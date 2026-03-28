const path = require("node:path");

const { fileExists, readJson, listDirs } = require("./fs-utils");

const SKILLS_CATALOG_PATH = path.join("docs", "catalog", "skills.md");
const AGENTS_CATALOG_PATH = path.join("docs", "catalog", "agents.md");
const PACKS_CATALOG_PATH = path.join("docs", "catalog", "packs.md");
const MACHINE_CATALOG_PATH = path.join("dist", "catalog.json");

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

async function collectSkillItems(repoRoot) {
  const skillDirs = await listDirs(path.join(repoRoot, "skills"));
  const skillItems = [];

  for (const dirName of skillDirs) {
    const skillJsonPath = path.join(repoRoot, "skills", dirName, "skill.json");
    if (!(await fileExists(skillJsonPath))) continue;
    const skill = await readJson(skillJsonPath);
    skillItems.push(toSkillCatalogItem(skill, dirName));
  }

  return skillItems.sort((left, right) => left.name.localeCompare(right.name));
}

async function collectAgentItems(repoRoot) {
  const agentDirs = await listDirs(path.join(repoRoot, "agents"));
  const agentItems = [];

  for (const dirName of agentDirs) {
    const agentJsonPath = path.join(repoRoot, "agents", dirName, "agent.json");
    if (!(await fileExists(agentJsonPath))) continue;
    const agent = await readJson(agentJsonPath);
    const platforms = await detectPlatforms(path.join(repoRoot, "agents", dirName));
    agentItems.push(toAgentCatalogItem(agent, dirName, platforms));
  }

  return agentItems.sort((left, right) => left.name.localeCompare(right.name));
}

async function collectPackItems(repoRoot) {
  const packDirs = await listDirs(path.join(repoRoot, "packs"));
  const packItems = [];

  for (const dirName of packDirs) {
    const packJsonPath = path.join(repoRoot, "packs", dirName, "pack.json");
    if (!(await fileExists(packJsonPath))) continue;
    const pack = await readJson(packJsonPath);
    packItems.push(toPackCatalogItem(pack, dirName));
  }

  return packItems.sort((left, right) => left.name.localeCompare(right.name));
}

async function generateCatalogSnapshot(repoRoot) {
  const skills = await collectSkillItems(repoRoot);
  const agents = await collectAgentItems(repoRoot);
  const packs = await collectPackItems(repoRoot);

  const catalogBase = {
    schemaVersion: 1,
    skills,
    agents,
    packs
  };

  return {
    catalogBase,
    skillsMarkdown: renderSkillsMarkdown(skills),
    agentsMarkdown: renderAgentsMarkdown(agents),
    packsMarkdown: renderPacksMarkdown(packs)
  };
}

module.exports = {
  SKILLS_CATALOG_PATH,
  AGENTS_CATALOG_PATH,
  PACKS_CATALOG_PATH,
  MACHINE_CATALOG_PATH,
  detectPlatforms,
  generateCatalogSnapshot,
  renderSkillsMarkdown,
  renderAgentsMarkdown,
  renderPacksMarkdown,
  toSkillCatalogItem,
  toAgentCatalogItem,
  toPackCatalogItem
};
