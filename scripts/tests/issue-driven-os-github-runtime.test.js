const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getIssuePriorityRank,
  parseIssueDependencies,
  planConsumableIssues,
  produceGitHubIssue,
  recoverIssueRun,
  runGitHubDaemon,
  runGitHubIssueWorker
} = require("../lib/issue-driven-os-github-runtime");
const {
  acquireIssueLease,
  buildRunRecord,
  buildRuntimePaths,
  persistArtifact,
  persistRunRecord,
  readLease,
  readRunRecord,
  recordRunUpdate
} = require("../lib/issue-driven-os-state-store");

test("parseIssueDependencies extracts explicit dependency references", () => {
  const dependencies = parseIssueDependencies(
    {
      body: ["Depends-On: #4, owner/repo#7", "", "Blocked-By:", "- #11", "- other/repo#13"].join(
        "\n"
      )
    },
    "current/repo"
  );

  assert.deepEqual(dependencies, [
    { repoSlug: "current/repo", issueNumber: 4, raw: "#4" },
    { repoSlug: "owner/repo", issueNumber: 7, raw: "owner/repo#7" },
    { repoSlug: "current/repo", issueNumber: 11, raw: "#11" },
    { repoSlug: "other/repo", issueNumber: 13, raw: "other/repo#13" }
  ]);
});

test("getIssuePriorityRank prefers the highest configured label priority", () => {
  assert.equal(getIssuePriorityRank({ labels: [] }), 2);
  assert.equal(getIssuePriorityRank({ labels: ["agent:priority-low"] }), 3);
  assert.equal(
    getIssuePriorityRank({
      labels: ["agent:priority-low", "agent:priority-high"]
    }),
    1
  );
});

