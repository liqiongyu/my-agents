const fs = require("node:fs/promises");
const path = require("node:path");

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

function renderSkillsMarkdown(items) {
  const header = [
    "# Skills Catalog",
    "",
    "> This file is generated. Run `npm run build`.",
    "",
    "| Name | Version | Maturity | Categories | Description |",
    "| --- | --- | --- | --- | --- |"
  ];

  const rows = items.map((it) => {
    const link = `[${it.name}](${it.path}/SKILL.md)`;
    const categories = (it.categories ?? []).join(", ");
    const desc = (it.description ?? "").replace(/\r?\n/g, " ");
    return `| ${link} | ${it.version} | ${it.maturity} | ${categories} | ${desc} |`;
  });

  return [...header, ...rows, ""].join("\n");
}

function renderAgentsMarkdown(items) {
  const routingBlock = [
    "<!-- rctl:block:start routing -->",
    "## rctl routing",
    "",
    "- Treat `rctl/control-plane/control-plane.yaml` as the machine-readable entrypoint.",
    "- Plans, status, evidence, and rollback notes live under `rctl/changes/`.",
    "- Command/skill mappings live under `rctl/registry/`.",
    "- Durable docs and policies live under `rctl/docs/` and `rctl/control-plane/`.",
    "- Codex-native skills live under `.agents/skills/`.",
    "- Claude Code uses `CLAUDE.md`, `.claude/skills/`, and `.claude/commands/`.",
    "- Keep root guidance short; detailed operating truth belongs under `rctl/`.",
    "",
    "- For non-trivial work, create or update an active change under `rctl/changes/active/<change-id>/` before broad edits.",
    "<!-- rctl:block:end routing -->"
  ];
  const header = [
    "# Agents Catalog",
    "",
    "> This file is generated. Run `npm run build`.",
    "",
    "| Name | Version | Maturity | Archetype | Platforms | Categories | Description |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  ];

  const rows = items.map((it) => {
    const link = `[${it.name}](${it.path}/claude-code.md)`;
    const platforms = (it.platforms ?? []).join(", ");
    const categories = (it.categories ?? []).join(", ");
    const desc = (it.description ?? "").replace(/\r?\n/g, " ");
    return `| ${link} | ${it.version} | ${it.maturity} | ${it.archetype} | ${platforms} | ${categories} | ${desc} |`;
  });

  return [...header, ...rows, "", ...routingBlock, ""].join("\n");
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");

  // Build skill items
  const skillDirs = await listDirs(path.join(repoRoot, "skills"));
  const skillItems = [];
  for (const dirName of skillDirs) {
    const skillJsonPath = path.join(repoRoot, "skills", dirName, "skill.json");
    if (!(await fileExists(skillJsonPath))) continue;
    const skill = await readJson(skillJsonPath);
    skillItems.push(toSkillCatalogItem(skill, dirName));
  }
  skillItems.sort((a, b) => a.name.localeCompare(b.name));

  // Build agent items
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

  // Write catalog.json
  const catalog = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    skills: skillItems,
    agents: agentItems
  };

  await fs.writeFile(
    path.join(repoRoot, "catalog.json"),
    `${JSON.stringify(catalog, null, 2)}\n`,
    "utf8"
  );

  // Write SKILLS.md
  await fs.writeFile(
    path.join(repoRoot, "SKILLS.md"),
    renderSkillsMarkdown(skillItems),
    "utf8"
  );

  // Write AGENTS.md
  await fs.writeFile(
    path.join(repoRoot, "AGENTS.md"),
    renderAgentsMarkdown(agentItems),
    "utf8"
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
