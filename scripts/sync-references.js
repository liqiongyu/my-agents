#!/usr/bin/env node

const fs = require("node:fs/promises");
const path = require("node:path");

const { syncGitRepository } = require("./lib/git-utils");
const {
  MANIFEST_PATH,
  REFERENCES_ROOT,
  defaultRepositoryPath,
  findRepositoryIndex,
  normalizeRelativePath,
  normalizeRepositoryEntry,
  parseRepositoryUrl,
  readManifest,
  repositoryLabel,
  writeManifest
} = require("./lib/reference-repos");

const DEFAULT_CLONE_DEPTH = 1;
const REFERENCES_USAGE = `Usage:
  npx my-agents references <command> [options]

Commands:
  list
  add <repository-url> [--purpose <text>] [--tags <a,b>] [--path <relative-path>] [--no-sync] [--depth <n>]
  sync [--depth <n>]
  remove <repository-url|owner/repo|owner__repo|path> [--delete-working-copy]

Compatibility alias:
  npm run sync-references -- <command> [options]

Manifest path: ${MANIFEST_PATH}
Clone root: ${REFERENCES_ROOT}

See also:
  npx my-agents --help`;

function readOptionValue(args, index, label) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${label} requires a value`);
  }
  return value;
}

function parseTagList(rawValue) {
  return [
    ...new Set(
      String(rawValue)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b));
}

function parseDepth(rawValue) {
  const depth = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(depth) || depth < 0) {
    throw new Error(`invalid clone depth: ${rawValue}`);
  }
  return depth;
}

async function handleList() {
  const manifest = await readManifest();

  if (manifest.repositories.length === 0) {
    console.log(`No local reference repositories registered in ${MANIFEST_PATH}.`);
    return;
  }

  console.log(`Local reference repositories (${manifest.repositories.length}):`);
  for (const entry of manifest.repositories) {
    const detail = entry.purpose ? ` - ${entry.purpose}` : "";
    console.log(`- ${repositoryLabel(entry)} -> ${entry.path}${detail}`);
  }
}

async function handleAdd(args) {
  const repositoryUrl = args.find((arg) => !arg.startsWith("--"));
  if (!repositoryUrl) {
    throw new Error("add requires a repository URL");
  }

  let purpose = "";
  let tags = [];
  let customPath = "";
  let shouldSync = true;
  let depth = DEFAULT_CLONE_DEPTH;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === repositoryUrl) {
      continue;
    }
    if (arg === "--purpose") {
      purpose = readOptionValue(args, index, "--purpose");
      index += 1;
      continue;
    }
    if (arg === "--tags") {
      tags = parseTagList(readOptionValue(args, index, "--tags"));
      index += 1;
      continue;
    }
    if (arg === "--path") {
      customPath = normalizeRelativePath(readOptionValue(args, index, "--path"));
      index += 1;
      continue;
    }
    if (arg === "--no-sync") {
      shouldSync = false;
      continue;
    }
    if (arg === "--depth") {
      depth = parseDepth(readOptionValue(args, index, "--depth"));
      index += 1;
      continue;
    }
    throw new Error(`unknown option for add: ${arg}`);
  }

  const parsed = parseRepositoryUrl(repositoryUrl);
  const candidate = normalizeRepositoryEntry({
    url: parsed.url,
    path: customPath || defaultRepositoryPath(parsed.owner, parsed.repo),
    purpose,
    tags
  });

  const manifest = await readManifest();
  const existingIndex = manifest.repositories.findIndex(
    (entry) => entry.url === candidate.url || entry.path === candidate.path
  );

  if (existingIndex >= 0) {
    const existing = manifest.repositories[existingIndex];
    console.log(`Already registered: ${repositoryLabel(existing)} -> ${existing.path}`);
    if (shouldSync) {
      await syncGitRepository(existing, depth, repositoryLabel(existing));
    }
    return;
  }

  manifest.repositories.push(candidate);
  await writeManifest(manifest);
  console.log(`Registered ${repositoryLabel(candidate)} in ${MANIFEST_PATH}`);

  if (shouldSync) {
    await syncGitRepository(candidate, depth, repositoryLabel(candidate));
  }
}

async function handleSync(args) {
  let depth = DEFAULT_CLONE_DEPTH;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--depth") {
      depth = parseDepth(readOptionValue(args, index, "--depth"));
      index += 1;
      continue;
    }
    throw new Error(`unknown option for sync: ${arg}`);
  }

  const manifest = await readManifest();
  if (manifest.repositories.length === 0) {
    console.log(`No local reference repositories registered in ${MANIFEST_PATH}.`);
    return;
  }

  const summary = {
    cloned: 0,
    updated: 0
  };

  for (const entry of manifest.repositories) {
    const result = await syncGitRepository(entry, depth, repositoryLabel(entry));
    summary[result] += 1;
  }

  console.log(
    `Sync complete: ${summary.cloned} cloned, ${summary.updated} updated (${manifest.repositories.length} total).`
  );
}

async function handleRemove(args) {
  const identifier = args.find((arg) => !arg.startsWith("--"));
  if (!identifier) {
    throw new Error("remove requires a repository identifier");
  }

  let deleteWorkingCopy = false;
  for (const arg of args) {
    if (arg === identifier) {
      continue;
    }
    if (arg === "--delete-working-copy") {
      deleteWorkingCopy = true;
      continue;
    }
    throw new Error(`unknown option for remove: ${arg}`);
  }

  const manifest = await readManifest();
  const existingIndex = findRepositoryIndex(manifest, identifier);
  if (existingIndex < 0) {
    throw new Error(`repository not found: ${identifier}`);
  }

  const [removed] = manifest.repositories.splice(existingIndex, 1);
  await writeManifest(manifest);
  console.log(`Removed ${repositoryLabel(removed)} from ${MANIFEST_PATH}`);

  if (deleteWorkingCopy) {
    await fs.rm(path.resolve(removed.path), { recursive: true, force: true });
    console.log(`Deleted working copy at ${removed.path}`);
  }
}

async function runReferencesCli(rawArgs = process.argv.slice(2), usageText = REFERENCES_USAGE) {
  const [command, ...args] = rawArgs;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    console.log(usageText);
    return;
  }

  if (command === "list") {
    await handleList();
    return;
  }

  if (command === "add") {
    await handleAdd(args);
    return;
  }

  if (command === "sync") {
    await handleSync(args);
    return;
  }

  if (command === "remove") {
    await handleRemove(args);
    return;
  }

  throw new Error(`unknown command: ${command}`);
}

if (require.main === module) {
  runReferencesCli().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  REFERENCES_USAGE,
  runReferencesCli
};
