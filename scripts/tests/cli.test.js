const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const { followRuntimeEvents, formatDaemonPassSummary } = require("../issue-driven-os-cli");
const {
  appendRuntimeEvent,
  buildRunRecord,
  buildRuntimePaths,
  persistRunRecord,
  recordRunUpdate
} = require("../lib/issue-driven-os-state-store");

const cliPath = path.join(__dirname, "..", "cli.js");
const installPath = path.join(__dirname, "..", "install.js");
const referencesPath = path.join(__dirname, "..", "sync-references.js");

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: path.join(__dirname, "..", ".."),
    encoding: "utf8"
  });
}

function runNodeScriptWithStatus(scriptPath, args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: path.join(__dirname, "..", ".."),
    encoding: "utf8"
  });
}

test("top-level CLI help documents the canonical command surface", () => {
  const output = runNodeScript(cliPath, ["--help"]);

  assert.match(output, /npx my-agents install <skill\|agent\|pack> <name> \[options\]/);
  assert.match(output, /npx my-agents project sync \[options\]/);
  assert.match(output, /npx my-agents issue-driven-os <command> \[options\]/);
  assert.match(output, /npx my-agents references <command> \[options\]/);
  assert.match(output, /Compatibility aliases:/);
});

test("legacy install wrapper help points to the canonical CLI", () => {
  const output = runNodeScript(installPath, ["--help"]);

  assert.match(output, /npx my-agents install <skill\|agent\|pack> <name> \[options\]/);
  assert.match(output, /npm run install-skill -- <name>/);
});

test("reference repository help shows canonical and compatibility forms", () => {
  const output = runNodeScript(referencesPath, ["--help"]);

  assert.match(output, /npx my-agents references <command> \[options\]/);
  assert.match(output, /npm run sync-references -- <command> \[options\]/);
});

