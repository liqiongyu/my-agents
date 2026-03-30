#!/usr/bin/env node

const path = require("node:path");
const fs = require("node:fs/promises");

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
const {
  formatGitHubRuntimeInspection,
  inspectGitHubRuntime
} = require("./lib/issue-driven-os-github-inspection");
const { buildRuntimePaths, listRuntimeEvents } = require("./lib/issue-driven-os-state-store");
const {
  produceGitHubIssue,
  recoverIssueRun,
  reconcileIssue,
  runGitHubDaemon,
  runGitHubIssueWorker
} = require("./lib/issue-driven-os-github-runtime");

const ISSUE_DRIVEN_OS_USAGE = `Usage:
  npx my-agents issue-driven-os bundle <scenario-id> [--json]
  npx my-agents issue-driven-os simulate <scenario-id> [--json]
  npx my-agents issue-driven-os run <scenario-id> [--out <path>] [--json]
  npx my-agents issue-driven-os project <session-path> [--out <path>] [--json]
  npx my-agents issue-driven-os pipeline <scenario-id> [--out-dir <path>] [--json]
  npx my-agents issue-driven-os github produce <owner>/<repo> --repo-path <path> --from <path|->
  npx my-agents issue-driven-os github inspect <owner>/<repo> [--run <id>] [--limit <n>] [--events <n>] [--runtime-root <path>] [--json]
  npx my-agents issue-driven-os github run <owner>/<repo> --repo-path <path> --issue <number> [--follow] [--json] [--no-resume] [--review-loops-max <n>]
  npx my-agents issue-driven-os github resume <owner>/<repo> --repo-path <path> --issue <number> [--follow] [--json] [--review-loops-max <n>]
  npx my-agents issue-driven-os github recover <owner>/<repo> --issue <number> [--json]
  npx my-agents issue-driven-os github daemon <owner>/<repo> --repo-path <path> [--concurrency <n>] [--poll-seconds <n>] [--once] [--json] [--review-loops-max <n>]
  npx my-agents issue-driven-os github reconcile <owner>/<repo> --issue <number> [--branch <name>] [--json]

Examples:
  npx my-agents issue-driven-os bundle G1
  npx my-agents issue-driven-os simulate GT1 --json
  npx my-agents issue-driven-os run F1 --out .tmp/f1-session.json
  npx my-agents issue-driven-os project .tmp/f1-session.json
  npx my-agents issue-driven-os pipeline G1
  npx my-agents issue-driven-os pipeline GT1 --out-dir .tmp/gt1-pipeline
  npx my-agents issue-driven-os github inspect owner/repo --events 20
  npx my-agents issue-driven-os github run owner/repo --repo-path /path/to/repo --issue 123 --follow --review-loops-max 3
  npx my-agents issue-driven-os github resume owner/repo --repo-path /path/to/repo --issue 123 --follow --review-loops-max 3
  npx my-agents issue-driven-os github recover owner/repo --issue 123
  npx my-agents issue-driven-os github daemon owner/repo --repo-path /path/to/repo --concurrency 4 --once --review-loops-max 3`;

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

function excludedFlagValues(args, names) {
  const values = new Set();
  for (const name of names) {
    const value = parseValueFlag(args, name);
    if (value !== undefined) {
      values.add(value);
    }
  }
  return values;
}

function parseIntegerFlag(args, name, fallback) {
  const raw = parseValueFlag(args, name);
  if (raw === undefined) return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) {
    throw new Error(`Expected integer after ${name}.`);
  }
  return value;
}

