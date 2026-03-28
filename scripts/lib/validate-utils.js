const {
  getExternalProjectManifestEntryId,
  getProjectManifestRuntimeCollisionKey,
  getLocalProjectManifestEntries,
  getExternalProjectManifestEntries
} = require("./project-manifest-entries");

function formatAjvErrors(errors) {
  return (errors ?? [])
    .map((error) => `- ${error.instancePath || "/"} ${error.message}`)
    .join("\n");
}

async function checkChangelogHasVersion(fs, changelogPath, version) {
  const raw = await fs.readFile(changelogPath, "utf8");
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^##\\s*\\[?${escaped}\\]?(?:\\s+-.*)?$`, "m");
  return re.test(raw);
}

function pushUnknownCategoryErrors(baseLabel, categories, allowedCategories, errors) {
  if (!allowedCategories) return;
  for (const category of categories ?? []) {
    if (!allowedCategories.has(category)) {
      errors.push(`${baseLabel}: unknown category "${category}" (add it to categories.json first)`);
    }
  }
}

function findDuplicates(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values ?? []) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates].sort();
}

function validateProjectManifestReferences(
  manifest,
  label,
  packNames,
  skillNames,
  agentNames,
  errors
) {
  for (const duplicate of findDuplicates(manifest.packs)) {
    errors.push(`${label}: duplicate pack "${duplicate}"`);
  }

  const localSkillEntries = getLocalProjectManifestEntries(manifest.skills);
  const localAgentEntries = getLocalProjectManifestEntries(manifest.agents);
  const externalSkillEntries = getExternalProjectManifestEntries(manifest.skills);
  const externalAgentEntries = getExternalProjectManifestEntries(manifest.agents);

  for (const duplicate of findDuplicates(localSkillEntries)) {
    errors.push(`${label}: duplicate skill "${duplicate}"`);
  }

  for (const duplicate of findDuplicates(localAgentEntries)) {
    errors.push(`${label}: duplicate agent "${duplicate}"`);
  }

  for (const packName of manifest.packs ?? []) {
    if (!packNames.has(packName)) {
      errors.push(`${label}: references unknown pack "${packName}"`);
    }
  }

  for (const skillName of localSkillEntries) {
    if (!skillNames.has(skillName)) {
      errors.push(`${label}: references unknown skill "${skillName}"`);
    }
  }

  for (const agentName of localAgentEntries) {
    if (!agentNames.has(agentName)) {
      errors.push(`${label}: references unknown agent "${agentName}"`);
    }
  }

  const externalIds = new Set();
  for (const entry of [...externalSkillEntries, ...externalAgentEntries]) {
    const id = getExternalProjectManifestEntryId(entry);
    if (externalIds.has(id)) {
      errors.push(`${label}: duplicate external entry "${id}"`);
      continue;
    }
    externalIds.add(id);
  }

  const destinationKinds = [
    { kind: "skill", entries: externalSkillEntries },
    { kind: "agent", entries: externalAgentEntries }
  ];

  for (const { kind, entries } of destinationKinds) {
    const destinationKeys = new Set();
    for (const entry of entries) {
      const key = getProjectManifestRuntimeCollisionKey(kind, entry.platform, entry.name);
      if (destinationKeys.has(key)) {
        errors.push(
          `${label}: duplicate external ${kind} destination "${entry.platform}:${entry.name}"`
        );
        continue;
      }
      destinationKeys.add(key);
    }
  }
}

function detectAgentCycles(agentGraph) {
  const errors = [];
  const state = new Map();

  function visit(node, trail) {
    const status = state.get(node);
    if (status === "visiting") {
      const cycleStart = trail.indexOf(node);
      const cycle = trail.slice(cycleStart).concat(node);
      errors.push(
        `agents/${node}/agent.json: circular agent reference detected (${cycle.join(" -> ")})`
      );
      return;
    }
    if (status === "visited") return;

    state.set(node, "visiting");
    for (const ref of agentGraph.get(node) ?? []) {
      visit(ref, [...trail, node]);
    }
    state.set(node, "visited");
  }

  for (const node of agentGraph.keys()) {
    visit(node, []);
  }

  return [...new Set(errors)];
}

module.exports = {
  formatAjvErrors,
  checkChangelogHasVersion,
  pushUnknownCategoryErrors,
  findDuplicates,
  validateProjectManifestReferences,
  detectAgentCycles
};
