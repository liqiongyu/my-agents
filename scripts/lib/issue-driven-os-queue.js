#!/usr/bin/env node

"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const { buildGhAdapter } = require("./issue-driven-os-github-adapter");
const { planConsumableIssues } = require("../../runtime/services/issue-queue-service");

const FIXTURE_PATH = path.resolve(__dirname, "..", "..", "fixtures", "queue-test.json");

const PRIORITY_RANK_NAMES = new Map([
  [0, "P0"],
  [1, "P1"],
  [2, "P2"],
  [3, "P3"]
]);

const DEFAULT_PRIORITY_NAME = "none";

function flag(args, name) {
  const index = args.indexOf(name);
  return index >= 0 && index + 1 < args.length ? args[index + 1] : undefined;
}

function isConsumerQueueCandidate(issue) {
  return (issue.labels ?? []).includes("agent:queued");
}

function formatPriority(rank) {
  return PRIORITY_RANK_NAMES.get(rank) ?? DEFAULT_PRIORITY_NAME;
}

function formatIssueResult(entry) {
  return {
    number: entry.issue.number,
    title: entry.issue.title,
    labels: entry.issue.labels,
    priority: formatPriority(entry.priorityRank)
  };
}

async function buildDryRunAdapter() {
  const raw = await fs.readFile(FIXTURE_PATH, "utf8");
  const allIssues = JSON.parse(raw);

  async function listIssues(_repoSlug, options = {}) {
    const state = (options.state ?? "open").toLowerCase();
    const labels = options.labels ?? [];

    return allIssues.filter((issue) => {
      if (state !== "all" && issue.state.toLowerCase() !== state) {
        return false;
      }
      for (const label of labels) {
        if (!(issue.labels ?? []).includes(label)) {
          return false;
        }
      }
      return true;
    });
  }

  async function viewIssue(_repoSlug, issueNumber) {
    const found = allIssues.find((issue) => issue.number === issueNumber);
    if (!found) {
      const error = new Error(`Issue #${issueNumber} not found in fixture`);
      error.statusCode = 404;
      throw error;
    }
    return found;
  }

  return { listIssues, viewIssue };
}

function buildQueue(gh, repoSlug) {
  async function next(options = {}) {
    const limit = options.limit ?? 6;

    const issues = await gh.listIssues(repoSlug, {
      state: "open",
      labels: ["agent:queued"],
      limit: 100
    });

    const candidates = issues.filter(isConsumerQueueCandidate);
    const queuePlan = await planConsumableIssues(repoSlug, candidates, gh);

    return queuePlan.ready.slice(0, limit).map((entry) => formatIssueResult(entry));
  }

  async function checkChildren(parentNumber) {
    const allIssues = await gh.listIssues(repoSlug, {
      state: "all",
      limit: 200
    });

    const children = allIssues.filter((issue) => {
      return (issue.body ?? "").includes(`#${parentNumber}`);
    });

    const childStates = children.map((c) => ({
      number: c.number,
      state: c.state
    }));
    const allDone =
      childStates.length > 0 && childStates.every((c) => c.state.toLowerCase() === "closed");

    return { allDone, children: childStates };
  }

  return { next, checkChildren };
}

async function runNext(args) {
  const repoSlug = flag(args, "--repo");
  const dryRun = args.includes("--dry-run");
  const limitRaw = flag(args, "--limit");
  const limit = limitRaw !== undefined ? parseInt(limitRaw, 10) : 6;

  if (limitRaw !== undefined && (!Number.isInteger(limit) || limit <= 0)) {
    throw new Error("--limit must be a positive integer.");
  }

  if (!repoSlug) {
    throw new Error("Missing --repo <owner/repo>.");
  }

  const gh = dryRun ? await buildDryRunAdapter() : buildGhAdapter();
  const queue = buildQueue(gh, repoSlug);
  const results = await queue.next({ limit });

  console.log(JSON.stringify(results, null, 2));
}

async function runCheckChildren(args) {
  const repoSlug = flag(args, "--repo");
  const dryRun = args.includes("--dry-run");
  const parentRaw = flag(args, "--parent");
  const parentNumber = parentRaw !== undefined ? parseInt(parentRaw, 10) : NaN;

  if (!repoSlug) {
    throw new Error("Missing --repo <owner/repo>.");
  }

  if (!Number.isInteger(parentNumber) || parentNumber <= 0) {
    throw new Error("Missing or invalid --parent <number>.");
  }

  const gh = dryRun ? await buildDryRunAdapter() : buildGhAdapter();
  const queue = buildQueue(gh, repoSlug);
  const result = await queue.checkChildren(parentNumber);

  console.log(JSON.stringify(result, null, 2));
}

async function main(argv = process.argv) {
  const args = argv.slice(2);
  const [command, ...rest] = args;

  if (!command || command === "--help" || command === "-h" || command === "help") {
    console.log(
      [
        "Usage:",
        "  node issue-driven-os-queue.js next --repo <owner/repo> [--limit N] [--dry-run]",
        "  node issue-driven-os-queue.js check-children --repo <owner/repo> --parent N [--dry-run]",
        "",
        "Commands:",
        "  next             Print the prioritized ready queue as JSON",
        "  check-children   Check whether all children of a parent issue are done",
        "",
        "Flags:",
        "  --repo      GitHub repository slug (owner/repo)",
        "  --limit     Maximum number of issues to return for `next` (default: 6)",
        "  --parent    Parent issue number for `check-children`",
        "  --dry-run   Read from fixtures/queue-test.json instead of calling GitHub"
      ].join("\n")
    );
    return;
  }

  if (command === "next") {
    await runNext(rest);
    return;
  }

  if (command === "check-children") {
    await runCheckChildren(rest);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

module.exports = {
  buildDryRunAdapter,
  buildQueue,
  formatIssueResult,
  main
};
