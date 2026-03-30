const {
  critiqueGitHubIssue,
  executeGitHubIssue,
  normalizeIssueInput,
  shapeGitHubIssue
} = require("./issue-driven-os-codex-runner");
const { buildGhAdapter } = require("./issue-driven-os-github-adapter");
const {
  DEFAULT_LEASE_TTL_MS,
  acquireIssueLease,
  buildRunRecord,
  buildRuntimePaths,
  ensureRuntimeLayout,
  persistArtifact,
  persistRunRecord,
  recordRunUpdate,
  releaseIssueLease,
  renewIssueLease
} = require("./issue-driven-os-state-store");
const {
  cleanupIssueWorktree,
  commitAllChanges,
  createIssueWorktree,
  pushBranch
} = require("./issue-driven-os-workspace");

function labelSet(issue) {
  return new Set(issue?.labels ?? []);
}

function normalizeStateName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function buildRuntimeDeps(options = {}) {
  return {
    github: options.github ?? buildGhAdapter(),
    codex: {
      normalizeIssueInput: options.normalizeIssueInput ?? normalizeIssueInput,
      shapeGitHubIssue: options.shapeGitHubIssue ?? shapeGitHubIssue,
      executeGitHubIssue: options.executeGitHubIssue ?? executeGitHubIssue,
      critiqueGitHubIssue: options.critiqueGitHubIssue ?? critiqueGitHubIssue
    },
    workspace: {
      createIssueWorktree: options.createIssueWorktree ?? createIssueWorktree,
      commitAllChanges: options.commitAllChanges ?? commitAllChanges,
      pushBranch: options.pushBranch ?? pushBranch,
      cleanupIssueWorktree: options.cleanupIssueWorktree ?? cleanupIssueWorktree
    }
  };
}

function buildRunSummary(status, summary, extra = {}) {
  return {
    status,
    summary,
    ...extra
  };
}

function snapshotLeaseForRun(lease) {
  if (!lease || typeof lease !== "object") {
    return null;
  }

  const snapshot = { ...lease };
  delete snapshot.leasePath;
  return snapshot;
}

function resolveLeaseHeartbeatMs(options = {}) {
  if (options.leaseHeartbeatMs !== undefined) {
    const heartbeatMs = Number(options.leaseHeartbeatMs);
    return Number.isFinite(heartbeatMs) && heartbeatMs > 0 ? heartbeatMs : null;
  }

  const ttlMs = Number(options.leaseTtlMs ?? DEFAULT_LEASE_TTL_MS);
  return Number.isFinite(ttlMs) && ttlMs > 0 ? Math.max(1, Math.floor(ttlMs / 2)) : null;
}

function buildLeaseCollisionSummary(lease) {
  if (!lease) {
    return "Issue is already claimed by another active worker.";
  }

  return [
    "Issue is already claimed by an active lease.",
    lease.holderId ? `Holder: ${lease.holderId}` : null,
    lease.holderType ? `Type: ${lease.holderType}` : null,
    lease.runId ? `Run: ${lease.runId}` : null,
    lease.expiresAt ? `Expires: ${lease.expiresAt}` : null
  ]
    .filter(Boolean)
    .join(" ");
}

function buildLeaseRecoveryNote(lease) {
  if (!lease?.lastOutcome || !lease?.previousLease) {
    return null;
  }

  if (lease.lastOutcome !== "expired_recovered" && lease.lastOutcome !== "force_recovered") {
    return null;
  }

  return [
    lease.lastOutcome === "force_recovered" ? "Force-recovered lease." : "Recovered expired lease.",
    lease.previousLease.holderId ? `Previous holder: ${lease.previousLease.holderId}.` : null,
    lease.previousLease.runId ? `Previous run: ${lease.previousLease.runId}.` : null,
    lease.previousLease.leaseStatus ? `Previous state: ${lease.previousLease.leaseStatus}.` : null
  ]
    .filter(Boolean)
    .join(" ");
}

