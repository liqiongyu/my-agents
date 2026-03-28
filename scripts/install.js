#!/usr/bin/env node

const path = require("node:path");

const { ALL_PLATFORMS, DEFAULT_PROJECT_MANIFEST, USAGE } = require("./lib/install-shared");
const { parseGitHubPackageUrl } = require("./lib/github-package-url");
const { resolveExternalAssetCandidates } = require("./lib/external-assets");
const { appendProjectManifestEntry } = require("./lib/project-manifest-write");
const {
  installSkill,
  installAgent,
  installPack,
  uninstallSkill,
  uninstallAgent,
  uninstallPack,
  syncProject,
  runAll
} = require("./lib/install-runtime");

function parseArgs(argv) {
  const args = argv.slice(2);
  let command = null;
  let type = null;
  let name = null;
  let addUrl = null;
  let all = false;
  let platforms = null;
  let platformsSpecified = false;
  let scope = "project";
  let isUninstall = false;
  let prune = false;
  let manifestPath = DEFAULT_PROJECT_MANIFEST;
  let showHelp = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      showHelp = true;
    } else if (arg === "add" && !command && !type) {
      command = "add";
    } else if (arg === "--skill" || arg === "-s") {
      type = "skill";
    } else if (arg === "--agent" || arg === "-a") {
      type = "agent";
    } else if (arg === "--pack") {
      type = "pack";
    } else if (arg === "--sync-project") {
      type = "project";
      scope = "project";
    } else if (arg === "--all") {
      all = true;
    } else if (arg === "--uninstall" || arg === "-u") {
      isUninstall = true;
    } else if (arg === "--prune") {
      prune = true;
    } else if (arg === "--manifest") {
      const value = args[index + 1];
      if (value) {
        manifestPath = value;
        index += 1;
      }
    } else if (arg === "--platform" || arg === "-p") {
      const value = args[index + 1];
      if (value) {
        platformsSpecified = true;
        platforms =
          value === "all" ? [...ALL_PLATFORMS] : value.split(",").map((item) => item.trim());
        index += 1;
      }
    } else if (arg === "--scope") {
      const value = args[index + 1];
      if (value === "user" || value === "project") {
        scope = value;
        index += 1;
      }
    } else if (!arg.startsWith("-")) {
      if (command === "add" && !addUrl) {
        addUrl = arg;
        continue;
      }
      name = arg;
    }
  }

  if (!platforms) {
    platforms = [...ALL_PLATFORMS];
  }

  return {
    command,
    type,
    name,
    addUrl,
    all,
    platforms,
    platformsSpecified,
    scope,
    isUninstall,
    prune,
    manifestPath,
    showHelp
  };
}

async function runNamedOperation(repoRoot, type, name, platforms, scope, isUninstall) {
  if (type === "agent") {
    return isUninstall
      ? uninstallAgent(name, platforms, scope)
      : installAgent(repoRoot, name, platforms, scope);
  }

  if (type === "pack") {
    return isUninstall
      ? uninstallPack(repoRoot, name, platforms, scope)
      : installPack(repoRoot, name, platforms, scope);
  }

  return isUninstall
    ? uninstallSkill(name, platforms, scope)
    : installSkill(repoRoot, name, platforms, scope);
}

async function runAddCommand(addUrl, manifestPath) {
  const parsedUrl = parseGitHubPackageUrl(addUrl);
  const resolved = await resolveExternalAssetCandidates(parsedUrl);
  const { resolvedPath } = await appendProjectManifestEntry(
    resolved.kind,
    resolved.entry,
    manifestPath
  );

  console.log(
    `Added external ${resolved.kind.slice(0, -1)} (${resolved.entry.platform}): ${resolved.entry.name}`
  );
  console.log(
    `Updated project manifest: ${path.relative(process.cwd(), resolvedPath) || manifestPath}`
  );
}

async function runInstallCli(argv = process.argv) {
  const {
    command,
    type,
    name,
    addUrl,
    all,
    platforms,
    platformsSpecified,
    scope,
    isUninstall,
    prune,
    manifestPath,
    showHelp
  } = parseArgs(argv);

  if (showHelp) {
    console.log(USAGE);
    return;
  }

  if (command === "add") {
    if (!addUrl) {
      console.error("Provide a GitHub URL to add.");
      process.exitCode = 2;
      return;
    }
    if (type || all || isUninstall || prune || platformsSpecified) {
      console.error("`add` only supports a GitHub URL and optional --manifest.");
      process.exitCode = 2;
      return;
    }

    await runAddCommand(addUrl, manifestPath);
    return;
  }

  if (!type) {
    console.error(USAGE);
    process.exitCode = 2;
    return;
  }

  const repoRoot = path.resolve(__dirname, "..");
  let ok = true;

  if (type === "project") {
    if (all) {
      console.error("`project sync` does not support --all.");
      process.exitCode = 2;
      return;
    }
    if (isUninstall) {
      console.error("`project sync` does not support --uninstall.");
      process.exitCode = 2;
      return;
    }
    ok = await syncProject(repoRoot, manifestPath, platforms, platformsSpecified, prune);
  } else if (all) {
    ok = await runAll(repoRoot, type, platforms, scope, isUninstall);
  } else if (name) {
    ok = await runNamedOperation(repoRoot, type, name, platforms, scope, isUninstall);
  } else {
    console.error("Provide a name or use --all.");
    process.exitCode = 2;
    return;
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  runInstallCli().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = {
  parseArgs,
  runAddCommand,
  runInstallCli
};
