const test = require("node:test");
const assert = require("node:assert/strict");

const { parseGitHubPackageUrl } = require("../lib/github-package-url");

test("parses a GitHub tree URL for a skill directory", () => {
  const parsed = parseGitHubPackageUrl(
    "https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering"
  );

  assert.equal(parsed.repositoryName, "affaan-m/everything-claude-code");
  assert.equal(parsed.mode, "tree");
  assert.deepEqual(parsed.candidates[0], {
    declaredRef: "main",
    path: "skills/agentic-engineering"
  });
});

test("parses a GitHub blob URL for a single-file agent", () => {
  const parsed = parseGitHubPackageUrl(
    "https://github.com/VoltAgent/awesome-codex-subagents/blob/main/categories/01-core-development/api-designer.toml"
  );

  assert.equal(parsed.repositoryName, "VoltAgent/awesome-codex-subagents");
  assert.equal(parsed.mode, "blob");
  assert.deepEqual(parsed.candidates[0], {
    declaredRef: "main",
    path: "categories/01-core-development/api-designer.toml"
  });
});

test("rejects a repo root URL", () => {
  assert.throws(
    () => parseGitHubPackageUrl("https://github.com/affaan-m/everything-claude-code"),
    /tree\/blob asset path/
  );
});

test("rejects a GitHub URL without a ref and path", () => {
  assert.throws(
    () => parseGitHubPackageUrl("https://github.com/affaan-m/everything-claude-code/tree/main"),
    /tree\/blob asset path/
  );
});

test("rejects non-GitHub URLs", () => {
  assert.throws(
    () => parseGitHubPackageUrl("https://example.com/affaan-m/everything-claude-code"),
    /only github.com URLs are supported/
  );
});
