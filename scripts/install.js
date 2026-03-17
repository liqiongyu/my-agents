#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const skillName = args.find((a) => !a.startsWith("-"));

  if (!skillName) {
    console.error("Usage: npm run install-skill -- <skill-name>");
    console.error("");
    console.error("Installs a skill's SKILL.md into ~/.claude/commands/<skill-name>.md");
    process.exitCode = 2;
    return;
  }

  const repoRoot = path.resolve(__dirname, "..");
  const skillDir = path.join(repoRoot, "skills", skillName);

  if (!(await fileExists(skillDir))) {
    console.error(`Skill not found: skills/${skillName}`);
    process.exitCode = 1;
    return;
  }

  // Read skill.json for entrypoint
  const skillJsonPath = path.join(skillDir, "skill.json");
  let skillDoc = "SKILL.md";
  if (await fileExists(skillJsonPath)) {
    const raw = await fs.readFile(skillJsonPath, "utf8");
    const meta = JSON.parse(raw);
    skillDoc = meta.entrypoints?.skillDoc ?? "SKILL.md";
  }

  const srcPath = path.join(skillDir, skillDoc);
  if (!(await fileExists(srcPath))) {
    console.error(`Skill doc not found: skills/${skillName}/${skillDoc}`);
    process.exitCode = 1;
    return;
  }

  const destDir = path.join(os.homedir(), ".claude", "commands");
  await fs.mkdir(destDir, { recursive: true });

  const destPath = path.join(destDir, `${skillName}.md`);
  await fs.copyFile(srcPath, destPath);

  console.log(`Installed: ${destPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
