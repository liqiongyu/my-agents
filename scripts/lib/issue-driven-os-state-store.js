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

function isLeaseExpired(lease, now = new Date()) {
  const expiresAt = Date.parse(lease?.expiresAt ?? "");
  return !Number.isNaN(expiresAt) && expiresAt < now.getTime();
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

    if (!includeExpired && isLeaseExpired(lease, now)) {
      continue;
    }

    leases.push({
      ...lease,
      leasePath
    });
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
    prNumber: data.prNumber ?? null,
    prUrl: data.prUrl ?? null,
    mergeStatus: data.mergeStatus ?? null,
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

async function readRunRecord(runtimePaths, runId) {
  const runPath = path.join(runtimePaths.runsDir, `${runId}.json`);
  const runRecord = await readJsonOrNull(runPath);
  if (!runRecord) {
    return null;
  }

  return {
    ...runRecord,
    runPath
  };
}

async function listRunRecords(runtimePaths) {
  const runFiles = await listJsonFiles(runtimePaths.runsDir);
  const runRecords = [];

  for (const runPath of runFiles) {
    const runRecord = await readJsonOrNull(runPath);
    if (!runRecord) {
      continue;
    }

    runRecords.push({
      ...runRecord,
      runPath
    });
  }

  return runRecords.sort(compareRunRecords);
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

module.exports = {
  DEFAULT_LEASE_TTL_MS,
  acquireIssueLease,
  buildRunId,
  buildRunRecord,
  buildRuntimePaths,
  compareIssueNumbers,
  createEmptyRuntimeState,
  ensureRuntimeLayout,
  isLeaseExpired,
  listIssueLeases,
  listRunArtifactFiles,
  listRunRecords,
  persistArtifact,
  persistRunRecord,
  readLease,
  readRunRecord,
  readRuntimeState,
  recordRunUpdate,
  releaseIssueLease,
  sanitizeRepoSlug,
  writeRuntimeState
};
