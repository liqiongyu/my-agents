#!/usr/bin/env node

const { USAGE } = require("./lib/install-shared");
const { runInstallCli } = require("./install");
const { REFERENCES_USAGE, runReferencesCli } = require("./sync-references");
const { main: runIssueDrivenOsCli } = require("./issue-driven-os-cli");

function isHelpToken(token) {
  return token === "help" || token === "--help" || token === "-h";
}

function isLegacyInstallArg(token) {
  return typeof token === "string" && token.startsWith("-") && !isHelpToken(token);
}

function buildSyntheticArgv(args) {
  return ["node", "scripts/cli.js", ...args];
}

function printUsage() {
  console.log(USAGE);
}

function printCommandError(message) {
  console.error(message);
  console.error("");
  printUsage();
  process.exitCode = 2;
}

async function forwardInstallArgs(args) {
  await runInstallCli(buildSyntheticArgv(args));
}

async function handlePackageCommand(command, args) {
  const [type, ...rest] = args;

  if (!type) {
    printCommandError(`Missing package type for \`${command}\`.`);
    return;
  }

  if (isHelpToken(type)) {
    printUsage();
    return;
  }

  if (!["skill", "agent", "pack"].includes(type)) {
    printCommandError(`Unknown package type: ${type}`);
    return;
  }

  const translatedArgs = [`--${type}`];
  if (command === "uninstall") {
    translatedArgs.push("--uninstall");
  }
  translatedArgs.push(...rest);

  await forwardInstallArgs(translatedArgs);
}

async function handleProjectCommand(args) {
  const [subcommand, ...rest] = args;

  if (!subcommand) {
    printCommandError("Missing project command.");
    return;
  }

  if (isHelpToken(subcommand)) {
    printUsage();
    return;
  }

  if (subcommand !== "sync") {
    printCommandError(`Unknown project command: ${subcommand}`);
    return;
  }

  await forwardInstallArgs(["--sync-project", ...rest]);
}

async function handleLegacyAlias(command, args) {
  if (command === "install-skill") {
    await forwardInstallArgs(["--skill", ...args]);
    return true;
  }

  if (command === "install-agent") {
    await forwardInstallArgs(["--agent", ...args]);
    return true;
  }

  if (command === "install-pack") {
    await forwardInstallArgs(["--pack", ...args]);
    return true;
  }

  if (command === "uninstall-skill") {
    await forwardInstallArgs(["--skill", "--uninstall", ...args]);
    return true;
  }

  if (command === "uninstall-agent") {
    await forwardInstallArgs(["--agent", "--uninstall", ...args]);
    return true;
  }

  if (command === "uninstall-pack") {
    await forwardInstallArgs(["--pack", "--uninstall", ...args]);
    return true;
  }

  if (command === "sync-project") {
    await forwardInstallArgs(["--sync-project", ...args]);
    return true;
  }

  if (command === "sync-references") {
    await runReferencesCli(args, REFERENCES_USAGE);
    return true;
  }

  return false;
}

async function main(argv = process.argv) {
  const [command, ...args] = argv.slice(2);

  if (!command || isHelpToken(command)) {
    printUsage();
    return;
  }

  if (isLegacyInstallArg(command)) {
    await forwardInstallArgs([command, ...args]);
    return;
  }

  if (command === "add") {
    await forwardInstallArgs(["add", ...args]);
    return;
  }

  if (command === "install" || command === "uninstall") {
    await handlePackageCommand(command, args);
    return;
  }

  if (command === "project") {
    await handleProjectCommand(args);
    return;
  }

  if (command === "references") {
    await runReferencesCli(args, REFERENCES_USAGE);
    return;
  }

  if (command === "issue-driven-os") {
    await runIssueDrivenOsCli(buildSyntheticArgv(args));
    return;
  }

  if (await handleLegacyAlias(command, args)) {
    return;
  }

  printCommandError(`Unknown command: ${command}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}

module.exports = {
  main
};
