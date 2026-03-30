const test = require("node:test");
const assert = require("node:assert/strict");

const { renderAgentsMarkdown } = require("../lib/catalog");

test("renderAgentsMarkdown prefers Claude docs when the agent supports claude-code", () => {
  const markdown = renderAgentsMarkdown([
    {
      name: "demo-agent",
      path: "agents/demo-agent",
      version: "0.1.0",
      maturity: "experimental",
      archetype: "custom",
      platforms: ["claude-code", "codex"],
      categories: ["workflow"],
      description: "Demo agent."
    }
  ]);

  assert.match(markdown, /\[demo-agent\]\(\.\.\/\.\.\/agents\/demo-agent\/claude-code\.md\)/);
});

test("renderAgentsMarkdown falls back to codex.toml when the agent is codex-only", () => {
  const markdown = renderAgentsMarkdown([
    {
      name: "codex-only-agent",
      path: "agents/codex-only-agent",
      version: "0.1.0",
      maturity: "experimental",
      archetype: "custom",
      platforms: ["codex"],
      categories: ["workflow"],
      description: "Codex-only demo agent."
    }
  ]);

  assert.match(
    markdown,
    /\[codex-only-agent\]\(\.\.\/\.\.\/agents\/codex-only-agent\/codex\.toml\)/
  );
});
