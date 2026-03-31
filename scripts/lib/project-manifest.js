const path = require("node:path");

const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const { fileExists, readJson } = require("./fs-utils");
const { DEFAULT_PROJECT_MANIFEST, unique } = require("./install-shared");
const { formatAjvErrors } = require("./validate-utils");
const {
  getExternalProjectManifestEntryId,
  getExternalProjectManifestEntries,
  getLocalProjectManifestEntries
} = require("./project-manifest-entries");

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

async function readProjectManifest(repoRoot, manifestPath = DEFAULT_PROJECT_MANIFEST) {
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

async function expandManifestMembers(repoRoot, manifest) {
  const desiredPacks = unique(manifest.packs);
  const packSkillNames = [];
  const packAgentNames = [];
  const directLocalSkills = unique(getLocalProjectManifestEntries(manifest.skills));
  const directLocalAgents = unique(getLocalProjectManifestEntries(manifest.agents));
  const externalSkills = [];
  const externalAgents = [];
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

  const seenExternalSkillIds = new Set();
  for (const entry of getExternalProjectManifestEntries(manifest.skills)) {
    const id = getExternalProjectManifestEntryId(entry);
    if (seenExternalSkillIds.has(id)) {
      continue;
    }
    seenExternalSkillIds.add(id);
    externalSkills.push(entry);
  }

  const seenExternalAgentIds = new Set();
  for (const entry of getExternalProjectManifestEntries(manifest.agents)) {
    const id = getExternalProjectManifestEntryId(entry);
    if (seenExternalAgentIds.has(id)) {
      continue;
    }
    seenExternalAgentIds.add(id);
    externalAgents.push(entry);
  }

  return {
    ok,
    packs: desiredPacks,
    packSkills: unique(packSkillNames),
    packAgents: unique(packAgentNames),
    directLocalSkills,
    directLocalAgents,
    externalSkills,
    externalAgents,
    effectiveLocalSkills: unique([...packSkillNames, ...directLocalSkills]),
    effectiveLocalAgents: unique([...packAgentNames, ...directLocalAgents])
  };
}

module.exports = {
  readProjectManifest,
  readPackMetadata,
  expandManifestMembers
};
