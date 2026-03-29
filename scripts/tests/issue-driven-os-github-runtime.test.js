const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  produceGitHubIssue,
  runGitHubIssueWorker
} = require("../lib/issue-driven-os-github-runtime");
const { buildRuntimePaths } = require("../lib/issue-driven-os-state-store");

test("produceGitHubIssue normalizes raw input and creates a ready issue", async () => {
  const calls = [];
  const github = {
    ensureLabels: async () => {},
    createIssue: async (_repoSlug, draft) => {
      calls.push(draft);
      return { number: 101, url: "https://example.test/issues/101" };
    }
  };

  const result = await produceGitHubIssue(
    path.resolve(__dirname, "..", ".."),
    "owner/repo",
    process.cwd(),
    "Bug: the CLI crashes on empty input.",
    {
      github,
      normalizeIssueInput: async () => ({
        payload: {
          title: "CLI crashes on empty input",
          body: "Steps to reproduce...",
          labels: ["bug"],
          summary: "Normalized bug issue."
        }
      })
    }
  );

  assert.equal(result.issueNumber, 101);
  assert.deepEqual(calls[0].labels, ["bug", "agent:ready"]);
});

test("runGitHubIssueWorker executes, critiques, and records a successful issue run", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-"));
  const comments = [];
  const issueEdits = [];
  const prComments = [];
  let findPrCalls = 0;

  const github = {
    ensureLabels: async () => {},
    viewIssue: async () => ({
      number: 12,
      title: "Fix the parser",
      body: "Parser fails on blank lines.",
      labels: ["agent:ready"],
      comments: [],
      state: "OPEN",
      url: "https://example.test/issues/12"
    }),
    editIssue: async (_repoSlug, _issueNumber, edit) => {
      issueEdits.push(edit);
    },
    commentIssue: async (_repoSlug, _issueNumber, body) => {
      comments.push(body);
    },
    createIssue: async () => {
      throw new Error("unexpected child issue creation");
    },
    findPullRequestForBranch: async () => {
      findPrCalls += 1;
      if (findPrCalls === 1) {
        return null;
      }
      return {
        number: 88,
        url: "https://example.test/pull/88",
        state: "MERGED",
        mergeStateStatus: "MERGED"
      };
    },
    createPullRequest: async () => ({
      number: 88,
      url: "https://example.test/pull/88"
    }),
    listPullRequestReviews: async () => [],
    listPullRequestReviewComments: async () => [],
    commentPullRequest: async (_repoSlug, _pullNumber, body) => {
      prComments.push(body);
    },
    enableAutoMerge: async () => {},
    closeIssue: async () => {}
  };

  const workspace = {
    createIssueWorktree: async () => ({
      branchName: "agent/issue-12",
      baseBranch: "main",
      worktreePath: "/tmp/fake-worktree"
    }),
    commitAllChanges: async () => ({
      changed: true,
      commitSha: "abc123"
    }),
    pushBranch: async () => {},
    cleanupIssueWorktree: async () => {}
  };

  try {
    const result = await runGitHubIssueWorker(
      path.resolve(__dirname, "..", ".."),
      "owner/repo",
      process.cwd(),
      12,
      {
        runtimeRoot: tempRoot,
        github,
        createIssueWorktree: workspace.createIssueWorktree,
        commitAllChanges: workspace.commitAllChanges,
        pushBranch: workspace.pushBranch,
        cleanupIssueWorktree: workspace.cleanupIssueWorktree,
        shapeGitHubIssue: async () => ({
          payload: {
            route: "execute",
            summary: "Shaped and ready.",
            acceptanceCriteria: ["Parser handles blank lines."],
            nonGoals: [],
            splitIssues: []
          }
        }),
        executeGitHubIssue: async () => ({
          payload: {
            status: "implemented",
            summary: "Implemented parser fix.",
            changeSummary: "Updated parser handling for blank lines.",
            verificationSummary: "Unit tests updated and passed.",
            commitMessage: "fix(parser): handle blank lines",
            prTitle: "Fix parser blank line handling",
            prBody: "This fixes the parser.",
            blockers: []
          }
        }),
        critiqueGitHubIssue: async () => ({
          payload: {
            verdict: "ready",
            verificationVerdict: "verified-pass",
            summary: "Ready to merge.",
            blockingFindings: [],
            nonBlockingFindings: []
          }
        })
      }
    );

    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const runFiles = await fs.readdir(runtimePaths.runsDir);

    assert.equal(result.status, "merged");
    assert.equal(issueEdits.length >= 2, true);
    assert.equal(prComments.length, 1);
    assert.equal(runFiles.length, 1);
    assert.match(comments[0], /claimed this issue/);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
