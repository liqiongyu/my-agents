const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");

const cliPath = path.join(__dirname, "..", "cli.js");
const repoRoot = path.join(__dirname, "..", "..");
const {
  acquireIssueLease,
  buildRunRecord,
  buildRuntimePaths,
  persistArtifact,
  persistRunRecord,
  recordRunUpdate,
  renewIssueLease
} = require("../lib/issue-driven-os-state-store");

function runCli(args) {
  return execFileSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

function runCliWithStatus(args) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
}

async function seedRuntimeFixture(tempRoot) {
  const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
  const leaseNow = new Date();
  const olderRun = buildRunRecord(7, {
    id: "run_issue_7_20260329T090000Z",
    repoSlug: "owner/repo",
    status: "blocked",
    startedAt: "2026-03-29T09:00:00.000Z",
    updatedAt: "2026-03-29T09:05:00.000Z",
    summary: "Waiting on missing repository context."
  });
  const newerRun = buildRunRecord(8, {
    id: "run_issue_8_20260329T100000Z",
    repoSlug: "owner/repo",
    status: "awaiting_merge",
    startedAt: "2026-03-29T10:00:00.000Z",
    updatedAt: "2026-03-29T10:20:00.000Z",
    branchRef: "agent/issue-8",
    prNumber: 88,
    prUrl: "https://example.test/pull/88",
    summary: "Pull request opened and auto-merge enabled."
  });

  const executionPath = await persistArtifact(runtimePaths, newerRun.id, "execution", {
    status: "implemented"
  });
  const criticPath = await persistArtifact(runtimePaths, newerRun.id, "critic", {
    verdict: "ready"
  });
  newerRun.artifacts = [
    { kind: "execution", path: executionPath },
    { kind: "critic", path: criticPath }
  ];

  await acquireIssueLease(
    runtimePaths,
    7,
    {
      holderId: olderRun.id,
      holderType: "worker",
      runId: olderRun.id
    },
    {
      now: new Date("2020-01-01T00:00:00.000Z"),
      ttlMs: 60 * 1000
    }
  );

  await acquireIssueLease(
    runtimePaths,
    8,
    {
      holderId: "daemon-1",
      holderType: "daemon",
      runId: newerRun.id
    },
    {
      now: leaseNow,
      ttlMs: 24 * 60 * 60 * 1000
    }
  );
  const renewedLease = await renewIssueLease(runtimePaths, 8, "daemon-1", {
    now: new Date(leaseNow.getTime() + 60 * 60 * 1000),
    ttlMs: 24 * 60 * 60 * 1000
  });

  newerRun.lease = renewedLease.lease;
  await persistRunRecord(runtimePaths, olderRun);
  await recordRunUpdate(runtimePaths, "owner/repo", olderRun);
  await persistRunRecord(runtimePaths, newerRun);
  await recordRunUpdate(runtimePaths, "owner/repo", newerRun);

  return {
    runtimePaths,
    olderRun,
    newerRun,
    executionPath,
    criticPath
  };
}

