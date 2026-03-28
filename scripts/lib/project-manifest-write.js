const fs = require("node:fs/promises");
const path = require("node:path");

const { fileExists, readJson } = require("./fs-utils");
const { DEFAULT_PROJECT_MANIFEST } = require("./install-shared");
const {
  isExternalProjectManifestEntry,
  isLocalProjectManifestEntry,
  getExternalProjectManifestEntryId
} = require("./project-manifest-entries");

function createEmptyProjectManifest() {
  return {
    schemaVersion: 1,
    packs: [],
    skills: [],
    agents: []
  };
}

function normalizeWritableManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("project manifest must be a JSON object");
  }

  return {
    ...manifest,
    schemaVersion: 1,
    packs: Array.isArray(manifest.packs) ? manifest.packs : [],
    skills: Array.isArray(manifest.skills) ? manifest.skills : [],
    agents: Array.isArray(manifest.agents) ? manifest.agents : []
  };
}

async function readWritableProjectManifest(manifestPath = DEFAULT_PROJECT_MANIFEST) {
  const resolvedPath = path.resolve(process.cwd(), manifestPath);
  if (!(await fileExists(resolvedPath))) {
    return {
      manifest: createEmptyProjectManifest(),
      resolvedPath,
      exists: false
    };
  }

  let manifest;
  try {
    manifest = await readJson(resolvedPath);
  } catch (err) {
    throw new Error(`Invalid project manifest: ${manifestPath} (${err.message})`);
  }

  return {
    manifest: normalizeWritableManifest(manifest),
    resolvedPath,
    exists: true
  };
}

function hasEquivalentManifestEntry(entries, entry) {
  if (isLocalProjectManifestEntry(entry)) {
    return entries.includes(entry);
  }

  if (!isExternalProjectManifestEntry(entry)) {
    return false;
  }

  const targetId = getExternalProjectManifestEntryId(entry);
  return entries.some(
    (currentEntry) =>
      isExternalProjectManifestEntry(currentEntry) &&
      getExternalProjectManifestEntryId(currentEntry) === targetId
  );
}

async function appendProjectManifestEntry(kind, entry, manifestPath = DEFAULT_PROJECT_MANIFEST) {
  if (kind !== "skills" && kind !== "agents") {
    throw new Error(`unsupported project manifest collection: ${kind}`);
  }

  const { manifest, resolvedPath } = await readWritableProjectManifest(manifestPath);
  if (hasEquivalentManifestEntry(manifest[kind], entry)) {
    throw new Error(`Project manifest already contains this ${kind.slice(0, -1)} entry`);
  }

  manifest[kind] = [...manifest[kind], entry];
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return {
    manifest,
    resolvedPath
  };
}

module.exports = {
  appendProjectManifestEntry,
  createEmptyProjectManifest,
  normalizeWritableManifest,
  readWritableProjectManifest
};
