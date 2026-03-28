const test = require("node:test");
const assert = require("node:assert/strict");

const { validateProjectManifestReferences } = require("../lib/validate-utils");

function runValidation(manifest) {
  const errors = [];
  validateProjectManifestReferences(
    manifest,
    "my-agents.project.json",
    new Set(["product-manager"]),
    new Set(["brainstorming"]),
    new Set(["explorer"]),
    errors
  );
  return errors;
}

test("accepts mixed local and external manifest entries", () => {
  const errors = runValidation({
    schemaVersion: 1,
    packs: ["product-manager"],
    skills: [
      "brainstorming",
      {
        source: "official",
        provider: "github",
        platform: "claude",
        name: "agentic-engineering",
        repo: "affaan-m/everything-claude-code",
        declaredRef: "main",
        resolvedCommit: "0123456789abcdef0123456789abcdef01234567",
        path: "skills/agentic-engineering",
        sourceUrl:
          "https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering"
      }
    ],
    agents: ["explorer"]
  });

  assert.deepEqual(errors, []);
});

test("flags duplicate external entries by canonical identity", () => {
  const externalEntry = {
    source: "official",
    provider: "github",
    platform: "codex",
    name: "api-designer",
    repo: "VoltAgent/awesome-codex-subagents",
    declaredRef: "main",
    resolvedCommit: "0123456789abcdef0123456789abcdef01234567",
    path: "categories/01-core-development/api-designer.toml",
    sourceUrl:
      "https://github.com/VoltAgent/awesome-codex-subagents/blob/main/categories/01-core-development/api-designer.toml"
  };

  const errors = runValidation({
    schemaVersion: 1,
    packs: [],
    skills: [],
    agents: [externalEntry, { ...externalEntry }]
  });

  assert.match(errors[0], /duplicate external entry/);
});

test("flags duplicate external runtime destinations", () => {
  const errors = runValidation({
    schemaVersion: 1,
    packs: [],
    skills: [],
    agents: [
      {
        source: "official",
        provider: "github",
        platform: "claude",
        name: "code-reviewer",
        repo: "affaan-m/everything-claude-code",
        declaredRef: "main",
        resolvedCommit: "0123456789abcdef0123456789abcdef01234567",
        path: "agents/code-reviewer.md",
        sourceUrl:
          "https://github.com/affaan-m/everything-claude-code/blob/main/agents/code-reviewer.md"
      },
      {
        source: "official",
        provider: "github",
        platform: "claude",
        name: "code-reviewer",
        repo: "another-org/another-repo",
        declaredRef: "main",
        resolvedCommit: "fedcba9876543210fedcba9876543210fedcba98",
        path: "agents/code-reviewer.md",
        sourceUrl: "https://github.com/another-org/another-repo/blob/main/agents/code-reviewer.md"
      }
    ]
  });

  assert.match(errors[0], /duplicate external agent destination/);
});
