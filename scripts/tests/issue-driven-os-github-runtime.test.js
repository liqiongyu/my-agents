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
  runGitHubIssueWorker
} = require("../lib/issue-driven-os-github-runtime");
const {
  buildRunRecord,
  buildRuntimePaths,
  persistArtifact,
  persistRunRecord,
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
    assert.equal(runFiles.length, 1);
    assert.match(comments[0], /claimed this issue/);
    assert.match(comments[0], /Agent type: worker/);
    assert.match(comments[0], /Execution Summary: agents=worker;/);
    assert.match(pullRequests[0].body, /Agent type: issue-cell-executor/);
    assert.match(pullRequests[0].body, /Execution Summary: agents=issue-cell-executor;/);
    assert.match(reviews[0].body, /Agent type: issue-cell-critic/);
    assert.match(reviews[0].body, /Execution Summary: agents=issue-cell-critic;/);
    assert.equal(reviews[0].event, "COMMENT");
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
