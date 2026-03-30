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
  return index >= 0 && args[index + 1] ? args[index + 1] : undefined;
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
      if (issue.state.toLowerCase() !== state) {
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
    const issues = await gh.listIssues(repoSlug, {
      state: "open",
      labels: ["agent:queued"],
      limit: options.limit ?? 100
    });

    const candidates = issues.filter(isConsumerQueueCandidate);
    const queuePlan = await planConsumableIssues(repoSlug, candidates, gh);

    return queuePlan.ready.map((entry) => formatIssueResult(entry));
  }

  return { next };
}

async function runNext(args) {
  const repoSlug = flag(args, "--repo");
  const dryRun = args.includes("--dry-run");

  if (!repoSlug) {
    throw new Error("Missing --repo <owner/repo>.");
  }

  const gh = dryRun ? await buildDryRunAdapter() : buildGhAdapter();
  const queue = buildQueue(gh, repoSlug);
  const results = await queue.next();

  console.log(JSON.stringify(results, null, 2));
}

async function main(argv = process.argv) {
  const args = argv.slice(2);
  const [command, ...rest] = args;

  if (!command || command === "--help" || command === "-h" || command === "help") {
    console.log(
      [
        "Usage:",
        "  node issue-driven-os-queue.js next --repo <owner/repo> [--dry-run]",
        "",
        "Commands:",
        "  next    Print the prioritized ready queue as JSON",
        "",
        "Flags:",
        "  --repo      GitHub repository slug (owner/repo)",
        "  --dry-run   Read from fixtures/queue-test.json instead of calling GitHub"
      ].join("\n")
    );
    return;
  }

  if (command === "next") {
    await runNext(rest);
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
