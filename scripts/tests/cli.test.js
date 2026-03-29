const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");

const cliPath = path.join(__dirname, "..", "cli.js");
const installPath = path.join(__dirname, "..", "install.js");
const referencesPath = path.join(__dirname, "..", "sync-references.js");

function runNodeScript(scriptPath, args) {
  return execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: path.join(__dirname, "..", ".."),
    encoding: "utf8"
  });
}

function runNodeScriptWithStatus(scriptPath, args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: path.join(__dirname, "..", ".."),
    encoding: "utf8"
  });
}

test("top-level CLI help documents the canonical command surface", () => {
  const output = runNodeScript(cliPath, ["--help"]);

  assert.match(output, /npx my-agents install <skill\|agent\|pack> <name> \[options\]/);
  assert.match(output, /npx my-agents project sync \[options\]/);
  assert.match(output, /npx my-agents issue-driven-os <command> \[options\]/);
  assert.match(output, /npx my-agents references <command> \[options\]/);
  assert.match(output, /Compatibility aliases:/);
});

test("legacy install wrapper help points to the canonical CLI", () => {
  const output = runNodeScript(installPath, ["--help"]);

  assert.match(output, /npx my-agents install <skill\|agent\|pack> <name> \[options\]/);
  assert.match(output, /npm run install-skill -- <name>/);
});

test("reference repository help shows canonical and compatibility forms", () => {
  const output = runNodeScript(referencesPath, ["--help"]);

  assert.match(output, /npx my-agents references <command> \[options\]/);
  assert.match(output, /npm run sync-references -- <command> \[options\]/);
});

test("top-level CLI still accepts legacy flag-first install syntax", () => {
  const result = runNodeScriptWithStatus(cliPath, ["--skill", "--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /npx my-agents install <skill\|agent\|pack> <name> \[options\]/);
  assert.doesNotMatch(result.stderr, /Unknown command/);
});

test("incomplete canonical install command exits nonzero", () => {
  const result = runNodeScriptWithStatus(cliPath, ["install"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Missing package type/);
});

test("incomplete canonical project command exits nonzero", () => {
  const result = runNodeScriptWithStatus(cliPath, ["project"]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Missing project command/);
});

test("issue-driven-os help documents the unified runtime flow surface", () => {
  const output = runNodeScript(cliPath, ["issue-driven-os", "--help"]);

  assert.match(output, /npx my-agents issue-driven-os bundle <scenario-id> \[--json\]/);
  assert.match(
    output,
    /npx my-agents issue-driven-os pipeline <scenario-id> \[--out-dir <path>\] \[--json\]/
  );
});

test("issue-driven-os pipeline runs the end-to-end reference flow", () => {
  const tempBase = path.join(__dirname, "..", "..", ".tmp", "cli-pipeline-test");
  const result = runNodeScriptWithStatus(cliPath, [
    "issue-driven-os",
    "pipeline",
    "G1",
    "--out-dir",
    tempBase
  ]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Issue-Driven OS pipeline completed for G1/);
  assert.match(result.stdout, /Projection artifact:/);
});
