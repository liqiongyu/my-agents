#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");

const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const ALL_PLATFORMS = ["claude", "codex"];
const DEFAULT_PROJECT_MANIFEST = "my-agents.project.json";
const PROJECT_SYNC_STATE_PATH = path.join(".my-agents", "project-sync-state.json");

const SKILL_EXCLUDED_NAMES = new Set(["__pycache__", ".DS_Store"]);
const SKILL_EXCLUDED_SUFFIXES = [".pyc"];
const PROJECTION_CONFIG_NAME = "projection.json";
const DEFAULT_SKILL_EXCLUDED_ROOTS = new Set([PROJECTION_CONFIG_NAME]);
const PLATFORM_SKILL_EXCLUDED_ROOTS = {
  codex: new Set(),
  claude: new Set(["skill.json", "CHANGELOG.md", "agents"])
};

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(jsonPath) {
  const raw = await fs.readFile(jsonPath, "utf8");
  return JSON.parse(raw);
}

async function listEntries(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function formatAjvErrors(errors) {
  return (errors ?? [])
    .map((error) => `- ${error.instancePath || "/"} ${error.message}`)
    .join("\n");
}

function unique(values) {
  return [...new Set(values ?? [])];
}

function uniqueSorted(values) {
  return unique(values).sort((a, b) => a.localeCompare(b));
}

function difference(previousValues, nextValues) {
  const nextSet = new Set(nextValues ?? []);
  return (previousValues ?? []).filter((value) => !nextSet.has(value));
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
    ...normalizeRoots(projectionConfig.exclude)
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

function emptyManagedPlatformState() {
  return {
    packs: [],
    skills: [],
    agents: []
  };
}

function createEmptyProjectSyncState() {
  return {
    schemaVersion: 1,
    updatedAt: null,
    manifestPath: DEFAULT_PROJECT_MANIFEST,
    platforms: {
      claude: emptyManagedPlatformState(),
      codex: emptyManagedPlatformState()
    }
  };
}

function normalizeManagedPlatformState(entry) {
  return {
    packs: uniqueSorted(entry?.packs),
    skills: uniqueSorted(entry?.skills),
    agents: uniqueSorted(entry?.agents)
  };
}

function normalizeProjectSyncState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("expected an object at the top level");
  }

  const platforms =
    state.platforms && typeof state.platforms === "object" && !Array.isArray(state.platforms)
      ? state.platforms
      : {};

  return {
    schemaVersion: 1,
    updatedAt: typeof state.updatedAt === "string" ? state.updatedAt : null,
    manifestPath:
      typeof state.manifestPath === "string" && state.manifestPath.trim()
        ? state.manifestPath
        : DEFAULT_PROJECT_MANIFEST,
    platforms: {
      claude: normalizeManagedPlatformState(platforms.claude),
      codex: normalizeManagedPlatformState(platforms.codex)
    }
  };
}

async function readProjectSyncState(statePath, { strict = false } = {}) {
  if (!(await fileExists(statePath))) {
    return createEmptyProjectSyncState();
  }

  try {
    const parsed = await readJson(statePath);
    return normalizeProjectSyncState(parsed);
  } catch (err) {
    if (strict) {
      throw new Error(`Invalid project sync state: ${statePath} (${err.message})`);
    }
    return createEmptyProjectSyncState();
  }
}

async function writeProjectSyncState(statePath, state) {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(`${statePath}`, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function parseArgs(argv) {
  const args = argv.slice(2);
  let type = null;
  let name = null;
  let all = false;
  let platforms = null;
  let platformsSpecified = false;
  let scope = "user";
  let isUninstall = false;
  let prune = false;
  let manifestPath = DEFAULT_PROJECT_MANIFEST;

  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--skill" || arg === "-s") {
      type = "skill";
    } else if (arg === "--agent" || arg === "-a") {
      type = "agent";
    } else if (arg === "--pack") {
      type = "pack";
    } else if (arg === "--sync-project") {
      type = "project";
      scope = "project";
    } else if (arg === "--all") {
      all = true;
    } else if (arg === "--uninstall" || arg === "-u") {
      isUninstall = true;
    } else if (arg === "--prune") {
      prune = true;
    } else if (arg === "--manifest") {
      const value = args[++index];
      if (value) {
        manifestPath = value;
      }
    } else if (arg === "--platform" || arg === "-p") {
      const value = args[++index];
      if (value) {
        platformsSpecified = true;
        platforms =
          value === "all" ? [...ALL_PLATFORMS] : value.split(",").map((item) => item.trim());
      }
    } else if (arg === "--scope") {
      const value = args[++index];
      if (value === "user" || value === "project") {
        scope = value;
      }
    } else if (!arg.startsWith("-")) {
      name = arg;
    }
  }

  if (!platforms) {
    platforms = [...ALL_PLATFORMS];
  }

  return {
    type,
    name,
    all,
    platforms,
    platformsSpecified,
    scope,
    isUninstall,
    prune,
    manifestPath
  };
}

