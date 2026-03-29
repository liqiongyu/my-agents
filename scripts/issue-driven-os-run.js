#!/usr/bin/env node

const path = require("node:path");

const { runReferenceScenario } = require("./lib/issue-driven-os-run-manager");

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(
      [
        "Usage: node scripts/issue-driven-os-run.js <scenario-id> [--out <path>] [--json]",
        "",
        "Examples:",
        "  node scripts/issue-driven-os-run.js G1",
        "  node scripts/issue-driven-os-run.js F1 --out .tmp/f1-session.json",
        "  node scripts/issue-driven-os-run.js GT1 --json"
      ].join("\n")
    );
    return;
  }

  const asJson = args.includes("--json");
  const outFlagIndex = args.indexOf("--out");
  const outputPath =
    outFlagIndex >= 0 && args[outFlagIndex + 1]
      ? path.resolve(process.cwd(), args[outFlagIndex + 1])
      : undefined;
  const scenarioId = args.find(
    (arg, index) => !arg.startsWith("-") && (outFlagIndex < 0 || index !== outFlagIndex + 1)
  );

  if (!scenarioId) {
    throw new Error("Missing scenario id.");
  }

  const repoRoot = path.resolve(__dirname, "..");
  const result = await runReferenceScenario(repoRoot, scenarioId, {
    outputPath,
    persist: !asJson
  });

  if (asJson) {
    console.log(JSON.stringify(result.session, null, 2));
    return;
  }

  console.log(
    [
      `Reference runtime session written for ${result.session.scenarioId}.`,
      `Session id: ${result.session.id}`,
      `Output: ${path.relative(process.cwd(), result.outputPath)}`,
      `Artifact trail entries: ${result.session.artifactTrail.length}`
    ].join("\n")
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