function startLeaseHeartbeat(runtimePaths, issueNumber, runRecord, options = {}) {
  const ttlMs = Number(options.leaseTtlMs ?? DEFAULT_LEASE_TTL_MS);
  const heartbeatMs = resolveLeaseHeartbeatMs(options);

  if (!Number.isFinite(ttlMs) || ttlMs <= 0 || !Number.isFinite(heartbeatMs) || heartbeatMs <= 0) {
    return {
      stop: async () => {}
    };
  }

  let stopped = false;
  let inFlight = Promise.resolve();
  let failureNote = null;

  const recordFailure = (message) => {
    if (failureNote) {
      return;
    }

    failureNote = message;
    runRecord.notes.push(message);
  };

  const renewLease = async () => {
    const renewal = await renewIssueLease(runtimePaths, issueNumber, runRecord.id, {
      ttlMs
    });

    if (renewal.lease) {
      runRecord.lease = snapshotLeaseForRun(renewal.lease);
    }

    if (!renewal.renewed) {
      recordFailure(`Lease renewal stopped for issue #${issueNumber}: ${renewal.reason}.`);
    }
  };

  const timer = setInterval(() => {
    if (stopped) {
      return;
    }

    inFlight = renewLease().catch((error) => {
      recordFailure(`Lease renewal failed for issue #${issueNumber}: ${error.message}`);
    });
  }, heartbeatMs);

  if (typeof timer.unref === "function") {
    timer.unref();
  }

  return {
    stop: async () => {
      stopped = true;
      clearInterval(timer);
      await inFlight;
    }
  };
}

function isConsumerCandidate(issue) {
  const labels = labelSet(issue);
  return labels.has("agent:ready") || labels.has("agent:review");
}

function buildIssueStartComment(runRecord) {
  return [
    `Agent worker claimed this issue.`,
    `Run id: ${runRecord.id}`,
    runRecord.branchRef ? `Branch: ${runRecord.branchRef}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSplitComment(shaping) {
  const lines = [
    "The issue was not executed directly because shaping decided it should split first.",
    "",
    shaping.summary,
    ""
  ];

  if ((shaping.splitIssues ?? []).length > 0) {
    lines.push("Child issues created:");
    for (const item of shaping.splitIssues) {
      lines.push(`- ${item.title}`);
    }
  }

  return lines.join("\n");
}

function buildBlockedComment(summary, blockers = []) {
  const lines = ["The agent run stopped without completing the issue.", "", summary];
  if (blockers.length > 0) {
    lines.push("", "Blockers:");
    for (const blocker of blockers) {
      lines.push(`- ${blocker}`);
    }
  }
  return lines.join("\n");
}

function buildPullRequestBody(issue, execution, critic) {
  const sections = [
    execution.prBody?.trim() || execution.summary?.trim() || "",
    "",
    `Closes #${issue.number}`,
    "",
    "## Agent Summary",
    execution.changeSummary?.trim() || execution.summary?.trim() || "",
    "",
    "## Verification",
    execution.verificationSummary?.trim() || critic.summary?.trim() || ""
  ];

  return sections.filter(Boolean).join("\n");
}

function buildCriticComment(critic) {
  const lines = [critic.summary, ""];

  if ((critic.blockingFindings ?? []).length > 0) {
    lines.push("Blocking findings:");
    for (const item of critic.blockingFindings) {
      lines.push(`- ${item}`);
    }
  }

  if ((critic.nonBlockingFindings ?? []).length > 0) {
    lines.push("", "Non-blocking notes:");
    for (const item of critic.nonBlockingFindings) {
      lines.push(`- ${item}`);
    }
  }

  lines.push("", `Verification verdict: ${critic.verificationVerdict}`);
  return lines.join("\n");
}

function buildReadyComment(prUrl, critic) {
  return [
    "Execution and critique passed.",
    prUrl ? `PR: ${prUrl}` : null,
    `Verification verdict: ${critic.verificationVerdict}`,
    critic.summary
  ]
    .filter(Boolean)
    .join("\n");
}

function extractReviewFeedback(reviews, reviewComments) {
  const requestedChanges = (reviews ?? []).filter(
    (review) => normalizeStateName(review.state) === "changes_requested"
  );

  return {
    requestedChanges: requestedChanges.map((review) => ({
      author: review.user?.login ?? null,
      body: review.body ?? "",
      submittedAt: review.submitted_at ?? null
    })),
    inlineComments: (reviewComments ?? []).map((comment) => ({
      author: comment.user?.login ?? null,
      body: comment.body ?? "",
      path: comment.path ?? null,
      line: comment.line ?? null
    }))
  };
}

