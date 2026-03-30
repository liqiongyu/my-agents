const test = require("node:test");
const assert = require("node:assert/strict");

const {
  collectNestedPlatformAgentWarnings,
  getPlatformAgentRefs
} = require("../lib/validate-utils");

test("getPlatformAgentRefs returns explicit platform-specific agent refs", () => {
  const agent = {
    agents: ["reviewer"],
    platformDependencies: {
      "claude-code": {
        agents: ["triager", "coder"]
      }
    }
  };

  assert.deepEqual(getPlatformAgentRefs(agent, "claude-code"), ["triager", "coder"]);
  assert.deepEqual(getPlatformAgentRefs(agent, "codex"), []);
});

test("collectNestedPlatformAgentWarnings only warns on nested refs declared for that platform", () => {
  const claudeGraph = new Map([
    ["controller", ["reviewer", "planner"]],
    ["reviewer", []],
    ["planner", []],
    ["explorer", []]
  ]);

  assert.deepEqual(
    collectNestedPlatformAgentWarnings(claudeGraph, {
      platformKey: "claude-code",
      platformLabel: "Claude Code"
    }),
    []
  );
});

test("collectNestedPlatformAgentWarnings reports second-level Claude Code agent graphs", () => {
  const claudeGraph = new Map([
    ["controller", ["reviewer"]],
    ["reviewer", ["explorer"]],
    ["explorer", []]
  ]);

  const warnings = collectNestedPlatformAgentWarnings(claudeGraph, {
    platformKey: "claude-code",
    platformLabel: "Claude Code"
  });

  assert.equal(warnings.length, 1);
  assert.match(
    warnings[0],
    /agents\/controller\/agent\.json: platformDependencies\["claude-code"\]\.agents references agent "reviewer".*Claude Code only supports one level of subagent nesting/
  );
});
