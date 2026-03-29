#!/usr/bin/env node

const path = require("node:path");

const {
  formatScenarioSimulation,
  simulateScenario
} = require("./lib/issue-driven-os-scenario-harness");

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(
      [
        "Usage: node scripts/issue-driven-os-simulate.js <scenario-id> [--json]",
        "",
        "Examples:",
        "  node scripts/issue-driven-os-simulate.js G1",
        "  node scripts/issue-driven-os-simulate.js F1 --json"
      ].join("\n")
    );
    return;
  }

  const asJson = args.includes("--json");
  const scenarioId = args.find((arg) => !arg.startsWith("-"));
  if (!scenarioId) {
    throw new Error("Missing scenario id.");
  }

  const repoRoot = path.resolve(__dirname, "..");
  const simulation = await simulateScenario(repoRoot, scenarioId);

  if (asJson) {
    console.log(JSON.stringify(simulation, null, 2));
    return;
  }

  process.stdout.write(formatScenarioSimulation(simulation));
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
