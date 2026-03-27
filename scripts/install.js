#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");

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

const SKILL_EXCLUDED_NAMES = new Set(["__pycache__", ".DS_Store"]);
const SKILL_EXCLUDED_SUFFIXES = [".pyc"];
const PROJECTION_CONFIG_NAME = "projection.json";
const DEFAULT_SKILL_EXCLUDED_ROOTS = new Set([PROJECTION_CONFIG_NAME]);
const PLATFORM_SKILL_EXCLUDED_ROOTS = {
  codex: new Set(),
  claude: new Set(["skill.json", "CHANGELOG.md", "agents"]),
};

async function loadProjectionConfig(skillDir) {
  const projectionPath = path.join(skillDir, PROJECTION_CONFIG_NAME);
  if (!(await fileExists(projectionPath))) {
    return {};
  }
  try {
    const raw = await fs.readFile(projectionPath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function normalizeRoots(values) {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .filter((value) => typeof value === "string")
    .map((value) => value.trim().replace(/^\/+|\/+$/g, ""))
    .filter(Boolean);
}

function buildExcludedRoots(projectionConfig, platformKey) {
  const roots = new Set([
    ...DEFAULT_SKILL_EXCLUDED_ROOTS,
    ...(PLATFORM_SKILL_EXCLUDED_ROOTS[platformKey] ?? []),
    ...normalizeRoots(projectionConfig.exclude),
  ]);

  const platformConfig =
    projectionConfig &&
    typeof projectionConfig === "object" &&
    projectionConfig.platforms &&
    typeof projectionConfig.platforms === "object"
      ? projectionConfig.platforms[platformKey]
      : null;

  for (const root of normalizeRoots(platformConfig?.exclude)) {
    roots.add(root);
  }

  return roots;
}

function shouldSkipSkillEntry(relativePath, excludedRoots) {
  const parts = relativePath.split(path.sep);
  if (parts.some((part) => SKILL_EXCLUDED_NAMES.has(part))) {
    return true;
  }
  if (SKILL_EXCLUDED_SUFFIXES.some((suffix) => relativePath.endsWith(suffix))) {
    return true;
  }
  if (parts[0] && excludedRoots.has(parts[0])) {
    return true;
  }
  return false;
}

async function copySkillDir(src, dest, excludedRoots, relativePath = "") {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const entryRelativePath = relativePath ? path.join(relativePath, entry.name) : entry.name;
    if (shouldSkipSkillEntry(entryRelativePath, excludedRoots)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copySkillDir(srcPath, destPath, excludedRoots, entryRelativePath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function copySkillDirAtomic(src, dest, excludedRoots) {
  const parentDir = path.dirname(dest);
  await fs.mkdir(parentDir, { recursive: true });
  const tmpDir = path.join(
    parentDir,
    `.${path.basename(dest)}.tmp-${crypto.randomBytes(6).toString("hex")}`
  );
  await copySkillDir(src, tmpDir, excludedRoots);
  await fs.rm(dest, { recursive: true, force: true });
  await fs.rename(tmpDir, dest);
}

async function removeDirRecursive(dir) {
  if (await fileExists(dir)) {
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  }
  return false;
}

const ALL_PLATFORMS = ["claude", "codex"];

function parseArgs(argv) {
  const args = argv.slice(2);
  let type = null;
  let name = null;
  let all = false;
  let platforms = null;
  let scope = "user";
  let isUninstall = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--skill" || arg === "-s") {
      type = "skill";
    } else if (arg === "--agent" || arg === "-a") {
      type = "agent";
    } else if (arg === "--all") {
      all = true;
    } else if (arg === "--uninstall" || arg === "-u") {
      isUninstall = true;
    } else if (arg === "--platform" || arg === "-p") {
      const val = args[++i];
      if (val) {
        platforms = val === "all" ? [...ALL_PLATFORMS] : val.split(",").map((s) => s.trim());
      }
    } else if (arg === "--scope") {
      const val = args[++i];
      if (val === "user" || val === "project") {
        scope = val;
      }
    } else if (!arg.startsWith("-")) {
      name = arg;
    }
  }

  if (!platforms) {
    platforms = [...ALL_PLATFORMS];
  }

  return { type, name, all, platforms, scope, isUninstall };
}

// --- Skill installation targets ---
// Claude Code: full skill directory
//   user:    ~/.claude/skills/<name>/
//   project: .claude/skills/<name>/
// Codex: full skill directory
//   user:    ~/.agents/skills/<name>/
//   project: .agents/skills/<name>/

function getSkillTargets(name, platforms, scope) {
  const targets = [];
  const base = scope === "user" ? os.homedir() : process.cwd();

  if (platforms.includes("claude")) {
    targets.push({
      platformKey: "claude",
      platform: "Claude Code",
      mode: "dir",
      destDir: path.join(base, ".claude", "skills", name),
    });
  }

  if (platforms.includes("codex")) {
    targets.push({
      platformKey: "codex",
      platform: "Codex",
      mode: "dir",
      destDir: path.join(base, ".agents", "skills", name),
    });
  }

  return targets;
}

// --- Agent installation targets ---
// Claude Code: claude-code.md
//   user:    ~/.claude/agents/<name>.md
//   project: .claude/agents/<name>.md
// Codex: codex.toml
//   user:    ~/.codex/agents/<name>.toml
//   project: .codex/agents/<name>.toml

function getAgentTargets(name, platforms, scope) {
  const targets = [];
  const base = scope === "user" ? os.homedir() : process.cwd();

  if (platforms.includes("claude")) {
    targets.push({
      platform: "Claude Code",
      srcFile: "claude-code.md",
      destDir: path.join(base, ".claude", "agents"),
      destPath: path.join(base, ".claude", "agents", `${name}.md`),
    });
  }

  if (platforms.includes("codex")) {
    targets.push({
      platform: "Codex",
      srcFile: "codex.toml",
      destDir: path.join(base, ".codex", "agents"),
      destPath: path.join(base, ".codex", "agents", `${name}.toml`),
    });
  }

  return targets;
}

async function installSkill(repoRoot, name, platforms, scope) {
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

  const targets = getSkillTargets(name, platforms, scope);
  const projectionConfig = await loadProjectionConfig(skillDir);
  let installed = 0;

  for (const target of targets) {
    if (target.mode === "dir") {
      // Copy a platform-filtered skill directory so runtime surfaces stay clean.
      const excludedRoots = buildExcludedRoots(projectionConfig, target.platformKey);
      await copySkillDirAtomic(skillDir, target.destDir, excludedRoots);
      console.log(`Installed (${target.platform}, ${scope}): ${target.destDir}/`);
      installed++;
    }
  }

  if (installed === 0) {
    console.error(`No targets matched for skill ${name}`);
    process.exitCode = 1;
  }
}

async function installAgent(repoRoot, name, platforms, scope) {
  const agentDir = path.join(repoRoot, "agents", name);

  if (!(await fileExists(agentDir))) {
    console.error(`Agent not found: agents/${name}`);
    process.exitCode = 1;
    return;
  }

  const targets = getAgentTargets(name, platforms, scope);
  let installed = 0;

  for (const target of targets) {
    const srcPath = path.join(agentDir, target.srcFile);
    if (await fileExists(srcPath)) {
      await fs.mkdir(target.destDir, { recursive: true });
      await fs.copyFile(srcPath, target.destPath);
      console.log(`Installed (${target.platform}, ${scope}): ${target.destPath}`);
      installed++;
    }
  }

  if (installed === 0) {
    console.error(`No platform files found in agents/${name}`);
    process.exitCode = 1;
  }
}

async function uninstallSkill(name, platforms, scope) {
  const targets = getSkillTargets(name, platforms, scope);
  let removed = 0;

  for (const target of targets) {
    if (target.mode === "dir") {
      if (await removeDirRecursive(target.destDir)) {
        console.log(`Uninstalled (${target.platform}, ${scope}): ${target.destDir}/`);
        removed++;
      }
    }
  }

  if (removed === 0) {
    console.log(`Not installed: ${name}`);
  }
}

async function uninstallAgent(name, platforms, scope) {
  const targets = getAgentTargets(name, platforms, scope);
  let removed = 0;

  for (const target of targets) {
    if (await fileExists(target.destPath)) {
      await fs.unlink(target.destPath);
      console.log(`Uninstalled (${target.platform}, ${scope}): ${target.destPath}`);
      removed++;
    }
  }

  if (removed === 0) {
    console.log(`Not installed: ${name}`);
  }
}

const USAGE = `Usage:
  npm run install-skill   -- <name> [options]    Install a skill
  npm run install-agent   -- <name> [options]    Install an agent
  npm run uninstall-skill -- <name> [options]    Uninstall a skill
  npm run uninstall-agent -- <name> [options]    Uninstall an agent

Options:
  --all                    Install/uninstall all skills or agents
  --platform, -p <list>    Platforms: claude, codex, or all (default: all)
  --scope <scope>          Scope: user or project (default: user)

Examples:
  npm run install-skill -- clarify                          # Both platforms, user scope
  npm run install-skill -- clarify --platform codex         # Codex only
  npm run install-skill -- clarify --scope project          # Project scope (./)
  npm run install-skill -- --all --platform claude          # All skills, Claude Code only
  npm run install-agent -- explorer --platform codex --scope project`;

async function main() {
  const { type, name, all, platforms, scope, isUninstall } = parseArgs(process.argv);

  if (!type) {
    console.error(USAGE);
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
          await uninstallAgent(n, platforms, scope);
        } else {
          await uninstallSkill(n, platforms, scope);
        }
      }
      console.log(`\nUninstalled all ${names.length} ${dir}.`);
    } else if (name) {
      if (type === "agent") {
        await uninstallAgent(name, platforms, scope);
      } else {
        await uninstallSkill(name, platforms, scope);
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
          await installAgent(repoRoot, n, platforms, scope);
        } else {
          await installSkill(repoRoot, n, platforms, scope);
        }
      }
      console.log(`\nInstalled all ${names.length} ${dir}.`);
    } else if (name) {
      if (type === "agent") {
        await installAgent(repoRoot, name, platforms, scope);
      } else {
        await installSkill(repoRoot, name, platforms, scope);
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