async function produceGitHubIssue(repoRoot, repoSlug, repoPath, rawInput, options = {}) {
  const deps = buildRuntimeDeps(options);
  await deps.github.ensureLabels(repoSlug);

  const normalized = await deps.codex.normalizeIssueInput(repoRoot, repoPath, rawInput, {
    repoSlug,
    source: options.source ?? "cli"
  });

  const labels = [...new Set([...(normalized.payload.labels ?? []), "agent:ready"])];
  const created = await deps.github.createIssue(
    repoSlug,
    {
      title: normalized.payload.title,
      body: normalized.payload.body,
      labels
    },
    options.commandOptions
  );

  return {
    issueNumber: created.number,
    issueUrl: created.url,
    normalized: normalized.payload
  };
}

async function createSplitIssues(repoSlug, shaping, github) {
  const created = [];
  for (const child of shaping.splitIssues ?? []) {
    created.push(
      await github.createIssue(repoSlug, {
        title: child.title,
        body: child.body,
        labels: [...new Set([...(child.labels ?? []), "agent:ready"])]
      })
    );
  }
  return created;
}

async function reconcileIssue(repoSlug, issueNumber, options = {}) {
  const deps = buildRuntimeDeps(options);
  const branchName = options.branchName ?? `agent/issue-${issueNumber}`;
  const pr = await deps.github.findPullRequestForBranch(repoSlug, branchName, {
    state: "all",
    commandOptions: options.commandOptions
  });

  if (!pr) {
    return buildRunSummary("noop", "No pull request exists for this issue branch.");
  }

  const merged =
    normalizeStateName(pr.state) === "merged" ||
    normalizeStateName(pr.mergeStateStatus) === "merged";

  if (!merged) {
    return buildRunSummary("pending", "Pull request still open or waiting for merge.", {
      pullRequest: pr
    });
  }

  await deps.github.editIssue(repoSlug, issueNumber, {
    addLabels: ["agent:done"],
    removeLabels: ["agent:claimed", "agent:ready", "agent:review", "agent:blocked"],
    commandOptions: options.commandOptions
  });
  await deps.github.closeIssue(repoSlug, issueNumber, {
    commandOptions: options.commandOptions
  });

  return buildRunSummary("closed", "Issue closed after merge.", {
    pullRequest: pr
  });
}

