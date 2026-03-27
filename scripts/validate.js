const fs = require("node:fs/promises");
const path = require("node:path");

const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const MIN_DOC_LENGTH = 200;
const SKILLS_CATALOG_PATH = path.join("docs", "catalog", "skills.md");
const AGENTS_CATALOG_PATH = path.join("docs", "catalog", "agents.md");
const MACHINE_CATALOG_PATH = path.join("dist", "catalog.json");

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
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."));
}

function formatAjvErrors(errors) {
  return (errors ?? [])
    .map((e) => `- ${e.instancePath || "/"} ${e.message}`)
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

async function generateExpectedIndex(repoRoot) {
  // Skills
  const skillDirs = await listDirs(path.join(repoRoot, "skills"));
  const skillItems = [];
  for (const dirName of skillDirs) {
    const skillJsonPath = path.join(repoRoot, "skills", dirName, "skill.json");
    if (!(await fileExists(skillJsonPath))) continue;
    const skill = await readJson(skillJsonPath);
    skillItems.push({
      name: skill.name,
      path: `skills/${dirName}`,
      displayName: skill.displayName,
      description: skill.description,
      version: skill.version,
      maturity: skill.maturity,
      categories: skill.categories,
      tags: skill.tags ?? []
    });
  }
  skillItems.sort((a, b) => a.name.localeCompare(b.name));

  // Agents
  const agentDirs = await listDirs(path.join(repoRoot, "agents"));
  const agentItems = [];
  for (const dirName of agentDirs) {
    const agentJsonPath = path.join(repoRoot, "agents", dirName, "agent.json");
    if (!(await fileExists(agentJsonPath))) continue;
    const agent = await readJson(agentJsonPath);
    const platforms = await detectPlatforms(path.join(repoRoot, "agents", dirName));
    agentItems.push({
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
    });
  }
  agentItems.sort((a, b) => a.name.localeCompare(b.name));

  // dist/catalog.json comparison ignores generatedAt (volatile field)
  const expectedCatalogObj = { schemaVersion: 1, skills: skillItems, agents: agentItems };

  // Skill catalog markdown
  const skillHeader = [
    "# Skills Catalog",
    "",
    "> This file is generated. Run `npm run build`.",
    "",
    "| Name | Version | Maturity | Categories | Description |",
    "| --- | --- | --- | --- | --- |"
  ];
  const skillRows = skillItems.map((it) => {
    const link = `[${it.name}](../../${it.path}/SKILL.md)`;
    const categories = (it.categories ?? []).join(", ");
    const desc = (it.description ?? "").replace(/\r?\n/g, " ");
    return `| ${link} | ${it.version} | ${it.maturity} | ${categories} | ${desc} |`;
  });
  const expectedSkillsMd = [...skillHeader, ...skillRows, ""].join("\n");

  // Agent catalog markdown
  const agentHeader = [
    "# Agents Catalog",
    "",
    "> This file is generated. Run `npm run build`.",
    "",
    "| Name | Version | Maturity | Archetype | Platforms | Categories | Description |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  ];
  const agentRows = agentItems.map((it) => {
    const link = `[${it.name}](../../${it.path}/claude-code.md)`;
    const platforms = (it.platforms ?? []).join(", ");
    const categories = (it.categories ?? []).join(", ");
    const desc = (it.description ?? "").replace(/\r?\n/g, " ");
    return `| ${link} | ${it.version} | ${it.maturity} | ${it.archetype} | ${platforms} | ${categories} | ${desc} |`;
  });
  const expectedAgentsMd = [...agentHeader, ...agentRows, ""].join("\n");

  return { expectedCatalogObj, expectedSkillsMd, expectedAgentsMd };
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");

  const skillSchema = await readJson(path.join(repoRoot, "schemas", "skill.schema.json"));
  const agentSchema = await readJson(path.join(repoRoot, "schemas", "agent.schema.json"));
  const catalogSchema = await readJson(path.join(repoRoot, "schemas", "catalog.schema.json"));

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const validateSkill = ajv.compile(skillSchema);
  const validateAgent = ajv.compile(agentSchema);
  const validateCatalog = ajv.compile(catalogSchema);

  const allowedCategories = await loadAllowedCategories(repoRoot);

  const errors = [];
  const warnings = [];

  // ── Validate skills ──────────────────────────────────────────────

  const skillDirs = await listDirs(path.join(repoRoot, "skills"));
  const seenSkillNames = new Set();

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

    const ok = validateSkill(skill);
    if (!ok) {
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

    if (seenSkillNames.has(skill.name)) {
      errors.push(`Duplicate skill name: ${skill.name}`);
    }
    seenSkillNames.add(skill.name);

    // Validate categories against whitelist
    if (allowedCategories) {
      for (const cat of skill.categories ?? []) {
        if (!allowedCategories.has(cat)) {
          errors.push(
            `skills/${dirName}/skill.json: unknown category "${cat}" (add it to categories.json first)`
          );
        }
      }
    }

    const skillDoc = skill.entrypoints?.skillDoc ?? "SKILL.md";
    const changelog = skill.entrypoints?.changelog ?? "CHANGELOG.md";

    const skillDocPath = path.join(baseDir, skillDoc);
    if (!(await fileExists(skillDocPath))) {
      errors.push(`Missing skill doc: skills/${dirName}/${skillDoc}`);
    } else {
      const content = await fs.readFile(skillDocPath, "utf8");
      if (content.trim().length < MIN_DOC_LENGTH) {
        errors.push(
          `skills/${dirName}/${skillDoc}: too short (${content.trim().length} chars, minimum ${MIN_DOC_LENGTH})`
        );
      }
    }

    const changelogPath = path.join(baseDir, changelog);
    if (!(await fileExists(changelogPath))) {
      errors.push(`Missing changelog: skills/${dirName}/${changelog}`);
    } else {
      const hasVersion = await checkChangelogHasVersion(changelogPath, skill.version);
      if (!hasVersion) {
        errors.push(
          `skills/${dirName}/${changelog}: must contain a '## [${skill.version}]' section`
        );
      }
    }
  }

  // ── Validate agents ──────────────────────────────────────────────

  const agentDirs = await listDirs(path.join(repoRoot, "agents"));
  const seenAgentNames = new Set();

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

    const ok = validateAgent(agent);
    if (!ok) {
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

    if (seenAgentNames.has(agent.name)) {
      errors.push(`Duplicate agent name: ${agent.name}`);
    }
    seenAgentNames.add(agent.name);

    // Warn if name collides with a skill (different install targets, but can confuse)
    if (seenSkillNames.has(agent.name)) {
      warnings.push(
        `agents/${dirName}: name "${agent.name}" also exists as a skill (they install to different locations, but may cause confusion)`
      );
    }

    // Validate categories against whitelist
    if (allowedCategories) {
      for (const cat of agent.categories ?? []) {
        if (!allowedCategories.has(cat)) {
          errors.push(
            `agents/${dirName}/agent.json: unknown category "${cat}" (add it to categories.json first)`
          );
        }
      }
    }

    // At least one platform file must exist
    const platforms = await detectPlatforms(baseDir);
    if (platforms.length === 0) {
      errors.push(
        `agents/${dirName}: must have at least one platform file (claude-code.md or codex.toml)`
      );
    }

    // Check platform file quality (>= 200 chars for .md files)
    const claudeCodePath = path.join(baseDir, "claude-code.md");
    if (await fileExists(claudeCodePath)) {
      const content = await fs.readFile(claudeCodePath, "utf8");
      if (content.trim().length < MIN_DOC_LENGTH) {
        errors.push(
          `agents/${dirName}/claude-code.md: too short (${content.trim().length} chars, minimum ${MIN_DOC_LENGTH})`
        );
      }
    }

    // Validate skill references
    for (const skillRef of agent.skills ?? []) {
      const skillRefPath = path.join(repoRoot, "skills", skillRef, "skill.json");
      if (!(await fileExists(skillRefPath))) {
        errors.push(
          `agents/${dirName}/agent.json: references unknown skill "${skillRef}"`
        );
      }
    }

    // Validate agent references
    for (const agentRef of agent.agents ?? []) {
      if (agentRef === agent.name) {
        errors.push(
          `agents/${dirName}/agent.json: self-reference in agents array`
        );
        continue;
      }
      const agentRefPath = path.join(repoRoot, "agents", agentRef, "agent.json");
      if (!(await fileExists(agentRefPath))) {
        errors.push(
          `agents/${dirName}/agent.json: references unknown agent "${agentRef}"`
        );
      }
    }

    // Validate changelog
    const changelog = agent.entrypoints?.changelog ?? "CHANGELOG.md";
    const changelogPath = path.join(baseDir, changelog);
    if (!(await fileExists(changelogPath))) {
      errors.push(`Missing changelog: agents/${dirName}/${changelog}`);
    } else {
      const hasVersion = await checkChangelogHasVersion(changelogPath, agent.version);
      if (!hasVersion) {
        errors.push(
          `agents/${dirName}/${changelog}: must contain a '## [${agent.version}]' section`
        );
      }
    }
  }

  // ── Validate agent-to-agent references (cycles & depth) ─────────

  // Build adjacency map: agent name → list of referenced agent names
  const agentGraph = new Map();
  for (const dirName of agentDirs) {
    const agentJsonPath = path.join(repoRoot, "agents", dirName, "agent.json");
    if (!(await fileExists(agentJsonPath))) continue;
    const agent = await readJson(agentJsonPath);
    agentGraph.set(agent.name, agent.agents ?? []);
  }

  // Detect cycles via DFS
  function detectCycle(start) {
    const visited = new Set();
    const stack = [start];
    while (stack.length > 0) {
      const current = stack.pop();
      if (visited.has(current)) {
        return current;
      }
      visited.add(current);
      for (const ref of agentGraph.get(current) ?? []) {
        if (ref === start) return start;
        stack.push(ref);
      }
    }
    return null;
  }

  const reportedCycles = new Set();
  for (const [name, refs] of agentGraph) {
    if (refs.length === 0) continue;
    const cycleNode = detectCycle(name);
    if (cycleNode && !reportedCycles.has(name)) {
      errors.push(
        `agents/${name}/agent.json: circular agent reference detected (involves "${cycleNode}")`
      );
      reportedCycles.add(name);
    }

    // Depth check: referenced agents should not themselves reference other agents
    for (const ref of refs) {
      const refRefs = agentGraph.get(ref) ?? [];
      if (refRefs.length > 0) {
        warnings.push(
          `agents/${name}/agent.json: references agent "${ref}" which itself references other agents — Claude Code only supports one level of subagent nesting`
        );
      }
    }
  }

  // ── Validate catalog files ───────────────────────────────────────

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

  const { expectedCatalogObj, expectedSkillsMd, expectedAgentsMd } = await generateExpectedIndex(repoRoot);

  // Compare dist/catalog.json ignoring generatedAt (it changes every build)
  if (await fileExists(catalogPath)) {
    const actual = await readJson(catalogPath);
    const actualComparable = { schemaVersion: actual.schemaVersion, skills: actual.skills, agents: actual.agents };
    if (JSON.stringify(actualComparable) !== JSON.stringify(expectedCatalogObj)) {
      errors.push(`${MACHINE_CATALOG_PATH} is out of date (run \`npm run build\`)`);
    }
  }

  if ((await fileExists(skillsMdPath)) && (await fs.readFile(skillsMdPath, "utf8")) !== expectedSkillsMd) {
    errors.push(`${SKILLS_CATALOG_PATH} is out of date (run \`npm run build\`)`);
  }

  if ((await fileExists(agentsMdPath)) && (await fs.readFile(agentsMdPath, "utf8")) !== expectedAgentsMd) {
    errors.push(`${AGENTS_CATALOG_PATH} is out of date (run \`npm run build\`)`);
  }

  // Print warnings
  if (warnings.length > 0) {
    console.warn("Warnings:");
    console.warn(warnings.map((w) => `  ⚠ ${w}`).join("\n"));
  }

  if (errors.length > 0) {
    console.error(errors.map((e) => `- ${e}`).join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log("OK");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
