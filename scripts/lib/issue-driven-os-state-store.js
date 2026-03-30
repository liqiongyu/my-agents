const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { fileExists, readJson } = require("./fs-utils");

const DEFAULT_LEASE_TTL_MS = 30 * 60 * 1000;

function sanitizeRepoSlug(repoSlug) {
  return String(repoSlug ?? "")
    .trim()
    .replace(/[/:]+/g, "__")
    .replace(/[^A-Za-z0-9._-]/g, "_");
}

function buildRuntimePaths(repoSlug, options = {}) {
  const baseDir =
    options.runtimeRoot ??
    path.join(os.homedir(), ".my-agents", "issue-driven-os", sanitizeRepoSlug(repoSlug));

  return {
    baseDir,
    leasesDir: path.join(baseDir, "leases"),
    runsDir: path.join(baseDir, "runs"),
    artifactsDir: path.join(baseDir, "artifacts"),
    eventsDir: path.join(baseDir, "events"),
    runEventsDir: path.join(baseDir, "events", "runs"),
    eventsFilePath: path.join(baseDir, "events", "events.ndjson"),
    worktreesDir: path.join(baseDir, "worktrees"),
    stateFilePath: path.join(baseDir, "state.json")
  };
}

function createEmptyRuntimeState(repoSlug) {
  return {
    schemaVersion: 1,
    repoSlug,
    updatedAt: null,
    runs: {},
    issues: {}
  };
}

async function ensureRuntimeLayout(runtimePaths) {
  await Promise.all(
    [
      runtimePaths.baseDir,
      runtimePaths.leasesDir,
      runtimePaths.runsDir,
      runtimePaths.artifactsDir,
      runtimePaths.eventsDir,
      runtimePaths.runEventsDir,
      runtimePaths.worktreesDir
    ].map((dirPath) => fs.mkdir(dirPath, { recursive: true }))
  );
}