async function runGitHubIssueWorker(repoRoot, repoSlug, repoPath, issueNumber, options = {}) {
  const deps = buildRuntimeDeps(options);
  const runtimePaths = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
  await ensureRuntimeLayout(runtimePaths);
  await deps.github.ensureLabels(repoSlug);
  let stopLeaseHeartbeat = async () => {};

  const runRecord = buildRunRecord(issueNumber, {
    repoSlug,
    status: "claimed"
  });

  const lease = await acquireIssueLease(
    runtimePaths,
    issueNumber,
    {
      holderId: runRecord.id,
      holderType: options.holderType ?? "worker",
      runId: runRecord.id
    },
    {
      ttlMs: options.leaseTtlMs,
      forceRecover: options.forceRecoverLease === true
    }
  );

  if (!lease.acquired) {
    return buildRunSummary("skipped", buildLeaseCollisionSummary(lease.lease), {
      runId: runRecord.id,
      lease: lease.lease,
      leaseAction: lease.action
    });
  }

  runRecord.lease = snapshotLeaseForRun(lease.lease);
  const leaseRecoveryNote = buildLeaseRecoveryNote(runRecord.lease);
  if (leaseRecoveryNote) {
    runRecord.notes.push(leaseRecoveryNote);
  }
  stopLeaseHeartbeat = startLeaseHeartbeat(runtimePaths, issueNumber, runRecord, options).stop;

  try {
    const issue = await deps.github.viewIssue(repoSlug, issueNumber, options);
    if (normalizeStateName(issue.state) !== "open") {
      return buildRunSummary("skipped", "Issue is not open anymore.", {
        runId: runRecord.id
      });
    }

    runRecord.summary = `Claimed issue #${issueNumber}`;
    await deps.github.editIssue(repoSlug, issueNumber, {
      addLabels: ["agent:claimed"],
      removeLabels: ["agent:ready", "agent:blocked"],
      commandOptions: options.commandOptions
    });
    await deps.github.commentIssue(
      repoSlug,
      issueNumber,
      buildIssueStartComment(runRecord),
      options
    );

    const shaping = await deps.codex.shapeGitHubIssue(repoRoot, repoPath, {
      issue,
      recentComments: issue.comments.slice(-10)
    });
    const shapingArtifactPath = await persistArtifact(
      runtimePaths,
      runRecord.id,
      "shaping",
      shaping.payload
    );

    if (shaping.payload.route === "split") {
      const childIssues = await createSplitIssues(repoSlug, shaping.payload, deps.github);
      runRecord.status = "split";
      runRecord.finishedAt = new Date().toISOString();
      runRecord.updatedAt = runRecord.finishedAt;
      runRecord.summary = shaping.payload.summary;
      runRecord.artifacts.push({ kind: "shaping", path: shapingArtifactPath });
      runRecord.notes.push(`Created ${childIssues.length} child issues.`);
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels: ["agent:split"],
        removeLabels: ["agent:claimed", "agent:ready"],
        commandOptions: options.commandOptions
      });
      await deps.github.commentIssue(
        repoSlug,
        issueNumber,
        buildSplitComment(shaping.payload),
        options
      );
      await persistRunRecord(runtimePaths, runRecord);
      await recordRunUpdate(runtimePaths, repoSlug, runRecord);
      return buildRunSummary("split", shaping.payload.summary, {
        runId: runRecord.id,
        childIssues
      });
    }

    if (shaping.payload.route !== "execute") {
      runRecord.status = "blocked";
      runRecord.finishedAt = new Date().toISOString();
      runRecord.updatedAt = runRecord.finishedAt;
      runRecord.summary = shaping.payload.summary;
      runRecord.artifacts.push({ kind: "shaping", path: shapingArtifactPath });
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels: ["agent:blocked"],
        removeLabels: ["agent:claimed", "agent:ready"],
        commandOptions: options.commandOptions
      });
      await deps.github.commentIssue(
        repoSlug,
        issueNumber,
        buildBlockedComment(shaping.payload.summary),
        options
      );
      await persistRunRecord(runtimePaths, runRecord);
      await recordRunUpdate(runtimePaths, repoSlug, runRecord);
      return buildRunSummary("blocked", shaping.payload.summary, {
        runId: runRecord.id
      });
    }

    const workspace = await deps.workspace.createIssueWorktree(
      repoPath,
      runtimePaths,
      issueNumber,
      {
        branchName: options.branchName
      }
    );

    runRecord.branchRef = workspace.branchName;
    runRecord.worktreePath = workspace.worktreePath;
    runRecord.updatedAt = new Date().toISOString();

    const existingPullRequest = await deps.github.findPullRequestForBranch(
      repoSlug,
      workspace.branchName,
      {
        state: "open",
        commandOptions: options.commandOptions
      }
    );
    const reviewFeedback = existingPullRequest
      ? extractReviewFeedback(
          await deps.github.listPullRequestReviews(repoSlug, existingPullRequest.number, options),
          await deps.github.listPullRequestReviewComments(
            repoSlug,
            existingPullRequest.number,
            options
          )
        )
      : { requestedChanges: [], inlineComments: [] };

    const execution = await deps.codex.executeGitHubIssue(repoRoot, workspace.worktreePath, {
      issue,
      shaping: shaping.payload,
      reviewFeedback,
      branchRef: workspace.branchName
    });
    const executionArtifactPath = await persistArtifact(
      runtimePaths,
      runRecord.id,
      "execution",
      execution.payload
    );

    if (execution.payload.status === "blocked" || execution.payload.status === "split_required") {
      runRecord.status = "blocked";
      runRecord.finishedAt = new Date().toISOString();
      runRecord.updatedAt = runRecord.finishedAt;
      runRecord.summary = execution.payload.summary;
      runRecord.artifacts.push(
        { kind: "shaping", path: shapingArtifactPath },
        { kind: "execution", path: executionArtifactPath }
      );
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels: ["agent:blocked"],
        removeLabels: ["agent:claimed", "agent:ready"],
        commandOptions: options.commandOptions
      });
      await deps.github.commentIssue(
        repoSlug,
        issueNumber,
        buildBlockedComment(execution.payload.summary, execution.payload.blockers),
        options
      );
      await persistRunRecord(runtimePaths, runRecord);
      await recordRunUpdate(runtimePaths, repoSlug, runRecord);
      return buildRunSummary("blocked", execution.payload.summary, {
        runId: runRecord.id
      });
    }

    const commitResult = await deps.workspace.commitAllChanges(
      workspace.worktreePath,
      execution.payload.commitMessage || `fix(issue): address #${issueNumber}`
    );

    if (!commitResult.changed || execution.payload.status === "no_changes") {
      runRecord.status = "blocked";
      runRecord.finishedAt = new Date().toISOString();
      runRecord.updatedAt = runRecord.finishedAt;
      runRecord.summary = execution.payload.summary || "No code changes were produced.";
      runRecord.artifacts.push(
        { kind: "shaping", path: shapingArtifactPath },
        { kind: "execution", path: executionArtifactPath }
      );
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels: ["agent:blocked"],
        removeLabels: ["agent:claimed", "agent:ready"],
        commandOptions: options.commandOptions
      });
      await deps.github.commentIssue(
        repoSlug,
        issueNumber,
        buildBlockedComment(runRecord.summary, execution.payload.blockers),
        options
      );
      await persistRunRecord(runtimePaths, runRecord);
      await recordRunUpdate(runtimePaths, repoSlug, runRecord);
      return buildRunSummary("blocked", runRecord.summary, {
        runId: runRecord.id
      });
    }

    await deps.workspace.pushBranch(workspace.worktreePath, workspace.branchName);

    const pullRequest =
      existingPullRequest ??
      (await deps.github.createPullRequest(repoSlug, {
        branchName: workspace.branchName,
        baseBranch: workspace.baseBranch,
        title: execution.payload.prTitle || `Fix #${issueNumber}: ${issue.title}`,
        body: buildPullRequestBody(issue, execution.payload, {
          summary: execution.payload.verificationSummary
        }),
        commandOptions: options.commandOptions
      }));

    runRecord.prNumber = pullRequest.number;
    runRecord.prUrl = pullRequest.url;

    const critic = await deps.codex.critiqueGitHubIssue(repoRoot, workspace.worktreePath, {
      issue,
      shaping: shaping.payload,
      execution: execution.payload,
      reviewFeedback,
      pullRequest
    });
    const criticArtifactPath = await persistArtifact(
      runtimePaths,
      runRecord.id,
      "critic",
      critic.payload
    );

    runRecord.artifacts.push(
      { kind: "shaping", path: shapingArtifactPath },
      { kind: "execution", path: executionArtifactPath },
      { kind: "critic", path: criticArtifactPath }
    );

    if (critic.payload.verdict !== "ready") {
      runRecord.status = critic.payload.verdict === "needs_changes" ? "needs_changes" : "blocked";
      runRecord.finishedAt = new Date().toISOString();
      runRecord.updatedAt = runRecord.finishedAt;
      runRecord.summary = critic.payload.summary;
      await deps.github.commentPullRequest(
        repoSlug,
        pullRequest.number,
        buildCriticComment(critic.payload),
        options
      );
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels: ["agent:review"],
        removeLabels: ["agent:claimed", "agent:ready"],
        commandOptions: options.commandOptions
      });
      await persistRunRecord(runtimePaths, runRecord);
      await recordRunUpdate(runtimePaths, repoSlug, runRecord);
      return buildRunSummary(runRecord.status, critic.payload.summary, {
        runId: runRecord.id,
        pullRequest
      });
    }

    await deps.github.commentPullRequest(
      repoSlug,
      pullRequest.number,
      buildReadyComment(pullRequest.url, critic.payload),
      options
    );
    await deps.github.editIssue(repoSlug, issueNumber, {
      addLabels: ["agent:review"],
      removeLabels: ["agent:claimed", "agent:ready", "agent:blocked"],
      commandOptions: options.commandOptions
    });
    await deps.github.enableAutoMerge(repoSlug, pullRequest.number, {
      matchHeadCommit: commitResult.commitSha,
      commandOptions: options.commandOptions
    });

    const reconcile = await reconcileIssue(repoSlug, issueNumber, {
      ...options,
      branchName: workspace.branchName
    });

    runRecord.status = reconcile.status === "closed" ? "merged" : "awaiting_merge";
    runRecord.mergeStatus = reconcile.status;
    runRecord.finishedAt = new Date().toISOString();
    runRecord.updatedAt = runRecord.finishedAt;
    runRecord.summary =
      reconcile.status === "closed"
        ? "Issue merged and closed."
        : "Pull request opened and auto-merge enabled.";

    await persistRunRecord(runtimePaths, runRecord);
    await recordRunUpdate(runtimePaths, repoSlug, runRecord);

    if (runRecord.status === "merged") {
      await deps.workspace.cleanupIssueWorktree(repoPath, workspace.worktreePath, {
        branchName: workspace.branchName,
        deleteBranch: true
      });
    }

    return buildRunSummary(runRecord.status, runRecord.summary, {
      runId: runRecord.id,
      pullRequest
    });
  } catch (error) {
    const runtimePathsLocal = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
    const failedRecord = buildRunRecord(issueNumber, {
      id: runRecord.id,
      repoSlug,
      status: "failed",
      startedAt: runRecord.startedAt,
      updatedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      branchRef: runRecord.branchRef,
      worktreePath: runRecord.worktreePath,
      summary: error.message,
      lease: runRecord.lease
    });

    await persistRunRecord(runtimePathsLocal, failedRecord);
    await recordRunUpdate(runtimePathsLocal, repoSlug, failedRecord);

    try {
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels: ["agent:blocked"],
        removeLabels: ["agent:claimed"],
        commandOptions: options.commandOptions
      });
      await deps.github.commentIssue(
        repoSlug,
        issueNumber,
        buildBlockedComment(error.message),
        options
      );
    } catch {
      // Keep the original failure if writeback also fails.
    }

    return buildRunSummary("failed", error.message, {
      runId: runRecord.id
    });
  } finally {
    const runtimePathsLocal = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
    await stopLeaseHeartbeat();
    if (runRecord.status !== "claimed" && runRecord.finishedAt) {
      await persistRunRecord(runtimePathsLocal, runRecord);
      await recordRunUpdate(runtimePathsLocal, repoSlug, runRecord);
    }
    await releaseIssueLease(runtimePathsLocal, issueNumber, runRecord.id);
  }
}

