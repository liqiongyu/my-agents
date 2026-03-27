#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

const prettierExtensions = new Set([
  ".cjs",
  ".js",
  ".json",
  ".json5",
  ".md",
  ".mdx",
  ".toml",
  ".yaml",
  ".yml"
]);

const eslintExtensions = new Set([".cjs", ".js"]);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit"
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"]
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result.stdout;
}

function binaryPath(name) {
  return path.join(
    repoRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${name}.cmd` : name
  );
}

function stagedFiles() {
  const output = runCapture("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]);
  return output
    .split("\0")
    .filter(Boolean)
    .filter((relativePath) => fs.existsSync(path.join(repoRoot, relativePath)));
}

function selectFiles(files, extensions) {
  return files.filter((filePath) => extensions.has(path.extname(filePath).toLowerCase()));
}

function main() {
  const files = stagedFiles();
  if (files.length === 0) {
    console.log("No staged files to lint or format.");
    return;
  }

  const prettierFiles = selectFiles(files, prettierExtensions);
  if (prettierFiles.length > 0) {
    run(binaryPath("prettier"), ["--write", ...prettierFiles]);
    run("git", ["add", "--", ...prettierFiles]);
  }

  const eslintFiles = selectFiles(files, eslintExtensions);
  if (eslintFiles.length > 0) {
    run(binaryPath("eslint"), ["--fix", "--max-warnings=0", ...eslintFiles]);
    run("git", ["add", "--", ...eslintFiles]);
  }
}

main();