test("issue-driven-os github inspect requires an owner/repo slug", () => {
  const result = runCliWithStatus(["issue-driven-os", "github", "inspect"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing owner\/repo/);
});

test("issue-driven-os github inspect renders an empty runtime summary in text mode", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-inspect-empty-"));

  try {
    const output = runCli([
      "issue-driven-os",
      "github",
      "inspect",
      "owner/repo",
      "--runtime-root",
      tempRoot
    ]);

    assert.match(output, /Repo: owner\/repo/);
    assert.match(
      output,
      new RegExp(`Runtime root: ${tempRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
    );
    assert.match(output, /Active leases: 0/);
    assert.match(output, /Stale leases: 0/);
    assert.match(output, /Tracked issues: 0/);
    assert.match(output, /Recent runs shown: 0\/0/);
    assert.match(output, /Active leases\n- none/);
    assert.match(output, /Stale leases\n- none/);
    assert.match(output, /Issue summary state\n- none/);
    assert.match(output, /Recent runs\n- none/);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("issue-driven-os github inspect returns populated runtime summaries in text and JSON modes", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-inspect-populated-"));

  try {
    const { olderRun, newerRun } = await seedRuntimeFixture(tempRoot);

    const textOutput = runCli([
      "issue-driven-os",
      "github",
      "inspect",
      "owner/repo",
      "--runtime-root",
      tempRoot
    ]);
    const jsonOutput = runCli([
      "issue-driven-os",
      "github",
      "inspect",
      "owner/repo",
      "--runtime-root",
      tempRoot,
      "--json"
    ]);
    const payload = JSON.parse(jsonOutput);

    assert.match(textOutput, new RegExp(`run ${newerRun.id}`));
    assert.match(textOutput, /Stale leases: 1/);
    assert.match(textOutput, /- issue #8 \| active \| outcome renewed/);
    assert.match(textOutput, /- issue #7 \| expired \| outcome acquired/);
    assert.match(textOutput, new RegExp(`- ${newerRun.id} \\| issue #8 \\| awaiting_merge`));
    assert.match(textOutput, new RegExp(`- ${olderRun.id} \\| issue #7 \\| blocked`));

    assert.equal(payload.mode, "summary");
    assert.equal(payload.repoSlug, "owner/repo");
    assert.equal(payload.activeLeaseCount, 1);
    assert.equal(payload.staleLeaseCount, 1);
    assert.deepEqual(
      payload.issueSummaries.map((issueSummary) => issueSummary.issueNumber),
      [7, 8]
    );
    assert.deepEqual(
      payload.recentRuns.map((runRecord) => runRecord.id),
      [newerRun.id, olderRun.id]
    );
    assert.equal(payload.recentRuns[0].branchRef, "agent/issue-8");
    assert.equal(payload.recentRuns[0].prNumber, 88);
    assert.equal(payload.staleLeases[0].issueNumber, 7);
    assert.equal(payload.staleLeases[0].leaseStatus, "expired");
    assert.equal(payload.issueSummaries[1].lease.lastOutcome, "renewed");
    assert.equal(payload.recentRuns[0].lease.lastOutcome, "renewed");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("issue-driven-os github inspect handles legacy lease snapshots without previousLease", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-inspect-legacy-lease-"));

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const runRecord = buildRunRecord(9, {
      id: "run_issue_9_20260329T110000Z",
      repoSlug: "owner/repo",
      status: "claimed",
      updatedAt: "2026-03-29T11:05:00.000Z",
      summary: "Legacy lease snapshot fixture.",
      lease: {
        issueNumber: 9,
        holderId: "run_issue_9_20260329T110000Z",
        holderType: "worker",
        runId: "run_issue_9_20260329T110000Z",
        createdAt: "2026-03-29T11:00:00.000Z",
        updatedAt: "2026-03-29T11:05:00.000Z",
        expiresAt: "2026-03-29T11:20:00.000Z",
        lastOutcome: "acquired",
        leaseStatus: "active"
      }
    });

    await persistRunRecord(runtimePaths, runRecord);
    await recordRunUpdate(runtimePaths, "owner/repo", runRecord);

    const jsonOutput = runCli([
      "issue-driven-os",
      "github",
      "inspect",
      "owner/repo",
      "--runtime-root",
      tempRoot,
      "--json"
    ]);
    const payload = JSON.parse(jsonOutput);

    assert.equal(payload.issueSummaries[0].issueNumber, 9);
    assert.equal(payload.issueSummaries[0].lease.lastOutcome, "acquired");
    assert.equal(payload.issueSummaries[0].lease.previousLease, null);
    assert.equal(payload.recentRuns[0].lease.previousLease, null);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("issue-driven-os github inspect returns run detail with artifact locations", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-inspect-run-"));

  try {
    const { newerRun, criticPath, executionPath } = await seedRuntimeFixture(tempRoot);
    const jsonOutput = runCli([
      "issue-driven-os",
      "github",
      "inspect",
      "owner/repo",
      "--runtime-root",
      tempRoot,
      "--run",
      newerRun.id,
      "--json"
    ]);
    const textOutput = runCli([
      "issue-driven-os",
      "github",
      "inspect",
      "owner/repo",
      "--runtime-root",
      tempRoot,
      "--run",
      newerRun.id
    ]);
    const payload = JSON.parse(jsonOutput);

    assert.equal(payload.mode, "run");
    assert.equal(payload.run.id, newerRun.id);
    assert.equal(payload.run.runPath.endsWith(`${newerRun.id}.json`), true);
    assert.equal(payload.run.lease.lastOutcome, "renewed");
    assert.deepEqual(
      payload.artifacts.files.map((file) => file.path),
      [criticPath, executionPath]
    );
    assert.deepEqual(
      payload.artifacts.references.map((artifact) => artifact.path),
      [executionPath, criticPath]
    );
    assert.equal(payload.issueSummary.latestRunId, newerRun.id);
    assert.equal(payload.issueSummary.lease.lastOutcome, "renewed");
    assert.equal(payload.leaseRecord.lastOutcome, "renewed");
    assert.match(textOutput, /Run detail/);
    assert.match(textOutput, /Lease snapshot: lease active \(renewed\)/);
    assert.match(textOutput, /Lease record/);
    assert.match(
      textOutput,
      new RegExp(`Artifacts dir: ${tempRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
    );
    assert.match(
      textOutput,
      new RegExp(`critic: ${criticPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
    );
    assert.match(
      textOutput,
      new RegExp(`execution: ${executionPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`)
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
