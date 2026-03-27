const fs = require("node:fs/promises");
const path = require("node:path");

const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const MIN_DOC_LENGTH = 200;
const SKILLS_CATALOG_PATH = path.join("docs", "catalog", "skills.md");
const AGENTS_CATALOG_PATH = path.join("docs", "catalog", "agents.md");
const PACKS_CATALOG_PATH = path.join("docs", "catalog", "packs.md");
const MACHINE_CATALOG_PATH = path.join("dist", "catalog.json");
const DEFAULT_PROJECT_MANIFEST_PATH = "my-agents.project.json";
const EXAMPLE_PROJECT_MANIFEST_PATH = path.join(
  "docs",
  "examples",
  "my-agents.project.example.json"
);

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

async function listDirs(baseDir) {
  if (!(await fileExists(baseDir))) return [];
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."));
}

function formatAjvErrors(errors) {
  return (errors ?? [])
    .map((error) => `- ${error.instancePath || "/"} ${error.message}`)
    .join("\n");
}

async function checkChangelogHasVersion(changelogPath, version) {
  const raw = await fs.readFile(changelogPath, "utf8");
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^##\\s*\\[?${escaped}\\]?(?:\\s+-.*)?$`, "m");
  return re.test(raw);
}

async function loadAllowedCategories(repoRoot) {
  const catPath = path.join(repoRoot, "categories.json");
  if (!(await fileExists(catPath))) return null;
  const data = await readJson(catPath);
  return new Set(data.categories);
}

async function detectPlatforms(agentDir) {
  const platforms = [];
  if (await fileExists(path.join(agentDir, "claude-code.md"))) {
    platforms.push("claude-code");
  }
  if (await fileExists(path.join(agentDir, "codex.toml"))) {
    platforms.push("codex");
  }
  return platforms.sort();
}

async function checkDocLength(filePath, label, errors) {
  if (!(await fileExists(filePath))) {
    errors.push(`Missing ${label}: ${filePath}`);
    return;
  }

  const content = await fs.readFile(filePath, "utf8");
  if (content.trim().length < MIN_DOC_LENGTH) {
    errors.push(`${label}: too short (${content.trim().length} chars, minimum ${MIN_DOC_LENGTH})`);
  }
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

  for (const duplicate of findDuplicates(manifest.skills)) {
    errors.push(`${label}: duplicate skill "${duplicate}"`);
  }

  for (const duplicate of findDuplicates(manifest.agents)) {
    errors.push(`${label}: duplicate agent "${duplicate}"`);
  }

  for (const packName of manifest.packs ?? []) {
    if (!packNames.has(packName)) {
      errors.push(`${label}: references unknown pack "${packName}"`);
    }
  }

  for (const skillName of manifest.skills ?? []) {
    if (!skillNames.has(skillName)) {
      errors.push(`${label}: references unknown skill "${skillName}"`);
    }
  }

  for (const agentName of manifest.agents ?? []) {
    if (!agentNames.has(agentName)) {
      errors.push(`${label}: references unknown agent "${agentName}"`);
    }
  }
}

function toSkillCatalogItem(skill, dirName) {
  return {
    name: skill.name,
    path: `skills/${dirName}`,
    displayName: skill.displayName,
    description: skill.description,
    version: skill.version,
    maturity: skill.maturity,
    categories: skill.categories,
    tags: skill.tags ?? []
  };
}

function toAgentCatalogItem(agent, dirName, platforms) {
  return {
    name: agent.name,
    path: `agents/${dirName}`,
    displayName: agent.displayName,
    description: agent.description,
    version: agent.version,
    maturity: agent.maturity,
    categories: agent.categories,
    tags: agent.tags ?? [],
    archetype: agent.archetype,
    skills: agent.skills ?? [],
    agents: agent.agents ?? [],
    platforms
  };
}

