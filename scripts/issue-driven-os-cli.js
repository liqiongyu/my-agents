#!/usr/bin/env node

const path = require("node:path");

const { formatPipelineRun, runIssueDrivenOsPipeline } = require("./lib/issue-driven-os-pipeline");
const {
  formatScenarioBundle,
  loadScenarioBundle
} = require("./lib/issue-driven-os-reference-runtime");
const {
  formatScenarioSimulation,
  simulateScenario
} = require("./lib/issue-driven-os-scenario-harness");
const { runReferenceScenario } = require("./lib/issue-driven-os-run-manager");
const { projectReferenceRuntimeSession } = require("./lib/issue-driven-os-projection-adapter");

const ISSUE_DRIVEN_OS_USAGE = `Usage:
  npx my-agents issue-driven-os bundle <scenario-id> [--json]
  npx my-agents issue-driven-os simulate <scenario-id> [--json]
  npx my-agents issue-driven-os run <scenario-id> [--out <path>] [--json]
  npx my-agents issue-driven-os project <session-path> [--out <path>] [--json]
  npx my-agents issue-driven-os pipeline <scenario-id> [--out-dir <path>] [--json]

Examples:
  npx my-agents issue-driven-os bundle G1
  npx my-agents issue-driven-os simulate GT1 --json
  npx my-agents issue-driven-os run F1 --out .tmp/f1-session.json
  npx my-agents issue-driven-os project .tmp/f1-session.json
  npx my-agents issue-driven-os pipeline G1
  npx my-agents issue-driven-os pipeline GT1 --out-dir .tmp/gt1-pipeline`;

function printUsage() {
  console.log(ISSUE_DRIVEN_OS_USAGE);
}

function parseValueFlag(args, name) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : undefined;
}

function firstPositionalArg(args, excludedValues = new Set()) {
  return args.find((arg) => !arg.startsWith("-") && !excludedValues.has(arg));
}

async function runBundle(repoRoot, args) {
  const asJson = args.includes("--json");
  const scenarioId = firstPositionalArg(args);
  if (!scenarioId) throw new Error("Missing scenario id.");
  const bundle = await loadScenarioBundle(repoRoot, scenarioId);
  if (asJson) {
    console.log(JSON.stringify(bundle, null, 2));
    return;
  }
  process.stdout.write(formatScenarioBundle(bundle));
}

async function runSimulate(repoRoot, args) {
  const asJson = args.includes("--json");
  const scenarioId = firstPositionalArg(args);
  if (!scenarioId) throw new Error("Missing scenario id.");
  const simulation = await simulateScenario(repoRoot, scenarioId);
  if (asJson) {
    console.log(JSON.stringify(simulation, null, 2));
    return;
  }
  process.stdout.write(formatScenarioSimulation(simulation));
}

async function runRun(repoRoot, args) {
  const asJson = args.includes("--json");
  const outPathArg = parseValueFlag(args, "--out");
  const excluded = new Set(outPathArg ? [outPathArg] : []);
  const scenarioId = firstPositionalArg(args, excluded);
  if (!scenarioId) throw new Error("Missing scenario id.");

  const result = await runReferenceScenario(repoRoot, scenarioId, {
    outputPath: outPathArg ? path.resolve(process.cwd(), outPathArg) : undefined,
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

async function runProject(repoRoot, args) {
  const asJson = args.includes("--json");
  const outPathArg = parseValueFlag(args, "--out");
  const excluded = new Set(outPathArg ? [outPathArg] : []);
  const sessionArg = firstPositionalArg(args, excluded);
  if (!sessionArg) throw new Error("Missing session path.");

  const result = await projectReferenceRuntimeSession(
    repoRoot,
    path.resolve(process.cwd(), sessionArg),
    {
      outputPath: outPathArg ? path.resolve(process.cwd(), outPathArg) : undefined,
      persist: !asJson
    }
  );

  if (asJson) {
    console.log(JSON.stringify(result.payload, null, 2));
    return;
  }

  console.log(
    [
      `Reference projection payload written for session ${result.session.id}.`,
      `Output: ${path.relative(process.cwd(), result.outputPath)}`,
      `Issue state: ${result.payload.issueProjection.visibleState ?? "n/a"}`,
      `Merge eligibility: ${result.payload.pullRequestProjection.mergeEligibility}`
    ].join("\n")
  );
}

async function runPipeline(repoRoot, args) {
  const asJson = args.includes("--json");
  const outDirArg = parseValueFlag(args, "--out-dir");
  const excluded = new Set(outDirArg ? [outDirArg] : []);
  const scenarioId = firstPositionalArg(args, excluded);
  if (!scenarioId) throw new Error("Missing scenario id.");

  const result = await runIssueDrivenOsPipeline(repoRoot, scenarioId, {
    outputDir: outDirArg ? path.resolve(process.cwd(), outDirArg) : undefined,
    persist: !asJson
  });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  process.stdout.write(formatPipelineRun(result, process.cwd()));
}

async function main(argv = process.argv) {
  const args = argv.slice(2);
  const [command, ...rest] = args;

  if (!command || command === "--help" || command === "-h" || command === "help") {
    printUsage();
    return;
  }

  const repoRoot = path.resolve(__dirname, "..");

  if (command === "bundle") {
    await runBundle(repoRoot, rest);
    return;
  }

  if (command === "simulate") {
    await runSimulate(repoRoot, rest);
    return;
  }

  if (command === "run") {
    await runRun(repoRoot, rest);
    return;
  }

  if (command === "project") {
    await runProject(repoRoot, rest);
    return;
  }

  if (command === "pipeline") {
    await runPipeline(repoRoot, rest);
    return;
  }

  throw new Error(`Unknown issue-driven-os command: ${command}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

module.exports = {
  ISSUE_DRIVEN_OS_USAGE,
  main
};