test("top-level CLI still accepts legacy flag-first install syntax", () => {
  const result = runNodeScriptWithStatus(cliPath, ["--skill", "--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /npx my-agents install <skill\|agent\|pack> <name> \[options\]/);
  assert.doesNotMatch(result.stderr, /Unknown command/);
});

test("incomplete canonical install command exits nonzero", () => {
  const result = runNodeScriptWithStatus(cliPath, ["install"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Missing package type/);
});

test("incomplete canonical project command exits nonzero", () => {
  const result = runNodeScriptWithStatus(cliPath, ["project"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Missing project command/);
});

test("issue-driven-os help documents the unified runtime flow surface", () => {
  const output = runNodeScript(cliPath, ["issue-driven-os", "--help"]);

  assert.match(output, /npx my-agents issue-driven-os bundle <scenario-id> \[--json\]/);
  assert.match(
    output,
    /npx my-agents issue-driven-os github inspect <owner>\/<repo> \[--run <id>\] \[--limit <n>\] \[--events <n>\] \[--runtime-root <path>\] \[--json\]/
  );
  assert.match(
    output,
    /npx my-agents issue-driven-os pipeline <scenario-id> \[--out-dir <path>\] \[--json\]/
  );
  assert.match(
    output,
    /npx my-agents issue-driven-os github run <owner>\/<repo> --repo-path <path> --issue <number> \[--follow\] \[--json\] \[--no-resume\] \[--review-loops-max <n>\]/
  );
  assert.match(
    output,
    /npx my-agents issue-driven-os github resume <owner>\/<repo> --repo-path <path> --issue <number> \[--follow\] \[--json\] \[--review-loops-max <n>\]/
  );
  assert.match(
    output,
    /npx my-agents issue-driven-os github recover <owner>\/<repo> --issue <number> \[--json\]/
  );
  assert.match(
    output,
    /npx my-agents issue-driven-os github daemon <owner>\/<repo> --repo-path <path> \[--concurrency <n>\] \[--poll-seconds <n>\] \[--once\] \[--json\] \[--review-loops-max <n>\]/
  );
});

test("issue-driven-os pipeline runs the end-to-end reference flow", () => {
  const tempBase = path.join(__dirname, "..", "..", ".tmp", "cli-pipeline-test");
  const result = runNodeScriptWithStatus(cliPath, [
    "issue-driven-os",
    "pipeline",
    "G1",
    "--out-dir",
    tempBase
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Issue-Driven OS pipeline completed for G1/);
  assert.match(result.stdout, /Projection artifact:/);
});

test("issue-driven-os github inspect returns runtime state as JSON", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-cli-inspect-"));

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const runRecord = buildRunRecord(31, {
      repoSlug: "owner/repo",
      status: "claimed",
      summary: "Worker claimed issue #31."
    });

    await persistRunRecord(runtimePaths, runRecord);
    await recordRunUpdate(runtimePaths, "owner/repo", runRecord);
    await appendRuntimeEvent(runtimePaths, {
      repoSlug: "owner/repo",
      issueNumber: 31,
      runId: runRecord.id,
      phase: "claim",
      event: "issue_claimed",
      message: "Claimed issue #31."
    });

    const output = runNodeScript(cliPath, [
      "issue-driven-os",
      "github",
      "inspect",
      "owner/repo",
      "--runtime-root",
      tempRoot,
      "--json"
    ]);
    const parsed = JSON.parse(output);

    assert.equal(parsed.repoSlug, "owner/repo");
    assert.equal(parsed.recentRuns[0].id, runRecord.id);
    assert.equal(parsed.recentEvents[0].event, "issue_claimed");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("followRuntimeEvents emits matching runtime events for live debugging", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-cli-follow-"));

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const received = [];
    const stopFollowing = await followRuntimeEvents(runtimePaths, {
      startedAt: "2026-03-30T00:00:00.000Z",
      intervalMs: 100,
      matches: (event) => Number(event.issueNumber) === 31,
      onEvent: async (event) => {
        received.push(event);
      }
    });

    await appendRuntimeEvent(runtimePaths, {
      id: "evt_1",
      timestamp: "2026-03-30T00:00:01.000Z",
      repoSlug: "owner/repo",
      issueNumber: 30,
      phase: "queue",
      event: "ignored",
      message: "Should be filtered out."
    });
    await appendRuntimeEvent(runtimePaths, {
      id: "evt_2",
      timestamp: "2026-03-30T00:00:02.000Z",
      repoSlug: "owner/repo",
      issueNumber: 31,
      runId: "run_issue_31_test",
      actor: "worker",
      phase: "claim",
      event: "issue_claimed",
      message: "Claimed issue #31."
    });

    await new Promise((resolve) => setTimeout(resolve, 160));
    await stopFollowing();

    assert.equal(received.length, 1);
    assert.equal(received[0].event, "issue_claimed");
    assert.equal(received[0].issueNumber, 31);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("followRuntimeEvents discovers appended events incrementally without overlapping polls", async () => {
  const received = [];
  let activeReads = 0;
  let maxConcurrentReads = 0;
  let incrementalCallCount = 0;

  const initialEvents = [
    {
      id: "evt_2",
      timestamp: "2026-03-30T00:00:02.000Z",
      issueNumber: 31,
      phase: "claim",
      event: "second",
      message: "Second event."
    },
    {
      id: "evt_1",
      timestamp: "2026-03-30T00:00:01.000Z",
      issueNumber: 31,
      phase: "claim",
      event: "first",
      message: "First event."
    }
  ];
  const appendedBatches = [
    [
      {
        id: "evt_4",
        timestamp: "2026-03-30T00:00:04.000Z",
        issueNumber: 31,
        phase: "execution",
        event: "fourth",
        message: "Fourth event."
      },
      {
        id: "evt_3",
        timestamp: "2026-03-30T00:00:03.000Z",
        issueNumber: 31,
        phase: "execution",
        event: "third",
        message: "Third event."
      }
    ],
    [
      {
        id: "evt_5",
        timestamp: "2026-03-30T00:00:05.000Z",
        issueNumber: 30,
        phase: "execution",
        event: "ignored",
        message: "Ignored event."
      }
    ],
    []
  ];

  const stopFollowing = await followRuntimeEvents(buildRuntimePaths("owner/repo"), {
    startedAt: "2026-03-30T00:00:00.000Z",
    intervalMs: 100,
    eventWindow: 50,
    captureCursor: async () => ({ offset: 200 }),
    listEvents: async ({ limit }) => {
      assert.equal(limit, 50);
      return initialEvents;
    },
    readEventsSince: async (cursor) => {
      activeReads += 1;
      maxConcurrentReads = Math.max(maxConcurrentReads, activeReads);
      const batch = appendedBatches[incrementalCallCount] ?? [];
      incrementalCallCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 150));
      activeReads -= 1;
      return {
        events: batch,
        cursor: { offset: cursor.offset + batch.length }
      };
    },
    matches: (event) => Number(event.issueNumber) === 31,
    onEvent: async (event) => {
      received.push(event.id);
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 420));
  await stopFollowing();

  assert.deepEqual(received, ["evt_1", "evt_2", "evt_3", "evt_4"]);
  assert.equal(maxConcurrentReads, 1);
  assert.ok(incrementalCallCount >= 2);
});

test("formatDaemonPassSummary surfaces dependency-blocked issues in operator output", () => {
  const rendered = formatDaemonPassSummary({
    checked: 6,
    consumed: 2,
    ready: [
      {
        issueNumber: 9,
        priorityRank: 1,
        dependencies: []
      }
    ],
    blocked: [
      {
        issueNumber: 12,
        unresolvedDependencies: [
          { repoSlug: "owner/repo", issueNumber: 11 },
          { repoSlug: "other/repo", issueNumber: 5 }
        ],
        warnings: ["Failed to load dependency other/repo#5: 404"]
      }
    ],
    results: [{ issueNumber: 9 }, { issueNumber: 14 }]
  });

  assert.match(rendered, /Ready candidates: 1/);
  assert.match(rendered, /Blocked by dependency: 1/);
  assert.match(rendered, /Ready queue/);
  assert.match(rendered, /- issue #9 \| priority 1/);
  assert.match(rendered, /Blocked queue/);
  assert.match(rendered, /- issue #12 \| waiting on owner\/repo#11, other\/repo#5/);
  assert.match(rendered, /warnings: Failed to load dependency other\/repo#5: 404/);
});
