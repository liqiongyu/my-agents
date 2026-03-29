const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  acquireIssueLease,
  buildRunRecord,
  buildRuntimePaths,
  listIssueLeases,
  listRunArtifactFiles,
  listRunRecords,
  persistArtifact,
  persistRunRecord,
  readLease,
  readRunRecord,
  recordRunUpdate,
  releaseIssueLease
} = require("../lib/issue-driven-os-state-store");

test("issue-driven-os state store acquires and releases issue leases", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-state-"));

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const first = await acquireIssueLease(runtimePaths, 123, {
      holderId: "run-1",
      holderType: "worker"
    });
    const second = await acquireIssueLease(runtimePaths, 123, {
      holderId: "run-2",
      holderType: "worker"
    });

    assert.equal(first.acquired, true);
    assert.equal(second.acquired, false);
    assert.equal((await readLease(runtimePaths, 123)).holderId, "run-1");

    const released = await releaseIssueLease(runtimePaths, 123, "run-1");
    assert.equal(released, true);
    assert.equal(await readLease(runtimePaths, 123), null);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("issue-driven-os state store persists runs, artifacts, and summary state", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-state-run-"));

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const runRecord = buildRunRecord(42, {
      repoSlug: "owner/repo",
      status: "awaiting_merge",
      summary: "PR opened."
    });

    const runPath = await persistRunRecord(runtimePaths, runRecord);
    const artifactPath = await persistArtifact(runtimePaths, runRecord.id, "critic", {
      verdict: "ready"
    });
    await recordRunUpdate(runtimePaths, "owner/repo", runRecord);

    const savedRun = JSON.parse(await fs.readFile(runPath, "utf8"));
    const savedArtifact = JSON.parse(await fs.readFile(artifactPath, "utf8"));
    const savedState = JSON.parse(await fs.readFile(runtimePaths.stateFilePath, "utf8"));

    assert.equal(savedRun.issueNumber, 42);
    assert.equal(savedArtifact.verdict, "ready");
    assert.equal(savedState.issues["42"].latestRunId, runRecord.id);
    assert.equal(savedState.runs[runRecord.id].status, "awaiting_merge");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("issue-driven-os state store lists leases, runs, and run artifacts for inspection", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-state-inspect-"));

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const olderRun = buildRunRecord(11, {
      id: "run_issue_11_20260329T010000Z",
      repoSlug: "owner/repo",
      status: "blocked",
      startedAt: "2026-03-29T01:00:00.000Z",
      updatedAt: "2026-03-29T01:05:00.000Z"
    });
    const newerRun = buildRunRecord(12, {
      id: "run_issue_12_20260329T020000Z",
      repoSlug: "owner/repo",
      status: "awaiting_merge",
      startedAt: "2026-03-29T02:00:00.000Z",
      updatedAt: "2026-03-29T02:10:00.000Z"
    });

    await persistRunRecord(runtimePaths, olderRun);
    await persistRunRecord(runtimePaths, newerRun);
    await persistArtifact(runtimePaths, newerRun.id, "critic", {
      verdict: "ready"
    });
    await acquireIssueLease(
      runtimePaths,
      12,
      {
        holderId: "daemon-1",
        holderType: "daemon",
        runId: newerRun.id
      },
      {
        now: new Date("2026-03-29T02:00:00.000Z"),
        ttlMs: 5 * 60 * 1000
      }
    );

    const leases = await listIssueLeases(runtimePaths, {
      now: new Date("2026-03-29T02:01:00.000Z")
    });
    const runs = await listRunRecords(runtimePaths);
    const savedRun = await readRunRecord(runtimePaths, newerRun.id);
    const artifactFiles = await listRunArtifactFiles(runtimePaths, newerRun.id);

    assert.equal(leases.length, 1);
    assert.equal(leases[0].holderType, "daemon");
    assert.equal(runs.map((run) => run.id).join(","), `${newerRun.id},${olderRun.id}`);
    assert.equal(savedRun.runPath.endsWith(`${newerRun.id}.json`), true);
    assert.deepEqual(
      artifactFiles.map((file) => file.kind),
      ["critic"]
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
