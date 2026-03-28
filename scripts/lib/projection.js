const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const { fileExists } = require("./fs-utils");

const SKILL_EXCLUDED_NAMES = new Set(["__pycache__", ".DS_Store"]);
const SKILL_EXCLUDED_SUFFIXES = [".pyc"];
const PROJECTION_CONFIG_NAME = "projection.json";
const DEFAULT_SKILL_EXCLUDED_ROOTS = new Set([PROJECTION_CONFIG_NAME]);
const PLATFORM_SKILL_EXCLUDED_ROOTS = {
  codex: new Set(),
  "claude-code": new Set(["skill.json", "CHANGELOG.md", "agents"])
};

function canonicalPlatformKey(platformKey) {
  if (platformKey === "claude") {
    return "claude-code";
  }
  return platformKey;
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
  const canonicalKey = canonicalPlatformKey(platformKey);
  const roots = new Set([
    ...DEFAULT_SKILL_EXCLUDED_ROOTS,
    ...(PLATFORM_SKILL_EXCLUDED_ROOTS[canonicalKey] ?? []),
    ...normalizeRoots(projectionConfig.exclude)
  ]);

  const platformConfig =
    projectionConfig &&
    typeof projectionConfig === "object" &&
    projectionConfig.platforms &&
    typeof projectionConfig.platforms === "object"
      ? (projectionConfig.platforms[canonicalKey] ?? projectionConfig.platforms[platformKey])
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

function entrypointIsProjected(entrypointPath, excludedRoots) {
  if (typeof entrypointPath !== "string") {
    return true;
  }
  const normalized = entrypointPath
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^\.([\\/])+/, "");
  if (!normalized) {
    return true;
  }
  return !excludedRoots.has(normalized.split(/[\\/]/)[0]);
}

async function projectedSkillJsonBuffer(srcPath, excludedRoots) {
  const payload = JSON.parse(await fs.readFile(srcPath, "utf8"));
  if (payload && typeof payload === "object") {
    const entrypoints = payload.entrypoints;
    if (entrypoints && typeof entrypoints === "object" && !Array.isArray(entrypoints)) {
      const filtered = Object.fromEntries(
        Object.entries(entrypoints).filter(([, value]) =>
          entrypointIsProjected(value, excludedRoots)
        )
      );
      if (Object.keys(filtered).length > 0) {
        payload.entrypoints = filtered;
      } else {
        delete payload.entrypoints;
      }
    }
  }
  return Buffer.from(`${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

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
    } else if (entryRelativePath === "skill.json") {
      await fs.writeFile(destPath, await projectedSkillJsonBuffer(srcPath, excludedRoots));
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

module.exports = {
  buildExcludedRoots,
  loadProjectionConfig,
  copySkillDirAtomic
};