async function writeJsonAtomic(targetPath, value) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const tempPath = `${targetPath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, targetPath);
}

async function readRuntimeState(runtimePaths, repoSlug) {
  if (!(await fileExists(runtimePaths.stateFilePath))) {
    return createEmptyRuntimeState(repoSlug);
  }

  try {
    const parsed = await readJson(runtimePaths.stateFilePath);
    return {
      ...createEmptyRuntimeState(repoSlug),
      ...parsed,
      runs: parsed?.runs && typeof parsed.runs === "object" ? parsed.runs : {},
      issues: parsed?.issues && typeof parsed.issues === "object" ? parsed.issues : {}
    };
  } catch {
    return createEmptyRuntimeState(repoSlug);
  }
}

async function writeRuntimeState(runtimePaths, state) {
  const normalized = {
    schemaVersion: 1,
    repoSlug: state.repoSlug,
    updatedAt: new Date().toISOString(),
    runs: state.runs ?? {},
    issues: state.issues ?? {}
  };

  await writeJsonAtomic(runtimePaths.stateFilePath, normalized);
  return normalized;
}

function leasePathForIssue(runtimePaths, issueNumber) {
  return path.join(runtimePaths.leasesDir, `issue-${issueNumber}.json`);
}

async function readLease(runtimePaths, issueNumber) {
  const leasePath = leasePathForIssue(runtimePaths, issueNumber);
  if (!(await fileExists(leasePath))) {
    return null;
  }

  try {
    return await readJson(leasePath);
  } catch {
    return null;
  }
}

async function acquireIssueLease(runtimePaths, issueNumber, leaseData, options = {}) {
  const now = options.now ?? new Date();
  const ttlMs = options.ttlMs ?? DEFAULT_LEASE_TTL_MS;
  const leasePath = leasePathForIssue(runtimePaths, issueNumber);
  const record = {
    issueNumber,
    holderId: leaseData.holderId,
    holderType: leaseData.holderType ?? "worker",
    runId: leaseData.runId ?? null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString()
  };

  await ensureRuntimeLayout(runtimePaths);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const handle = await fs.open(leasePath, "wx");
      try {
        await handle.writeFile(`${JSON.stringify(record, null, 2)}\n`, "utf8");
      } finally {
        await handle.close();
      }
      return { acquired: true, lease: record, leasePath };
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }

      const existing = await readLease(runtimePaths, issueNumber);
      if (!existing) {
        await fs.rm(leasePath, { force: true });
        continue;
      }

      if (Date.parse(existing.expiresAt ?? "") < now.getTime()) {
        await fs.rm(leasePath, { force: true });
        continue;
      }

      return { acquired: false, lease: existing, leasePath };
    }
  }

  return { acquired: false, lease: await readLease(runtimePaths, issueNumber), leasePath };
}

async function releaseIssueLease(runtimePaths, issueNumber, holderId) {
  const leasePath = leasePathForIssue(runtimePaths, issueNumber);
  const existing = await readLease(runtimePaths, issueNumber);

  if (!existing) {
    return false;
  }

  if (holderId && existing.holderId !== holderId) {
    return false;
  }

  await fs.rm(leasePath, { force: true });
  return true;
}

async function forceReleaseIssueLease(runtimePaths, issueNumber) {
  const leasePath = leasePathForIssue(runtimePaths, issueNumber);
  const existing = await readLease(runtimePaths, issueNumber);

  if (!existing) {
    return {
      released: false,
      lease: null,
      leasePath
    };
  }

  await fs.rm(leasePath, { force: true });
  return {
    released: true,
    lease: existing,
    leasePath
  };
}

function buildRunId(issueNumber, options = {}) {
  const timestamp = (options.startedAt ?? new Date().toISOString())
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  return `run_issue_${issueNumber}_${timestamp}`;
}

function buildRunRecord(issueNumber, data = {}) {
  const startedAt = data.startedAt ?? new Date().toISOString();
  return {
    id: data.id ?? buildRunId(issueNumber, { startedAt }),
    issueNumber,
    status: data.status ?? "created",
    repoSlug: data.repoSlug,
    startedAt,
    updatedAt: data.updatedAt ?? startedAt,
    finishedAt: data.finishedAt ?? null,
    branchRef: data.branchRef ?? null,
    worktreePath: data.worktreePath ?? null,
    commitSha: data.commitSha ?? null,
    prNumber: data.prNumber ?? null,
    prUrl: data.prUrl ?? null,
    mergeStatus: data.mergeStatus ?? null,
    lastCompletedPhase: data.lastCompletedPhase ?? null,
    summary: data.summary ?? null,
    artifacts: data.artifacts ?? [],
    notes: data.notes ?? []
  };
}

async function persistRunRecord(runtimePaths, runRecord) {
  const runPath = path.join(runtimePaths.runsDir, `${runRecord.id}.json`);
  await writeJsonAtomic(runPath, runRecord);
  return runPath;
}

async function recordRunUpdate(runtimePaths, repoSlug, runRecord) {
  const state = await readRuntimeState(runtimePaths, repoSlug);
  state.runs[runRecord.id] = {
    issueNumber: runRecord.issueNumber,
    status: runRecord.status,
    updatedAt: runRecord.updatedAt ?? new Date().toISOString(),
    branchRef: runRecord.branchRef ?? null,
    prNumber: runRecord.prNumber ?? null
  };
  state.issues[String(runRecord.issueNumber)] = {
    issueNumber: runRecord.issueNumber,
    latestRunId: runRecord.id,
    status: runRecord.status,
    updatedAt: runRecord.updatedAt ?? new Date().toISOString(),
    branchRef: runRecord.branchRef ?? null,
    prNumber: runRecord.prNumber ?? null
  };
  await writeRuntimeState(runtimePaths, state);
}

async function persistArtifact(runtimePaths, runId, kind, payload) {
  const artifactPath = path.join(runtimePaths.artifactsDir, runId, `${kind}.json`);
  await writeJsonAtomic(artifactPath, payload);
  return artifactPath;
}

function buildEventId(options = {}) {
  const timestamp = (options.timestamp ?? new Date().toISOString())
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  const suffix = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
  return `evt_${timestamp}_${suffix}`;
}

function buildRuntimeEvent(data = {}) {
  return {
    schemaVersion: 1,
    id: data.id ?? buildEventId({ timestamp: data.timestamp }),
    timestamp: data.timestamp ?? new Date().toISOString(),
    level: data.level ?? "info",
    actor: data.actor ?? "runtime",
    phase: data.phase ?? "runtime",
    event: data.event ?? "unknown",
    repoSlug: data.repoSlug ?? null,
    issueNumber: data.issueNumber ?? null,
    runId: data.runId ?? null,
    message: data.message ?? "",
    data: data.data ?? {}
  };
}

async function appendRuntimeEvent(runtimePaths, eventData) {
  await ensureRuntimeLayout(runtimePaths);
  const event = buildRuntimeEvent(eventData);
  const line = `${JSON.stringify(event)}\n`;

  await fs.appendFile(runtimePaths.eventsFilePath, line, "utf8");

  if (event.runId) {
    const runEventPath = path.join(runtimePaths.runEventsDir, `${event.runId}.ndjson`);
    await fs.appendFile(runEventPath, line, "utf8");
  }

  return event;
}

async function readJsonFiles(dirPath, options = {}) {
  const warnings = options.warnings ?? [];

  if (!(await fileExists(dirPath))) {
    return [];
  }

  const entries = await fs.readdir(dirPath).catch((error) => {
    warnings.push(`Failed to read directory ${dirPath}: ${error.message}`);
    return [];
  });

  const records = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith(".json")) {
      continue;
    }

    const filePath = path.join(dirPath, entry);
    try {
      records.push(await readJson(filePath));
    } catch (error) {
      warnings.push(`Failed to read JSON file ${filePath}: ${error.message}`);
    }
  }

  return records;
}

async function readNdjsonFile(filePath, options = {}) {
  const warnings = options.warnings ?? [];

  if (!(await fileExists(filePath))) {
    return [];
  }

  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    warnings.push(`Failed to read event log ${filePath}: ${error.message}`);
    return [];
  }

  const events = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      events.push(JSON.parse(trimmed));
    } catch (error) {
      warnings.push(`Failed to parse event line in ${filePath}: ${error.message}`);
    }
  }

  return events;
}

async function listActiveLeases(runtimePaths, options = {}) {
  const warnings = options.warnings ?? [];
  const leases = await readJsonFiles(runtimePaths.leasesDir, { warnings });

  return leases.filter(Boolean).sort((left, right) => {
    const leftIssue = Number(left.issueNumber ?? Number.MAX_SAFE_INTEGER);
    const rightIssue = Number(right.issueNumber ?? Number.MAX_SAFE_INTEGER);
    return leftIssue - rightIssue;
  });
}

async function listRunRecords(runtimePaths, options = {}) {
  const warnings = options.warnings ?? [];
  const limit = Math.max(1, Number(options.limit ?? 10));
  const runs = await readJsonFiles(runtimePaths.runsDir, { warnings });

  return runs
    .filter(Boolean)
    .sort((left, right) => {
      const leftUpdatedAt = Date.parse(left.updatedAt ?? left.startedAt ?? "");
      const rightUpdatedAt = Date.parse(right.updatedAt ?? right.startedAt ?? "");
      const safeLeft = Number.isFinite(leftUpdatedAt) ? leftUpdatedAt : 0;
      const safeRight = Number.isFinite(rightUpdatedAt) ? rightUpdatedAt : 0;
      return safeRight - safeLeft;
    })
    .slice(0, limit);
}

async function readRunRecord(runtimePaths, runId, options = {}) {
  const warnings = options.warnings ?? [];
  const runPath = path.join(runtimePaths.runsDir, `${runId}.json`);

  if (!(await fileExists(runPath))) {
    return null;
  }

  try {
    return await readJson(runPath);
  } catch (error) {
    warnings.push(`Failed to read run record ${runPath}: ${error.message}`);
    return null;
  }
}

async function listRunArtifacts(runtimePaths, runId, options = {}) {
  const warnings = options.warnings ?? [];
  const artifactDir = path.join(runtimePaths.artifactsDir, runId);

  if (!(await fileExists(artifactDir))) {
    return [];
  }

  const entries = await fs.readdir(artifactDir).catch((error) => {
    warnings.push(`Failed to read artifact directory ${artifactDir}: ${error.message}`);
    return [];
  });

  return entries
    .filter((entry) => entry.endsWith(".json"))
    .sort()
    .map((entry) => ({
      kind: path.basename(entry, ".json"),
      path: path.join(artifactDir, entry)
    }));
}

async function listRuntimeEvents(runtimePaths, options = {}) {
  const warnings = options.warnings ?? [];
  const limit = Math.max(1, Number(options.limit ?? 20));
  const targetPath = options.runId
    ? path.join(runtimePaths.runEventsDir, `${options.runId}.ndjson`)
    : runtimePaths.eventsFilePath;

  const events = await readNdjsonFile(targetPath, { warnings });
  return events
    .sort((left, right) => {
      const leftTime = Date.parse(left.timestamp ?? "");
      const rightTime = Date.parse(right.timestamp ?? "");
      const safeLeft = Number.isFinite(leftTime) ? leftTime : 0;
      const safeRight = Number.isFinite(rightTime) ? rightTime : 0;
      return safeRight - safeLeft;
    })
    .slice(0, limit);
}

async function inspectRuntimeState(runtimePaths, repoSlug, options = {}) {
  const warnings = [];
  const state = await readRuntimeState(runtimePaths, repoSlug);
  const activeLeases = await listActiveLeases(runtimePaths, { warnings });
  const recentRuns = await listRunRecords(runtimePaths, {
    warnings,
    limit: options.limit ?? 10
  });
  const recentEvents = await listRuntimeEvents(runtimePaths, {
    warnings,
    limit: options.eventLimit ?? 20,
    runId: options.runId
  });

  const selectedRunId = options.runId ?? null;
  const run = selectedRunId ? await readRunRecord(runtimePaths, selectedRunId, { warnings }) : null;
  const artifacts = selectedRunId
    ? await listRunArtifacts(runtimePaths, selectedRunId, { warnings })
    : [];

  return {
    schemaVersion: 1,
    repoSlug,
    runtimeRoot: runtimePaths.baseDir,
    observedAt: new Date().toISOString(),
    state,
    activeLeases,
    recentRuns,
    run,
    artifacts,
    recentEvents,
    warnings
  };
}

module.exports = {
  DEFAULT_LEASE_TTL_MS,
  acquireIssueLease,
  appendRuntimeEvent,
  buildEventId,
  buildRunId,
  buildRunRecord,
  buildRuntimePaths,
  buildRuntimeEvent,
  createEmptyRuntimeState,
  ensureRuntimeLayout,
  inspectRuntimeState,
  listActiveLeases,
  listRunArtifacts,
  listRunRecords,
  listRuntimeEvents,
  persistArtifact,
  persistRunRecord,
  forceReleaseIssueLease,
  readLease,
  readRunRecord,
  readRuntimeState,
  recordRunUpdate,
  releaseIssueLease,
  sanitizeRepoSlug,
  writeRuntimeState
};
