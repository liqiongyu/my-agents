const fs = require("node:fs/promises");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { executeGitHubIssue } = require("../lib/issue-driven-os-codex-runner");

function buildAgentDefinition() {
  return {
    agentName: "issue-cell-executor",
    developerInstructions: "Follow the structured output contract.",
    sandboxMode: "workspace-write",
    model: "gpt-5.4"
  };
}

function buildExecutionPayload() {
  return {
    status: "implemented",
    summary: "Implemented the requested change.",
    changeSummary: "Updated the target module.",
    verificationSummary: "npm test",
    commitMessage: "feat(issue-os): implement change",
    prTitle: "feat(issue-os): implement change",
    prBody: "Implements the requested change.",
    blockers: []
  };
}

test("executeGitHubIssue defaults to compact trace capture", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const payload = buildExecutionPayload();

  const result = await executeGitHubIssue(
    repoRoot,
    repoRoot,
    { issueNumber: 15 },
    {
      loadCodexAgentDefinition: async () => buildAgentDefinition(),
      runCodexExec: async (args) => {
        const outputPath = args[args.indexOf("--output-last-message") + 1];
        await fs.writeFile(outputPath, JSON.stringify(payload), "utf8");
        return {
          stdout: '{"type":"thread.started","thread_id":"thread_123"}\n',
          stderr: "verbose stderr output",
          events: [{ type: "thread.started", thread_id: "thread_123" }, { type: "message.delta" }],
          eventCount: 2,
          threadId: "thread_123",
          sessionPath: "/tmp/thread_123.jsonl",
          startedAt: "2026-03-30T00:00:00.000Z"
        };
      }
    }
  );

  assert.equal(result.payload.status, "implemented");
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
  assert.equal(result.trace.mode, "compact");
  assert.equal(result.trace.prompt, null);
  assert.equal(result.trace.finalMessage, null);
  assert.deepEqual(result.trace.events, []);
  assert.equal(result.trace.eventCount, 2);
  assert.equal(result.trace.threadId, "thread_123");
  assert.equal(result.trace.sessionPath, "/tmp/thread_123.jsonl");
});

test("executeGitHubIssue preserves rich trace data when requested", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const payload = buildExecutionPayload();

  const result = await executeGitHubIssue(
    repoRoot,
    repoRoot,
    { issueNumber: 15 },
    {
      traceMode: "rich",
      loadCodexAgentDefinition: async () => buildAgentDefinition(),
      runCodexExec: async (args) => {
        const outputPath = args[args.indexOf("--output-last-message") + 1];
        await fs.writeFile(outputPath, JSON.stringify(payload), "utf8");
        return {
          stdout: '{"type":"thread.started","thread_id":"thread_456"}\n',
          stderr: "verbose stderr output",
          events: [{ type: "thread.started", thread_id: "thread_456" }, { type: "message.delta" }],
          eventCount: 2,
          threadId: "thread_456",
          sessionPath: "/tmp/thread_456.jsonl",
          startedAt: "2026-03-30T00:00:00.000Z"
        };
      }
    }
  );

  assert.equal(result.stdout, '{"type":"thread.started","thread_id":"thread_456"}\n');
  assert.equal(result.stderr, "verbose stderr output");
  assert.equal(result.trace.mode, "rich");
  assert.match(result.trace.prompt, /Implement the issue in the current repository/);
  assert.match(result.trace.finalMessage, /"status":"implemented"/);
  assert.equal(result.trace.events.length, 2);
  assert.equal(result.trace.eventCount, 2);
  assert.equal(result.trace.threadId, "thread_456");
});
