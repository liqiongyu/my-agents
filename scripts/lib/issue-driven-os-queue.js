/**
 * Issue Agent OS — Queue Helper
 *
 * Treats GitHub Issues as a priority queue with dependency resolution.
 * Returns the next N eligible issues (queued, deps resolved, sorted by priority).
 *
 * Usage:
 *   node scripts/lib/issue-driven-os-queue.js next --repo owner/repo --limit 6
 */

const fs = require("node:fs");
const path = require("node:path");
const { buildGhAdapter } = require("./issue-driven-os-github-adapter");

const PRIORITY_ORDER = ["P0", "P1", "P2", "P3"];
const QUEUED_LABEL = "agent:queued";
const DEPENDS_ON_PATTERN = /depends-on:\s*([#\d,\s]+)/i;

function formatJsonOutput(value, compact = false) {
  return compact ? JSON.stringify(value) : JSON.stringify(value, null, 2);
}

/**
 * Parse `depends-on: #12, #34` from issue body.
 * Returns array of issue numbers.
 */
function parseDependencies(body) {
  const match = (body ?? "").match(DEPENDS_ON_PATTERN);
  if (!match) return [];
  return match[1]
    .split(",")
    .map((s) => parseInt(s.replace(/[^0-9]/g, ""), 10))
    .filter((n) => !isNaN(n) && n > 0);
}

/**
 * Extract the highest-priority label from an issue's labels.
 * Returns the index in PRIORITY_ORDER (lower = higher priority).
 * Issues without a priority label get the lowest priority.
 */
function priorityRank(labels) {
  for (let i = 0; i < PRIORITY_ORDER.length; i++) {
    if (labels.includes(PRIORITY_ORDER[i])) return i;
  }
  return PRIORITY_ORDER.length; // no priority label → lowest
}

/**
 * Build the queue interface.
 *
 * @param {object} options
 * @param {object} options.gh - GitHub adapter (from buildGhAdapter)
 * @param {string} options.repoSlug - "owner/repo"
 */
function buildQueue(options) {
  const { gh, repoSlug } = options;

  /**
   * Get the next N eligible issues from the queue.
   *
   * Eligible = labeled `agent:queued` + all `depends-on` issues are closed.
   * Sorted by priority label (P0 first).
   *
   * @param {object} params
   * @param {number} params.limit - Max issues to return (default: 6)
   * @returns {Promise<Array<{number, title, labels, priority}>>}
   */
  async function next(params = {}) {
    const limit = params.limit ?? 6;

    const queued = await gh.listIssues(repoSlug, {
      state: "open",
      labels: [QUEUED_LABEL],
      limit: 100
    });

    if (queued.length === 0) return [];

    const depNumbers = new Set();
    const issueDeps = new Map();

    for (const issue of queued) {
      const deps = parseDependencies(issue.body);
      issueDeps.set(issue.number, deps);
      for (const dep of deps) {
        depNumbers.add(dep);
      }
    }

    const closedDeps = new Set();
    if (depNumbers.size > 0) {
      const closedIssues = await gh.listIssues(repoSlug, {
        state: "closed",
        limit: 200
      });
      for (const issue of closedIssues) {
        if (depNumbers.has(issue.number)) {
          closedDeps.add(issue.number);
        }
      }
    }

    const eligible = queued.filter((issue) => {
      const deps = issueDeps.get(issue.number) ?? [];
      return deps.every((dep) => closedDeps.has(dep));
    });

    eligible.sort((a, b) => priorityRank(a.labels) - priorityRank(b.labels));

    return eligible.slice(0, limit).map((issue) => ({
      number: issue.number,
      title: issue.title,
      labels: issue.labels,
      priority: PRIORITY_ORDER[priorityRank(issue.labels)] ?? "none"
    }));
  }

  /**
   * Check if a parent issue's children are all done.
   * Used to auto-transition split parents from blocked → done.
   *
   * @param {number} parentNumber
   * @returns {Promise<{allDone: boolean, children: Array<{number, state}>}>}
   */
  async function checkChildren(parentNumber) {
    const allIssues = await gh.listIssues(repoSlug, {
      state: "all",
      limit: 200
    });

    const children = allIssues.filter((issue) => {
      const deps = parseDependencies(issue.body);
      return deps.includes(parentNumber) || (issue.body ?? "").includes(`Parent: #${parentNumber}`);
    });

    const childStates = children.map((c) => ({
      number: c.number,
      state: c.state
    }));
    const allDone = childStates.length > 0 && childStates.every((c) => c.state === "CLOSED");

    return { allDone, children: childStates };
  }

  return { next, checkChildren, parseDependencies };
}

function flag(args, name) {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
}

function hasFlag(args, name) {
  return args.includes(`--${name}`);
}

function buildDryRunAdapter(options = {}) {
  const fixturePath = options.fixturePath ?? path.resolve(__dirname, "../fixtures/queue-test.json");
  let allIssues;
  try {
    allIssues = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  } catch (err) {
    throw new Error(`--dry-run: could not load fixture at ${fixturePath}: ${err.message}`);
  }

  function listIssues(_repoSlug, issueOptions) {
    const state = (issueOptions.state ?? "open").toUpperCase();
    const labelFilter = issueOptions.labels ?? [];
    const limit = issueOptions.limit ?? 100;

    const filtered = allIssues.filter((issue) => {
      if (issue.state.toUpperCase() !== state) return false;
      for (const label of labelFilter) {
        if (!issue.labels.includes(label)) return false;
      }
      return true;
    });

    return Promise.resolve(filtered.slice(0, limit));
  }

  return { listIssues };
}

async function runCli(args, options = {}) {
  const command = args[0];
  const writeStdout = options.writeStdout ?? ((line) => console.log(line));
  const writeStderr = options.writeStderr ?? ((line) => console.error(line));
  const buildAdapter = options.buildGhAdapter ?? buildGhAdapter;
  const buildDryRun = options.buildDryRunAdapter ?? buildDryRunAdapter;

  if (command === "next") {
    const repo = flag(args, "repo");
    const limit = parseInt(flag(args, "limit") ?? "6", 10);
    const dryRun = hasFlag(args, "dry-run");
    const compact = hasFlag(args, "json");

    if (!repo) {
      writeStderr(
        "Usage: node issue-driven-os-queue.js next --repo owner/repo [--limit N] [--dry-run] [--json]"
      );
      return 1;
    }

    const gh = dryRun ? buildDryRun(options) : buildAdapter(options);
    const queue = buildQueue({ gh, repoSlug: repo });

    try {
      const issues = await queue.next({ limit });
      writeStdout(formatJsonOutput(issues, compact));
      return 0;
    } catch (err) {
      writeStderr(`Queue error: ${err.message}`);
      return 1;
    }
  }

  if (command === "check-children") {
    const repo = flag(args, "repo");
    const parent = parseInt(flag(args, "parent") ?? "0", 10);
    const compact = hasFlag(args, "json");
    const gh = buildAdapter(options);

    if (!repo || !parent) {
      writeStderr(
        "Usage: node issue-driven-os-queue.js check-children --repo owner/repo --parent N [--json]"
      );
      return 1;
    }

    const queue = buildQueue({ gh, repoSlug: repo });

    try {
      const result = await queue.checkChildren(parent);
      writeStdout(formatJsonOutput(result, compact));
      return 0;
    } catch (err) {
      writeStderr(`Check-children error: ${err.message}`);
      return 1;
    }
  }

  writeStderr("Commands: next, check-children");
  writeStderr("  next --repo owner/repo [--limit N] [--dry-run] [--json]");
  writeStderr("  check-children --repo owner/repo --parent N [--json]");
  return 1;
}

if (require.main === module) {
  runCli(process.argv.slice(2)).then((exitCode) => {
    process.exit(exitCode);
  });
}

module.exports = {
  PRIORITY_ORDER,
  QUEUED_LABEL,
  buildDryRunAdapter,
  buildQueue,
  formatJsonOutput,
  parseDependencies,
  priorityRank,
  runCli
};
