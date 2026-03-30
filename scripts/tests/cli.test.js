const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const { followRuntimeEvents } = require("../issue-driven-os-cli");
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
    /npx my-agents issue-driven-os github run <owner>\/<repo> --repo-path <path> --issue <number> \[--follow\] \[--json\] \[--no-resume\]/
  );
  assert.match(
    output,
    /npx my-agents issue-driven-os github resume <owner>\/<repo> --repo-path <path> --issue <number> \[--follow\] \[--json\]/
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