function toPackCatalogItem(pack, dirName) {
  return {
    name: pack.name,
    path: `packs/${dirName}`,
    displayName: pack.displayName,
    description: pack.description,
    version: pack.version,
    maturity: pack.maturity,
    packType: pack.packType,
    persona: pack.persona,
    categories: pack.categories,
    tags: pack.tags ?? [],
    skills: pack.skills ?? [],
    agents: pack.agents ?? [],
    leadAgent: pack.leadAgent
  };
}

function renderSkillsMarkdown(items) {
  const header = [
    "# Skills Catalog",
    "",
    "> This file is generated. Run `npm run build`.",
    "",
    "| Name | Version | Maturity | Categories | Description |",
    "| --- | --- | --- | --- | --- |"
  ];

  const rows = items.map((item) => {
    const link = `[${item.name}](../../${item.path}/SKILL.md)`;
    const categories = (item.categories ?? []).join(", ");
    const desc = (item.description ?? "").replace(/\r?\n/g, " ");
    return `| ${link} | ${item.version} | ${item.maturity} | ${categories} | ${desc} |`;
  });

  return [...header, ...rows, ""].join("\n");
}

function renderAgentsMarkdown(items) {
  const header = [
    "# Agents Catalog",
    "",
    "> This file is generated. Run `npm run build`.",
    "",
    "| Name | Version | Maturity | Archetype | Platforms | Categories | Description |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  ];

  const rows = items.map((item) => {
    const link = `[${item.name}](../../${item.path}/claude-code.md)`;
    const platforms = (item.platforms ?? []).join(", ");
    const categories = (item.categories ?? []).join(", ");
    const desc = (item.description ?? "").replace(/\r?\n/g, " ");
    return `| ${link} | ${item.version} | ${item.maturity} | ${item.archetype} | ${platforms} | ${categories} | ${desc} |`;
  });

  return [...header, ...rows, ""].join("\n");
}

function renderPacksMarkdown(items) {
  const header = [
    "# Packs Catalog",
    "",
    "> This file is generated. Run `npm run build`.",
    "",
    "| Name | Type | Version | Maturity | Categories | Members | Description |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  ];

  const rows = items.map((item) => {
    const link = `[${item.name}](../../${item.path}/README.md)`;
    const categories = (item.categories ?? []).join(", ");
    const desc = (item.description ?? "").replace(/\r?\n/g, " ");
    const members = `${(item.skills ?? []).length} skills, ${(item.agents ?? []).length} agents`;
    return `| ${link} | ${item.packType} | ${item.version} | ${item.maturity} | ${categories} | ${members} | ${desc} |`;
  });

  return [...header, ...rows, ""].join("\n");
}

async function generateExpectedIndex(repoRoot) {
  const skillDirs = await listDirs(path.join(repoRoot, "skills"));
  const skillItems = [];
  for (const dirName of skillDirs) {
    const skillJsonPath = path.join(repoRoot, "skills", dirName, "skill.json");
    if (!(await fileExists(skillJsonPath))) continue;
    const skill = await readJson(skillJsonPath);
    skillItems.push(toSkillCatalogItem(skill, dirName));
  }
  skillItems.sort((a, b) => a.name.localeCompare(b.name));

  const agentDirs = await listDirs(path.join(repoRoot, "agents"));
  const agentItems = [];
  for (const dirName of agentDirs) {
    const agentJsonPath = path.join(repoRoot, "agents", dirName, "agent.json");
    if (!(await fileExists(agentJsonPath))) continue;
    const agent = await readJson(agentJsonPath);
    const platforms = await detectPlatforms(path.join(repoRoot, "agents", dirName));
    agentItems.push(toAgentCatalogItem(agent, dirName, platforms));
  }
  agentItems.sort((a, b) => a.name.localeCompare(b.name));

  const packDirs = await listDirs(path.join(repoRoot, "packs"));
  const packItems = [];
  for (const dirName of packDirs) {
    const packJsonPath = path.join(repoRoot, "packs", dirName, "pack.json");
    if (!(await fileExists(packJsonPath))) continue;
    const pack = await readJson(packJsonPath);
    packItems.push(toPackCatalogItem(pack, dirName));
  }
  packItems.sort((a, b) => a.name.localeCompare(b.name));

  const expectedCatalogObj = {
    schemaVersion: 1,
    skills: skillItems,
    agents: agentItems,
    packs: packItems
  };

  return {
    expectedCatalogObj,
    expectedSkillsMd: renderSkillsMarkdown(skillItems),
    expectedAgentsMd: renderAgentsMarkdown(agentItems),
    expectedPacksMd: renderPacksMarkdown(packItems)
  };
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

async function main() {
  const repoRoot = path.resolve(__dirname, "..");

  const skillSchema = await readJson(path.join(repoRoot, "schemas", "skill.schema.json"));
  const agentSchema = await readJson(path.join(repoRoot, "schemas", "agent.schema.json"));
  const packSchema = await readJson(path.join(repoRoot, "schemas", "pack.schema.json"));
  const projectManifestSchema = await readJson(
    path.join(repoRoot, "schemas", "project-manifest.schema.json")
  );
  const catalogSchema = await readJson(path.join(repoRoot, "schemas", "catalog.schema.json"));

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const validateSkill = ajv.compile(skillSchema);
  const validateAgent = ajv.compile(agentSchema);
  const validatePack = ajv.compile(packSchema);
  const validateProjectManifest = ajv.compile(projectManifestSchema);
  const validateCatalog = ajv.compile(catalogSchema);

  const allowedCategories = await loadAllowedCategories(repoRoot);

  const errors = [];
  const warnings = [];
  const skillNames = new Set();
  const agentNames = new Set();
  const agentMetadata = new Map();

  const skillDirs = await listDirs(path.join(repoRoot, "skills"));
  for (const dirName of skillDirs) {
    const baseDir = path.join(repoRoot, "skills", dirName);
    const skillJsonPath = path.join(baseDir, "skill.json");

    if (!(await fileExists(skillJsonPath))) {
      continue;
    }

    let skill;
    try {
      skill = await readJson(skillJsonPath);
    } catch (err) {
      errors.push(`skills/${dirName}/skill.json: invalid JSON (${err.message})`);
      continue;
    }

    if (!validateSkill(skill)) {
      errors.push(
        `skills/${dirName}/skill.json: schema validation failed\n${formatAjvErrors(
          validateSkill.errors
        )}`
      );
      continue;
    }

    if (skill.name !== dirName) {
      errors.push(
        `skills/${dirName}/skill.json: name mismatch (skill.name=${skill.name}, dir=${dirName})`
      );
    }

    if (skillNames.has(skill.name)) {
      errors.push(`Duplicate skill name: ${skill.name}`);
    }
    skillNames.add(skill.name);

    pushUnknownCategoryErrors(
      `skills/${dirName}/skill.json`,
      skill.categories,
      allowedCategories,
      errors
    );

    const skillDoc = skill.entrypoints?.skillDoc ?? "SKILL.md";
    const changelog = skill.entrypoints?.changelog ?? "CHANGELOG.md";

    await checkDocLength(path.join(baseDir, skillDoc), `skills/${dirName}/${skillDoc}`, errors);

    const changelogPath = path.join(baseDir, changelog);
    if (!(await fileExists(changelogPath))) {
      errors.push(`Missing changelog: skills/${dirName}/${changelog}`);
    } else if (!(await checkChangelogHasVersion(changelogPath, skill.version))) {
      errors.push(`skills/${dirName}/${changelog}: must contain a '## [${skill.version}]' section`);
    }
  }

  const agentDirs = await listDirs(path.join(repoRoot, "agents"));
  for (const dirName of agentDirs) {
    const baseDir = path.join(repoRoot, "agents", dirName);
    const agentJsonPath = path.join(baseDir, "agent.json");

    if (!(await fileExists(agentJsonPath))) {
      continue;
    }

    let agent;
    try {
      agent = await readJson(agentJsonPath);
    } catch (err) {
      errors.push(`agents/${dirName}/agent.json: invalid JSON (${err.message})`);
      continue;
    }

    if (!validateAgent(agent)) {
      errors.push(
        `agents/${dirName}/agent.json: schema validation failed\n${formatAjvErrors(
          validateAgent.errors
        )}`
      );
      continue;
    }

    if (agent.name !== dirName) {
      errors.push(
        `agents/${dirName}/agent.json: name mismatch (agent.name=${agent.name}, dir=${dirName})`
      );
    }

    if (agentNames.has(agent.name)) {
      errors.push(`Duplicate agent name: ${agent.name}`);
    }
    agentNames.add(agent.name);
    agentMetadata.set(agent.name, agent);

    if (skillNames.has(agent.name)) {
      warnings.push(
        `agents/${dirName}: name "${agent.name}" also exists as a skill (they install to different locations, but may cause confusion)`
      );
    }

    pushUnknownCategoryErrors(
      `agents/${dirName}/agent.json`,
      agent.categories,
      allowedCategories,
      errors
    );

    const platforms = await detectPlatforms(baseDir);
    if (platforms.length === 0) {
      errors.push(
        `agents/${dirName}: must have at least one platform file (claude-code.md or codex.toml)`
      );
    }

    const claudeCodePath = path.join(baseDir, "claude-code.md");
    if (await fileExists(claudeCodePath)) {
      await checkDocLength(claudeCodePath, `agents/${dirName}/claude-code.md`, errors);
    }

    for (const skillRef of agent.skills ?? []) {
      const skillRefPath = path.join(repoRoot, "skills", skillRef, "skill.json");
      if (!(await fileExists(skillRefPath))) {
        errors.push(`agents/${dirName}/agent.json: references unknown skill "${skillRef}"`);
      }
    }

    for (const agentRef of agent.agents ?? []) {
      if (agentRef === agent.name) {
        errors.push(`agents/${dirName}/agent.json: self-reference in agents array`);
        continue;
      }
      const agentRefPath = path.join(repoRoot, "agents", agentRef, "agent.json");
      if (!(await fileExists(agentRefPath))) {
        errors.push(`agents/${dirName}/agent.json: references unknown agent "${agentRef}"`);
      }
    }

    const changelog = agent.entrypoints?.changelog ?? "CHANGELOG.md";
    const changelogPath = path.join(baseDir, changelog);
    if (!(await fileExists(changelogPath))) {
      errors.push(`Missing changelog: agents/${dirName}/${changelog}`);
    } else if (!(await checkChangelogHasVersion(changelogPath, agent.version))) {
      errors.push(`agents/${dirName}/${changelog}: must contain a '## [${agent.version}]' section`);
    }
  }

  const agentGraph = new Map();
  for (const [name, agent] of agentMetadata) {
    agentGraph.set(name, agent.agents ?? []);
  }

  errors.push(...detectAgentCycles(agentGraph));

  for (const [name, refs] of agentGraph) {
    for (const ref of refs) {
      const refRefs = agentGraph.get(ref) ?? [];
      if (refRefs.length > 0) {
        warnings.push(
          `agents/${name}/agent.json: references agent "${ref}" which itself references other agents — Claude Code only supports one level of subagent nesting`
        );
      }
    }
  }

  const packDirs = await listDirs(path.join(repoRoot, "packs"));
  const packNames = new Set();
  for (const dirName of packDirs) {
    const baseDir = path.join(repoRoot, "packs", dirName);
    const packJsonPath = path.join(baseDir, "pack.json");

    if (!(await fileExists(packJsonPath))) {
      continue;
    }

    let pack;
    try {
      pack = await readJson(packJsonPath);
    } catch (err) {
      errors.push(`packs/${dirName}/pack.json: invalid JSON (${err.message})`);
      continue;
    }

    if (!validatePack(pack)) {
      errors.push(
        `packs/${dirName}/pack.json: schema validation failed\n${formatAjvErrors(
          validatePack.errors
        )}`
      );
      continue;
    }

    if (pack.name !== dirName) {
      errors.push(
        `packs/${dirName}/pack.json: name mismatch (pack.name=${pack.name}, dir=${dirName})`
      );
    }

    if (packNames.has(pack.name)) {
      errors.push(`Duplicate pack name: ${pack.name}`);
    }
    packNames.add(pack.name);

    pushUnknownCategoryErrors(
      `packs/${dirName}/pack.json`,
      pack.categories,
      allowedCategories,
      errors
    );

    await checkDocLength(path.join(baseDir, "README.md"), `packs/${dirName}/README.md`, errors);

    const changelogPath = path.join(baseDir, "CHANGELOG.md");
    if (!(await fileExists(changelogPath))) {
      errors.push(`Missing changelog: packs/${dirName}/CHANGELOG.md`);
    } else if (!(await checkChangelogHasVersion(changelogPath, pack.version))) {
      errors.push(`packs/${dirName}/CHANGELOG.md: must contain a '## [${pack.version}]' section`);
    }

    for (const duplicate of findDuplicates(pack.skills)) {
      errors.push(`packs/${dirName}/pack.json: duplicate skill "${duplicate}"`);
    }

    for (const duplicate of findDuplicates(pack.agents)) {
      errors.push(`packs/${dirName}/pack.json: duplicate agent "${duplicate}"`);
    }

    for (const skillRef of pack.skills ?? []) {
      if (!skillNames.has(skillRef)) {
        errors.push(`packs/${dirName}/pack.json: references unknown skill "${skillRef}"`);
      }
    }

    for (const agentRef of pack.agents ?? []) {
      if (!agentNames.has(agentRef)) {
        errors.push(`packs/${dirName}/pack.json: references unknown agent "${agentRef}"`);
      }
    }

    if (pack.packType === "agent-team") {
      if (!pack.leadAgent) {
        errors.push(`packs/${dirName}/pack.json: agent-team packs must define leadAgent`);
      } else if (!(pack.agents ?? []).includes(pack.leadAgent)) {
        errors.push(
          `packs/${dirName}/pack.json: leadAgent "${pack.leadAgent}" must appear in agents`
        );
      }
    } else if (pack.leadAgent) {
      errors.push(`packs/${dirName}/pack.json: leadAgent is only valid for agent-team packs`);
    }

    const packSkillSet = new Set(pack.skills ?? []);
    const packAgentSet = new Set(pack.agents ?? []);
    for (const agentRef of pack.agents ?? []) {
      const agent = agentMetadata.get(agentRef);
      if (!agent) continue;

      for (const requiredSkill of agent.skills ?? []) {
        if (!packSkillSet.has(requiredSkill)) {
          errors.push(
            `packs/${dirName}/pack.json: agent "${agentRef}" requires skill "${requiredSkill}" to be listed explicitly`
          );
        }
      }

      for (const requiredAgent of agent.agents ?? []) {
        if (!packAgentSet.has(requiredAgent)) {
          errors.push(
            `packs/${dirName}/pack.json: agent "${agentRef}" requires agent "${requiredAgent}" to be listed explicitly`
          );
        }
      }
    }
  }

  const projectManifestCandidates = [
    {
      required: false,
      path: path.join(repoRoot, DEFAULT_PROJECT_MANIFEST_PATH),
      label: DEFAULT_PROJECT_MANIFEST_PATH
    },
    {
      required: true,
      path: path.join(repoRoot, EXAMPLE_PROJECT_MANIFEST_PATH),
      label: EXAMPLE_PROJECT_MANIFEST_PATH
    }
  ];

  for (const candidate of projectManifestCandidates) {
    if (!(await fileExists(candidate.path))) {
      if (candidate.required) {
        errors.push(`Missing ${candidate.label}`);
      }
      continue;
    }

    let manifest;
    try {
      manifest = await readJson(candidate.path);
    } catch (err) {
      errors.push(`${candidate.label}: invalid JSON (${err.message})`);
      continue;
    }

    if (!validateProjectManifest(manifest)) {
      errors.push(
        `${candidate.label}: schema validation failed\n${formatAjvErrors(
          validateProjectManifest.errors
        )}`
      );
      continue;
    }

    validateProjectManifestReferences(
      manifest,
      candidate.label,
      packNames,
      skillNames,
      agentNames,
      errors
    );
  }

  const catalogPath = path.join(repoRoot, MACHINE_CATALOG_PATH);
  if (!(await fileExists(catalogPath))) {
    errors.push(`Missing ${MACHINE_CATALOG_PATH} (run \`npm run build\`)`);
  } else {
    let catalog;
    try {
      catalog = await readJson(catalogPath);
    } catch (err) {
      errors.push(`${MACHINE_CATALOG_PATH}: invalid JSON (${err.message})`);
      catalog = null;
    }

    if (catalog && !validateCatalog(catalog)) {
      errors.push(
        `${MACHINE_CATALOG_PATH}: schema validation failed\n${formatAjvErrors(
          validateCatalog.errors
        )}`
      );
    }
  }

  const skillsMdPath = path.join(repoRoot, SKILLS_CATALOG_PATH);
  if (!(await fileExists(skillsMdPath))) {
    errors.push(`Missing ${SKILLS_CATALOG_PATH} (run \`npm run build\`)`);
  }

  const agentsMdPath = path.join(repoRoot, AGENTS_CATALOG_PATH);
  if (!(await fileExists(agentsMdPath))) {
    errors.push(`Missing ${AGENTS_CATALOG_PATH} (run \`npm run build\`)`);
  }

  const packsMdPath = path.join(repoRoot, PACKS_CATALOG_PATH);
  if (!(await fileExists(packsMdPath))) {
    errors.push(`Missing ${PACKS_CATALOG_PATH} (run \`npm run build\`)`);
  }

  const { expectedCatalogObj, expectedSkillsMd, expectedAgentsMd, expectedPacksMd } =
    await generateExpectedIndex(repoRoot);

  if (await fileExists(catalogPath)) {
    const actual = await readJson(catalogPath);
    const actualComparable = {
      schemaVersion: actual.schemaVersion,
      skills: actual.skills,
      agents: actual.agents,
      packs: actual.packs
    };
    if (JSON.stringify(actualComparable) !== JSON.stringify(expectedCatalogObj)) {
      errors.push(`${MACHINE_CATALOG_PATH} is out of date (run \`npm run build\`)`);
    }
  }

  if (
    (await fileExists(skillsMdPath)) &&
    (await fs.readFile(skillsMdPath, "utf8")) !== expectedSkillsMd
  ) {
    errors.push(`${SKILLS_CATALOG_PATH} is out of date (run \`npm run build\`)`);
  }

  if (
    (await fileExists(agentsMdPath)) &&
    (await fs.readFile(agentsMdPath, "utf8")) !== expectedAgentsMd
  ) {
    errors.push(`${AGENTS_CATALOG_PATH} is out of date (run \`npm run build\`)`);
  }

  if (
    (await fileExists(packsMdPath)) &&
    (await fs.readFile(packsMdPath, "utf8")) !== expectedPacksMd
  ) {
    errors.push(`${PACKS_CATALOG_PATH} is out of date (run \`npm run build\`)`);
  }

  if (warnings.length > 0) {
    console.warn("Warnings:");
    console.warn(warnings.map((warning) => `  ⚠ ${warning}`).join("\n"));
  }

  if (errors.length > 0) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("OK");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
