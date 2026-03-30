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

function compareStrings(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""));
}

function toTimestamp(value, fallback) {
  const timestamp = Date.parse(value ?? "");
  return Number.isNaN(timestamp) ? fallback : timestamp;
}

function compareIssueNumbers(left, right) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  return compareStrings(left, right);
}

function compareLeaseRecords(left, right) {
  const issueCompare = compareIssueNumbers(left.issueNumber, right.issueNumber);
  if (issueCompare !== 0) {
    return issueCompare;
  }

  return compareStrings(left.holderId, right.holderId);
}

function compareRunRecords(left, right) {
  const updatedCompare =
    toTimestamp(right.updatedAt, Number.NEGATIVE_INFINITY) -
    toTimestamp(left.updatedAt, Number.NEGATIVE_INFINITY);
  if (updatedCompare !== 0) {
    return updatedCompare;
  }

  const startedCompare =
    toTimestamp(right.startedAt, Number.NEGATIVE_INFINITY) -
    toTimestamp(left.startedAt, Number.NEGATIVE_INFINITY);
  if (startedCompare !== 0) {
    return startedCompare;
  }

  return compareStrings(right.id, left.id);
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

async function listJsonFiles(dirPath) {
  if (!(await fileExists(dirPath))) {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(dirPath, entry.name))
    .sort(compareStrings);
}

async function readJsonOrNull(jsonPath) {
  if (!(await fileExists(jsonPath))) {
    return null;
  }

  try {
    const parsed = await readJson(jsonPath);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function leasePathForIssue(runtimePaths, issueNumber) {
  return path.join(runtimePaths.leasesDir, `issue-${issueNumber}.json`);
}

function isLeaseExpired(lease, now = new Date()) {
  const expiresAt = Date.parse(lease?.expiresAt ?? "");
  return !Number.isNaN(expiresAt) && expiresAt < now.getTime();
}

function leaseStatusFor(lease, now = new Date()) {
  return isLeaseExpired(lease, now) ? "expired" : "active";
}

function normalizeLeaseRenewalCount(value) {
  const renewalCount = Number(value ?? 0);
  return Number.isFinite(renewalCount) && renewalCount > 0 ? renewalCount : 0;
}

function buildLeaseHistoryRecord(lease, now = new Date()) {
  if (!lease || typeof lease !== "object") {
    return null;
  }

  return {
    issueNumber: lease.issueNumber ?? null,
    holderId: lease.holderId ?? null,
    holderType: lease.holderType ?? null,
    runId: lease.runId ?? null,
    createdAt: lease.createdAt ?? null,
    updatedAt: lease.updatedAt ?? null,
    renewedAt: lease.renewedAt ?? null,
    renewalCount: normalizeLeaseRenewalCount(lease.renewalCount),
    expiresAt: lease.expiresAt ?? null,
    lastOutcome: lease.lastOutcome ?? "acquired",
    recoveredAt: lease.recoveredAt ?? null,
    recoveryReason: lease.recoveryReason ?? null,
    leaseStatus: leaseStatusFor(lease, now)
  };
}

function decorateLeaseRecord(lease, leasePath, now = new Date()) {
  return {
    ...lease,
    leasePath,
    leaseStatus: leaseStatusFor(lease, now)
  };
}

function buildLeaseRecord(issueNumber, leaseData, options = {}) {
  const now = options.now ?? new Date();
  const ttlMs = options.ttlMs ?? DEFAULT_LEASE_TTL_MS;

  return {
    issueNumber,
    holderId: leaseData.holderId,
    holderType: leaseData.holderType ?? "worker",
    runId: leaseData.runId ?? null,
    createdAt: leaseData.createdAt ?? now.toISOString(),
    updatedAt: now.toISOString(),
    renewedAt: leaseData.renewedAt ?? null,
    renewalCount: normalizeLeaseRenewalCount(leaseData.renewalCount),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    lastOutcome: leaseData.lastOutcome ?? "acquired",
    recoveredAt: leaseData.recoveredAt ?? null,
    recoveryReason: leaseData.recoveryReason ?? null,
    previousLease: leaseData.previousLease ?? null
  };
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
  const forceRecover = options.forceRecover === true;
  let nextLeaseData = { ...leaseData };

  await ensureRuntimeLayout(runtimePaths);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const record = buildLeaseRecord(issueNumber, nextLeaseData, {
      now,
      ttlMs
    });

    try {
      const handle = await fs.open(leasePath, "wx");
      try {
        await handle.writeFile(`${JSON.stringify(record, null, 2)}\n`, "utf8");
      } finally {
        await handle.close();
      }

      return {
        acquired: true,
        lease: decorateLeaseRecord(record, leasePath, now),
        leasePath,
        action: record.lastOutcome
      };
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }

      const existing = await readLease(runtimePaths, issueNumber);
      if (!existing) {
        await fs.rm(leasePath, { force: true });
        continue;
      }

      if (isLeaseExpired(existing, now) || forceRecover) {
        nextLeaseData = {
          ...leaseData,
          lastOutcome: forceRecover ? "force_recovered" : "expired_recovered",
          recoveredAt: now.toISOString(),
          recoveryReason: forceRecover ? "force" : "expired",
          previousLease: buildLeaseHistoryRecord(existing, now)
        };
        await fs.rm(leasePath, { force: true });
        continue;
      }

      return {
        acquired: false,
        lease: decorateLeaseRecord(existing, leasePath, now),
        leasePath,
        action: "active_collision"
      };
    }
  }

  const existing = await readLease(runtimePaths, issueNumber);
  return {
    acquired: false,
    lease: existing ? decorateLeaseRecord(existing, leasePath, now) : null,
    leasePath,
    action: "active_collision"
  };
}

async function renewIssueLease(runtimePaths, issueNumber, holderId, options = {}) {
  const now = options.now ?? new Date();
  const ttlMs = options.ttlMs ?? DEFAULT_LEASE_TTL_MS;
  const leasePath = leasePathForIssue(runtimePaths, issueNumber);
  const existing = await readLease(runtimePaths, issueNumber);

  if (!existing) {
    return {
      renewed: false,
      reason: "missing",
      lease: null,
      leasePath
    };
  }

  if (holderId && existing.holderId !== holderId) {
    return {
      renewed: false,
      reason: "holder_mismatch",
      lease: decorateLeaseRecord(existing, leasePath, now),
      leasePath
    };
  }

  if (isLeaseExpired(existing, now)) {
    return {
      renewed: false,
      reason: "expired",
      lease: decorateLeaseRecord(existing, leasePath, now),
      leasePath
    };
  }

  const renewedLease = {
    ...existing,
    updatedAt: now.toISOString(),
    renewedAt: now.toISOString(),
    renewalCount: normalizeLeaseRenewalCount(existing.renewalCount) + 1,
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
    lastOutcome: "renewed"
  };
  await writeJsonAtomic(leasePath, renewedLease);

  return {
    renewed: true,
    reason: "renewed",
    lease: decorateLeaseRecord(renewedLease, leasePath, now),
    leasePath
  };
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

async function listIssueLeases(runtimePaths, options = {}) {
  const now = options.now ?? new Date();
  const includeExpired = options.includeExpired ?? false;
  const leaseFiles = await listJsonFiles(runtimePaths.leasesDir);
  const leases = [];

  for (const leasePath of leaseFiles) {
    const lease = await readJsonOrNull(leasePath);
    if (!lease) {
      continue;
    }

    const decoratedLease = decorateLeaseRecord(lease, leasePath, now);

    if (!includeExpired && decoratedLease.leaseStatus === "expired") {
      continue;
    }

    leases.push(decoratedLease);
  }

  return leases.sort(compareLeaseRecords);
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
    lease: data.lease ?? null,
    leaseFailure: data.leaseFailure ?? null,
    artifacts: data.artifacts ?? [],
    notes: data.notes ?? []
  };
}

async function persistRunRecord(runtimePaths, runRecord) {
  const runPath = path.join(runtimePaths.runsDir, `${runRecord.id}.json`);
  await writeJsonAtomic(runPath, runRecord);
  return runPath;
}

async function readRunRecord(runtimePaths, runId, options = {}) {
  const warnings = options.warnings ?? [];
  const runPath = path.join(runtimePaths.runsDir, `${runId}.json`);
  const runRecord = await readJsonOrNull(runPath);

  if (!runRecord) {
    if (await fileExists(runPath)) {
      warnings.push(`Failed to read run record ${runPath}.`);
    }
    return null;
  }

  return {
    ...runRecord,
    runPath
  };
}

async function listRunRecords(runtimePaths, options = {}) {
  const warnings = options.warnings ?? [];
  const limit = Math.max(1, Number(options.limit ?? 10));
  const runFiles = await listJsonFiles(runtimePaths.runsDir);
  const runRecords = [];

  for (const runPath of runFiles) {
    const runRecord = await readJsonOrNull(runPath);
    if (!runRecord) {
      warnings.push(`Failed to read run record ${runPath}.`);
      continue;
    }

    runRecords.push({
      ...runRecord,
      runPath
    });
  }

  return runRecords.sort(compareRunRecords).slice(0, limit);
}

async function recordRunUpdate(runtimePaths, repoSlug, runRecord) {
  const state = await readRuntimeState(runtimePaths, repoSlug);
  const existingRunSummary = state.runs[runRecord.id] ?? {};
  const existingIssueSummary = state.issues[String(runRecord.issueNumber)] ?? {};
  state.runs[runRecord.id] = {
    ...existingRunSummary,
    issueNumber: runRecord.issueNumber,
    status: runRecord.status,
    updatedAt: runRecord.updatedAt ?? new Date().toISOString(),
    branchRef: runRecord.branchRef ?? null,
    prNumber: runRecord.prNumber ?? null,
    lease: runRecord.lease ?? existingRunSummary.lease ?? null,
    leaseFailure: runRecord.leaseFailure ?? existingRunSummary.leaseFailure ?? null
  };
  state.issues[String(runRecord.issueNumber)] = {
    ...existingIssueSummary,
    issueNumber: runRecord.issueNumber,
    latestRunId: runRecord.id,
    status: runRecord.status,
    updatedAt: runRecord.updatedAt ?? new Date().toISOString(),
    branchRef: runRecord.branchRef ?? null,
    prNumber: runRecord.prNumber ?? null,
    lease: runRecord.lease ?? existingIssueSummary.lease ?? null
  };
  await writeRuntimeState(runtimePaths, state);
}

async function persistArtifact(runtimePaths, runId, kind, payload) {
  const artifactPath = path.join(runtimePaths.artifactsDir, runId, `${kind}.json`);
  await writeJsonAtomic(artifactPath, payload);
  return artifactPath;
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

async function listRunArtifactFiles(runtimePaths, runId) {
  const artifactDir = path.join(runtimePaths.artifactsDir, runId);
  if (!(await fileExists(artifactDir))) {
    return [];
  }

  const entries = await fs.readdir(artifactDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const artifactPath = path.join(artifactDir, entry.name);
    const stats = await fs.stat(artifactPath);
    files.push({
      name: entry.name,
      kind: path.extname(entry.name) === ".json" ? path.basename(entry.name, ".json") : entry.name,
      path: artifactPath,
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString()
    });
  }

  return files.sort((left, right) => compareStrings(left.name, right.name));
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
  return listIssueLeases(runtimePaths, {
    ...options,
    includeExpired: false
  });
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
  buildLeaseHistoryRecord,
  buildRunId,
  buildRunRecord,
  buildRuntimePaths,
  buildRuntimeEvent,
  compareIssueNumbers,
  createEmptyRuntimeState,
  decorateLeaseRecord,
  ensureRuntimeLayout,
  inspectRuntimeState,
  isLeaseExpired,
  leaseStatusFor,
  listActiveLeases,
  listIssueLeases,
  listRunArtifactFiles,
  listRunArtifacts,
  listRunRecords,
  listRuntimeEvents,
  persistArtifact,
  persistRunRecord,
  readLease,
  readRunRecord,
  readRuntimeState,
  recordRunUpdate,
  releaseIssueLease,
  renewIssueLease,
  sanitizeRepoSlug,
  writeRuntimeState
};
