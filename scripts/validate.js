const fs = require("node:fs/promises");
const path = require("node:path");

const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const { fileExists, readJson, listDirs } = require("./lib/fs-utils");
const {
  SKILLS_CATALOG_PATH,
  AGENTS_CATALOG_PATH,
  PACKS_CATALOG_PATH,
  MACHINE_CATALOG_PATH,
  detectPlatforms,
  generateCatalogSnapshot
} = require("./lib/catalog");
const {
  formatAjvErrors,
  checkChangelogHasVersion,
  pushUnknownCategoryErrors,
  findDuplicates,
  validateProjectManifestReferences,
  detectAgentCycles
} = require("./lib/validate-utils");
const {
  getIssueDrivenOsExamplesDir,
  validateIssueDrivenOsFixtures
} = require("./lib/issue-driven-os-fixtures");

const MIN_DOC_LENGTH = 200;
const DEFAULT_PROJECT_MANIFEST_PATH = "my-agents.project.json";
const EXAMPLE_PROJECT_MANIFEST_PATH = path.join(
  "docs",
  "examples",
  "my-agents.project.example.json"
);

async function loadAllowedCategories(repoRoot) {
  const catPath = path.join(repoRoot, "categories.json");
  if (!(await fileExists(catPath))) return null;
  const data = await readJson(catPath);
  return new Set(data.categories);
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

async function loadValidators(repoRoot) {
  const skillSchema = await readJson(path.join(repoRoot, "schemas", "skill.schema.json"));
  const agentSchema = await readJson(path.join(repoRoot, "schemas", "agent.schema.json"));
  const packSchema = await readJson(path.join(repoRoot, "schemas", "pack.schema.json"));
  const projectManifestSchema = await readJson(
    path.join(repoRoot, "schemas", "project-manifest.schema.json")
  );
  const catalogSchema = await readJson(path.join(repoRoot, "schemas", "catalog.schema.json"));

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  return {
    validateSkill: ajv.compile(skillSchema),
    validateAgent: ajv.compile(agentSchema),
    validatePack: ajv.compile(packSchema),
    validateProjectManifest: ajv.compile(projectManifestSchema),
    validateCatalog: ajv.compile(catalogSchema)
  };
}

async function validateSkills(repoRoot, validateSkill, allowedCategories, errors, skillNames) {
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
    } else if (!(await checkChangelogHasVersion(fs, changelogPath, skill.version))) {
      errors.push(`skills/${dirName}/${changelog}: must contain a '## [${skill.version}]' section`);
    }
  }
}

async function validateAgents(
  repoRoot,
  validateAgent,
  allowedCategories,
  skillNames,
  errors,
  warnings,
  agentNames,
  agentMetadata
) {
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
    } else if (!(await checkChangelogHasVersion(fs, changelogPath, agent.version))) {
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
}

async function validatePacks(
  repoRoot,
  validatePack,
  allowedCategories,
  skillNames,
  agentNames,
  agentMetadata,
  errors
) {
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
    } else if (!(await checkChangelogHasVersion(fs, changelogPath, pack.version))) {
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

  return packNames;
}

async function validateProjectManifestFiles(
  repoRoot,
  validateProjectManifest,
  packNames,
  skillNames,
  agentNames,
  errors
) {
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
}

async function validateGeneratedOutputs(repoRoot, validateCatalog, errors) {
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

  const snapshot = await generateCatalogSnapshot(repoRoot);

  if (await fileExists(catalogPath)) {
    const actual = await readJson(catalogPath);
    const actualComparable = {
      schemaVersion: actual.schemaVersion,
      skills: actual.skills,
      agents: actual.agents,
      packs: actual.packs
    };
    if (JSON.stringify(actualComparable) !== JSON.stringify(snapshot.catalogBase)) {
      errors.push(`${MACHINE_CATALOG_PATH} is out of date (run \`npm run build\`)`);
    }
  }

  if (
    (await fileExists(skillsMdPath)) &&
    (await fs.readFile(skillsMdPath, "utf8")) !== snapshot.skillsMarkdown
  ) {
    errors.push(`${SKILLS_CATALOG_PATH} is out of date (run \`npm run build\`)`);
  }

  if (
    (await fileExists(agentsMdPath)) &&
    (await fs.readFile(agentsMdPath, "utf8")) !== snapshot.agentsMarkdown
  ) {
    errors.push(`${AGENTS_CATALOG_PATH} is out of date (run \`npm run build\`)`);
  }

  if (
    (await fileExists(packsMdPath)) &&
    (await fs.readFile(packsMdPath, "utf8")) !== snapshot.packsMarkdown
  ) {
    errors.push(`${PACKS_CATALOG_PATH} is out of date (run \`npm run build\`)`);
  }
}

async function validateExampleFixtures(repoRoot, errors) {
  const examplesDir = getIssueDrivenOsExamplesDir(repoRoot);
  await validateIssueDrivenOsFixtures(examplesDir, errors);
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const validators = await loadValidators(repoRoot);
  const allowedCategories = await loadAllowedCategories(repoRoot);

  const errors = [];
  const warnings = [];
  const skillNames = new Set();
  const agentNames = new Set();
  const agentMetadata = new Map();

  await validateSkills(repoRoot, validators.validateSkill, allowedCategories, errors, skillNames);
  await validateAgents(
    repoRoot,
    validators.validateAgent,
    allowedCategories,
    skillNames,
    errors,
    warnings,
    agentNames,
    agentMetadata
  );

  const packNames = await validatePacks(
    repoRoot,
    validators.validatePack,
    allowedCategories,
    skillNames,
    agentNames,
    agentMetadata,
    errors
  );

  await validateProjectManifestFiles(
    repoRoot,
    validators.validateProjectManifest,
    packNames,
    skillNames,
    agentNames,
    errors
  );
  await validateExampleFixtures(repoRoot, errors);
  await validateGeneratedOutputs(repoRoot, validators.validateCatalog, errors);

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
