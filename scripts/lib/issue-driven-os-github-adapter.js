const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const { runCommand, runCommandCapture } = require("./git-utils");

const DEFAULT_AGENT_LABELS = [
  { name: "agent:ready", color: "0e8a16", description: "Ready for the issue-driven OS worker" },
  { name: "agent:claimed", color: "1d76db", description: "Currently claimed by an active worker" },
  { name: "agent:blocked", color: "d73a4a", description: "Blocked and needs intervention" },
  {
    name: "agent:priority-critical",
    color: "b60205",
    description: "Highest claim priority for the issue-driven OS worker"
  },
  {
    name: "agent:priority-high",
    color: "d93f0b",
    description: "High claim priority for the issue-driven OS worker"
  },
  {
    name: "agent:priority-medium",
    color: "fbca04",
    description: "Default claim priority for the issue-driven OS worker"
  },
  {
    name: "agent:priority-low",
    color: "0e8a16",
    description: "Low claim priority for the issue-driven OS worker"
  },
  {
    name: "agent:review",
    color: "fbca04",
    description: "PR opened and waiting for review or merge"
  },
  { name: "agent:split", color: "5319e7", description: "Issue was decomposed into child issues" },
  { name: "agent:done", color: "0e8a16", description: "Completed and merged by the worker" }
];

function parseRepoSlug(repoSlug) {
  const [owner, repo] = String(repoSlug ?? "").split("/");
  if (!owner || !repo) {
    throw new Error(`Expected repository in owner/repo form, got: ${repoSlug}`);
  }
  return { owner, repo, repoSlug: `${owner}/${repo}` };
}

async function withTempFile(prefix, content, fn) {
  const dirPath = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  const filePath = path.join(dirPath, "body.txt");

  try {
    await fs.writeFile(filePath, content, "utf8");
    return await fn(filePath);
  } finally {
    await fs.rm(dirPath, { recursive: true, force: true });
  }
}

