const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildExcludedRoots,
  copySkillDirAtomic,
  loadProjectionConfig
} = require("../lib/projection");

test("copySkillDirAtomic normalizes projected skill.json entrypoints", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "projection-test-"));

  try {
    const skillDir = path.join(tmp, "skills", "demo-skill");
    const destination = path.join(tmp, ".agents", "skills", "demo-skill");
    await fs.mkdir(path.join(skillDir, "eval"), { recursive: true });

    await fs.writeFile(
      path.join(skillDir, "projection.json"),
      '{\n  "exclude": ["CHANGELOG.md", "eval"]\n}\n',
      "utf8"
    );
    await fs.writeFile(
      path.join(skillDir, "skill.json"),
      "{\n" +
        '  "name": "demo-skill",\n' +
        '  "entrypoints": {\n' +
        '    "skillDoc": "SKILL.md",\n' +
        '    "changelog": "CHANGELOG.md",\n' +
        '    "suite": "eval/trigger-cases.json"\n' +
        "  }\n" +
        "}\n",
      "utf8"
    );
    await fs.writeFile(path.join(skillDir, "SKILL.md"), "# Demo Skill\n", "utf8");
    await fs.writeFile(path.join(skillDir, "CHANGELOG.md"), "# Changelog\n", "utf8");
    await fs.writeFile(path.join(skillDir, "eval", "trigger-cases.json"), '{"cases":[]}\n', "utf8");

    await copySkillDirAtomic(
      skillDir,
      destination,
      new Set(["projection.json", "CHANGELOG.md", "eval"])
    );

    const projected = JSON.parse(await fs.readFile(path.join(destination, "skill.json"), "utf8"));
    assert.deepEqual(projected.entrypoints, { skillDoc: "SKILL.md" });
    await assert.rejects(fs.access(path.join(destination, "CHANGELOG.md")));
    await assert.rejects(fs.access(path.join(destination, "eval", "trigger-cases.json")));
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("copySkillDirAtomic drops excluded ./-prefixed skill.json entrypoints", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "projection-test-dot-"));

  try {
    const skillDir = path.join(tmp, "skills", "demo-skill");
    const destination = path.join(tmp, ".agents", "skills", "demo-skill");
    await fs.mkdir(path.join(skillDir, "eval"), { recursive: true });

    await fs.writeFile(
      path.join(skillDir, "projection.json"),
      '{\n  "exclude": ["CHANGELOG.md", "eval"]\n}\n',
      "utf8"
    );
    await fs.writeFile(
      path.join(skillDir, "skill.json"),
      "{\n" +
        '  "name": "demo-skill",\n' +
        '  "entrypoints": {\n' +
        '    "skillDoc": "./SKILL.md",\n' +
        '    "changelog": "./CHANGELOG.md",\n' +
        '    "suite": "./eval/trigger-cases.json"\n' +
        "  }\n" +
        "}\n",
      "utf8"
    );
    await fs.writeFile(path.join(skillDir, "SKILL.md"), "# Demo Skill\n", "utf8");
    await fs.writeFile(path.join(skillDir, "CHANGELOG.md"), "# Changelog\n", "utf8");
    await fs.writeFile(path.join(skillDir, "eval", "trigger-cases.json"), '{"cases":[]}\n', "utf8");

    await copySkillDirAtomic(
      skillDir,
      destination,
      new Set(["projection.json", "CHANGELOG.md", "eval"])
    );

    const projected = JSON.parse(await fs.readFile(path.join(destination, "skill.json"), "utf8"));
    assert.deepEqual(projected.entrypoints, { skillDoc: "./SKILL.md" });
    await assert.rejects(fs.access(path.join(destination, "CHANGELOG.md")));
    await assert.rejects(fs.access(path.join(destination, "eval", "trigger-cases.json")));
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("buildExcludedRoots honors claude-code projection config during JS install flow", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "projection-test-claude-"));

  try {
    const skillDir = path.join(tmp, "skills", "demo-skill");
    const destination = path.join(tmp, ".claude", "skills", "demo-skill");
    await fs.mkdir(path.join(skillDir, "internal-notes"), { recursive: true });

    await fs.writeFile(
      path.join(skillDir, "projection.json"),
      JSON.stringify(
        {
          platforms: {
            "claude-code": {
              exclude: ["internal-notes"]
            }
          }
        },
        null,
        2
      ),
      "utf8"
    );
    await fs.writeFile(path.join(skillDir, "SKILL.md"), "# Demo Skill\n", "utf8");
    await fs.writeFile(path.join(skillDir, "internal-notes", "draft.md"), "# Draft\n", "utf8");

    const projectionConfig = await loadProjectionConfig(skillDir);
    const excludedRoots = buildExcludedRoots(projectionConfig, "claude");
    await copySkillDirAtomic(skillDir, destination, excludedRoots);

    await assert.rejects(fs.access(path.join(destination, "internal-notes", "draft.md")));
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
