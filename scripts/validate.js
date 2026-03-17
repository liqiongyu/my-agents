const fs = require("node:fs/promises");
const path = require("node:path");

const Ajv = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const MIN_SKILL_DOC_LENGTH = 200;

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

function formatAjvErrors(errors) {
  return (errors ?? [])
    .map((e) => `- ${e.instancePath || "/"} ${e.message}`)
    .join("\n");
}

async function checkChangelogHasVersion(changelogPath, version) {
  const raw = await fs.readFile(changelogPath, "utf8");
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^##\\s*\\[?${escaped}\\]?\\b`, "m");
  return re.test(raw);
}

async function loadAllowedCategories(repoRoot) {
  const catPath = path.join(repoRoot, "categories.json");
  if (!(await fileExists(catPath))) return null;
  const data = await readJson(catPath);
  return new Set(data.categories);
}

async function generateExpectedIndex(repoRoot) {
  const dirs = await listSkillDirs(repoRoot);
  const items = [];
  for (const dirName of dirs) {
    const skillJsonPath = path.join(repoRoot, "skills", dirName, "skill.json");
    if (!(await fileExists(skillJsonPath))) continue;
    const skill = await readJson(skillJsonPath);
    items.push({
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
  items.sort((a, b) => a.name.localeCompare(b.name));

  // catalog.json comparison ignores generatedAt (volatile field)
  const expectedCatalogObj = { schemaVersion: 1, skills: items };

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
  const expectedSkillsMd = [...header, ...rows, ""].join("\n");

  return { expectedCatalogObj, expectedSkillsMd };
}

async function main() {
  const repoRoot = path.resolve(__dirname, "..");

  const skillSchema = await readJson(path.join(repoRoot, "schemas", "skill.schema.json"));
  const catalogSchema = await readJson(path.join(repoRoot, "schemas", "catalog.schema.json"));

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  const validateSkill = ajv.compile(skillSchema);
  const validateCatalog = ajv.compile(catalogSchema);

  const allowedCategories = await loadAllowedCategories(repoRoot);

  const dirs = await listSkillDirs(repoRoot);
  const seenNames = new Set();

  const errors = [];

  for (const dirName of dirs) {
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

    if (seenNames.has(skill.name)) {
      errors.push(`Duplicate skill name: ${skill.name}`);
    }
    seenNames.add(skill.name);

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
      if (content.trim().length < MIN_SKILL_DOC_LENGTH) {
        errors.push(
          `skills/${dirName}/${skillDoc}: too short (${content.trim().length} chars, minimum ${MIN_SKILL_DOC_LENGTH})`
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

  // Validate catalog files and ensure they are in sync with skill.json files.
  const catalogPath = path.join(repoRoot, "catalog.json");
  if (!(await fileExists(catalogPath))) {
    errors.push("Missing catalog.json (run `npm run build`)");
  } else {
    let catalog;
    try {
      catalog = await readJson(catalogPath);
    } catch (err) {
      errors.push(`catalog.json: invalid JSON (${err.message})`);
      catalog = null;
    }

    if (catalog && !validateCatalog(catalog)) {
      errors.push(`catalog.json: schema validation failed\n${formatAjvErrors(validateCatalog.errors)}`);
    }
  }

  const skillsMdPath = path.join(repoRoot, "SKILLS.md");
  if (!(await fileExists(skillsMdPath))) {
    errors.push("Missing SKILLS.md (run `npm run build`)");
  }

  const { expectedCatalogObj, expectedSkillsMd } = await generateExpectedIndex(repoRoot);

  // Compare catalog.json ignoring generatedAt (it changes every build)
  if (await fileExists(catalogPath)) {
    const actual = await readJson(catalogPath);
    const actualComparable = { schemaVersion: actual.schemaVersion, skills: actual.skills };
    if (JSON.stringify(actualComparable) !== JSON.stringify(expectedCatalogObj)) {
      errors.push("catalog.json is out of date (run `npm run build`)");
    }
  }

  if ((await fileExists(skillsMdPath)) && (await fs.readFile(skillsMdPath, "utf8")) !== expectedSkillsMd) {
    errors.push("SKILLS.md is out of date (run `npm run build`)");
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