function consumeBatch(items, limit, handler) {
  const queue = [...items];
  const results = [];

  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      results.push(await handler(item));
    }
  }

  return Promise.all(Array.from({ length: Math.max(1, limit) }, () => worker())).then(
    () => results
  );
}

async function runGitHubDaemon(repoRoot, repoSlug, repoPath, options = {}) {
  const deps = buildRuntimeDeps(options);
  await deps.github.ensureLabels(repoSlug);

  const intervalMs = (options.pollSeconds ?? 60) * 1000;
  const concurrency = Math.max(1, Number(options.concurrency ?? 4));
  const runPass = async () => {
    const issues = await deps.github.listIssues(repoSlug, {
      limit: options.limit ?? 100,
      commandOptions: options.commandOptions
    });
    const candidates = issues.filter(isConsumerCandidate);

    const results = await consumeBatch(
      candidates.slice(0, options.limit ?? candidates.length),
      concurrency,
      (issue) => runGitHubIssueWorker(repoRoot, repoSlug, repoPath, issue.number, options)
    );

    return {
      checked: issues.length,
      consumed: candidates.length,
      results
    };
  };

  if (options.once) {
    return runPass();
  }

  const passes = [];
  while (true) {
    passes.push(await runPass());
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

module.exports = {
  buildRuntimeDeps,
  isConsumerCandidate,
  produceGitHubIssue,
  reconcileIssue,
  runGitHubDaemon,
  runGitHubIssueWorker
};