function buildGhAdapter(options = {}) {
  const run = options.run ?? runCommand;
  const capture = options.capture ?? runCommandCapture;

  async function readJson(commandArgs, commandOptions = {}) {
    const { stdout } = await capture("gh", commandArgs, commandOptions);
    return JSON.parse(stdout || "null");
  }

  async function listIssues(repoSlug, options = {}) {
    const args = [
      "issue",
      "list",
      "--repo",
      repoSlug,
      "--state",
      options.state ?? "open",
      "--limit",
      String(options.limit ?? 100),
      "--json",
      "number,title,body,labels,comments,createdAt,updatedAt,url,state"
    ];

    for (const label of options.labels ?? []) {
      args.push("--label", label);
    }

    const issues = await readJson(args, options.commandOptions);
    return issues.map(normalizeIssueSummary);
  }

  async function viewIssue(repoSlug, issueNumber, options = {}) {
    const issue = await readJson(
      [
        "issue",
        "view",
        String(issueNumber),
        "--repo",
        repoSlug,
        "--comments",
        "--json",
        "number,title,body,labels,comments,createdAt,updatedAt,url,state"
      ],
      options.commandOptions
    );

    return normalizeIssueDetail(issue);
  }

  async function editIssue(repoSlug, issueNumber, options = {}) {
    const args = ["issue", "edit", String(issueNumber), "--repo", repoSlug];

    if (options.title) {
      args.push("--title", options.title);
    }

    if (options.body) {
      return withTempFile("issue-driven-os-issue-edit-", options.body, async (bodyPath) => {
        const bodyArgs = [...args, "--body-file", bodyPath];
        for (const label of options.addLabels ?? []) {
          bodyArgs.push("--add-label", label);
        }
        for (const label of options.removeLabels ?? []) {
          bodyArgs.push("--remove-label", label);
        }
        await run("gh", bodyArgs, options.commandOptions);
      });
    }

    for (const label of options.addLabels ?? []) {
      args.push("--add-label", label);
    }
    for (const label of options.removeLabels ?? []) {
      args.push("--remove-label", label);
    }

    await run("gh", args, options.commandOptions);
  }

  async function commentIssue(repoSlug, issueNumber, body, options = {}) {
    await withTempFile("issue-driven-os-issue-comment-", body, async (bodyPath) => {
      await run(
        "gh",
        ["issue", "comment", String(issueNumber), "--repo", repoSlug, "--body-file", bodyPath],
        options.commandOptions
      );
    });
  }

  async function closeIssue(repoSlug, issueNumber, options = {}) {
    const { owner, repo } = parseRepoSlug(repoSlug);
    const args = [
      "api",
      "--method",
      "PATCH",
      `repos/${owner}/${repo}/issues/${issueNumber}`,
      "-f",
      "state=closed"
    ];

    await run("gh", args, options.commandOptions);
  }

  async function createIssue(repoSlug, issueDraft, options = {}) {
    const args = ["issue", "create", "--repo", repoSlug, "--title", issueDraft.title];

    for (const label of issueDraft.labels ?? []) {
      args.push("--label", label);
    }

    return withTempFile("issue-driven-os-create-issue-", issueDraft.body, async (bodyPath) => {
      const createArgs = [...args, "--body-file", bodyPath];
      const { stdout } = await capture("gh", createArgs, options.commandOptions);
      const url = stdout.trim();
      const number = Number.parseInt(url.split("/").pop(), 10);
      return { number, url };
    });
  }

  async function listRepositoryLabels(repoSlug, options = {}) {
    const labels = await readJson(
      [
        "label",
        "list",
        "--repo",
        repoSlug,
        "--limit",
        String(options.limit ?? 1000),
        "--json",
        "name"
      ],
      options.commandOptions
    );

    return new Set((labels ?? []).map((label) => label?.name).filter(Boolean));
  }

  async function ensureLabels(repoSlug, labels = DEFAULT_AGENT_LABELS, options = {}) {
    const { owner, repo } = parseRepoSlug(repoSlug);
    const existingLabels = await listRepositoryLabels(repoSlug, options);

    for (const label of labels) {
      if (existingLabels.has(label.name)) {
        continue;
      }

      try {
        await capture(
          "gh",
          [
            "api",
            "--method",
            "POST",
            `repos/${owner}/${repo}/labels`,
            "-f",
            `name=${label.name}`,
            "-f",
            `color=${label.color}`,
            "-f",
            `description=${label.description}`
          ],
          options.commandOptions
        );
        existingLabels.add(label.name);
      } catch (error) {
        if (!/already_exists|already exists|422/i.test(error.message)) {
          throw error;
        }
        existingLabels.add(label.name);
      }
    }
  }

  async function findPullRequestForBranch(repoSlug, branchName, options = {}) {
    const pullRequests = await readJson(
      [
        "pr",
        "list",
        "--repo",
        repoSlug,
        "--head",
        branchName,
        "--state",
        options.state ?? "all",
        "--json",
        "number,url,state,headRefName,reviewDecision,mergeStateStatus,isDraft,autoMergeRequest,statusCheckRollup,title"
      ],
      options.commandOptions
    );

    return pullRequests[0] ? normalizePullRequest(pullRequests[0]) : null;
  }

  async function viewPullRequest(repoSlug, pullNumber, options = {}) {
    const pullRequest = await readJson(
      [
        "pr",
        "view",
        String(pullNumber),
        "--repo",
        repoSlug,
        "--json",
        "number,url,state,headRefName,baseRefName,reviewDecision,mergeStateStatus,isDraft,autoMergeRequest,statusCheckRollup,title,body"
      ],
      options.commandOptions
    );

    return normalizePullRequest(pullRequest);
  }

  async function createPullRequest(repoSlug, options = {}) {
    const args = [
      "pr",
      "create",
      "--repo",
      repoSlug,
      "--head",
      options.branchName,
      "--base",
      options.baseBranch,
      "--title",
      options.title
    ];

    return withTempFile("issue-driven-os-pr-body-", options.body, async (bodyPath) => {
      const createArgs = [...args, "--body-file", bodyPath];
      const { stdout } = await capture("gh", createArgs, options.commandOptions);
      const url = stdout.trim();
      const number = Number.parseInt(url.split("/").pop(), 10);
      return { number, url };
    });
  }

  async function editPullRequest(repoSlug, pullNumber, options = {}) {
    const args = ["pr", "edit", String(pullNumber), "--repo", repoSlug];

    if (options.title) {
      args.push("--title", options.title);
    }

    if (Object.prototype.hasOwnProperty.call(options, "body")) {
      return withTempFile("issue-driven-os-pr-edit-", options.body ?? "", async (bodyPath) => {
        const editArgs = [...args, "--body-file", bodyPath];
        await run("gh", editArgs, options.commandOptions);
      });
    }

    await run("gh", args, options.commandOptions);
  }

  async function commentPullRequest(repoSlug, pullNumber, body, options = {}) {
    await withTempFile("issue-driven-os-pr-comment-", body, async (bodyPath) => {
      await run(
        "gh",
        ["pr", "comment", String(pullNumber), "--repo", repoSlug, "--body-file", bodyPath],
        options.commandOptions
      );
    });
  }

  async function submitPullRequestReview(repoSlug, pullNumber, options = {}) {
    const reviewEvent = String(options.event ?? "COMMENT")
      .trim()
      .toUpperCase();
    const args = ["pr", "review", String(pullNumber), "--repo", repoSlug];

    if (reviewEvent === "APPROVE") {
      args.push("--approve");
    } else if (reviewEvent === "REQUEST_CHANGES") {
      args.push("--request-changes");
    } else {
      args.push("--comment");
    }

    return withTempFile("issue-driven-os-pr-review-", options.body ?? "", async (bodyPath) => {
      const reviewArgs = [...args, "--body-file", bodyPath];
      await run("gh", reviewArgs, options.commandOptions);
    });
  }

  async function listPullRequestReviews(repoSlug, pullNumber, options = {}) {
    const { owner, repo } = parseRepoSlug(repoSlug);
    const reviews = await readJson(
      ["api", `repos/${owner}/${repo}/pulls/${pullNumber}/reviews`],
      options.commandOptions
    );

    return Array.isArray(reviews) ? reviews : [];
  }

  async function listPullRequestReviewComments(repoSlug, pullNumber, options = {}) {
    const { owner, repo } = parseRepoSlug(repoSlug);
    const comments = await readJson(
      ["api", `repos/${owner}/${repo}/pulls/${pullNumber}/comments`],
      options.commandOptions
    );

    return Array.isArray(comments) ? comments : [];
  }

  async function enableAutoMerge(repoSlug, pullNumber, options = {}) {
    const args = [
      "pr",
      "merge",
      String(pullNumber),
      "--repo",
      repoSlug,
      "--auto",
      "--squash",
      "--delete-branch"
    ];

    if (options.matchHeadCommit) {
      args.push("--match-head-commit", options.matchHeadCommit);
    }

    await run("gh", args, options.commandOptions);
  }

  return {
    closeIssue,
    commentIssue,
    commentPullRequest,
    createIssue,
    createPullRequest,
    editPullRequest,
    editIssue,
    enableAutoMerge,
    ensureLabels,
    findPullRequestForBranch,
    listIssues,
    listPullRequestReviewComments,
    listPullRequestReviews,
    submitPullRequestReview,
    viewIssue,
    viewPullRequest
  };
}

