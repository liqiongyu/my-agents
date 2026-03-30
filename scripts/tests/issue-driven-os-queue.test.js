const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");

const { runCli } = require("../lib/issue-driven-os-queue");

const queueScriptPath = path.join(__dirname, "..", "lib", "issue-driven-os-queue.js");

function runQueueScript(args) {
  return execFileSync(process.execPath, [queueScriptPath, ...args], {
    cwd: path.join(__dirname, "..", ".."),
    encoding: "utf8"
  });
}

test("queue helper next keeps pretty JSON output by default", () => {
  const output = runQueueScript(["next", "--repo", "owner/repo", "--dry-run"]);

  assert.match(output, /\[\n {2}\{/);
  assert.match(output, /\n {4}"number": 1,/);

  const parsed = JSON.parse(output);
  assert.equal(parsed[0].number, 1);
});

test("queue helper next emits compact JSON when --json is set", () => {
  const output = runQueueScript(["next", "--repo", "owner/repo", "--dry-run", "--json"]);
  const trimmed = output.trim();

  assert.doesNotMatch(trimmed, /\n/);

  const parsed = JSON.parse(trimmed);
  assert.equal(parsed[0].number, 1);
});

test("queue helper check-children supports compact JSON output", async () => {
  const stdout = [];
  const stderr = [];
  const fakeGh = {
    listIssues: async () => [
      { number: 10, state: "OPEN", body: "", labels: [], title: "Parent" },
      { number: 11, state: "OPEN", body: "depends-on: #10", labels: [], title: "Open child" },
      { number: 12, state: "CLOSED", body: "Parent: #10", labels: [], title: "Closed child" }
    ]
  };

  const exitCode = await runCli(
    ["check-children", "--repo", "owner/repo", "--parent", "10", "--json"],
    {
      buildGhAdapter: () => fakeGh,
      writeStdout: (line) => stdout.push(line),
      writeStderr: (line) => stderr.push(line)
    }
  );

  assert.equal(exitCode, 0);
  assert.deepEqual(stderr, []);
  assert.equal(stdout.length, 1);
  assert.doesNotMatch(stdout[0], /\n/);
  assert.deepEqual(JSON.parse(stdout[0]), {
    allDone: false,
    children: [
      { number: 11, state: "OPEN" },
      { number: 12, state: "CLOSED" }
    ]
  });
});
