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
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."));
}

async function copyPath(srcPath, destPath) {
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.rm(destPath, { recursive: true, force: true });
  await fs.cp(srcPath, destPath, { recursive: true, force: true });
}

module.exports = {
  copyPath,
  fileExists,
  readJson,
  listDirs
};