async function readInputFromFlag(args, name) {
  const value = parseValueFlag(args, name);
  if (!value) {
    throw new Error(`Missing required ${name} value.`);
  }

  if (value === "-") {
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString("utf8");
  }

  return fs.readFile(path.resolve(process.cwd(), value), "utf8");
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

function requireRepoPath(args) {
  const repoPath = parseValueFlag(args, "--repo-path");
  if (!repoPath) {
    throw new Error("Missing --repo-path.");
  }
  return path.resolve(process.cwd(), repoPath);
}

function formatInspection(payload) {
  const base = formatGitHubRuntimeInspection(payload).trimEnd();
  const lines = [base];

  if ((payload.recentEvents ?? []).length > 0) {
    lines.push("", "Recent events");
    for (const event of payload.recentEvents) {
      lines.push(
        `- ${event.timestamp} | ${event.phase}/${event.event} | issue #${event.issueNumber ?? "n/a"} | run ${event.runId ?? "n/a"} | ${event.message}`
      );
    }
  }

  if ((payload.warnings ?? []).length > 0) {
    lines.push("", "Warnings");
    for (const warning of payload.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatDependencyRef(dependency = {}) {
  if (dependency.repoSlug && dependency.issueNumber) {
    return `${dependency.repoSlug}#${dependency.issueNumber}`;
  }

  return dependency.raw ?? "unknown dependency";
}

function formatDaemonPassSummary(result = {}) {
  const lines = [
    `Daemon pass checked ${result.checked ?? 0} issues.`,
    `Candidates consumed: ${result.consumed ?? 0}`,
    `Ready candidates: ${(result.ready ?? []).length}`,
    `Blocked by dependency: ${(result.blocked ?? []).length}`,
    `Result count: ${(result.results ?? []).length}`
  ];

  if ((result.ready ?? []).length > 0) {
    lines.push("", "Ready queue");
    for (const entry of result.ready ?? []) {
      lines.push(
        [
          `- issue #${entry.issueNumber}`,
          entry.priorityRank !== undefined ? `priority ${entry.priorityRank}` : null,
          (entry.dependencies ?? []).length > 0
            ? `deps ${entry.dependencies.map((dependency) => formatDependencyRef(dependency)).join(", ")}`
            : null
        ]
          .filter(Boolean)
          .join(" | ")
      );
    }
  }

  if ((result.blocked ?? []).length > 0) {
    lines.push("", "Blocked queue");
    for (const entry of result.blocked ?? []) {
      const waitingOn = (entry.unresolvedDependencies ?? []).map((dependency) =>
        formatDependencyRef(dependency)
      );
      lines.push(
        [
          `- issue #${entry.issueNumber}`,
          waitingOn.length > 0
            ? `waiting on ${waitingOn.join(", ")}`
            : "waiting on unknown dependency",
          (entry.warnings ?? []).length > 0
            ? `warnings: ${(entry.warnings ?? []).join("; ")}`
            : null
        ]
          .filter(Boolean)
          .join(" | ")
      );
    }
  }

  return lines.join("\n");
}

function formatRuntimeEventLine(event) {
  return [
    `[${event.timestamp}]`,
    `${event.phase}/${event.event}`,
    `actor=${event.actor ?? "runtime"}`,
    `issue=#${event.issueNumber ?? "n/a"}`,
    `run=${event.runId ?? "n/a"}`,
    event.message
  ].join(" | ");
}

async function followRuntimeEvents(runtimePaths, options = {}) {
  const onEvent =
    options.onEvent ??
    ((event) => {
      process.stdout.write(`${formatRuntimeEventLine(event)}\n`);
    });
  const matches = options.matches ?? (() => true);
  const minTimestamp = Date.parse(options.startedAt ?? new Date().toISOString());
  const intervalMs = Math.max(100, Number(options.intervalMs ?? 250));
  const eventWindow = Math.max(50, Number(options.eventWindow ?? 1000));
  const seenIds = new Set();

  async function pump() {
    const events = await listRuntimeEvents(runtimePaths, { limit: eventWindow });
    const ordered = [...events].sort((left, right) => {
      const leftTime = Date.parse(left.timestamp ?? "");
      const rightTime = Date.parse(right.timestamp ?? "");
      const safeLeft = Number.isFinite(leftTime) ? leftTime : 0;
      const safeRight = Number.isFinite(rightTime) ? rightTime : 0;
      return safeLeft - safeRight;
    });

    for (const event of ordered) {
      if (seenIds.has(event.id)) {
        continue;
      }
      seenIds.add(event.id);

      const eventTime = Date.parse(event.timestamp ?? "");
      if (Number.isFinite(minTimestamp) && Number.isFinite(eventTime) && eventTime < minTimestamp) {
        continue;
      }

      if (!matches(event)) {
        continue;
      }

      await onEvent(event);
    }
  }

  await pump();
  const timer = setInterval(() => {
    void pump();
  }, intervalMs);
  timer.unref?.();

  return async () => {
    clearInterval(timer);
    await pump();
  };
}

async function runGitHubProduce(repoRoot, args) {
  const asJson = args.includes("--json");
  const repoSlug = firstPositionalArg(args, excludedFlagValues(args, ["--repo-path", "--from"]));
  if (!repoSlug) throw new Error("Missing owner/repo.");
  const repoPath = requireRepoPath(args);
  const rawInput = await readInputFromFlag(args, "--from");

  const result = await produceGitHubIssue(repoRoot, repoSlug, repoPath, rawInput);
  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(
    [
      `Created issue #${result.issueNumber} in ${repoSlug}.`,
      `URL: ${result.issueUrl}`,
      `Summary: ${result.normalized.summary}`
    ].join("\n")
  );
}

async function runGitHubInspect(_repoRoot, args) {
  const asJson = args.includes("--json");
  const repoSlug = firstPositionalArg(
    args,
    excludedFlagValues(args, ["--runtime-root", "--run", "--limit", "--events"])
  );
  if (!repoSlug) throw new Error("Missing owner/repo.");

  const runtimeRoot = parseValueFlag(args, "--runtime-root");
  const runId = parseValueFlag(args, "--run");
  const payload = await inspectGitHubRuntime(repoSlug, {
    runtimeRoot: runtimeRoot ? path.resolve(process.cwd(), runtimeRoot) : undefined,
    runId,
    limit: parseIntegerFlag(args, "--limit", 10),
    eventLimit: parseIntegerFlag(args, "--events", 20)
  });

  if (asJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  process.stdout.write(`${formatInspection(payload)}\n`);
}

async function runGitHubSingleIssue(repoRoot, args, options = {}) {
  const asJson = args.includes("--json");
  const follow = args.includes("--follow");
  const issueNumber = parseIntegerFlag(args, "--issue");
  if (!issueNumber) throw new Error("Missing --issue.");
  const repoSlug = firstPositionalArg(
    args,
    new Set([
      ...excludedFlagValues(args, [
        "--repo-path",
        "--runtime-root",
        "--issue",
        "--review-loops-max"
      ]),
      String(issueNumber)
    ])
  );
  if (!repoSlug) throw new Error("Missing owner/repo.");
  const repoPath = requireRepoPath(args);
  const runtimeRoot = parseValueFlag(args, "--runtime-root");
  if (asJson && follow) {
    throw new Error("Cannot combine --follow with --json.");
  }

  const resolvedRuntimeRoot = runtimeRoot ? path.resolve(process.cwd(), runtimeRoot) : undefined;
  const runtimePaths = buildRuntimePaths(repoSlug, { runtimeRoot: resolvedRuntimeRoot });
  const startedAt = new Date().toISOString();
  const stopFollowing = follow
    ? await followRuntimeEvents(runtimePaths, {
        startedAt,
        matches: (event) => Number(event.issueNumber) === issueNumber
      })
    : null;

  let result;
  try {
    result = await runGitHubIssueWorker(repoRoot, repoSlug, repoPath, issueNumber, {
      runtimeRoot: resolvedRuntimeRoot,
      resume: options.forceResume ? true : !args.includes("--no-resume"),
      reviewLoopsMax: parseIntegerFlag(args, "--review-loops-max")
    });
  } finally {
    if (stopFollowing) {
      await stopFollowing();
    }
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(
    [
      `Issue #${issueNumber}: ${result.status}`,
      `Summary: ${result.summary}`,
      result.pullRequest?.url ? `PR: ${result.pullRequest.url}` : null,
      result.runId ? `Run id: ${result.runId}` : null
    ]
      .filter(Boolean)
      .join("\n")
  );
}

async function runGitHubDaemonMode(repoRoot, args) {
  const asJson = args.includes("--json");
  const repoSlug = firstPositionalArg(
    args,
    excludedFlagValues(args, [
      "--repo-path",
      "--runtime-root",
      "--concurrency",
      "--poll-seconds",
      "--limit",
      "--review-loops-max"
    ])
  );
  if (!repoSlug) throw new Error("Missing owner/repo.");
  const repoPath = requireRepoPath(args);
  const runtimeRoot = parseValueFlag(args, "--runtime-root");

  const result = await runGitHubDaemon(repoRoot, repoSlug, repoPath, {
    concurrency: parseIntegerFlag(args, "--concurrency", 4),
    pollSeconds: parseIntegerFlag(args, "--poll-seconds", 60),
    limit: parseIntegerFlag(args, "--limit", 100),
    once: args.includes("--once"),
    runtimeRoot: runtimeRoot ? path.resolve(process.cwd(), runtimeRoot) : undefined,
    reviewLoopsMax: parseIntegerFlag(args, "--review-loops-max")
  });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(formatDaemonPassSummary(result));
}

async function runGitHubReconcile(repoRoot, args) {
  const asJson = args.includes("--json");
  const issueNumber = parseIntegerFlag(args, "--issue");
  if (!issueNumber) throw new Error("Missing --issue.");
  const repoSlug = firstPositionalArg(
    args,
    new Set([...excludedFlagValues(args, ["--issue", "--branch"]), String(issueNumber)])
  );
  if (!repoSlug) throw new Error("Missing owner/repo.");
  const branchName = parseValueFlag(args, "--branch");

  const result = await reconcileIssue(repoSlug, issueNumber, {
    branchName
  });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(
    [
      `Reconcile status: ${result.status}`,
      `Summary: ${result.summary}`,
      result.pullRequest?.url ? `PR: ${result.pullRequest.url}` : null
    ]
      .filter(Boolean)
      .join("\n")
  );
}

async function runGitHubRecover(_repoRoot, args) {
  const asJson = args.includes("--json");
  const issueNumber = parseIntegerFlag(args, "--issue");
  if (!issueNumber) throw new Error("Missing --issue.");
  const repoSlug = firstPositionalArg(
    args,
    new Set([...excludedFlagValues(args, ["--issue", "--runtime-root"]), String(issueNumber)])
  );
  if (!repoSlug) throw new Error("Missing owner/repo.");
  const runtimeRoot = parseValueFlag(args, "--runtime-root");

  const result = await recoverIssueRun(repoSlug, issueNumber, {
    runtimeRoot: runtimeRoot ? path.resolve(process.cwd(), runtimeRoot) : undefined
  });

  if (asJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(
    [
      `Recover status: ${result.status}`,
      `Summary: ${result.summary}`,
      result.runId ? `Run id: ${result.runId}` : null
    ]
      .filter(Boolean)
      .join("\n")
  );
}

async function runGitHub(repoRoot, args) {
  const [subcommand, ...rest] = args;
  if (!subcommand || subcommand === "--help" || subcommand === "-h" || subcommand === "help") {
    printUsage();
    return;
  }

  if (subcommand === "produce") {
    await runGitHubProduce(repoRoot, rest);
    return;
  }

  if (subcommand === "inspect") {
    await runGitHubInspect(repoRoot, rest);
    return;
  }

  if (subcommand === "run") {
    await runGitHubSingleIssue(repoRoot, rest);
    return;
  }

  if (subcommand === "resume") {
    await runGitHubSingleIssue(repoRoot, rest, { forceResume: true });
    return;
  }

  if (subcommand === "recover") {
    await runGitHubRecover(repoRoot, rest);
    return;
  }

  if (subcommand === "daemon") {
    await runGitHubDaemonMode(repoRoot, rest);
    return;
  }

  if (subcommand === "reconcile") {
    await runGitHubReconcile(repoRoot, rest);
    return;
  }

  throw new Error(`Unknown issue-driven-os github command: ${subcommand}`);
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

  if (command === "github") {
    await runGitHub(repoRoot, rest);
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
  followRuntimeEvents,
  formatDaemonPassSummary,
  formatInspection,
  formatRuntimeEventLine,
  main
};
