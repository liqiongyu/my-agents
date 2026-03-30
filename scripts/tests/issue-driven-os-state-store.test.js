const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  acquireIssueLease,
  appendRuntimeEvent,
  buildRunRecord,
  buildRuntimePaths,
  inspectRuntimeState,
  persistArtifact,
  persistRunRecord,
  readLease,
  recordRunUpdate,
  releaseIssueLease,
  renewIssueLease
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

test("issue-driven-os state store renews leases and records stale plus force recovery", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-state-renew-"));

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const acquired = await acquireIssueLease(
      runtimePaths,
      123,
      {
        holderId: "run-1",
        holderType: "worker",
        runId: "run-1"
      },
      {
        now: new Date("2026-03-29T00:00:00.000Z"),
        ttlMs: 60 * 1000
      }
    );
    const renewed = await renewIssueLease(runtimePaths, 123, "run-1", {
      now: new Date("2026-03-29T00:00:30.000Z"),
      ttlMs: 60 * 1000,
      runId: "run-1"
    });
    const holderMismatch = await renewIssueLease(runtimePaths, 123, "run-2", {
      now: new Date("2026-03-29T00:00:31.000Z"),
      ttlMs: 60 * 1000,
      runId: "run-2"
    });
    const expiredRenewal = await renewIssueLease(runtimePaths, 123, "run-1", {
      now: new Date("2026-03-29T00:01:31.000Z"),
      ttlMs: 60 * 1000,
      runId: "run-1"
    });
    const expiredRecovery = await acquireIssueLease(
      runtimePaths,
      123,
      {
        holderId: "run-2",
        holderType: "worker",
        runId: "run-2"
      },
      {
        now: new Date("2026-03-29T00:02:01.000Z"),
        ttlMs: 60 * 1000
      }
    );
    const forceRecovery = await acquireIssueLease(
      runtimePaths,
      123,
      {
        holderId: "run-3",
        holderType: "daemon",
        runId: "run-3"
      },
      {
        now: new Date("2026-03-29T00:02:30.000Z"),
        ttlMs: 60 * 1000,
        forceRecover: true
      }
    );

    assert.equal(acquired.acquired, true);
    assert.equal(acquired.action, "acquired");
    assert.equal(renewed.renewed, true);
    assert.equal(renewed.reason, "renewed");
    assert.equal(renewed.lease.lastOutcome, "renewed");
    assert.equal(renewed.lease.renewalCount, 1);
    assert.equal(renewed.lease.expiresAt, "2026-03-29T00:01:30.000Z");

    assert.equal(holderMismatch.renewed, false);
    assert.equal(holderMismatch.reason, "holder_mismatch");
    assert.equal(holderMismatch.lease.holderId, "run-1");
    assert.equal(holderMismatch.lease.lastOutcome, "renewed");

    assert.equal(expiredRenewal.renewed, false);
    assert.equal(expiredRenewal.reason, "expired");
    assert.equal(expiredRenewal.lease.holderId, "run-1");
    assert.equal(expiredRenewal.lease.leaseStatus, "expired");

    assert.equal(expiredRecovery.acquired, true);
    assert.equal(expiredRecovery.action, "expired_recovered");
    assert.equal(expiredRecovery.lease.lastOutcome, "expired_recovered");
    assert.equal(expiredRecovery.lease.previousLease.holderId, "run-1");
    assert.equal(expiredRecovery.lease.previousLease.leaseStatus, "expired");

    assert.equal(forceRecovery.acquired, true);
    assert.equal(forceRecovery.action, "force_recovered");
    assert.equal(forceRecovery.lease.lastOutcome, "force_recovered");
    assert.equal(forceRecovery.lease.previousLease.holderId, "run-2");
    assert.equal(forceRecovery.lease.previousLease.leaseStatus, "active");
    assert.equal((await readLease(runtimePaths, 123)).holderId, "run-3");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("issue-driven-os state store does not let renewal resurrect a recovered lease", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-state-renew-race-"));

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    await acquireIssueLease(
      runtimePaths,
      126,
      {
        holderId: "run-1",
        holderType: "worker",
        runId: "run-1"
      },
      {
        now: new Date("2026-03-29T00:00:00.000Z"),
        ttlMs: 60 * 1000
      }
    );

    let recoveredLease = null;
    const renewal = await renewIssueLease(runtimePaths, 126, "run-1", {
      now: new Date("2026-03-29T00:00:20.000Z"),
      ttlMs: 60 * 1000,
      runId: "run-1",
      beforeWrite: async () => {
        recoveredLease = await acquireIssueLease(
          runtimePaths,
          126,
          {
            holderId: "run-2",
            holderType: "worker",
            runId: "run-2"
          },
          {
            now: new Date("2026-03-29T00:00:20.500Z"),
            ttlMs: 60 * 1000,
            forceRecover: true
          }
        );
      }
    });
    const persistedLease = await readLease(runtimePaths, 126);

    assert.equal(recoveredLease.acquired, true);
    assert.equal(recoveredLease.action, "force_recovered");
    assert.equal(renewal.renewed, false);
    assert.equal(renewal.reason, "holder_mismatch");
    assert.equal(renewal.lease.holderId, "run-2");
    assert.equal(persistedLease.holderId, "run-2");
    assert.equal(persistedLease.runId, "run-2");
    assert.equal(persistedLease.previousLease.holderId, "run-1");
    assert.equal(persistedLease.lastOutcome, "force_recovered");
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
      summary: "PR opened.",
      reviewLoopCount: 2,
      reviewLoopsMax: 3,
      terminationReason: "review_loop_budget_exhausted"
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
    assert.equal(savedRun.reviewLoopCount, 2);
    assert.equal(savedRun.reviewLoopsMax, 3);
    assert.equal(savedState.runs[runRecord.id].terminationReason, "review_loop_budget_exhausted");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("issue-driven-os state store exposes inspection snapshots and recent events", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-inspect-"));

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const runRecord = buildRunRecord(21, {
      repoSlug: "owner/repo",
      status: "claimed",
      summary: "Worker claimed the issue."
    });

    await acquireIssueLease(runtimePaths, 21, {
      holderId: runRecord.id,
      holderType: "worker",
      runId: runRecord.id
    });
    await persistRunRecord(runtimePaths, runRecord);
    await persistArtifact(runtimePaths, runRecord.id, "shaping", {
      route: "execute"
    });
    await recordRunUpdate(runtimePaths, "owner/repo", runRecord);
    await appendRuntimeEvent(runtimePaths, {
      repoSlug: "owner/repo",
      issueNumber: 21,
      runId: runRecord.id,
      actor: "worker",
      phase: "claim",
      event: "issue_claimed",
      message: "Claimed issue #21."
    });

    const snapshot = await inspectRuntimeState(runtimePaths, "owner/repo", {
      runId: runRecord.id,
      limit: 5,
      eventLimit: 5
    });

    assert.equal(snapshot.activeLeases.length, 1);
    assert.equal(snapshot.staleLeases.length, 0);
    assert.equal(snapshot.recentRuns.length, 1);
    assert.equal(snapshot.run.id, runRecord.id);
    assert.equal(snapshot.artifacts[0].kind, "shaping");
    assert.equal(snapshot.recentEvents[0].event, "issue_claimed");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("issue-driven-os state store inspection surfaces stale leases directly", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-inspect-stale-"));

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    await acquireIssueLease(
      runtimePaths,
      31,
      {
        holderId: "run-31",
        holderType: "worker",
        runId: "run-31"
      },
      {
        now: new Date("2026-03-29T00:00:00.000Z"),
        ttlMs: 60 * 1000
      }
    );
    await acquireIssueLease(
      runtimePaths,
      32,
      {
        holderId: "run-32",
        holderType: "worker",
        runId: "run-32"
      },
      {
        now: new Date(),
        ttlMs: 60 * 1000
      }
    );

    const snapshot = await inspectRuntimeState(runtimePaths, "owner/repo");

    assert.equal(snapshot.activeLeases.length, 1);
    assert.equal(snapshot.staleLeases.length, 1);
    assert.equal(snapshot.activeLeases[0].issueNumber, 32);
    assert.equal(snapshot.staleLeases[0].issueNumber, 31);
    assert.equal(snapshot.staleLeases[0].leaseStatus, "expired");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