function normalizeLabels(labels) {
  return (labels ?? [])
    .map((label) => (typeof label === "string" ? label : label.name))
    .filter(Boolean);
}

function normalizeIssueSummary(issue) {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    labels: normalizeLabels(issue.labels),
    commentsCount: Array.isArray(issue.comments) ? issue.comments.length : (issue.comments ?? 0),
    createdAt: issue.createdAt ?? null,
    updatedAt: issue.updatedAt ?? null,
    url: issue.url,
    state: issue.state
  };
}

function normalizeIssueDetail(issue) {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    labels: normalizeLabels(issue.labels),
    comments: Array.isArray(issue.comments)
      ? issue.comments.map((comment) => ({
          id: comment.id,
          author: comment.author?.login ?? null,
          body: comment.body ?? "",
          createdAt: comment.createdAt ?? null,
          url: comment.url ?? null
        }))
      : [],
    createdAt: issue.createdAt ?? null,
    updatedAt: issue.updatedAt ?? null,
    url: issue.url,
    state: issue.state
  };
}

function normalizePullRequest(pullRequest) {
  return {
    number: pullRequest.number,
    url: pullRequest.url,
    title: pullRequest.title ?? "",
    body: pullRequest.body ?? "",
    state: pullRequest.state,
    headRefName: pullRequest.headRefName,
    baseRefName: pullRequest.baseRefName ?? null,
    reviewDecision: pullRequest.reviewDecision ?? null,
    mergeStateStatus: pullRequest.mergeStateStatus ?? null,
    isDraft: Boolean(pullRequest.isDraft),
    autoMergeEnabled: Boolean(pullRequest.autoMergeRequest),
    statusCheckRollup: pullRequest.statusCheckRollup ?? []
  };
}

module.exports = {
  DEFAULT_AGENT_LABELS,
  buildGhAdapter,
  parseRepoSlug
};
