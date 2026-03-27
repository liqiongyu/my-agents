#!/usr/bin/env node

const { execFileSync } = require("node:child_process");

function runGit(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  }).trim();
}

function inGitWorktree() {
  try {
    return runGit(["rev-parse", "--is-inside-work-tree"]) === "true";
  } catch {
    return false;
  }
}

function main() {
  if (!inGitWorktree()) {
    return;
  }

  let currentHooksPath = "";
  try {
    currentHooksPath = runGit(["config", "--get", "core.hooksPath"]);
  } catch {
    currentHooksPath = "";
  }

  if (currentHooksPath === ".githooks") {
    return;
  }

  try {
    execFileSync("git", ["config", "core.hooksPath", ".githooks"], {
      cwd: process.cwd(),
      stdio: "ignore"
    });
    console.log("Configured Git hooks path to .githooks");
  } catch {
    console.warn(
      "Could not configure Git hooks automatically. Run `git config core.hooksPath .githooks` to enable auto-sync on commit."
    );
  }
}

main();
