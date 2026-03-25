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

function parseArgs(argv) {
  const args = argv.slice(2);
  let type = null;
  let name = null;

  for (const arg of args) {
    if (arg === "--skill" || arg === "-s") {
      type = "skill";
    } else if (arg === "--agent" || arg === "-a") {
      type = "agent";
    } else if (!arg.startsWith("-")) {
      name = arg;
    }
  }

  return { type, name };
}

async function installSkill(repoRoot, name) {
  const skillDir = path.join(repoRoot, "skills", name);

  if (!(await fileExists(skillDir))) {
    console.error(`Skill not found: skills/${name}`);
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
    console.error(`Skill doc not found: skills/${name}/${skillDoc}`);
    process.exitCode = 1;
    return;
  }

  const destDir = path.join(os.homedir(), ".claude", "commands");
  await fs.mkdir(destDir, { recursive: true });

  const destPath = path.join(destDir, `${name}.md`);
  await fs.copyFile(srcPath, destPath);

  console.log(`Installed: ${destPath}`);
}

async function installAgent(repoRoot, name) {
  const agentDir = path.join(repoRoot, "agents", name);

  if (!(await fileExists(agentDir))) {
    console.error(`Agent not found: agents/${name}`);
    process.exitCode = 1;
    return;
  }

  let installed = 0;

  // Claude Code: claude-code.md → ~/.claude/agents/<name>.md
  const claudeCodeSrc = path.join(agentDir, "claude-code.md");
  if (await fileExists(claudeCodeSrc)) {
    const destDir = path.join(os.homedir(), ".claude", "agents");
    await fs.mkdir(destDir, { recursive: true });
    const destPath = path.join(destDir, `${name}.md`);
    await fs.copyFile(claudeCodeSrc, destPath);
    console.log(`Installed (Claude Code): ${destPath}`);
    installed++;
  }

  // Codex: codex.toml → ~/.codex/agents/<name>.toml
  const codexSrc = path.join(agentDir, "codex.toml");
  if (await fileExists(codexSrc)) {
    const destDir = path.join(os.homedir(), ".codex", "agents");
    await fs.mkdir(destDir, { recursive: true });
    const destPath = path.join(destDir, `${name}.toml`);
    await fs.copyFile(codexSrc, destPath);
    console.log(`Installed (Codex): ${destPath}`);
    installed++;
  }

  if (installed === 0) {
    console.error(`No platform files found in agents/${name}`);
    process.exitCode = 1;
  }
}

async function main() {
  const { type, name } = parseArgs(process.argv);

  if (!type || !name) {
    console.error("Usage: npm run install-skill -- <name>");
    console.error("       npm run install-agent -- <name>");
    console.error("");
    console.error("  --skill, -s   Install a skill to ~/.claude/commands/");
    console.error("  --agent, -a   Install an agent to ~/.claude/agents/ and ~/.codex/agents/");
    process.exitCode = 2;
    return;
  }

  const repoRoot = path.resolve(__dirname, "..");

  if (type === "agent") {
    await installAgent(repoRoot, name);
  } else {
    await installSkill(repoRoot, name);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
