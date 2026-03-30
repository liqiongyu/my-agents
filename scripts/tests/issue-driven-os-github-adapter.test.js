const test = require("node:test");
const assert = require("node:assert/strict");

const { buildGhAdapter, DEFAULT_AGENT_LABELS } = require("../lib/issue-driven-os-github-adapter");

test("ensureLabels only creates labels missing from the repository", async () => {
  const createCalls = [];
  const adapter = buildGhAdapter({
    capture: async (_command, args) => {
      if (args[0] === "label" && args[1] === "list") {
        return {
          stdout: JSON.stringify([{ name: "agent:ready" }, { name: "agent:claimed" }]),
          stderr: ""
        };
      }

      if (args[0] === "api" && args[1] === "--method" && args[2] === "POST") {
        createCalls.push(args);
        return { stdout: "", stderr: "" };
      }

      throw new Error(`unexpected gh capture args: ${args.join(" ")}`);
    }
  });

  await adapter.ensureLabels("owner/repo", [
    DEFAULT_AGENT_LABELS[0],
    DEFAULT_AGENT_LABELS[1],
    DEFAULT_AGENT_LABELS[2]
  ]);

  assert.equal(createCalls.length, 1);
  assert.ok(createCalls[0].includes("name=agent:blocked"));
});

test("ensureLabels tolerates concurrent label creation races", async () => {
  const createCalls = [];
  const adapter = buildGhAdapter({
    capture: async (_command, args) => {
      if (args[0] === "label" && args[1] === "list") {
        return { stdout: JSON.stringify([]), stderr: "" };
      }

      if (args[0] === "api" && args[1] === "--method" && args[2] === "POST") {
        createCalls.push(args);
        const nameArg = args.find((arg) => arg.startsWith("name="));
        if (nameArg === "name=agent:ready") {
          throw new Error("gh api exited with code 1: HTTP 422 already_exists");
        }

        return { stdout: "", stderr: "" };
      }

      throw new Error(`unexpected gh capture args: ${args.join(" ")}`);
    }
  });

  await assert.doesNotReject(() =>
    adapter.ensureLabels("owner/repo", [DEFAULT_AGENT_LABELS[0], DEFAULT_AGENT_LABELS[1]])
  );

  assert.equal(createCalls.length, 2);
});

test("submitPullRequestReview maps GitHub review events to gh pr review flags", async () => {
  const runCalls = [];
  const adapter = buildGhAdapter({
    run: async (_command, args) => {
      runCalls.push(args);
    }
  });

  await adapter.submitPullRequestReview("owner/repo", 42, {
    event: "REQUEST_CHANGES",
    body: "Needs more coverage."
  });

  assert.equal(runCalls.length, 1);
  assert.deepEqual(runCalls[0].slice(0, 6), [
    "pr",
    "review",
    "42",
    "--repo",
    "owner/repo",
    "--request-changes"
  ]);
  assert.ok(runCalls[0].includes("--body-file"));
});
