const fs = require("node:fs/promises");

const { fileExists, readJson } = require("./fs-utils");
const { DEFAULT_PROJECT_MANIFEST, uniqueSorted } = require("./install-shared");

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
  await fs.mkdir(require("node:path").dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

module.exports = {
  createEmptyProjectSyncState,
  normalizeManagedPlatformState,
  normalizeProjectSyncState,
  readProjectSyncState,
  writeProjectSyncState
};
