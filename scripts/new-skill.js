const fs = require("node:fs/promises");
const path = require("node:path");

function isValidSkillName(name) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function todayISODate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const name = process.argv.slice(2).find((a) => !a.startsWith("-"));

  if (!name) {
    console.error("Usage: npm run new -- <skill-name>");
    process.exitCode = 2;
    return;
  }

  if (!isValidSkillName(name)) {
    console.error(
      `Invalid skill name: ${name}. Expected kebab-case (e.g. \"my-skill\").`
    );
    process.exitCode = 2;
    return;
  }

  const skillDir = path.join(repoRoot, "skills", name);
  if (await fileExists(skillDir)) {
    console.error(`Skill already exists: skills/${name}`);
    process.exitCode = 2;
    return;
  }

  await fs.mkdir(skillDir, { recursive: true });

  const skillJson = {
    schemaVersion: 1,
    name,
    displayName: name,
    description: "TODO: one-line description",
    version: "0.1.0",
    maturity: "experimental",
    categories: ["general"],
    tags: [],
    authors: [
      {
        name: "TODO: your name"
      }
    ],
    entrypoints: {
      skillDoc: "SKILL.md",
      changelog: "CHANGELOG.md"
    }
  };

  await fs.writeFile(
    path.join(skillDir, "skill.json"),
    `${JSON.stringify(skillJson, null, 2)}\n`,
    "utf8"
  );

  await fs.writeFile(
    path.join(skillDir, "SKILL.md"),
    [
      `# ${name}`,
      "",
      "## Trigger",
      "",
      "<!-- When should this skill be activated? Describe the conditions, keywords, or user intents that trigger it. -->",
      "",
      "TODO",
      "",
      "## Instructions",
      "",
      "<!-- Core prompt / behavioral instructions for the agent. This is the main content of the skill. -->",
      "",
      "TODO",
      "",
      "## Examples",
      "",
      "<!-- Provide concrete input/output examples showing the skill in action. -->",
      "",
      "TODO",
      "",
      "## Caveats",
      "",
      "<!-- Known limitations, edge cases, or situations where this skill should NOT be used. -->",
      "",
      "TODO",
      ""
    ].join("\n"),
    "utf8"
  );

  await fs.writeFile(
    path.join(skillDir, "CHANGELOG.md"),
    [
      "# Changelog",
      "",
      "All notable changes to this skill will be documented in this file.",
      "This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).",
      "",
      "## [Unreleased]",
      "",
      "## [0.1.0] - " + todayISODate(),
      "- Initial release.",
      ""
    ].join("\n"),
    "utf8"
  );

  console.log(`Created skills/${name}`);
  console.log("Next:");
  console.log("  npm run build");
  console.log("  npm test");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