function getSkillTargets(name, platforms, scope) {
  const targets = [];
  const base = scope === "user" ? os.homedir() : process.cwd();

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
  const base = scope === "user" ? os.homedir() : process.cwd();

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

async function validateProjectManifest(repoRoot, manifest, manifestPath) {
  const schema = await readJson(path.join(repoRoot, "schemas", "project-manifest.schema.json"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  if (!validate(manifest)) {
    console.error(`${manifestPath}: schema validation failed\n${formatAjvErrors(validate.errors)}`);
    return false;
  }

  return true;
}

async function readProjectManifest(repoRoot, manifestPath) {
  const resolvedPath = path.resolve(process.cwd(), manifestPath);
  if (!(await fileExists(resolvedPath))) {
    console.error(`Project manifest not found: ${manifestPath}`);
    return { manifest: null, resolvedPath };
  }

  let manifest;
  try {
    manifest = await readJson(resolvedPath);
  } catch (err) {
    console.error(`Invalid project manifest: ${manifestPath} (${err.message})`);
    return { manifest: null, resolvedPath };
  }

  if (!(await validateProjectManifest(repoRoot, manifest, manifestPath))) {
    return { manifest: null, resolvedPath };
  }

  return { manifest, resolvedPath };
}

async function readPackMetadata(repoRoot, name) {
  const packDir = path.join(repoRoot, "packs", name);
  const packJsonPath = path.join(packDir, "pack.json");

  if (!(await fileExists(packDir)) || !(await fileExists(packJsonPath))) {
    console.error(`Pack not found: packs/${name}`);
    return null;
  }

  try {
    return await readJson(packJsonPath);
  } catch (err) {
    console.error(`Invalid pack metadata: packs/${name}/pack.json (${err.message})`);
    return null;
  }
}

async function installSkill(repoRoot, name, platforms, scope) {
  const skillDir = path.join(repoRoot, "skills", name);
  if (!(await fileExists(skillDir))) {
    console.error(`Skill not found: skills/${name}`);
    return false;
  }

  const skillJsonPath = path.join(skillDir, "skill.json");
  let skillDoc = "SKILL.md";
  if (await fileExists(skillJsonPath)) {
    const meta = await readJson(skillJsonPath);
    skillDoc = meta.entrypoints?.skillDoc ?? "SKILL.md";
  }

  const srcPath = path.join(skillDir, skillDoc);
  if (!(await fileExists(srcPath))) {
    console.error(`Skill doc not found: skills/${name}/${skillDoc}`);
    return false;
  }

  const targets = getSkillTargets(name, platforms, scope);
  const projectionConfig = await loadProjectionConfig(skillDir);
  let installed = 0;

  for (const target of targets) {
    const excludedRoots = buildExcludedRoots(projectionConfig, target.platformKey);
    await copySkillDirAtomic(skillDir, target.destDir, excludedRoots);
    console.log(`Installed (${target.platform}, ${scope}): ${target.destDir}/`);
    installed++;
  }

  if (installed === 0) {
    console.error(`No targets matched for skill ${name}`);
    return false;
  }

  return true;
}

async function installAgent(repoRoot, name, platforms, scope) {
  const agentDir = path.join(repoRoot, "agents", name);
  if (!(await fileExists(agentDir))) {
    console.error(`Agent not found: agents/${name}`);
    return false;
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
    return false;
  }

  return true;
}

async function uninstallSkill(name, platforms, scope) {
  const targets = getSkillTargets(name, platforms, scope);
  for (const target of targets) {
    if (await removeDirRecursive(target.destDir)) {
      console.log(`Uninstalled (${target.platform}, ${scope}): ${target.destDir}/`);
    } else {
      console.log(`Not installed (${target.platform}, ${scope}): ${target.destDir}/`);
    }
  }
  return true;
}

async function uninstallAgent(name, platforms, scope) {
  const targets = getAgentTargets(name, platforms, scope);
  for (const target of targets) {
    if (await fileExists(target.destPath)) {
      await fs.unlink(target.destPath);
      console.log(`Uninstalled (${target.platform}, ${scope}): ${target.destPath}`);
    } else {
      console.log(`Not installed (${target.platform}, ${scope}): ${target.destPath}`);
    }
  }
  return true;
}

async function installPack(repoRoot, name, platforms, scope) {
  const pack = await readPackMetadata(repoRoot, name);
  if (!pack) {
    return false;
  }

  console.log(`Installing pack: ${name}`);
  let ok = true;

  for (const skillName of unique(pack.skills)) {
    if (!(await installSkill(repoRoot, skillName, platforms, scope))) {
      console.error(`Pack ${name}: failed to install skill "${skillName}"`);
      ok = false;
    }
  }

  for (const agentName of unique(pack.agents)) {
    if (!(await installAgent(repoRoot, agentName, platforms, scope))) {
      console.error(`Pack ${name}: failed to install agent "${agentName}"`);
      ok = false;
    }
  }

  if (ok) {
    console.log(`Installed pack: ${name}`);
  }

  return ok;
}

async function uninstallPack(repoRoot, name, platforms, scope) {
  const pack = await readPackMetadata(repoRoot, name);
  if (!pack) {
    return false;
  }

  console.log(`Uninstalling pack: ${name}`);
  for (const skillName of unique(pack.skills)) {
    await uninstallSkill(skillName, platforms, scope);
  }
  for (const agentName of unique(pack.agents)) {
    await uninstallAgent(agentName, platforms, scope);
  }
  console.log(`Uninstalled pack: ${name}`);
  return true;
}

async function expandManifestMembers(repoRoot, manifest) {
  const desiredPacks = unique(manifest.packs);
  const packSkillNames = [];
  const packAgentNames = [];
  let ok = true;

  for (const packName of desiredPacks) {
    const pack = await readPackMetadata(repoRoot, packName);
    if (!pack) {
      ok = false;
      continue;
    }
    packSkillNames.push(...(pack.skills ?? []));
    packAgentNames.push(...(pack.agents ?? []));
  }

  return {
    ok,
    packs: desiredPacks,
    packSkills: unique(packSkillNames),
    packAgents: unique(packAgentNames),
    effectiveSkills: unique([...packSkillNames, ...(manifest.skills ?? [])]),
    effectiveAgents: unique([...packAgentNames, ...(manifest.agents ?? [])])
  };
}

async function pruneManagedMembers(previousEntry, desiredEntry, platform) {
  const platformList = [platform];
  let ok = true;

  for (const agentName of difference(previousEntry.agents, desiredEntry.agents)) {
    if (!(await uninstallAgent(agentName, platformList, "project"))) {
      ok = false;
    }
  }

  for (const skillName of difference(previousEntry.skills, desiredEntry.skills)) {
    if (!(await uninstallSkill(skillName, platformList, "project"))) {
      ok = false;
    }
  }

  return ok;
}

async function syncProject(repoRoot, manifestPath, cliPlatforms, platformsSpecified, prune) {
  const { manifest, resolvedPath } = await readProjectManifest(repoRoot, manifestPath);
  if (!manifest) {
    return false;
  }

  const expanded = await expandManifestMembers(repoRoot, manifest);
  if (!expanded.ok) {
    return false;
  }

  const effectivePlatforms = platformsSpecified
    ? cliPlatforms
    : manifest.platforms?.length
      ? manifest.platforms
      : [...ALL_PLATFORMS];

  const statePath = path.join(process.cwd(), PROJECT_SYNC_STATE_PATH);
  let previousState;
  try {
    previousState = await readProjectSyncState(statePath, { strict: prune });
  } catch (err) {
    console.error(err.message);
    return false;
  }

  const relativeManifestPath = path.relative(process.cwd(), resolvedPath) || manifestPath;
  console.log(`Syncing project manifest: ${relativeManifestPath}${prune ? " (prune)" : ""}`);

  let ok = true;
  for (const packName of expanded.packs) {
    if (!(await installPack(repoRoot, packName, effectivePlatforms, "project"))) {
      console.error(`Project manifest: failed to install pack "${packName}"`);
      ok = false;
    }
  }

  for (const skillName of unique(manifest.skills)) {
    if (expanded.packSkills.includes(skillName)) {
      continue;
    }
    if (!(await installSkill(repoRoot, skillName, effectivePlatforms, "project"))) {
      console.error(`Project manifest: failed to install skill "${skillName}"`);
      ok = false;
    }
  }

  for (const agentName of unique(manifest.agents)) {
    if (expanded.packAgents.includes(agentName)) {
      continue;
    }
    if (!(await installAgent(repoRoot, agentName, effectivePlatforms, "project"))) {
      console.error(`Project manifest: failed to install agent "${agentName}"`);
      ok = false;
    }
  }

  if (!ok) {
    return false;
  }

  const nextState = normalizeProjectSyncState(previousState);
  for (const platform of effectivePlatforms) {
    const previousEntry = normalizeManagedPlatformState(nextState.platforms[platform]);
    const desiredEntry = {
      packs: uniqueSorted(expanded.packs),
      skills: uniqueSorted(expanded.effectiveSkills),
      agents: uniqueSorted(expanded.effectiveAgents)
    };

    if (prune) {
      if (!(await pruneManagedMembers(previousEntry, desiredEntry, platform))) {
        ok = false;
      }
      nextState.platforms[platform] = desiredEntry;
    } else {
      nextState.platforms[platform] = {
        packs: desiredEntry.packs,
        skills: uniqueSorted([...previousEntry.skills, ...desiredEntry.skills]),
        agents: uniqueSorted([...previousEntry.agents, ...desiredEntry.agents])
      };
    }
  }

  if (!ok) {
    return false;
  }

  nextState.schemaVersion = 1;
  nextState.updatedAt = new Date().toISOString();
  nextState.manifestPath = relativeManifestPath;
  await writeProjectSyncState(statePath, nextState);

  console.log(`Wrote sync state: ${path.relative(process.cwd(), statePath)}`);
  console.log(`Synced project manifest: ${relativeManifestPath}`);
  return true;
}

const USAGE = `Usage:
  npm run install-skill   -- <name> [options]    Install a skill
  npm run install-agent   -- <name> [options]    Install an agent
  npm run install-pack    -- <name> [options]    Install a pack
  npm run sync-project    -- [options]           Sync a project manifest into project scope
  npm run uninstall-skill -- <name> [options]    Uninstall a skill
  npm run uninstall-agent -- <name> [options]    Uninstall an agent
  npm run uninstall-pack  -- <name> [options]    Uninstall a pack

Options:
  --all                    Install/uninstall all packages of the selected type
  --manifest <path>        Project manifest path (default: my-agents.project.json)
  --platform, -p <list>    Platforms: claude, codex, or all (default: all)
  --prune                  When used with sync-project, remove previously managed items no longer desired
  --scope <scope>          Scope: user or project (default: user)

Examples:
  npm run install-skill -- clarify
  npm run install-agent -- explorer --platform codex --scope project
  npm run install-pack -- product-manager --platform codex --scope project
  npm run sync-project -- --manifest docs/examples/my-agents.project.example.json
  npm run sync-project -- --prune
  npm run uninstall-pack -- product-manager --platform claude`;

async function runAll(repoRoot, type, platforms, scope, isUninstall) {
  const dirName = type === "agent" ? "agents" : type === "pack" ? "packs" : "skills";
  const names = await listEntries(path.join(repoRoot, dirName));
  let ok = true;

  for (const name of names) {
    let currentOk;
    if (type === "agent") {
      currentOk = isUninstall
        ? await uninstallAgent(name, platforms, scope)
        : await installAgent(repoRoot, name, platforms, scope);
    } else if (type === "pack") {
      currentOk = isUninstall
        ? await uninstallPack(repoRoot, name, platforms, scope)
        : await installPack(repoRoot, name, platforms, scope);
    } else {
      currentOk = isUninstall
        ? await uninstallSkill(name, platforms, scope)
        : await installSkill(repoRoot, name, platforms, scope);
    }
    ok = currentOk && ok;
  }

  console.log(`\n${isUninstall ? "Uninstalled" : "Installed"} all ${names.length} ${dirName}.`);
  return ok;
}

async function main() {
  const {
    type,
    name,
    all,
    platforms,
    platformsSpecified,
    scope,
    isUninstall,
    prune,
    manifestPath
  } = parseArgs(process.argv);

  if (!type) {
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }

  const repoRoot = path.resolve(__dirname, "..");
  let ok = true;

  if (type === "project") {
    if (all) {
      console.error("`sync-project` does not support --all.");
      process.exitCode = 2;
      return;
    }
    if (isUninstall) {
      console.error("`sync-project` does not support --uninstall.");
      process.exitCode = 2;
      return;
    }
    ok = await syncProject(repoRoot, manifestPath, platforms, platformsSpecified, prune);
  } else if (all) {
    ok = await runAll(repoRoot, type, platforms, scope, isUninstall);
  } else if (name) {
    if (type === "agent") {
      ok = isUninstall
        ? await uninstallAgent(name, platforms, scope)
        : await installAgent(repoRoot, name, platforms, scope);
    } else if (type === "pack") {
      ok = isUninstall
        ? await uninstallPack(repoRoot, name, platforms, scope)
        : await installPack(repoRoot, name, platforms, scope);
    } else {
      ok = isUninstall
        ? await uninstallSkill(name, platforms, scope)
        : await installSkill(repoRoot, name, platforms, scope);
    }
  } else {
    console.error("Provide a name or use --all.");
    process.exitCode = 2;
    return;
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
