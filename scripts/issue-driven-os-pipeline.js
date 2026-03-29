#!/usr/bin/env node

const path = require("node:path");

const { formatPipelineRun, runIssueDrivenOsPipeline } = require("./lib/issue-driven-os-pipeline");

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(
      [
        "Usage: node scripts/issue-driven-os-pipeline.js <scenario-id> [--out-dir <path>] [--json]",
        "",
        "Examples:",
        "  node scripts/issue-driven-os-pipeline.js G1",
        "  node scripts/issue-driven-os-pipeline.js F1 --out-dir .tmp/f1-pipeline",
        "  node scripts/issue-driven-os-pipeline.js GT1 --json"
      ].join("\n")
    );
    return;
  }

  const asJson = args.includes("--json");
  const outDirFlagIndex = args.indexOf("--out-dir");
  const outputDir =
    outDirFlagIndex >= 0 && args[outDirFlagIndex + 1]
      ? path.resolve(process.cwd(), args[outDirFlagIndex + 1])
      : undefined;
  const scenarioId = args.find(
    (arg, index) => !arg.startsWith("-") && (outDirFlagIndex < 0 || index !== outDirFlagIndex + 1)
  );

  if (!scenarioId) {
    throw new Error("Missing scenario id.");
  }

  const repoRoot = path.resolve(__dirname, "..");
  const result = await runIssueDrivenOsPipeline(repoRoot, scenarioId, {
    outputDir,
    persist: !asJson
  });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  process.stdout.write(formatPipelineRun(result, process.cwd()));
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
