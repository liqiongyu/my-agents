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

async function listSkillDirs(repoRoot) {
  const skillsDir = path.join(repoRoot, "skills");
  if (!(await fileExists(skillsDir))) return [];
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."));
}

function toCatalogItem(skill, dirName) {
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

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  const dirs = await listSkillDirs(repoRoot);

  const items = [];
  for (const dirName of dirs) {
    const skillJsonPath = path.join(repoRoot, "skills", dirName, "skill.json");
    if (!(await fileExists(skillJsonPath))) continue;
    const skill = await readJson(skillJsonPath);
    items.push(toCatalogItem(skill, dirName));
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  const catalog = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    skills: items
  };

  await fs.writeFile(
    path.join(repoRoot, "catalog.json"),
    `${JSON.stringify(catalog, null, 2)}\n`,
    "utf8"
  );

  await fs.writeFile(
    path.join(repoRoot, "SKILLS.md"),
    renderSkillsMarkdown(items),
    "utf8"
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

