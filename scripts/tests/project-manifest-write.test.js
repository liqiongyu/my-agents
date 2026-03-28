const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  appendProjectManifestEntry,
  readWritableProjectManifest
} = require("../lib/project-manifest-write");

async function createTempManifestPath() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "my-agents-manifest-test-"));
  return {
    tempDir,
    manifestPath: path.join(tempDir, "my-agents.project.json")
  };
}

test("creates a project manifest when adding the first external entry", async () => {
  const { tempDir, manifestPath } = await createTempManifestPath();

  try {
    await appendProjectManifestEntry(
      "skills",
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
      },
      manifestPath
    );

    const { manifest } = await readWritableProjectManifest(manifestPath);
    assert.equal(manifest.schemaVersion, 1);
    assert.deepEqual(manifest.packs, []);
    assert.equal(manifest.skills.length, 1);
    assert.deepEqual(manifest.agents, []);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("preserves existing local entries when appending an external entry", async () => {
  const { tempDir, manifestPath } = await createTempManifestPath();

  try {
    await fs.writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          packs: [],
          skills: ["brainstorming"],
          agents: []
        },
        null,
        2
      )}\n`,
      "utf8"
    );

    await appendProjectManifestEntry(
      "agents",
      {
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
      },
      manifestPath
    );

    const { manifest } = await readWritableProjectManifest(manifestPath);
    assert.deepEqual(manifest.skills, ["brainstorming"]);
    assert.equal(manifest.agents.length, 1);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test("rejects duplicate external entries by canonical identity", async () => {
  const { tempDir, manifestPath } = await createTempManifestPath();

  const entry = {
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
  };

  try {
    await appendProjectManifestEntry("skills", entry, manifestPath);
    await assert.rejects(
      () => appendProjectManifestEntry("skills", entry, manifestPath),
      /already contains/
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
