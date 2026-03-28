const os = require("node:os");
const path = require("node:path");

function getScopeBase(scope) {
  return scope === "user" ? os.homedir() : process.cwd();
}

function getSkillTargets(name, platforms, scope) {
  const targets = [];
  const base = getScopeBase(scope);

  if (platforms.includes("claude")) {
    targets.push({
      platformKey: "claude",
      platform: "Claude Code",
      destDir: path.join(base, ".claude", "skills", name)
    });
  }

  if (platforms.includes("codex")) {
    targets.push({
      platformKey: "codex",
      platform: "Codex",
      destDir: path.join(base, ".agents", "skills", name)
    });
  }

  return targets;
}

function getAgentTargets(name, platforms, scope) {
  const targets = [];
  const base = getScopeBase(scope);

  if (platforms.includes("claude")) {
    targets.push({
      platform: "Claude Code",
      srcFile: "claude-code.md",
      destDir: path.join(base, ".claude", "agents"),
      destPath: path.join(base, ".claude", "agents", `${name}.md`)
    });
  }

  if (platforms.includes("codex")) {
    targets.push({
      platform: "Codex",
      srcFile: "codex.toml",
      destDir: path.join(base, ".codex", "agents"),
      destPath: path.join(base, ".codex", "agents", `${name}.toml`)
    });
  }

  return targets;
}

function getExternalAssetTarget(kind, entry, scope) {
  const base = getScopeBase(scope);

  if (kind === "skills" && entry.platform === "claude") {
    return {
      platformKey: "claude",
      platform: "Claude Code",
      kind: "skills",
      destType: "directory",
      destPath: path.join(base, ".claude", "skills", entry.name)
    };
  }

  if (kind === "agents" && entry.platform === "claude") {
    return {
      platformKey: "claude",
      platform: "Claude Code",
      kind: "agents",
      destType: "file",
      destPath: path.join(base, ".claude", "agents", `${entry.name}.md`)
    };
  }

  if (kind === "agents" && entry.platform === "codex") {
    return {
      platformKey: "codex",
      platform: "Codex",
      kind: "agents",
      destType: "file",
      destPath: path.join(base, ".codex", "agents", `${entry.name}.toml`)
    };
  }

  throw new Error(`Unsupported external ${kind.slice(0, -1)} platform: ${entry.platform}`);
}

module.exports = {
  getExternalAssetTarget,
  getSkillTargets,
  getAgentTargets
};