test("planConsumableIssues gates unresolved dependencies and sorts ready issues", async () => {
  const queuedIssues = [
    {
      number: 15,
      title: "Newest medium priority task",
      body: "",
      labels: ["agent:ready"],
      createdAt: "2026-03-29T15:13:19Z",
      state: "OPEN"
    },
    {
      number: 14,
      title: "High priority task",
      body: "",
      labels: ["agent:ready", "agent:priority-high"],
      createdAt: "2026-03-29T15:13:18Z",
      state: "OPEN"
    },
    {
      number: 11,
      title: "Oldest dependency root",
      body: "",
      labels: ["agent:ready"],
      createdAt: "2026-03-29T15:13:15Z",
      state: "OPEN"
    },
    {
      number: 12,
      title: "Blocked until #11 closes",
      body: "Depends-On: #11",
      labels: ["agent:ready"],
      createdAt: "2026-03-29T15:13:16Z",
      state: "OPEN"
    },
    {
      number: 13,
      title: "Depends on a closed issue",
      body: "Depends-On: #99",
      labels: ["agent:ready"],
      createdAt: "2026-03-29T15:13:17Z",
      state: "OPEN"
    }
  ];

  const dependencyViews = [];
  const plan = await planConsumableIssues("owner/repo", queuedIssues, {
    viewIssue: async (repoSlug, issueNumber) => {
      dependencyViews.push(`${repoSlug}#${issueNumber}`);
      if (issueNumber === 99) {
        return {
          number: 99,
          title: "Already done",
          body: "",
          labels: ["agent:done"],
          comments: [],
          state: "CLOSED",
          url: "https://example.test/issues/99"
        };
      }

      throw new Error(`unexpected dependency lookup for ${repoSlug}#${issueNumber}`);
    }
  });

  assert.deepEqual(
    plan.ready.map((entry) => entry.issue.number),
    [14, 11, 13, 15]
  );
  assert.deepEqual(
    plan.blocked.map((entry) => ({
      issueNumber: entry.issue.number,
      unresolvedDependencies: entry.unresolvedDependencies
    })),
    [
      {
        issueNumber: 12,
        unresolvedDependencies: [{ repoSlug: "owner/repo", issueNumber: 11, raw: "#11" }]
      }
    ]
  );
  assert.deepEqual(dependencyViews, ["owner/repo#99"]);
});

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
  const pullRequests = [];
  const reviews = [];
  const statuses = [];
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
    editPullRequest: async () => {},
    listPullRequestReviews: async () => [],
    listPullRequestReviewComments: async () => [],
    createPullRequest: async (_repoSlug, draft) => {
      pullRequests.push(draft);
      return {
        number: 88,
        url: "https://example.test/pull/88"
      };
    },
    submitPullRequestReview: async (_repoSlug, _pullNumber, review) => {
      reviews.push(review);
    },
    createCommitStatus: async (_repoSlug, commitSha, status) => {
      statuses.push({
        commitSha,
        state: status.state,
        context: status.context,
        description: status.description,
        targetUrl: status.targetUrl
      });
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
    const events = JSON.parse(
      `[${(await fs.readFile(runtimePaths.eventsFilePath, "utf8")).trim().replace(/\n/g, ",")}]`
    );

    assert.equal(result.status, "merged");
    assert.equal(issueEdits.length >= 2, true);
    assert.equal(reviews.length, 1);
    assert.equal(statuses.length, 1);
    assert.equal(runFiles.length, 1);
    assert.match(comments[0], /claimed this issue/);
    assert.match(comments[0], /Agent type: worker/);
    assert.match(comments[0], /Execution Summary: agents=worker;/);
    assert.match(pullRequests[0].body, /Agent type: issue-cell-executor/);
    assert.match(pullRequests[0].body, /Execution Summary: agents=issue-cell-executor;/);
    assert.match(reviews[0].body, /Agent type: issue-cell-critic/);
    assert.match(reviews[0].body, /Execution Summary: agents=issue-cell-critic;/);
    assert.equal(reviews[0].event, "COMMENT");
    assert.deepEqual(statuses[0], {
      commitSha: "abc123",
      state: "success",
      context: "issue-driven-os/verification",
      description: "verified-pass: Ready to merge.",
      targetUrl: "https://example.test/pull/88"
    });
    assert.ok(
      events.some(
        (event) =>
          event.event === "issue_comment_posted" &&
          event.data?.executionSummary?.agents === "worker"
      )
    );
    assert.ok(
      events.some(
        (event) =>
          ["pull_request_created", "pull_request_reused"].includes(event.event) &&
          event.data?.executionSummary?.agents === "issue-cell-executor"
      )
    );
    assert.ok(
      events.some(
        (event) =>
          event.event === "pull_request_review_submitted" &&
          event.data?.executionSummary?.agents === "issue-cell-critic"
      )
    );
    assert.ok(
      events.some(
        (event) =>
          event.event === "verification_status_projected" &&
          event.data?.state === "success" &&
          event.data?.commitSha === "abc123"
      )
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("runGitHubIssueWorker automatically reruns execution after needs_changes in the same worker pass", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-auto-review-loop-"));
  const comments = [];
  const issueEdits = [];
  const reviews = [];
  const executionContexts = [];
  const critiqueContexts = [];
  let executeCalls = 0;
  let critiqueCalls = 0;
  let findPrCalls = 0;

  const github = {
    ensureLabels: async () => {},
    viewIssue: async () => ({
      number: 21,
      title: "Keep reworking until ready",
      body: "The worker should continue after critic feedback without manual resume.",
      labels: ["agent:ready"],
      comments: [],
      state: "OPEN",
      url: "https://example.test/issues/21"
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
    findPullRequestForBranch: async (_repoSlug, _branchName, options = {}) => {
      findPrCalls += 1;
      if (options.state === "open") {
        return executeCalls === 0
          ? null
          : {
              number: 91,
              url: "https://example.test/pull/91",
              state: "OPEN",
              mergeStateStatus: "CLEAN"
            };
      }

      return {
        number: 91,
        url: "https://example.test/pull/91",
        state: "MERGED",
        mergeStateStatus: "MERGED"
      };
    },
    editPullRequest: async () => {},
    listPullRequestReviews: async () => [],
    listPullRequestReviewComments: async () => [],
    createPullRequest: async () => ({
      number: 91,
      url: "https://example.test/pull/91"
    }),
    submitPullRequestReview: async (_repoSlug, _pullNumber, review) => {
      reviews.push(review);
    },
    enableAutoMerge: async () => {},
    closeIssue: async () => {}
  };

  try {
    const result = await runGitHubIssueWorker(
      path.resolve(__dirname, "..", ".."),
      "owner/repo",
      process.cwd(),
      21,
      {
        runtimeRoot: tempRoot,
        github,
        createIssueWorktree: async () => ({
          branchName: "agent/issue-21",
          baseBranch: "main",
          worktreePath: "/tmp/fake-auto-review-loop-worktree",
          reused: false
        }),
        refreshIssueBranch: async () => ({
          status: "merged",
          baseBranch: "main",
          baseRef: "origin/main",
          conflictedFiles: []
        }),
        commitAllChanges: async () => ({
          changed: true,
          commitSha: `auto-review-loop-${executeCalls + 1}`
        }),
        pushBranch: async () => {},
        cleanupIssueWorktree: async () => {},
        shapeGitHubIssue: async () => ({
          payload: {
            route: "execute",
            summary: "Ready for execution.",
            acceptanceCriteria: ["needs_changes auto-loops without manual intervention"],
            nonGoals: [],
            splitIssues: []
          }
        }),
        executeGitHubIssue: async (_repoRoot, _cwd, context) => {
          executeCalls += 1;
          executionContexts.push(context);
          return {
            payload: {
              status: "implemented",
              summary:
                executeCalls === 1
                  ? "Initial implementation completed."
                  : "Follow-up implementation addressed critic feedback.",
              changeSummary:
                executeCalls === 1
                  ? "Initial runtime loop wiring."
                  : "Bound the review loop and kept the worker running.",
              verificationSummary:
                executeCalls === 1
                  ? "Initial tests pass."
                  : "Updated tests pass after review feedback.",
              commitMessage:
                executeCalls === 1
                  ? "feat(issue-os): start runtime review loop"
                  : "fix(issue-os): continue worker review loop automatically",
              prTitle: "Automatic review loop support",
              prBody: "The worker keeps reworking after critic feedback.",
              blockers: []
            }
          };
        },
        critiqueGitHubIssue: async (_repoRoot, _cwd, context) => {
          critiqueCalls += 1;
          critiqueContexts.push(context);
          if (critiqueCalls === 1) {
            return {
              payload: {
                verdict: "needs_changes",
                verificationVerdict: "verified-fail",
                summary: "The worker stops after review instead of continuing automatically.",
                blockingFindings: ["Continue to a second execution pass automatically."],
                nonBlockingFindings: []
              }
            };
          }
          return {
            payload: {
              verdict: "ready",
              verificationVerdict: "verified-pass",
              summary: "The automatic rework loop now continues correctly.",
              blockingFindings: [],
              nonBlockingFindings: []
            }
          };
        }
      }
    );

    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const updatedRun = JSON.parse(
      await fs.readFile(path.join(runtimePaths.runsDir, `${result.runId}.json`), "utf8")
    );
    const events = JSON.parse(
      `[${(await fs.readFile(runtimePaths.eventsFilePath, "utf8")).trim().replace(/\n/g, ",")}]`
    );

    assert.equal(result.status, "merged");
    assert.equal(executeCalls, 2);
    assert.equal(critiqueCalls, 2);
    assert.equal(executionContexts.length, 2);
    assert.match(
      executionContexts[1].reviewFeedback.requestedChanges[0].body,
      /Continue to a second execution pass automatically\./
    );
    assert.equal(reviews.length, 2);
    assert.deepEqual(
      reviews.map((review) => review.event),
      ["COMMENT", "COMMENT"]
    );
    assert.equal(updatedRun.status, "merged");
    assert.equal(updatedRun.lastCompletedPhase, "reconciled");
    assert.equal(updatedRun.reviewLoopCount, 1);
    assert.equal(updatedRun.reviewLoopsMax, 3);
    assert.equal(updatedRun.terminationReason, null);
    assert.ok(events.some((event) => event.event === "review_loop_continued"));
    assert.ok(events.some((event) => event.event === "auto_merge_enabled"));
    assert.ok(
      issueEdits.some(
        (edit) => Array.isArray(edit.addLabels) && edit.addLabels.includes("agent:done")
      )
    );
    assert.ok(comments.some((body) => /claimed this issue/i.test(body)));
    assert.ok(findPrCalls >= 2);
    assert.equal(critiqueContexts.length, 2);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("runGitHubIssueWorker stops after the review-loop budget is exhausted", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-review-budget-"));
  const reviews = [];
  const issueEdits = [];
  const statuses = [];
  let executeCalls = 0;
  let critiqueCalls = 0;

  const github = {
    ensureLabels: async () => {},
    viewIssue: async () => ({
      number: 23,
      title: "Bound review loop retries",
      body: "The worker should stop once the review-loop budget is exhausted.",
      labels: ["agent:ready"],
      comments: [],
      state: "OPEN",
      url: "https://example.test/issues/23"
    }),
    editIssue: async (_repoSlug, _issueNumber, edit) => {
      issueEdits.push(edit);
    },
    commentIssue: async () => {},
    createIssue: async () => {
      throw new Error("unexpected child issue creation");
    },
    findPullRequestForBranch: async (_repoSlug, _branchName, options = {}) => {
      if (options.state === "open") {
        return executeCalls === 0
          ? null
          : {
              number: 93,
              url: "https://example.test/pull/93",
              state: "OPEN",
              mergeStateStatus: "CLEAN"
            };
      }
      return {
        number: 93,
        url: "https://example.test/pull/93",
        state: "OPEN",
        mergeStateStatus: "DIRTY"
      };
    },
    editPullRequest: async () => {},
    listPullRequestReviews: async () => [],
    listPullRequestReviewComments: async () => [],
    createPullRequest: async () => ({
      number: 93,
      url: "https://example.test/pull/93"
    }),
    submitPullRequestReview: async (_repoSlug, _pullNumber, review) => {
      reviews.push(review);
    },
    createCommitStatus: async (_repoSlug, commitSha, status) => {
      statuses.push({
        commitSha,
        state: status.state,
        context: status.context,
        description: status.description,
        targetUrl: status.targetUrl
      });
    },
    enableAutoMerge: async () => {
      throw new Error("should not enable auto-merge after review budget exhaustion");
    },
    closeIssue: async () => {}
  };

  try {
    const result = await runGitHubIssueWorker(
      path.resolve(__dirname, "..", ".."),
      "owner/repo",
      process.cwd(),
      23,
      {
        runtimeRoot: tempRoot,
        reviewLoopsMax: 1,
        github,
        createIssueWorktree: async () => ({
          branchName: "agent/issue-23",
          baseBranch: "main",
          worktreePath: "/tmp/fake-review-budget-worktree",
          reused: false
        }),
        refreshIssueBranch: async () => ({
          status: "merged",
          baseBranch: "main",
          baseRef: "origin/main",
          conflictedFiles: []
        }),
        commitAllChanges: async () => {
          executeCalls += 1;
          return {
            changed: true,
            commitSha: `review-budget-${executeCalls}`
          };
        },
        pushBranch: async () => {},
        cleanupIssueWorktree: async () => {},
        shapeGitHubIssue: async () => ({
          payload: {
            route: "execute",
            summary: "Ready for execution.",
            acceptanceCriteria: ["review loop stops after the configured budget"],
            nonGoals: [],
            splitIssues: []
          }
        }),
        executeGitHubIssue: async () => ({
          payload: {
            status: "implemented",
            summary: "Implementation still needs follow-up.",
            changeSummary: "Another execution pass completed.",
            verificationSummary: "Tests keep passing, but critic still disagrees.",
            commitMessage: "fix(issue-os): another review loop pass",
            prTitle: "Review-loop budget handling",
            prBody: "Continues until budget is exhausted.",
            blockers: []
          }
        }),
        critiqueGitHubIssue: async () => {
          critiqueCalls += 1;
          return {
            payload: {
              verdict: "needs_changes",
              verificationVerdict: "verified-fail",
              summary: `Still not good enough after pass ${critiqueCalls}.`,
              blockingFindings: [`Critique pass ${critiqueCalls} still fails.`],
              nonBlockingFindings: []
            }
          };
        }
      }
    );

    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const updatedRun = JSON.parse(
      await fs.readFile(path.join(runtimePaths.runsDir, `${result.runId}.json`), "utf8")
    );
    const events = JSON.parse(
      `[${(await fs.readFile(runtimePaths.eventsFilePath, "utf8")).trim().replace(/\n/g, ",")}]`
    );

    assert.equal(result.status, "blocked");
    assert.match(result.summary, /Review-loop budget exhausted/);
    assert.equal(executeCalls, 2);
    assert.equal(critiqueCalls, 2);
    assert.equal(reviews.length, 2);
    assert.equal(statuses.length, 2);
    assert.equal(updatedRun.status, "blocked");
    assert.equal(updatedRun.reviewLoopCount, 2);
    assert.equal(updatedRun.reviewLoopsMax, 1);
    assert.equal(updatedRun.terminationReason, "review_loop_budget_exhausted");
    assert.deepEqual(
      statuses.map((status) => ({
        commitSha: status.commitSha,
        state: status.state,
        context: status.context
      })),
      [
        {
          commitSha: "review-budget-1",
          state: "failure",
          context: "issue-driven-os/verification"
        },
        {
          commitSha: "review-budget-2",
          state: "failure",
          context: "issue-driven-os/verification"
        }
      ]
    );
    assert.ok(events.some((event) => event.event === "review_loop_continued"));
    assert.ok(events.some((event) => event.event === "review_loop_budget_exhausted"));
    assert.ok(
      events.filter((event) => event.event === "verification_status_projected").length >= 2
    );
    assert.ok(
      issueEdits.some(
        (edit) => Array.isArray(edit.addLabels) && edit.addLabels.includes("agent:blocked")
      )
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("runGitHubIssueWorker downgrades self-approval to a comment review and still completes", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-"));
  const reviews = [];
  let approveAttempts = 0;
  let findPrCalls = 0;

  const github = {
    ensureLabels: async () => {},
    viewIssue: async () => ({
      number: 13,
      title: "Fix self-review projection",
      body: "Review projection should not fail for single-account runs.",
      labels: ["agent:ready"],
      comments: [],
      state: "OPEN",
      url: "https://example.test/issues/13"
    }),
    editIssue: async () => {},
    commentIssue: async () => {},
    createIssue: async () => {
      throw new Error("unexpected child issue creation");
    },
    findPullRequestForBranch: async () => {
      findPrCalls += 1;
      if (findPrCalls === 1) {
        return null;
      }

      return {
        number: 89,
        url: "https://example.test/pull/89",
        state: "MERGED",
        mergeStateStatus: "MERGED"
      };
    },
    editPullRequest: async () => {},
    listPullRequestReviews: async () => [],
    listPullRequestReviewComments: async () => [],
    createPullRequest: async () => ({
      number: 89,
      url: "https://example.test/pull/89"
    }),
    submitPullRequestReview: async (_repoSlug, _pullNumber, review) => {
      reviews.push(review);
      if (review.event === "APPROVE" && approveAttempts === 0) {
        approveAttempts += 1;
        throw new Error(
          "failed to create review: GraphQL: Review Can not approve your own pull request (addPullRequestReview)"
        );
      }
    },
    enableAutoMerge: async () => {},
    closeIssue: async () => {}
  };

  const workspace = {
    createIssueWorktree: async () => ({
      branchName: "agent/issue-13",
      baseBranch: "main",
      worktreePath: "/tmp/fake-worktree-self-review"
    }),
    commitAllChanges: async () => ({
      changed: true,
      commitSha: "def456"
    }),
    pushBranch: async () => {},
    cleanupIssueWorktree: async () => {}
  };

  try {
    const result = await runGitHubIssueWorker(
      path.resolve(__dirname, "..", ".."),
      "owner/repo",
      process.cwd(),
      13,
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
            acceptanceCriteria: ["Review projection succeeds in single-account mode."],
            nonGoals: [],
            splitIssues: []
          }
        }),
        executeGitHubIssue: async () => ({
          payload: {
            status: "implemented",
            summary: "Implemented the fallback.",
            changeSummary: "Downgraded self-approval to comment review.",
            verificationSummary: "Runtime test updated and passed.",
            commitMessage: "fix(agent-os): downgrade self-approval reviews",
            prTitle: "Handle self-review fallback",
            prBody: "This prevents same-account self-reviews from failing the run.",
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
        }),
        reviewProjectionMode: "formal"
      }
    );

    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const events = JSON.parse(
      `[${(await fs.readFile(runtimePaths.eventsFilePath, "utf8")).trim().replace(/\n/g, ",")}]`
    );

    assert.equal(result.status, "merged");
    assert.deepEqual(
      reviews.map((review) => review.event),
      ["APPROVE", "COMMENT"]
    );
    assert.match(
      reviews[1].body,
      /same GitHub account for both the PR author and the reviewer \(APPROVE\)/
    );
    assert.match(reviews[1].body, /Execution Summary: agents=issue-cell-critic;/);
    assert.match(reviews[1].body, /limits=github_self_review_restriction/);
    assert.ok(events.some((event) => event.event === "pull_request_review_downgraded"));
    assert.ok(
      events.some(
        (event) =>
          event.event === "pull_request_review_submitted" &&
          event.data?.requestedReviewEvent === "APPROVE" &&
          event.data?.submittedReviewEvent === "COMMENT" &&
          event.data?.executionSummary?.limits === "github_self_review_restriction"
      )
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("recoverIssueRun releases a stale lease and marks a claimed run as failed", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-recover-"));
  const issueEdits = [];
  const comments = [];

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const runRecord = buildRunRecord(19, {
      repoSlug: "owner/repo",
      status: "claimed",
      startedAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:10:00.000Z",
      branchRef: "agent/issue-19",
      lastCompletedPhase: "workspace",
      summary: "Claimed but never released."
    });

    await persistRunRecord(runtimePaths, runRecord);
    await recordRunUpdate(runtimePaths, "owner/repo", runRecord);
    await acquireIssueLease(
      runtimePaths,
      19,
      {
        holderId: runRecord.id,
        holderType: "worker",
        runId: runRecord.id
      },
      {
        now: new Date("2026-03-30T00:10:00.000Z"),
        ttlMs: 30 * 60 * 1000
      }
    );

    const result = await recoverIssueRun("owner/repo", 19, {
      runtimeRoot: tempRoot,
      github: {
        editIssue: async (_repoSlug, _issueNumber, edit) => {
          issueEdits.push(edit);
        },
        commentIssue: async (_repoSlug, _issueNumber, body) => {
          comments.push(body);
        }
      }
    });

    const recoveredRun = await readRunRecord(runtimePaths, runRecord.id);
    const lease = await readLease(runtimePaths, 19);

    assert.equal(result.status, "recovered");
    assert.equal(recoveredRun.status, "failed");
    assert.equal(recoveredRun.lastCompletedPhase, "workspace");
    assert.equal(lease, null);
    assert.ok(
      issueEdits.some(
        (edit) => Array.isArray(edit.removeLabels) && edit.removeLabels.includes("agent:claimed")
      )
    );
    assert.ok(comments.some((body) => /recovered a stale claim/i.test(body)));
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("runGitHubDaemon auto-recovers stale claimed issues and requeues them", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-daemon-recover-"));
  const issueEdits = [];
  const comments = [];
  const workerCalls = [];
  let claimedRecovered = false;

  try {
    const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
    const runRecord = buildRunRecord(24, {
      id: "run_issue_24_20260330T000000Z",
      repoSlug: "owner/repo",
      status: "claimed",
      startedAt: "2026-03-30T00:00:00.000Z",
      updatedAt: "2026-03-30T00:05:00.000Z",
      branchRef: "agent/issue-24",
      lastCompletedPhase: "workspace",
      summary: "Claimed and then lost."
    });

    await persistRunRecord(runtimePaths, runRecord);
    await recordRunUpdate(runtimePaths, "owner/repo", runRecord);

    const github = {
      ensureLabels: async () => {},
      listIssues: async () => [
        {
          number: 24,
          title: "Recoverable claimed issue",
          body: "",
          labels: claimedRecovered ? ["agent:ready"] : ["agent:claimed"],
          comments: [],
          createdAt: "2026-03-30T00:00:00Z",
          updatedAt: "2026-03-30T00:05:00Z",
          url: "https://example.test/issues/24",
          state: "OPEN"
        }
      ],
      editIssue: async (_repoSlug, _issueNumber, edit) => {
        issueEdits.push(edit);
        if (Array.isArray(edit.addLabels) && edit.addLabels.includes("agent:ready")) {
          claimedRecovered = true;
        }
      },
      commentIssue: async (_repoSlug, _issueNumber, body) => {
        comments.push(body);
      },
      viewIssue: async () => {
        throw new Error("unexpected dependency lookup");
      }
    };

    const result = await runGitHubDaemon(
      path.resolve(__dirname, "..", ".."),
      "owner/repo",
      process.cwd(),
      {
        once: true,
        runtimeRoot: tempRoot,
        github,
        runGitHubIssueWorker: async (_repoRoot, _repoSlug, _repoPath, issueNumber) => {
          workerCalls.push(issueNumber);
          return { status: "claimed", summary: "worker stub ran", runId: "stub" };
        }
      }
    );

    const recoveredRun = await readRunRecord(runtimePaths, runRecord.id);

    assert.deepEqual(workerCalls, [24]);
    assert.equal(result.recoveredClaims.length, 1);
    assert.equal(result.recoveredClaims[0].issueNumber, 24);
    assert.equal(recoveredRun.status, "failed");
    assert.ok(
      issueEdits.some(
        (edit) => Array.isArray(edit.addLabels) && edit.addLabels.includes("agent:ready")
      )
    );
    assert.ok(comments.some((body) => /automatically requeued/i.test(body)));
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("runGitHubIssueWorker resumes a failed run from persisted execution state", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-resume-"));
  const reviews = [];
  const pushCalls = [];
  const issueEdits = [];
  const comments = [];
  let shapeCalls = 0;
  let executeCalls = 0;
  let critiqueCalls = 0;
  let findPrCalls = 0;

  const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
  const priorRun = buildRunRecord(21, {
    id: "run_issue_21_20260330T000000Z",
    repoSlug: "owner/repo",
    status: "failed",
    startedAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:20:00.000Z",
    finishedAt: "2026-03-30T00:20:00.000Z",
    branchRef: "agent/issue-21",
    worktreePath: "/tmp/fake-resume-worktree",
    commitSha: "resume123",
    lastCompletedPhase: "commit_created",
    summary: "git push failed",
    artifacts: []
  });

  await persistRunRecord(runtimePaths, priorRun);
  await persistArtifact(runtimePaths, priorRun.id, "shaping", {
    route: "execute",
    summary: "Shaped and ready.",
    acceptanceCriteria: ["resume uses saved artifacts"],
    nonGoals: [],
    splitIssues: []
  });
  await persistArtifact(runtimePaths, priorRun.id, "execution", {
    status: "implemented",
    summary: "Implementation already exists.",
    changeSummary: "Reused existing execution output.",
    verificationSummary: "Saved execution artifact reused.",
    commitMessage: "fix(issue-os): resume saved execution",
    prTitle: "Resume saved execution",
    prBody: "Reuse the saved execution state.",
    blockers: []
  });
  await recordRunUpdate(runtimePaths, "owner/repo", priorRun);

  const github = {
    ensureLabels: async () => {},
    viewIssue: async () => ({
      number: 21,
      title: "Resume the failed run",
      body: "Recover from a failed push.",
      labels: ["agent:blocked"],
      comments: [],
      state: "OPEN",
      url: "https://example.test/issues/21"
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
    findPullRequestForBranch: async (_repoSlug, _branchName, options = {}) => {
      findPrCalls += 1;
      if (options.state === "open") {
        return {
          number: 91,
          url: "https://example.test/pull/91",
          state: "OPEN",
          mergeStateStatus: "CLEAN"
        };
      }

      return {
        number: 91,
        url: "https://example.test/pull/91",
        state: "MERGED",
        mergeStateStatus: "MERGED"
      };
    },
    editPullRequest: async () => {},
    listPullRequestReviews: async () => [],
    listPullRequestReviewComments: async () => [],
    createPullRequest: async () => {
      throw new Error("unexpected pull request creation");
    },
    submitPullRequestReview: async (_repoSlug, _pullNumber, review) => {
      reviews.push(review);
    },
    enableAutoMerge: async () => {},
    closeIssue: async () => {}
  };

  const workspace = {
    createIssueWorktree: async () => ({
      branchName: "agent/issue-21",
      baseBranch: "main",
      worktreePath: "/tmp/fake-resume-worktree",
      reused: true
    }),
    refreshIssueBranch: async () => ({
      status: "up_to_date",
      baseBranch: "main",
      baseRef: "origin/main",
      conflictedFiles: []
    }),
    getWorkingTreeStatus: async () => "",
    getHeadCommitSha: async () => "resume123",
    commitAllChanges: async () => {
      throw new Error("execution should not be recommitted");
    },
    pushBranch: async (_worktreePath, _branchName, options = {}) => {
      pushCalls.push(options);
    },
    cleanupIssueWorktree: async () => {}
  };

  try {
    const result = await runGitHubIssueWorker(
      path.resolve(__dirname, "..", ".."),
      "owner/repo",
      process.cwd(),
      21,
      {
        runtimeRoot: tempRoot,
        github,
        createIssueWorktree: workspace.createIssueWorktree,
        refreshIssueBranch: workspace.refreshIssueBranch,
        getWorkingTreeStatus: workspace.getWorkingTreeStatus,
        getHeadCommitSha: workspace.getHeadCommitSha,
        commitAllChanges: workspace.commitAllChanges,
        pushBranch: workspace.pushBranch,
        cleanupIssueWorktree: workspace.cleanupIssueWorktree,
        shapeGitHubIssue: async () => {
          shapeCalls += 1;
          throw new Error("shaping should not rerun");
        },
        executeGitHubIssue: async () => {
          executeCalls += 1;
          throw new Error("execution should not rerun");
        },
        critiqueGitHubIssue: async () => {
          critiqueCalls += 1;
          return {
            payload: {
              verdict: "ready",
              verificationVerdict: "verified-pass",
              summary: "Ready to merge after resume.",
              blockingFindings: [],
              nonBlockingFindings: []
            }
          };
        }
      }
    );

    const updatedRun = JSON.parse(
      await fs.readFile(path.join(runtimePaths.runsDir, `${priorRun.id}.json`), "utf8")
    );
    const events = JSON.parse(
      `[${(await fs.readFile(runtimePaths.eventsFilePath, "utf8")).trim().replace(/\n/g, ",")}]`
    );

    assert.equal(result.status, "merged");
    assert.equal(shapeCalls, 0);
    assert.equal(executeCalls, 0);
    assert.equal(critiqueCalls, 1);
    assert.equal(pushCalls.length, 1);
    assert.equal(pushCalls[0].forceWithLease, true);
    assert.equal(reviews[0].event, "COMMENT");
    assert.ok(comments.some((body) => /resumed this issue/i.test(body)));
    assert.ok(
      comments.some(
        (body) =>
          /Execution Summary: agents=worker;/.test(body) &&
          /verification=resume-from-execution/.test(body)
      )
    );
    assert.equal(updatedRun.id, priorRun.id);
    assert.equal(updatedRun.commitSha, "resume123");
    assert.equal(updatedRun.lastCompletedPhase, "reconciled");
    assert.ok(events.some((event) => event.event === "run_resumed"));
    assert.ok(events.some((event) => event.event === "execution_resumed"));
    assert.ok(events.some((event) => event.event === "commit_reused"));
    assert.ok(findPrCalls >= 1);
    assert.equal(issueEdits.length >= 2, true);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("runGitHubIssueWorker does not reuse stale execution artifacts before execution completed", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-stage-safe-resume-"));
  const executionContexts = [];
  let shapeCalls = 0;
  let executeCalls = 0;
  let critiqueCalls = 0;

  const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
  const priorRun = buildRunRecord(23, {
    id: "run_issue_23_20260330T000000Z",
    repoSlug: "owner/repo",
    status: "failed",
    startedAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:10:00.000Z",
    finishedAt: "2026-03-30T00:10:00.000Z",
    branchRef: "agent/issue-23",
    worktreePath: "/tmp/fake-stage-safe-worktree",
    lastCompletedPhase: "workspace",
    summary: "Worker died after workspace setup.",
    artifacts: []
  });

  await persistRunRecord(runtimePaths, priorRun);
  await persistArtifact(runtimePaths, priorRun.id, "shaping", {
    route: "execute",
    summary: "Shaped and ready.",
    acceptanceCriteria: ["resume reuses only safe artifacts"],
    nonGoals: [],
    splitIssues: []
  });
  await persistArtifact(runtimePaths, priorRun.id, "execution", {
    status: "implemented",
    summary: "This stale execution artifact should not be reused.",
    changeSummary: "stale",
    verificationSummary: "stale",
    commitMessage: "stale",
    prTitle: "stale",
    prBody: "stale",
    blockers: []
  });
  await persistArtifact(runtimePaths, priorRun.id, "critic", {
    verdict: "ready",
    verificationVerdict: "verified-pass",
    summary: "stale critic",
    blockingFindings: [],
    nonBlockingFindings: []
  });
  await recordRunUpdate(runtimePaths, "owner/repo", priorRun);

  const github = {
    ensureLabels: async () => {},
    viewIssue: async () => ({
      number: 23,
      title: "Resume from workspace after worker died",
      body: "Stale execution artifacts should not be reused.",
      labels: ["agent:blocked"],
      comments: [],
      state: "OPEN",
      url: "https://example.test/issues/23"
    }),
    editIssue: async () => {},
    commentIssue: async () => {},
    createIssue: async () => {
      throw new Error("unexpected child issue creation");
    },
    findPullRequestForBranch: async () => null,
    editPullRequest: async () => {},
    listPullRequestReviews: async () => [],
    listPullRequestReviewComments: async () => [],
    createPullRequest: async () => ({
      number: 93,
      url: "https://example.test/pull/93",
      state: "OPEN",
      mergeStateStatus: "CLEAN"
    }),
    submitPullRequestReview: async () => {},
    enableAutoMerge: async () => {},
    closeIssue: async () => {}
  };

  const workspace = {
    createIssueWorktree: async () => ({
      branchName: "agent/issue-23",
      baseBranch: "main",
      worktreePath: "/tmp/fake-stage-safe-worktree",
      reused: true
    }),
    refreshIssueBranch: async () => ({
      status: "up_to_date",
      baseBranch: "main",
      baseRef: "origin/main",
      conflictedFiles: []
    }),
    commitAllChanges: async () => ({
      changed: true,
      commitSha: "stageSafe123"
    }),
    pushBranch: async () => {},
    cleanupIssueWorktree: async () => {}
  };

  try {
    const result = await runGitHubIssueWorker(
      path.resolve(__dirname, "..", ".."),
      "owner/repo",
      process.cwd(),
      23,
      {
        runtimeRoot: tempRoot,
        github,
        createIssueWorktree: workspace.createIssueWorktree,
        refreshIssueBranch: workspace.refreshIssueBranch,
        commitAllChanges: workspace.commitAllChanges,
        pushBranch: workspace.pushBranch,
        cleanupIssueWorktree: workspace.cleanupIssueWorktree,
        shapeGitHubIssue: async () => {
          shapeCalls += 1;
          throw new Error("shaping should not rerun");
        },
        executeGitHubIssue: async (_repoRoot, _cwd, context) => {
          executeCalls += 1;
          executionContexts.push(context);
          return {
            payload: {
              status: "implemented",
              summary: "Fresh execution reran after recovery.",
              changeSummary: "Recovered from workspace checkpoint.",
              verificationSummary: "Fresh execution path ran.",
              commitMessage: "fix(issue-os): rerun after stale claimed run",
              prTitle: "Rerun after stale claimed run",
              prBody: "Fresh execution path after recovery.",
              blockers: []
            }
          };
        },
        critiqueGitHubIssue: async () => {
          critiqueCalls += 1;
          return {
            payload: {
              verdict: "ready",
              verificationVerdict: "verified-pass",
              summary: "Fresh execution result is ready.",
              blockingFindings: [],
              nonBlockingFindings: []
            }
          };
        }
      }
    );

    assert.equal(result.status, "awaiting_merge");
    assert.equal(shapeCalls, 0);
    assert.equal(executeCalls, 1);
    assert.equal(critiqueCalls, 1);
    assert.equal(executionContexts.length, 1);
    assert.equal(executionContexts[0].reviewFeedback.requestedChanges.length, 0);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("runGitHubIssueWorker reruns execution after needs_changes using prior critic feedback", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-review-loop-"));
  const reviews = [];
  const comments = [];
  const issueEdits = [];
  const pushCalls = [];
  const executionContexts = [];
  let shapeCalls = 0;
  let executeCalls = 0;
  let critiqueCalls = 0;
  let findPrCalls = 0;

  const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
  const priorRun = buildRunRecord(22, {
    id: "run_issue_22_20260330T000000Z",
    repoSlug: "owner/repo",
    status: "needs_changes",
    startedAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:30:00.000Z",
    finishedAt: "2026-03-30T00:30:00.000Z",
    branchRef: "agent/issue-22",
    worktreePath: "/tmp/fake-review-loop-worktree",
    commitSha: "reviewloop123",
    prNumber: 92,
    prUrl: "https://example.test/pull/92",
    lastCompletedPhase: "review_projected",
    summary: "Lease loss handling still needs work.",
    artifacts: []
  });

  await persistRunRecord(runtimePaths, priorRun);
  await persistArtifact(runtimePaths, priorRun.id, "shaping", {
    route: "execute",
    summary: "Shaped and ready.",
    acceptanceCriteria: ["worker stops when the lease is lost"],
    nonGoals: [],
    splitIssues: []
  });
  await persistArtifact(runtimePaths, priorRun.id, "execution", {
    status: "implemented",
    summary: "Initial implementation exists.",
    changeSummary: "Added lease renewal lifecycle.",
    verificationSummary: "Existing tests passed.",
    commitMessage: "feat(issue-os): add lease renewal",
    prTitle: "Add lease renewal runtime support",
    prBody: "Initial lease renewal implementation.",
    blockers: []
  });
  await persistArtifact(runtimePaths, priorRun.id, "critic", {
    verdict: "needs_changes",
    verificationVerdict: "verified-fail",
    summary: "Lease loss should stop the worker before it finishes the run.",
    blockingFindings: ["Stop work immediately after lease loss."],
    nonBlockingFindings: []
  });
  await recordRunUpdate(runtimePaths, "owner/repo", priorRun);

  const github = {
    ensureLabels: async () => {},
    viewIssue: async () => ({
      number: 22,
      title: "Rework lease recovery loop",
      body: "Needs another execution pass after review.",
      labels: ["agent:review"],
      comments: [],
      state: "OPEN",
      url: "https://example.test/issues/22"
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
    findPullRequestForBranch: async (_repoSlug, _branchName, options = {}) => {
      findPrCalls += 1;
      if (options.state === "open") {
        return {
          number: 92,
          url: "https://example.test/pull/92",
          state: "OPEN",
          mergeStateStatus: "CLEAN"
        };
      }

      return {
        number: 92,
        url: "https://example.test/pull/92",
        state: "MERGED",
        mergeStateStatus: "MERGED"
      };
    },
    editPullRequest: async () => {},
    listPullRequestReviews: async () => [
      {
        state: "COMMENTED",
        user: { login: "liqiongyu" },
        body: "previous review projection"
      }
    ],
    listPullRequestReviewComments: async () => [],
    createPullRequest: async () => {
      throw new Error("unexpected pull request creation");
    },
    submitPullRequestReview: async (_repoSlug, _pullNumber, review) => {
      reviews.push(review);
    },
    enableAutoMerge: async () => {},
    closeIssue: async () => {}
  };

  const workspace = {
    createIssueWorktree: async () => ({
      branchName: "agent/issue-22",
      baseBranch: "main",
      worktreePath: "/tmp/fake-review-loop-worktree",
      reused: true
    }),
    refreshIssueBranch: async () => ({
      status: "conflicted",
      baseBranch: "main",
      baseRef: "origin/main",
      conflictedFiles: ["scripts/lib/issue-driven-os-github-runtime.js"]
    }),
    commitAllChanges: async () => ({
      changed: true,
      commitSha: "reviewloop456"
    }),
    pushBranch: async (_worktreePath, _branchName, options = {}) => {
      pushCalls.push(options);
    },
    cleanupIssueWorktree: async () => {}
  };

  try {
    const result = await runGitHubIssueWorker(
      path.resolve(__dirname, "..", ".."),
      "owner/repo",
      process.cwd(),
      22,
      {
        runtimeRoot: tempRoot,
        github,
        createIssueWorktree: workspace.createIssueWorktree,
        refreshIssueBranch: workspace.refreshIssueBranch,
        commitAllChanges: workspace.commitAllChanges,
        pushBranch: workspace.pushBranch,
        cleanupIssueWorktree: workspace.cleanupIssueWorktree,
        shapeGitHubIssue: async () => {
          shapeCalls += 1;
          throw new Error("shaping should not rerun");
        },
        executeGitHubIssue: async (_repoRoot, _cwd, context) => {
          executeCalls += 1;
          executionContexts.push(context);
          return {
            payload: {
              status: "implemented",
              summary: "Addressed the review findings.",
              changeSummary: "Abort execution when lease ownership is lost.",
              verificationSummary: "Regression test added for lease loss.",
              commitMessage: "fix(issue-os): stop work after lease loss",
              prTitle: "Handle lease loss during worker execution",
              prBody: "Follow-up pass for review feedback.",
              blockers: []
            }
          };
        },
        critiqueGitHubIssue: async () => {
          critiqueCalls += 1;
          return {
            payload: {
              verdict: "ready",
              verificationVerdict: "verified-pass",
              summary: "Ready to merge after rework.",
              blockingFindings: [],
              nonBlockingFindings: []
            }
          };
        }
      }
    );

    const updatedRun = JSON.parse(
      await fs.readFile(path.join(runtimePaths.runsDir, `${priorRun.id}.json`), "utf8")
    );
    const events = JSON.parse(
      `[${(await fs.readFile(runtimePaths.eventsFilePath, "utf8")).trim().replace(/\n/g, ",")}]`
    );

    assert.equal(result.status, "merged");
    assert.equal(shapeCalls, 0);
    assert.equal(executeCalls, 1);
    assert.equal(critiqueCalls, 1);
    assert.equal(executionContexts.length, 1);
    assert.match(
      executionContexts[0].reviewFeedback.requestedChanges[0].body,
      /Stop work immediately after lease loss\./
    );
    assert.equal(executionContexts[0].branchSync.status, "conflicted");
    assert.deepEqual(executionContexts[0].branchSync.conflictedFiles, [
      "scripts/lib/issue-driven-os-github-runtime.js"
    ]);
    assert.equal(pushCalls.length, 1);
    assert.equal(pushCalls[0].forceWithLease, true);
    assert.equal(reviews[0].event, "COMMENT");
    assert.ok(comments.some((body) => /resumed this issue/i.test(body)));
    assert.ok(
      comments.some(
        (body) =>
          /Execution Summary: agents=worker;/.test(body) &&
          /verification=resume-from-execution/.test(body)
      )
    );
    assert.ok(
      issueEdits.some(
        (edit) => Array.isArray(edit.removeLabels) && edit.removeLabels.includes("agent:review")
      )
    );
    assert.equal(updatedRun.id, priorRun.id);
    assert.equal(updatedRun.commitSha, "reviewloop456");
    assert.equal(updatedRun.lastCompletedPhase, "reconciled");
    assert.ok(
      events.some(
        (event) => event.event === "run_resumed" && event.data?.resumePhase === "execution"
      )
    );
    assert.ok(events.some((event) => event.event === "execution_started"));
    assert.ok(
      events.some(
        (event) =>
          event.event === "branch_refresh_conflicted" &&
          event.data?.conflictedFiles?.includes("scripts/lib/issue-driven-os-github-runtime.js")
      )
    );
    assert.ok(!events.some((event) => event.event === "execution_resumed"));
    assert.ok(!events.some((event) => event.event === "critic_resumed"));
    assert.ok(findPrCalls >= 1);
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("runGitHubIssueWorker resumes failed review-projected runs as rework using persisted loop budget", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-failed-rework-"));
  const executionContexts = [];
  let executeCalls = 0;
  let critiqueCalls = 0;

  const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });
  const priorRun = buildRunRecord(24, {
    id: "run_issue_24_20260330T000000Z",
    repoSlug: "owner/repo",
    status: "failed",
    startedAt: "2026-03-30T00:00:00.000Z",
    updatedAt: "2026-03-30T00:30:00.000Z",
    finishedAt: "2026-03-30T00:30:00.000Z",
    branchRef: "agent/issue-24",
    worktreePath: "/tmp/fake-failed-rework-worktree",
    commitSha: "failedreview123",
    prNumber: 94,
    prUrl: "https://example.test/pull/94",
    lastCompletedPhase: "review_projected",
    summary: "Worker lost the lease after critic requested more changes.",
    artifacts: [],
    reviewLoopCount: 1,
    reviewLoopsMax: 5,
    terminationReason: "lease_lost"
  });

  await persistRunRecord(runtimePaths, priorRun);
  await persistArtifact(runtimePaths, priorRun.id, "shaping", {
    route: "execute",
    summary: "Shaped and ready.",
    acceptanceCriteria: ["failed rework resumes from execution"],
    nonGoals: [],
    splitIssues: []
  });
  await persistArtifact(runtimePaths, priorRun.id, "execution", {
    status: "implemented",
    summary: "Initial implementation exists.",
    changeSummary: "Added early auto-loop support.",
    verificationSummary: "Existing tests passed.",
    commitMessage: "feat(issue-os): initial review loop support",
    prTitle: "Initial review loop support",
    prBody: "Initial pass before rework.",
    blockers: []
  });
  await persistArtifact(runtimePaths, priorRun.id, "critic", {
    verdict: "needs_changes",
    verificationVerdict: "verified-fail",
    summary: "The failed run still needs another execution pass.",
    blockingFindings: ["Resume from execution using the prior critic feedback."],
    nonBlockingFindings: []
  });
  await recordRunUpdate(runtimePaths, "owner/repo", priorRun);

  const github = {
    ensureLabels: async () => {},
    viewIssue: async () => ({
      number: 24,
      title: "Resume failed review-projected rework",
      body: "A failed run should still resume from execution after needs_changes.",
      labels: ["agent:review"],
      comments: [],
      state: "OPEN",
      url: "https://example.test/issues/24"
    }),
    editIssue: async () => {},
    commentIssue: async () => {},
    createIssue: async () => {
      throw new Error("unexpected child issue creation");
    },
    findPullRequestForBranch: async (_repoSlug, _branchName, options = {}) => {
      if (options.state === "open") {
        return {
          number: 94,
          url: "https://example.test/pull/94",
          state: "OPEN",
          mergeStateStatus: "CLEAN"
        };
      }

      return {
        number: 94,
        url: "https://example.test/pull/94",
        state: "MERGED",
        mergeStateStatus: "MERGED"
      };
    },
    editPullRequest: async () => {},
    listPullRequestReviews: async () => [],
    listPullRequestReviewComments: async () => [],
    createPullRequest: async () => {
      throw new Error("unexpected pull request creation");
    },
    submitPullRequestReview: async () => {},
    enableAutoMerge: async () => {},
    closeIssue: async () => {}
  };

  try {
    const result = await runGitHubIssueWorker(
      path.resolve(__dirname, "..", ".."),
      "owner/repo",
      process.cwd(),
      24,
      {
        runtimeRoot: tempRoot,
        github,
        createIssueWorktree: async () => ({
          branchName: "agent/issue-24",
          baseBranch: "main",
          worktreePath: "/tmp/fake-failed-rework-worktree",
          reused: true
        }),
        refreshIssueBranch: async () => ({
          status: "merged",
          baseBranch: "main",
          baseRef: "origin/main",
          conflictedFiles: []
        }),
        commitAllChanges: async () => ({
          changed: true,
          commitSha: "failedreview456"
        }),
        pushBranch: async () => {},
        cleanupIssueWorktree: async () => {},
        shapeGitHubIssue: async () => {
          throw new Error("shaping should not rerun");
        },
        executeGitHubIssue: async (_repoRoot, _cwd, context) => {
          executeCalls += 1;
          executionContexts.push(context);
          return {
            payload: {
              status: "implemented",
              summary: "Failed review-projected run resumed from execution.",
              changeSummary: "Used persisted critic feedback after failure.",
              verificationSummary: "Resume path regression test added.",
              commitMessage: "fix(issue-os): resume failed rework from execution",
              prTitle: "Resume failed review-projected rework",
              prBody: "Failed rework resumes correctly.",
              blockers: []
            }
          };
        },
        critiqueGitHubIssue: async () => {
          critiqueCalls += 1;
          return {
            payload: {
              verdict: "ready",
              verificationVerdict: "verified-pass",
              summary: "Failed rework resume is ready.",
              blockingFindings: [],
              nonBlockingFindings: []
            }
          };
        }
      }
    );

    const updatedRun = JSON.parse(
      await fs.readFile(path.join(runtimePaths.runsDir, `${priorRun.id}.json`), "utf8")
    );

    assert.equal(result.status, "merged");
    assert.equal(executeCalls, 1);
    assert.equal(critiqueCalls, 1);
    assert.equal(updatedRun.reviewLoopCount, 1);
    assert.equal(updatedRun.reviewLoopsMax, 5);
    assert.equal(updatedRun.terminationReason, null);
    assert.match(
      executionContexts[0].reviewFeedback.requestedChanges[0].body,
      /Resume from execution using the prior critic feedback\./
    );
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});

test("runGitHubIssueWorker renews its lease during long execution loops", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-os-runtime-lease-renew-"));
  const runtimePaths = buildRuntimePaths("owner/repo", { runtimeRoot: tempRoot });

  const github = {
    ensureLabels: async () => {},
    viewIssue: async () => ({
      number: 25,
      title: "Renew lease during long execution",
      body: "The worker should keep its lease alive while a long execution is running.",
      labels: ["agent:ready"],
      comments: [],
      state: "OPEN",
      url: "https://example.test/issues/25"
    }),
    editIssue: async () => {},
    commentIssue: async () => {},
    createIssue: async () => {
      throw new Error("unexpected child issue creation");
    },
    findPullRequestForBranch: async (_repoSlug, _branchName, options = {}) => {
      if (options.state === "open") {
        return null;
      }

      return {
        number: 95,
        url: "https://example.test/pull/95",
        state: "MERGED",
        mergeStateStatus: "MERGED"
      };
    },
    editPullRequest: async () => {},
    listPullRequestReviews: async () => [],
    listPullRequestReviewComments: async () => [],
    createPullRequest: async () => ({
      number: 95,
      url: "https://example.test/pull/95"
    }),
    submitPullRequestReview: async () => {},
    enableAutoMerge: async () => {},
    closeIssue: async () => {}
  };

  try {
    const result = await runGitHubIssueWorker(
      path.resolve(__dirname, "..", ".."),
      "owner/repo",
      process.cwd(),
      25,
      {
        runtimeRoot: tempRoot,
        leaseTtlMs: 80,
        leaseRenewIntervalMs: 20,
        github,
        createIssueWorktree: async () => ({
          branchName: "agent/issue-25",
          baseBranch: "main",
          worktreePath: "/tmp/fake-lease-renew-worktree",
          reused: false
        }),
        refreshIssueBranch: async () => ({
          status: "merged",
          baseBranch: "main",
          baseRef: "origin/main",
          conflictedFiles: []
        }),
        commitAllChanges: async () => ({
          changed: true,
          commitSha: "leaserenew123"
        }),
        pushBranch: async () => {},
        cleanupIssueWorktree: async () => {},
        shapeGitHubIssue: async () => ({
          payload: {
            route: "execute",
            summary: "Ready for execution.",
            acceptanceCriteria: ["lease stays valid during long execution"],
            nonGoals: [],
            splitIssues: []
          }
        }),
        executeGitHubIssue: async () => {
          await new Promise((resolve) => setTimeout(resolve, 160));
          const liveLease = await readLease(runtimePaths, 25);
          const competingLease = await acquireIssueLease(
            runtimePaths,
            25,
            {
              holderId: "run-rival",
              holderType: "worker"
            },
            {
              ttlMs: 80
            }
          );

          assert.ok(liveLease);
          assert.match(liveLease.holderId, /^run_issue_25_/);
          assert.ok(Date.parse(liveLease.expiresAt) > Date.now());
          assert.equal(competingLease.acquired, false);

          return {
            payload: {
              status: "implemented",
              summary: "Long execution completed with a renewed lease.",
              changeSummary: "Worker heartbeats lease ownership during execution.",
              verificationSummary: "Lease remained valid after a long-running execution step.",
              commitMessage: "fix(issue-os): renew lease during execution",
              prTitle: "Renew worker lease during long execution",
              prBody: "Keeps the lease alive while the worker is still running.",
              blockers: []
            }
          };
        },
        critiqueGitHubIssue: async () => ({
          payload: {
            verdict: "ready",
            verificationVerdict: "verified-pass",
            summary: "Lease renewal kept the worker safely alive.",
            blockingFindings: [],
            nonBlockingFindings: []
          }
        })
      }
    );

    assert.equal(result.status, "merged");
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
