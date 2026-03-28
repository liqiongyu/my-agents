const fs = require("node:fs/promises");
const path = require("node:path");

const {
  SKILLS_CATALOG_PATH,
  AGENTS_CATALOG_PATH,
  PACKS_CATALOG_PATH,
  MACHINE_CATALOG_PATH,
  generateCatalogSnapshot
} = require("./lib/catalog");

async function main() {
  const repoRoot = path.resolve(__dirname, "..");
  await fs.mkdir(path.join(repoRoot, "docs", "catalog"), { recursive: true });
  await fs.mkdir(path.join(repoRoot, "dist"), { recursive: true });

  const snapshot = await generateCatalogSnapshot(repoRoot);
  const catalog = {
    ...snapshot.catalogBase,
    generatedAt: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(repoRoot, MACHINE_CATALOG_PATH),
    `${JSON.stringify(catalog, null, 2)}\n`,
    "utf8"
  );

  await fs.writeFile(path.join(repoRoot, SKILLS_CATALOG_PATH), snapshot.skillsMarkdown, "utf8");
  await fs.writeFile(path.join(repoRoot, AGENTS_CATALOG_PATH), snapshot.agentsMarkdown, "utf8");
  await fs.writeFile(path.join(repoRoot, PACKS_CATALOG_PATH), snapshot.packsMarkdown, "utf8");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
