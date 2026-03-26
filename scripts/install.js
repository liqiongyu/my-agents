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

async function listEntries(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let type = null;
  let name = null;
  let all = false;

  for (const arg of args) {
    if (arg === "--skill" || arg === "-s") {
      type = "skill";
    } else if (arg === "--agent" || arg === "-a") {
      type = "agent";
    } else if (arg === "--all") {
      all = true;
    } else if (!arg.startsWith("-")) {
      name = arg;
    }
  }

  return { type, name, all };
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

async function uninstallSkill(name) {
  const destPath = path.join(os.homedir(), ".claude", "commands", `${name}.md`);
  if (await fileExists(destPath)) {
    await fs.unlink(destPath);
    console.log(`Uninstalled: ${destPath}`);
  } else {
    console.log(`Not installed: ${destPath}`);
  }
}

async function uninstallAgent(name) {
  let removed = 0;

  const claudePath = path.join(os.homedir(), ".claude", "agents", `${name}.md`);
  if (await fileExists(claudePath)) {
    await fs.unlink(claudePath);
    console.log(`Uninstalled (Claude Code): ${claudePath}`);
    removed++;
  }

  const codexPath = path.join(os.homedir(), ".codex", "agents", `${name}.toml`);
  if (await fileExists(codexPath)) {
    await fs.unlink(codexPath);
    console.log(`Uninstalled (Codex): ${codexPath}`);
    removed++;
  }

  if (removed === 0) {
    console.log(`Not installed: ${name}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isUninstall = args.includes("--uninstall") || args.includes("-u");

  const { type, name, all } = parseArgs(process.argv);

  if (!type) {
    console.error("Usage: npm run install-skill   -- <name>     Install a skill");
    console.error("       npm run install-skill   -- --all      Install all skills");
    console.error("       npm run install-agent   -- <name>     Install an agent");
    console.error("       npm run install-agent   -- --all      Install all agents");
    console.error("       npm run uninstall-skill -- <name>     Uninstall a skill");
    console.error("       npm run uninstall-skill -- --all      Uninstall all skills");
    console.error("       npm run uninstall-agent -- <name>     Uninstall an agent");
    console.error("       npm run uninstall-agent -- --all      Uninstall all agents");
    process.exitCode = 2;
    return;
  }

  const repoRoot = path.resolve(__dirname, "..");

  if (isUninstall) {
    if (all) {
      const dir = type === "agent" ? "agents" : "skills";
      const names = await listEntries(path.join(repoRoot, dir));
      for (const n of names) {
        if (type === "agent") {
          await uninstallAgent(n);
        } else {
          await uninstallSkill(n);
        }
      }
      console.log(`\nUninstalled all ${names.length} ${dir}.`);
    } else if (name) {
      if (type === "agent") {
        await uninstallAgent(name);
      } else {
        await uninstallSkill(name);
      }
    } else {
      console.error("Provide a name or use --all.");
      process.exitCode = 2;
    }
  } else {
    if (all) {
      const dir = type === "agent" ? "agents" : "skills";
      const names = await listEntries(path.join(repoRoot, dir));
      for (const n of names) {
        if (type === "agent") {
          await installAgent(repoRoot, n);
        } else {
          await installSkill(repoRoot, n);
        }
      }
      console.log(`\nInstalled all ${names.length} ${dir}.`);
    } else if (name) {
      if (type === "agent") {
        await installAgent(repoRoot, name);
      } else {
        await installSkill(repoRoot, name);
      }
    } else {
      console.error("Provide a name or use --all.");
      process.exitCode = 2;
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
