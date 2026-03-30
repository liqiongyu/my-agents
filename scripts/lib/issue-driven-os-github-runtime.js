const {
  orchestrateGitHubIssue,
  critiqueGitHubIssue,
  executeGitHubIssue,
  normalizeIssueInput,
  shapeGitHubIssue
} = require("./issue-driven-os-codex-runner");
const { buildGhAdapter } = require("./issue-driven-os-github-adapter");
const {
  acquireIssueLease,
  appendRuntimeEvent,
  buildRunRecord,
  buildRuntimePaths,
  ensureRuntimeLayout,
  forceReleaseIssueLease,
  listRunArtifacts,
  persistArtifact,
  persistRunRecord,
  readLease,
  readRunRecord,
  readRuntimeState,
  recordRunUpdate,
  releaseIssueLease
} = require("./issue-driven-os-state-store");
const {
  cleanupIssueWorktree,
  commitAllChanges,
  createIssueWorktree,
  getHeadCommitSha,
  getWorkingTreeStatus,
  refreshIssueBranch,
  pushBranch
} = require("./issue-driven-os-workspace");
const { readJson } = require("./fs-utils");
const {
  compareScheduledIssues,
  getIssuePriorityRank,
  isClaimedIssue,
  isConsumerCandidate,
  normalizeStateName,
  parseIssueDependencies,
  planConsumableIssues
} = require("../../runtime/services/issue-queue-service");
const {
  buildLeaseCollisionSummary,
  buildLeaseRecoveryNote,
  buildRecoveredLeaseSnapshot,
  buildReviewLoopBudgetExceededSummary,
  createLeaseSupervisor,
  normalizeNonNegativeInteger,
  resolveReviewLoopsMax,
  snapshotLeaseForRun
} = require("../../runtime/services/issue-lease-service");

const DEFAULT_ORCHESTRATION_STEP_LIMIT = 16;
const ORCHESTRATOR_SUPPORTED_WORKER_KINDS = new Set([
  "issue-shaper",
  "issue-cell-executor",
  "issue-cell-critic"
]);
const GITHUB_VERIFICATION_STATUS_CONTEXT = "issue-driven-os/verification";
const GITHUB_STATUS_DESCRIPTION_MAX_LENGTH = 140;

function buildCompatibilityIssueOrchestrator() {
  return async (_repoRoot, _cwd, orchestrationContext = {}) => {
    const run = orchestrationContext?.run ?? {};
    const shaping = orchestrationContext?.artifacts?.shaping ?? null;
    const execution = orchestrationContext?.artifacts?.execution ?? null;
    const critic = orchestrationContext?.artifacts?.critic ?? null;
    const splitIssues = shaping?.splitIssues ?? [];
    const needsExecutionPostProcessing =
      execution?.status === "implemented" &&
      ![
        "pull_request_prepared",
        "critic",
        "review_projected",
        "merge_enabled",
        "reconciled"
      ].includes(run.lastCompletedPhase ?? "");

    if (!shaping) {
      return {
        payload: {
          action: "spawn_worker",
          summary: "Shape the issue for execution readiness.",
          worker: {
            kind: "issue-shaper",
            task: "Shape this issue and decide whether it should execute, split, clarify, or block.",
            acceptanceFocus: ["Return the next route for this issue."]
          },
          splitIssues: [],
          blockers: [],
          mergeReadiness: "none"
        }
      };
    }

    if (shaping.route === "split") {
      return {
        payload: {
          action: "split_issue",
          summary: shaping.summary,
          worker: null,
          splitIssues,
          blockers: [],
          mergeReadiness: "none"
        }
      };
    }

    if (shaping.route !== "execute") {
      return {
        payload: {
          action: "block_issue",
          summary: shaping.summary,
          worker: null,
          splitIssues: [],
          blockers: [],
          mergeReadiness: "not_ready"
        }
      };
    }

    if (critic?.verdict === "needs_changes") {
      return {
        payload: {
          action: "spawn_worker",
          summary: critic.summary || "Address requested review changes.",
          worker: {
            kind: "issue-cell-executor",
            task: "Address the latest requested changes and update the pull request.",
            acceptanceFocus: critic.blockingFindings ?? []
          },
          splitIssues: [],
          blockers: [],
          mergeReadiness: "not_ready"
        }
      };
    }

    if (!execution) {
      return {
        payload: {
          action: "spawn_worker",
          summary: shaping.summary || "Execute the shaped issue.",
          worker: {
            kind: "issue-cell-executor",
            task: "Implement the shaped issue in the repository.",
            acceptanceFocus: shaping.acceptanceCriteria ?? []
          },
          splitIssues: [],
          blockers: [],
          mergeReadiness: "not_ready"
        }
      };
    }

    if (needsExecutionPostProcessing) {
      return {
        payload: {
          action: "spawn_worker",
          summary: execution.summary || "Resume execution post-processing.",
          worker: {
            kind: "issue-cell-executor",
            task: "Resume execution from the saved artifact and finish commit, push, and pull request preparation.",
            acceptanceFocus: shaping.acceptanceCriteria ?? []
          },
          splitIssues: [],
          blockers: [],
          mergeReadiness: "not_ready"
        }
      };
    }

    if (execution.status === "split_required") {
      return {
        payload: {
          action: "split_issue",
          summary: execution.summary || shaping.summary,
          worker: null,
          splitIssues,
          blockers: execution.blockers ?? [],
          mergeReadiness: "not_ready"
        }
      };
    }

    if (execution.status === "blocked" || execution.status === "no_changes") {
      return {
        payload: {
          action: "block_issue",
          summary: execution.summary || "Execution did not produce mergeable changes.",
          worker: null,
          splitIssues: [],
          blockers: execution.blockers ?? [],
          mergeReadiness: "not_ready"
        }
      };
    }

    if (!critic) {
      return {
        payload: {
          action: "spawn_worker",
          summary: "Review the implementation result and decide whether it is ready.",
          worker: {
            kind: "issue-cell-critic",
            task: "Review the current implementation and produce a merge readiness verdict.",
            acceptanceFocus: shaping.acceptanceCriteria ?? []
          },
          splitIssues: [],
          blockers: [],
          mergeReadiness: "not_ready"
        }
      };
    }

    if (critic.verdict === "ready") {
      return {
        payload: {
          action: "request_merge",
          summary: critic.summary || "Ready to merge.",
          worker: null,
          splitIssues: [],
          blockers: [],
          mergeReadiness: "ready"
        }
      };
    }

    return {
      payload: {
        action: "block_issue",
        summary: critic.summary || "Review blocked the issue.",
        worker: null,
        splitIssues: [],
        blockers: critic.blockingFindings ?? [],
        mergeReadiness: "not_ready"
      }
    };
  };
}

function buildRuntimeDeps(options = {}) {
  const compatibilityOrchestratorNeeded =
    typeof options.orchestrateGitHubIssue !== "function" &&
    [options.shapeGitHubIssue, options.executeGitHubIssue, options.critiqueGitHubIssue].some(
      (candidate) => typeof candidate === "function"
    );

  return {
    github: options.github ?? buildGhAdapter(),
    codex: {
      normalizeIssueInput: options.normalizeIssueInput ?? normalizeIssueInput,
      orchestrateGitHubIssue:
        options.orchestrateGitHubIssue ??
        (compatibilityOrchestratorNeeded
          ? buildCompatibilityIssueOrchestrator()
          : orchestrateGitHubIssue),
      compatibilityOrchestrator: compatibilityOrchestratorNeeded,
      shapeGitHubIssue: options.shapeGitHubIssue ?? shapeGitHubIssue,
      executeGitHubIssue: options.executeGitHubIssue ?? executeGitHubIssue,
      critiqueGitHubIssue: options.critiqueGitHubIssue ?? critiqueGitHubIssue
    },
    workspace: {
      createIssueWorktree: options.createIssueWorktree ?? createIssueWorktree,
      commitAllChanges: options.commitAllChanges ?? commitAllChanges,
      getHeadCommitSha: options.getHeadCommitSha ?? getHeadCommitSha,
      getWorkingTreeStatus: options.getWorkingTreeStatus ?? getWorkingTreeStatus,
      refreshIssueBranch: options.refreshIssueBranch ?? refreshIssueBranch,
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

async function recordRuntimeEvent(runtimePaths, data) {
  try {
    return await appendRuntimeEvent(runtimePaths, data);
  } catch {
    return null;
  }
}

function buildProjectionSignature(metadata = {}) {
  return {
    schemaVersion: 1,
    workflow: "issue-driven-os",
    actor: metadata.actor ?? "worker",
    phase: metadata.phase ?? "runtime",
    channel: metadata.channel ?? null,
    runId: metadata.runId ?? null,
    issueNumber: metadata.issueNumber ?? null,
    pullRequestNumber: metadata.pullRequestNumber ?? null
  };
}

function formatExecutionSummaryField(value, fallback = "none") {
  if (Array.isArray(value)) {
    const normalizedFallback = String(fallback ?? "")
      .trim()
      .toLowerCase();
    const items = value.map((item) => String(item ?? "").trim()).filter(Boolean);
    const filteredItems = items.filter((item) => item.toLowerCase() !== normalizedFallback);
    const effectiveItems = filteredItems.length > 0 ? filteredItems : items;
    const dedupedItems = [...new Set(effectiveItems)];
    return dedupedItems.length > 0 ? dedupedItems.join(", ") : fallback;
  }

  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function buildExecutionSummary(summary = {}) {
  return {
    agents: formatExecutionSummaryField(summary.agents),
    skills: formatExecutionSummaryField(summary.skills),
    tools: formatExecutionSummaryField(summary.tools),
    verification: formatExecutionSummaryField(summary.verification),
    limits: formatExecutionSummaryField(summary.limits)
  };
}

function buildExecutionSummaryLine(summary = {}) {
  const normalized = buildExecutionSummary(summary);
  return `Execution Summary: agents=${normalized.agents}; skills=${normalized.skills}; tools=${normalized.tools}; verification=${normalized.verification}; limits=${normalized.limits}`;
}

function buildContentPreview(body, maxLength = 180) {
  const preview = String(body ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!preview) {
    return "";
  }

  return preview.length <= maxLength ? preview : `${preview.slice(0, maxLength - 3)}...`;
}

function buildProjectionFooter(metadata = {}) {
  const signature = buildProjectionSignature(metadata);
  const executionSummary = buildExecutionSummary(metadata.executionSummary);
  const lines = [
    "---",
    `Agent type: ${signature.actor}`,
    `Phase: ${signature.phase}`,
    signature.runId ? `Run id: ${signature.runId}` : null,
    signature.issueNumber ? `Issue: #${signature.issueNumber}` : null,
    signature.pullRequestNumber ? `Pull request: #${signature.pullRequestNumber}` : null,
    `Workflow: ${signature.workflow}`,
    buildExecutionSummaryLine(executionSummary),
    `<!-- issue-driven-os-summary ${JSON.stringify(executionSummary)} -->`,
    `<!-- issue-driven-os-meta ${JSON.stringify(signature)} -->`
  ];

  return lines.filter(Boolean).join("\n");
}

function annotateProjectionBody(body, metadata = {}) {
  const normalizedBody = String(body ?? "").trim();
  const footer = buildProjectionFooter(metadata);
  return normalizedBody ? `${normalizedBody}\n\n${footer}` : footer;
}

function buildWorkerExecutionSummary(overrides = {}) {
  return {
    agents: "worker",
    skills: "none",
    tools: ["github issue edit", "github issue comment"],
    verification: "none",
    limits: "none",
    ...overrides
  };
}

function buildShaperExecutionSummary(route, overrides = {}) {
  return {
    agents: "issue-shaper",
    skills: ["issue-shaping"],
    tools: ["codex exec", "github issue edit", "github issue comment"],
    verification: "shaping-complete",
    limits: route && route !== "execute" ? `route=${route}` : "none",
    ...overrides
  };
}

function buildExecutorExecutionSummary(execution = {}, overrides = {}) {
  return {
    agents: "issue-cell-executor",
    skills: ["clarify", "execution-briefing", "handoff-bundle-writing"],
    tools: ["codex exec", "git commit", "git push", "github pull request"],
    verification: execution.verificationSummary || execution.summary || "none",
    limits:
      Array.isArray(execution.blockers) && execution.blockers.length > 0
        ? execution.blockers
        : "none",
    ...overrides
  };
}

function buildCriticExecutionSummary(critic = {}, overrides = {}) {
  return {
    agents: "issue-cell-critic",
    skills: ["review", "acceptance-verification"],
    tools: ["codex exec", "github commit status", "github pull request review"],
    verification: critic.verificationVerdict || critic.summary || "none",
    limits:
      Array.isArray(critic.blockingFindings) && critic.blockingFindings.length > 0
        ? critic.blockingFindings
        : "none",
    ...overrides
  };
}

function buildOrchestratorExecutionSummary(decision = {}, overrides = {}) {
  return {
    agents: "issue-orchestrator",
    skills: ["issue-shaping", "execution-briefing", "handoff-bundle-writing"],
    tools: ["codex exec", "github issue edit", "github issue comment"],
    verification: decision.summary || "orchestration-decision",
    limits:
      Array.isArray(decision.blockers) && decision.blockers.length > 0 ? decision.blockers : "none",
    ...overrides
  };
}

function isOwnPullRequestReviewError(error) {
  return /own pull request/i.test(String(error?.message ?? ""));
}

function buildSelfReviewFallbackBody(body, requestedReviewEvent) {
  const normalizedBody = String(body ?? "").trim();
  const note = [
    "GitHub rejected the requested review event because this workflow is using the same GitHub account",
    `for both the PR author and the reviewer (${requestedReviewEvent}).`,
    "The review result is recorded here as a COMMENT review instead."
  ].join(" ");

  return [normalizedBody, "", note].filter(Boolean).join("\n");
}

async function postIssueComment(
  runtimePaths,
  deps,
  repoSlug,
  issueNumber,
  body,
  metadata = {},
  options = {}
) {
  const projection = buildProjectionSignature({
    ...metadata,
    issueNumber,
    channel: "issue_comment"
  });
  const executionSummary = buildExecutionSummary(metadata.executionSummary);
  const annotatedBody = annotateProjectionBody(body, {
    ...projection,
    executionSummary
  });
  await deps.github.commentIssue(repoSlug, issueNumber, annotatedBody, options);
  await recordRuntimeEvent(runtimePaths, {
    repoSlug,
    issueNumber,
    runId: projection.runId,
    actor: projection.actor,
    phase: projection.phase,
    event: "issue_comment_posted",
    message: `Posted issue comment as ${projection.actor}.`,
    data: {
      channel: projection.channel,
      preview: buildContentPreview(body),
      signature: projection,
      executionSummary
    }
  });
}

async function submitPullRequestReview(
  runtimePaths,
  deps,
  repoSlug,
  pullRequest,
  body,
  metadata = {},
  options = {}
) {
  const projection = buildProjectionSignature({
    ...metadata,
    pullRequestNumber: pullRequest.number,
    channel: "pull_request_review"
  });
  const requestedReviewEvent = String(metadata.reviewEvent ?? "COMMENT")
    .trim()
    .toUpperCase();
  let submittedReviewEvent = requestedReviewEvent;
  let projectedBody = body;
  let fallbackReason = null;
  let executionSummary = buildExecutionSummary(metadata.executionSummary);

  async function projectReview(reviewEvent, reviewBody, reviewExecutionSummary = executionSummary) {
    const annotatedBody = annotateProjectionBody(reviewBody, {
      ...projection,
      executionSummary: reviewExecutionSummary
    });
    await deps.github.submitPullRequestReview(repoSlug, pullRequest.number, {
      event: reviewEvent,
      body: annotatedBody,
      commandOptions: options.commandOptions
    });
  }

  try {
    await projectReview(requestedReviewEvent, projectedBody);
  } catch (error) {
    if (requestedReviewEvent === "COMMENT" || !isOwnPullRequestReviewError(error)) {
      throw error;
    }

    submittedReviewEvent = "COMMENT";
    projectedBody = buildSelfReviewFallbackBody(body, requestedReviewEvent);
    fallbackReason = "github_self_review_restriction";
    executionSummary = buildExecutionSummary({
      ...metadata.executionSummary,
      limits: [metadata.executionSummary?.limits, fallbackReason]
    });
    await projectReview(submittedReviewEvent, projectedBody, executionSummary);
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber: projection.issueNumber,
      runId: projection.runId,
      actor: projection.actor,
      phase: projection.phase,
      event: "pull_request_review_downgraded",
      message: `Downgraded ${requestedReviewEvent} review to COMMENT on pull request #${pullRequest.number}.`,
      data: {
        pullRequestNumber: pullRequest.number,
        pullRequestUrl: pullRequest.url,
        requestedReviewEvent,
        submittedReviewEvent,
        reason: fallbackReason,
        error: error.message
      }
    });
  }

  await recordRuntimeEvent(runtimePaths, {
    repoSlug,
    issueNumber: projection.issueNumber,
    runId: projection.runId,
    actor: projection.actor,
    phase: projection.phase,
    event: "pull_request_review_submitted",
    message: `Submitted ${submittedReviewEvent} review on pull request #${pullRequest.number}.`,
    data: {
      channel: projection.channel,
      pullRequestNumber: pullRequest.number,
      pullRequestUrl: pullRequest.url,
      requestedReviewEvent,
      submittedReviewEvent,
      reviewEvent: submittedReviewEvent,
      preview: buildContentPreview(projectedBody),
      signature: projection,
      executionSummary
    }
  });

  return {
    requestedReviewEvent,
    submittedReviewEvent,
    fallbackReason
  };
}

function isLeaseExpired(lease, now = new Date()) {
  if (!lease?.expiresAt) {
    return true;
  }

  const expiresAt = Date.parse(lease.expiresAt);
  return !Number.isFinite(expiresAt) || expiresAt <= now.getTime();
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

function buildIssueResumeComment(runRecord, resumeContext) {
  return [
    `Agent worker resumed this issue.`,
    `Run id: ${runRecord.id}`,
    resumeContext?.run?.status ? `Previous status: ${resumeContext.run.status}` : null,
    inferResumePhase(resumeContext) ? `Resume phase: ${inferResumePhase(resumeContext)}` : null,
    runRecord.branchRef ? `Branch: ${runRecord.branchRef}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

function buildIssueRecoveryComment(runRecord, lease, options = {}) {
  const recoveryMode = options.requeue
    ? "The issue was automatically requeued for another worker pass."
    : "Next step: rerun `issue-driven-os github resume` to continue from the last safe checkpoint.";
  return [
    "Agent worker recovered a stale claim for this issue.",
    `Run id: ${runRecord?.id ?? "n/a"}`,
    lease?.holderId ? `Recovered lease holder: ${lease.holderId}` : null,
    runRecord?.lastCompletedPhase ? `Last completed phase: ${runRecord.lastCompletedPhase}` : null,
    recoveryMode
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

function truncateGitHubStatusDescription(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) {
    return "Verification result recorded by issue-driven OS.";
  }

  if (normalized.length <= GITHUB_STATUS_DESCRIPTION_MAX_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, GITHUB_STATUS_DESCRIPTION_MAX_LENGTH - 3)}...`;
}

function buildVerificationStatusProjection(runRecord, pullRequest, critic) {
  const verdict = normalizeStateName(critic?.verdict);
  let state = "pending";

  if (verdict === "ready") {
    state = "success";
  } else if (verdict === "needs_changes" || verdict === "blocked") {
    state = "failure";
  }

  return {
    commitSha: runRecord?.commitSha ?? null,
    context: GITHUB_VERIFICATION_STATUS_CONTEXT,
    state,
    description: truncateGitHubStatusDescription(
      [critic?.verificationVerdict, critic?.summary].filter(Boolean).join(": ")
    ),
    targetUrl: pullRequest?.url ?? null
  };
}

async function projectVerificationStatus(
  runtimePaths,
  deps,
  repoSlug,
  issueNumber,
  runRecord,
  pullRequest,
  critic,
  options = {}
) {
  const projection = buildVerificationStatusProjection(runRecord, pullRequest, critic);
  if (!projection.commitSha || typeof deps.github.createCommitStatus !== "function") {
    return null;
  }

  await deps.github.createCommitStatus(repoSlug, projection.commitSha, {
    ...projection,
    commandOptions: options.commandOptions
  });
  await recordRuntimeEvent(runtimePaths, {
    repoSlug,
    issueNumber,
    runId: runRecord?.id ?? null,
    actor: "issue-cell-critic",
    phase: "review",
    event: "verification_status_projected",
    message: `Projected ${projection.state} verification status to commit ${projection.commitSha}.`,
    data: {
      pullRequestNumber: pullRequest?.number ?? null,
      pullRequestUrl: pullRequest?.url ?? null,
      commitSha: projection.commitSha,
      context: projection.context,
      state: projection.state,
      description: projection.description,
      targetUrl: projection.targetUrl,
      verdict: critic?.verdict ?? null,
      verificationVerdict: critic?.verificationVerdict ?? null
    }
  });

  return projection;
}

function getReviewProjectionMode(options = {}) {
  const normalized = normalizeStateName(
    options.reviewProjectionMode ?? process.env.ISSUE_DRIVEN_OS_REVIEW_MODE ?? "comment"
  );
  return normalized === "formal" || normalized === "approve" ? "formal" : "comment";
}

function getProjectedCriticReviewEvent(critic, options = {}) {
  if (getReviewProjectionMode(options) === "comment") {
    return "COMMENT";
  }

  return critic.verdict === "needs_changes" ? "REQUEST_CHANGES" : "APPROVE";
}

function mergeArtifactRefs(...artifactGroups) {
  const merged = new Map();

  for (const group of artifactGroups) {
    for (const artifact of group ?? []) {
      if (!artifact?.kind || !artifact?.path) {
        continue;
      }
      merged.set(artifact.kind, artifact);
    }
  }

  return [...merged.values()].sort((left, right) => left.kind.localeCompare(right.kind));
}

async function checkpointRun(runtimePaths, repoSlug, runRecord, updates = {}) {
  Object.assign(runRecord, updates);
  runRecord.updatedAt = updates.updatedAt ?? new Date().toISOString();
  await persistRunRecord(runtimePaths, runRecord);
  await recordRunUpdate(runtimePaths, repoSlug, runRecord);
}

async function loadArtifactPayload(artifact) {
  if (!artifact?.path) {
    return null;
  }

  try {
    return await readJson(artifact.path);
  } catch {
    return null;
  }
}

function hasCompletedPhase(runRecord, phases) {
  return phases.includes(runRecord?.lastCompletedPhase ?? "");
}

async function loadResumeContext(runtimePaths, repoSlug, issueNumber, options = {}) {
  if (options.resume === false) {
    return null;
  }

  const state = await readRuntimeState(runtimePaths, repoSlug);
  const latestRunId = state.issues?.[String(issueNumber)]?.latestRunId;
  if (!latestRunId) {
    return null;
  }

  const latestRun = await readRunRecord(runtimePaths, latestRunId);
  if (!latestRun) {
    return null;
  }

  if (["merged", "closed"].includes(normalizeStateName(latestRun.status))) {
    return null;
  }

  const persistedArtifacts = await listRunArtifacts(runtimePaths, latestRun.id);
  const artifacts = mergeArtifactRefs(latestRun.artifacts, persistedArtifacts);
  const artifactIndex = new Map(artifacts.map((artifact) => [artifact.kind, artifact]));
  const shaping = hasCompletedPhase(latestRun, [
    "shaping",
    "workspace",
    "execution",
    "commit_created",
    "branch_pushed",
    "pull_request_prepared",
    "critic",
    "review_projected",
    "merge_enabled",
    "reconciled"
  ])
    ? await loadArtifactPayload(artifactIndex.get("shaping"))
    : null;
  const execution = hasCompletedPhase(latestRun, [
    "execution",
    "commit_created",
    "branch_pushed",
    "pull_request_prepared",
    "critic",
    "review_projected",
    "merge_enabled",
    "reconciled"
  ])
    ? await loadArtifactPayload(artifactIndex.get("execution"))
    : null;
  const critic = hasCompletedPhase(latestRun, [
    "critic",
    "review_projected",
    "merge_enabled",
    "reconciled"
  ])
    ? await loadArtifactPayload(artifactIndex.get("critic"))
    : null;
  const needsRework =
    critic?.verdict === "needs_changes" &&
    latestRun.lastCompletedPhase === "review_projected" &&
    latestRun.terminationReason !== "review_loop_budget_exhausted";

  return {
    run: latestRun,
    artifacts,
    shaping,
    execution: needsRework ? null : execution,
    critic: needsRework ? null : critic,
    previousExecution: execution,
    previousCritic: critic,
    needsRework
  };
}

function inferResumePhase(resumeContext) {
  if (!resumeContext) {
    return null;
  }

  if (resumeContext.needsRework) {
    return "execution";
  }

  if (resumeContext.critic) {
    return "review";
  }

  if (resumeContext.execution) {
    return "execution";
  }

  if (resumeContext.shaping) {
    return "shaping";
  }

  return "claim";
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

function buildExecutionReviewFeedback(reviewFeedback, resumeContext) {
  const requestedChanges = [...(reviewFeedback?.requestedChanges ?? [])];

  if (resumeContext?.needsRework && resumeContext.previousCritic?.verdict === "needs_changes") {
    requestedChanges.unshift({
      author: "issue-cell-critic",
      body: buildCriticComment(resumeContext.previousCritic),
      submittedAt:
        resumeContext.run?.finishedAt ?? resumeContext.run?.updatedAt ?? new Date().toISOString(),
      source: "previous_critic_run",
      runId: resumeContext.run?.id ?? null
    });
  }

  return {
    requestedChanges,
    inlineComments: [...(reviewFeedback?.inlineComments ?? [])]
  };
}

function getOrchestrationStepLimit(options = {}) {
  return Math.max(
    1,
    normalizeNonNegativeInteger(
      options.orchestrationStepLimit ?? process.env.ISSUE_DRIVEN_OS_ORCHESTRATION_STEP_LIMIT,
      DEFAULT_ORCHESTRATION_STEP_LIMIT
    )
  );
}

function buildOrchestrationContext({
  issue,
  runRecord,
  workspace,
  shaping,
  execution,
  critic,
  pullRequest,
  reviewFeedback,
  branchSync,
  resumeContext,
  options
}) {
  return {
    issue: {
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      url: issue.url,
      labels: issue.labels ?? [],
      recentComments: issue.comments?.slice(-10) ?? []
    },
    run: {
      id: runRecord.id,
      status: runRecord.status,
      summary: runRecord.summary,
      branchRef: runRecord.branchRef ?? null,
      worktreePath: runRecord.worktreePath ?? null,
      commitSha: runRecord.commitSha ?? null,
      prNumber: runRecord.prNumber ?? null,
      prUrl: runRecord.prUrl ?? null,
      lastCompletedPhase: runRecord.lastCompletedPhase ?? null,
      reviewLoopCount: runRecord.reviewLoopCount,
      reviewLoopsMax: runRecord.reviewLoopsMax,
      orchestrationStepCount: runRecord.orchestrationStepCount ?? 0,
      notes: runRecord.notes ?? [],
      artifacts: runRecord.artifacts ?? []
    },
    workspace: workspace
      ? {
          branchName: workspace.branchName,
          baseBranch: workspace.baseBranch,
          worktreePath: workspace.worktreePath
        }
      : null,
    artifacts: {
      shaping,
      execution,
      critic,
      previousExecution: resumeContext?.previousExecution ?? null,
      previousCritic: resumeContext?.previousCritic ?? null
    },
    review: {
      pullRequest,
      feedback: reviewFeedback ?? { requestedChanges: [], inlineComments: [] },
      branchSync: branchSync ?? null
    },
    policy: {
      orchestrationStepLimit: getOrchestrationStepLimit(options),
      supportedWorkerKinds: [...ORCHESTRATOR_SUPPORTED_WORKER_KINDS],
      reviewLoopCount: runRecord.reviewLoopCount,
      reviewLoopsMax: runRecord.reviewLoopsMax,
      remainingReviewLoops: Math.max(0, runRecord.reviewLoopsMax - runRecord.reviewLoopCount),
      runtimeGates: [
        "request_merge requires an existing pull request and critic readiness",
        "runtime enforces review-loop budget exhaustion"
      ]
    }
  };
}

function buildOrchestratorSummary(decision) {
  if (!decision || typeof decision !== "object") {
    return "invalid";
  }

  return [decision.action, decision.worker?.kind].filter(Boolean).join(":");
}

function buildUnsupportedWorkerSummary(kind) {
  return `Issue orchestrator requested unsupported worker kind "${kind}".`;
}

async function produceGitHubIssue(repoRoot, repoSlug, repoPath, rawInput, options = {}) {
  const deps = buildRuntimeDeps(options);
  const runtimePaths = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
  await ensureRuntimeLayout(runtimePaths);
  await deps.github.ensureLabels(repoSlug);
  await recordRuntimeEvent(runtimePaths, {
    repoSlug,
    actor: "producer",
    phase: "intake",
    event: "produce_started",
    message: "Started normalizing raw input into a GitHub issue."
  });

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

  await recordRuntimeEvent(runtimePaths, {
    repoSlug,
    actor: "producer",
    phase: "intake",
    event: "issue_created",
    issueNumber: created.number,
    message: `Created issue #${created.number} from producer input.`,
    data: {
      title: normalized.payload.title,
      labels
    }
  });

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
  const runtimePaths = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
  await ensureRuntimeLayout(runtimePaths);
  const branchName = options.branchName ?? `agent/issue-${issueNumber}`;
  await recordRuntimeEvent(runtimePaths, {
    repoSlug,
    issueNumber,
    actor: "reconciler",
    phase: "reconcile",
    event: "reconcile_started",
    message: `Reconciling merge state for branch ${branchName}.`
  });
  const pr = await deps.github.findPullRequestForBranch(repoSlug, branchName, {
    state: "all",
    commandOptions: options.commandOptions
  });

  if (!pr) {
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      actor: "reconciler",
      phase: "reconcile",
      event: "reconcile_no_pull_request",
      message: "No pull request exists for the issue branch."
    });
    return buildRunSummary("noop", "No pull request exists for this issue branch.");
  }

  const merged =
    normalizeStateName(pr.state) === "merged" ||
    normalizeStateName(pr.mergeStateStatus) === "merged";

  if (!merged) {
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      actor: "reconciler",
      phase: "reconcile",
      event: "reconcile_pending_merge",
      message: "Pull request is still open or waiting for merge.",
      data: {
        pullRequestNumber: pr.number,
        pullRequestUrl: pr.url
      }
    });
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
  await recordRuntimeEvent(runtimePaths, {
    repoSlug,
    issueNumber,
    actor: "reconciler",
    phase: "reconcile",
    event: "reconcile_closed_issue",
    message: "Issue closed after pull request merge.",
    data: {
      pullRequestNumber: pr.number,
      pullRequestUrl: pr.url
    }
  });

  return buildRunSummary("closed", "Issue closed after merge.", {
    pullRequest: pr
  });
}

async function recoverIssueRun(repoSlug, issueNumber, options = {}) {
  const deps = buildRuntimeDeps(options);
  const runtimePaths = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
  await ensureRuntimeLayout(runtimePaths);

  const state = await readRuntimeState(runtimePaths, repoSlug);
  const latestRunId = state.issues?.[String(issueNumber)]?.latestRunId ?? null;
  const latestRun = latestRunId ? await readRunRecord(runtimePaths, latestRunId) : null;
  const lease = await readLease(runtimePaths, issueNumber);
  const forceRelease = await forceReleaseIssueLease(runtimePaths, issueNumber);
  const recoveredAt = new Date().toISOString();
  const recoveredLease = buildRecoveredLeaseSnapshot(
    forceRelease.lease ?? latestRun?.lease ?? lease,
    {
      recoveredAt
    }
  );

  if (!latestRun && !forceRelease.released) {
    return buildRunSummary("noop", "No claimed run or lease needed recovery.", {
      runId: null,
      lease: null
    });
  }

  let recoveredRun = latestRun;
  if (latestRun && normalizeStateName(latestRun.status) === "claimed") {
    recoveredRun = buildRunRecord(issueNumber, {
      ...latestRun,
      repoSlug,
      status: "failed",
      updatedAt: recoveredAt,
      finishedAt: recoveredAt,
      summary: "Recovered stale claimed run after worker exit before lease release.",
      lease: recoveredLease,
      notes: [...(latestRun.notes ?? []), `Recovered stale claim at ${recoveredAt}.`]
    });
    await persistRunRecord(runtimePaths, recoveredRun);
    await recordRunUpdate(runtimePaths, repoSlug, recoveredRun);
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      runId: recoveredRun.id,
      actor: "recovery",
      phase: "recovery",
      event: "run_recovered",
      message: "Marked stale claimed run as failed and resumable.",
      data: {
        previousStatus: latestRun.status,
        lastCompletedPhase: latestRun.lastCompletedPhase ?? null
      }
    });
  }

  if (forceRelease.released) {
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      runId: recoveredRun?.id ?? latestRun?.id ?? null,
      actor: "recovery",
      phase: "lease",
      event: "lease_force_released",
      message: `Force released lease for issue #${issueNumber}.`,
      data: {
        holderId: forceRelease.lease?.holderId ?? null,
        previousExpiresAt: forceRelease.lease?.expiresAt ?? null
      }
    });
  }

  if (recoveredRun) {
    try {
      const addLabels = options.requeue ? ["agent:ready"] : ["agent:blocked"];
      const removeLabels = options.requeue
        ? ["agent:claimed", "agent:blocked", "agent:review"]
        : ["agent:claimed"];
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels,
        removeLabels,
        commandOptions: options.commandOptions
      });
      await postIssueComment(
        runtimePaths,
        deps,
        repoSlug,
        issueNumber,
        buildIssueRecoveryComment(
          recoveredRun,
          recoveredLease ?? forceRelease.lease ?? lease,
          options
        ),
        {
          actor: "worker",
          phase: "recovery",
          runId: recoveredRun.id,
          executionSummary: buildWorkerExecutionSummary({
            tools: ["runtime lease recovery", "github issue edit", "github issue comment"],
            verification: "stale-claim-recovered",
            limits: options.requeue ? "auto-requeued" : "none"
          })
        },
        options
      );
    } catch {
      // Recovery should still succeed even if projection writeback fails.
    }
  }

  return buildRunSummary("recovered", "Recovered stale claim and released the issue lease.", {
    runId: recoveredRun?.id ?? latestRun?.id ?? null,
    lease: recoveredLease ?? forceRelease.lease ?? lease ?? null
  });
}

async function recoverStaleClaimedIssues(repoSlug, issues, options = {}) {
  const runtimePaths = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
  const state = await readRuntimeState(runtimePaths, repoSlug);
  const now = options.now ?? new Date();
  const recoveries = [];

  for (const issue of issues) {
    if (!isClaimedIssue(issue)) {
      continue;
    }

    const latestRunId = state.issues?.[String(issue.number)]?.latestRunId ?? null;
    if (!latestRunId) {
      continue;
    }

    const latestRun = await readRunRecord(runtimePaths, latestRunId);
    if (!latestRun || normalizeStateName(latestRun.status) !== "claimed") {
      continue;
    }

    const lease = await readLease(runtimePaths, issue.number);
    if (lease && !isLeaseExpired(lease, now)) {
      continue;
    }

    const result = await recoverIssueRun(repoSlug, issue.number, {
      ...options,
      requeue: true
    });

    recoveries.push({
      issueNumber: issue.number,
      runId: result.runId ?? latestRun.id,
      previousLeaseExpiresAt: lease?.expiresAt ?? null
    });
  }

  return recoveries;
}

async function runGitHubIssueWorker(repoRoot, repoSlug, repoPath, issueNumber, options = {}) {
  const deps = buildRuntimeDeps(options);
  const runtimePaths = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
  await ensureRuntimeLayout(runtimePaths);
  await deps.github.ensureLabels(repoSlug);

  const resumeContext = await loadResumeContext(runtimePaths, repoSlug, issueNumber, options);
  const runRecord = resumeContext
    ? buildRunRecord(issueNumber, {
        ...resumeContext.run,
        repoSlug,
        status: "claimed",
        finishedAt: null,
        artifacts: resumeContext.artifacts
      })
    : buildRunRecord(issueNumber, {
        repoSlug,
        status: "claimed"
      });
  const reviewLoopsMax = resolveReviewLoopsMax(runRecord, options);
  runRecord.reviewLoopCount = normalizeNonNegativeInteger(runRecord.reviewLoopCount, 0);
  runRecord.reviewLoopsMax = reviewLoopsMax;
  runRecord.terminationReason = null;

  const lease = await acquireIssueLease(
    runtimePaths,
    issueNumber,
    {
      holderId: runRecord.id,
      holderType: options.holderType ?? "worker",
      runId: runRecord.id
    },
    {
      ttlMs: options.leaseTtlMs
    }
  );

  if (!lease.acquired) {
    const collisionSummary = buildLeaseCollisionSummary(lease.lease);
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      runId: runRecord.id,
      actor: "worker",
      phase: "lease",
      event: "lease_skipped",
      message: collisionSummary,
      data: {
        action: lease.action ?? "active_collision",
        holderId: lease.lease?.holderId ?? null,
        holderType: lease.lease?.holderType ?? null,
        runId: lease.lease?.runId ?? null,
        expiresAt: lease.lease?.expiresAt ?? null,
        lastOutcome: lease.lease?.lastOutcome ?? null
      }
    });
    return buildRunSummary("skipped", collisionSummary, {
      runId: runRecord.id,
      lease: lease.lease,
      leaseAction: lease.action ?? "active_collision"
    });
  }

  runRecord.lease = snapshotLeaseForRun(lease.lease);
  const leaseRecoveryNote = buildLeaseRecoveryNote(runRecord.lease);
  if (leaseRecoveryNote) {
    runRecord.notes.push(leaseRecoveryNote);
  }
  const leaseSupervisor = createLeaseSupervisor(
    runtimePaths,
    repoSlug,
    issueNumber,
    runRecord,
    options
  );

  try {
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      runId: runRecord.id,
      actor: "worker",
      phase: "lease",
      event: "lease_acquired",
      message: `Lease acquired for issue #${issueNumber}.`,
      data: {
        action: lease.action ?? "acquired",
        lastOutcome: runRecord.lease?.lastOutcome ?? null
      }
    });
    if (resumeContext) {
      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        issueNumber,
        runId: runRecord.id,
        actor: "worker",
        phase: "resume",
        event: "run_resumed",
        message: `Resuming run ${runRecord.id} from ${inferResumePhase(resumeContext) ?? "claim"}.`,
        data: {
          previousStatus: resumeContext.run.status,
          resumePhase: inferResumePhase(resumeContext)
        }
      });
    }
    await leaseSupervisor.assertActive("claim");
    const issue = await deps.github.viewIssue(repoSlug, issueNumber, options);
    if (normalizeStateName(issue.state) !== "open") {
      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        issueNumber,
        runId: runRecord.id,
        actor: "worker",
        phase: "claim",
        event: "issue_not_open",
        message: "Issue is no longer open."
      });
      return buildRunSummary("skipped", "Issue is not open anymore.", {
        runId: runRecord.id
      });
    }

    runRecord.summary = resumeContext
      ? `Resumed issue #${issueNumber}`
      : `Claimed issue #${issueNumber}`;
    await deps.github.editIssue(repoSlug, issueNumber, {
      addLabels: ["agent:claimed"],
      removeLabels: ["agent:ready", "agent:blocked", "agent:review"],
      commandOptions: options.commandOptions
    });
    await postIssueComment(
      runtimePaths,
      deps,
      repoSlug,
      issueNumber,
      resumeContext
        ? buildIssueResumeComment(runRecord, resumeContext)
        : buildIssueStartComment(runRecord),
      {
        actor: "worker",
        phase: "claim",
        runId: runRecord.id,
        executionSummary: buildWorkerExecutionSummary({
          verification: resumeContext
            ? `resume-from-${inferResumePhase(resumeContext) ?? "claim"}`
            : "claimed"
        })
      },
      options
    );
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      runId: runRecord.id,
      actor: "worker",
      phase: "claim",
      event: resumeContext ? "issue_resumed" : "issue_claimed",
      message: resumeContext ? `Resumed issue #${issueNumber}.` : `Claimed issue #${issueNumber}.`
    });
    await checkpointRun(runtimePaths, repoSlug, runRecord, {
      status: "claimed",
      summary: runRecord.summary,
      lease: runRecord.lease,
      reviewLoopCount: runRecord.reviewLoopCount,
      reviewLoopsMax: runRecord.reviewLoopsMax,
      terminationReason: null
    });

    async function keepLease(reason) {
      await leaseSupervisor.assertActive(reason);
      await leaseSupervisor.renew(reason);
    }

    async function updateRun(updates) {
      await checkpointRun(runtimePaths, repoSlug, runRecord, updates);
    }

    async function checkpointPhaseArtifact(
      kind,
      artifactPath,
      lastCompletedPhase,
      extraUpdates = {}
    ) {
      runRecord.artifacts = mergeArtifactRefs(runRecord.artifacts, [{ kind, path: artifactPath }]);
      await updateRun({
        artifacts: runRecord.artifacts,
        lastCompletedPhase,
        ...extraUpdates
      });
    }

    async function finalizeIssueCommentBlock({
      actor,
      eventActor = actor,
      phase,
      summary,
      blockers,
      executionSummary,
      event,
      eventMessage = summary,
      eventData = {},
      removeLabels = ["agent:claimed", "agent:ready"],
      lastCompletedPhase,
      terminationReason = runRecord.terminationReason
    }) {
      const finishedAt = new Date().toISOString();
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels: ["agent:blocked"],
        removeLabels,
        commandOptions: options.commandOptions
      });
      await postIssueComment(
        runtimePaths,
        deps,
        repoSlug,
        issueNumber,
        buildBlockedComment(summary, blockers),
        {
          actor,
          phase,
          runId: runRecord.id,
          executionSummary
        },
        options
      );
      await updateRun({
        status: "blocked",
        finishedAt,
        summary,
        lastCompletedPhase,
        reviewLoopCount: runRecord.reviewLoopCount,
        reviewLoopsMax: runRecord.reviewLoopsMax,
        terminationReason
      });
      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        issueNumber,
        runId: runRecord.id,
        actor: eventActor,
        phase,
        event,
        message: eventMessage,
        data: eventData
      });

      return buildRunSummary("blocked", summary, {
        runId: runRecord.id
      });
    }

    async function finalizeSplitRoute(shapingPayload, childIssues) {
      const finishedAt = new Date().toISOString();
      runRecord.notes.push(`Created ${childIssues.length} child issues.`);
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels: ["agent:split"],
        removeLabels: ["agent:claimed", "agent:ready"],
        commandOptions: options.commandOptions
      });
      await postIssueComment(
        runtimePaths,
        deps,
        repoSlug,
        issueNumber,
        buildSplitComment(shapingPayload),
        {
          actor: "issue-shaper",
          phase: "shaping",
          runId: runRecord.id,
          executionSummary: buildShaperExecutionSummary("split", {
            tools: [
              "codex exec",
              "github issue create",
              "github issue edit",
              "github issue comment"
            ],
            limits: "split-required"
          })
        },
        options
      );
      await updateRun({
        status: "split",
        finishedAt,
        summary: shapingPayload.summary,
        lastCompletedPhase: "shaping"
      });
      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        issueNumber,
        runId: runRecord.id,
        actor: "worker",
        phase: "shaping",
        event: "issue_split",
        message: `Issue split into ${childIssues.length} child issues.`,
        data: {
          childIssues
        }
      });

      return buildRunSummary("split", shapingPayload.summary, {
        runId: runRecord.id,
        childIssues
      });
    }

    async function finalizeCriticBlock({
      summary,
      event,
      eventData = {},
      terminationReason = runRecord.terminationReason,
      pullRequest,
      extraSummary = {}
    }) {
      const finishedAt = new Date().toISOString();
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels: ["agent:blocked"],
        removeLabels: ["agent:claimed", "agent:ready", "agent:review"],
        commandOptions: options.commandOptions
      });
      await updateRun({
        status: "blocked",
        finishedAt,
        summary,
        lastCompletedPhase: "review_projected",
        reviewLoopCount: runRecord.reviewLoopCount,
        reviewLoopsMax: runRecord.reviewLoopsMax,
        terminationReason
      });
      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        issueNumber,
        runId: runRecord.id,
        actor: "issue-cell-critic",
        phase: "review",
        event,
        message: summary,
        data: eventData
      });

      return buildRunSummary("blocked", summary, {
        runId: runRecord.id,
        pullRequest,
        ...extraSummary
      });
    }

    async function submitProjectedCriticReview(pullRequest, criticPayload, body) {
      await projectVerificationStatus(
        runtimePaths,
        deps,
        repoSlug,
        issueNumber,
        runRecord,
        pullRequest,
        criticPayload,
        options
      );
      await submitPullRequestReview(
        runtimePaths,
        deps,
        repoSlug,
        pullRequest,
        body,
        {
          actor: "issue-cell-critic",
          phase: "review",
          runId: runRecord.id,
          issueNumber,
          reviewEvent: getProjectedCriticReviewEvent(criticPayload, options),
          executionSummary: buildCriticExecutionSummary(criticPayload)
        },
        options
      );
    }

    let workspace = null;
    let activePullRequest = null;
    let shaping = resumeContext?.shaping ? { payload: resumeContext.shaping } : null;
    let execution = resumeContext?.execution ? { payload: resumeContext.execution } : null;
    let critic = resumeContext?.critic ? { payload: resumeContext.critic } : null;
    let shapingArtifactPath =
      runRecord.artifacts.find((artifact) => artifact.kind === "shaping")?.path ?? null;
    let executionArtifactPath =
      runRecord.artifacts.find((artifact) => artifact.kind === "execution")?.path ?? null;
    let criticArtifactPath =
      runRecord.artifacts.find((artifact) => artifact.kind === "critic")?.path ?? null;
    const artifactReuse = {
      shaping: Boolean(resumeContext?.shaping),
      execution: Boolean(resumeContext?.execution),
      critic: Boolean(resumeContext?.critic)
    };
    let reviewResumeContext = {
      run: resumeContext?.run ?? null,
      previousExecution: resumeContext?.previousExecution ?? execution?.payload ?? null,
      previousCritic: resumeContext?.previousCritic ?? critic?.payload ?? null,
      needsRework: Boolean(resumeContext?.needsRework)
    };

    async function ensureWorkspace() {
      if (workspace) {
        return null;
      }

      workspace = await deps.workspace.createIssueWorktree(repoPath, runtimePaths, issueNumber, {
        branchName: options.branchName ?? runRecord.branchRef,
        reuseExisting: true
      });

      runRecord.branchRef = workspace.branchName;
      runRecord.worktreePath = workspace.worktreePath;
      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        issueNumber,
        runId: runRecord.id,
        actor: "workspace",
        phase: "workspace",
        event: workspace.reused ? "worktree_reused" : "worktree_created",
        message: `${workspace.reused ? "Reused" : "Created"} worktree ${workspace.worktreePath}.`,
        data: {
          branchRef: workspace.branchName,
          worktreePath: workspace.worktreePath
        }
      });
      await checkpointRun(runtimePaths, repoSlug, runRecord, {
        branchRef: workspace.branchName,
        worktreePath: workspace.worktreePath,
        lastCompletedPhase: "workspace"
      });

      const openPullRequest = await deps.github.findPullRequestForBranch(
        repoSlug,
        workspace.branchName,
        {
          state: "open",
          commandOptions: options.commandOptions
        }
      );
      const existingPullRequest =
        openPullRequest ??
        (resumeContext
          ? await deps.github.findPullRequestForBranch(repoSlug, workspace.branchName, {
              state: "all",
              commandOptions: options.commandOptions
            })
          : null);

      if (
        existingPullRequest &&
        (normalizeStateName(existingPullRequest.state) === "merged" ||
          normalizeStateName(existingPullRequest.mergeStateStatus) === "merged")
      ) {
        const reconcile = await reconcileIssue(repoSlug, issueNumber, {
          ...options,
          branchName: workspace.branchName
        });
        const finishedAt = new Date().toISOString();
        await checkpointRun(runtimePaths, repoSlug, runRecord, {
          status: reconcile.status === "closed" ? "merged" : "awaiting_merge",
          mergeStatus: reconcile.status,
          prNumber: existingPullRequest.number,
          prUrl: existingPullRequest.url,
          finishedAt,
          summary: reconcile.summary,
          lastCompletedPhase: "reconciled"
        });
        return buildRunSummary(
          reconcile.status === "closed" ? "merged" : "awaiting_merge",
          reconcile.summary,
          {
            runId: runRecord.id,
            pullRequest: existingPullRequest
          }
        );
      }

      activePullRequest = existingPullRequest;
      return null;
    }

    const orchestrationStepLimit = getOrchestrationStepLimit(options);

    while (true) {
      runRecord.orchestrationStepCount =
        normalizeNonNegativeInteger(runRecord.orchestrationStepCount, 0) + 1;
      if (runRecord.orchestrationStepCount > orchestrationStepLimit) {
        await keepLease("orchestration_budget_exhausted");
        return finalizeIssueCommentBlock({
          actor: "issue-orchestrator",
          phase: "orchestration",
          summary: `Issue orchestrator exceeded the orchestration step limit (${orchestrationStepLimit}).`,
          executionSummary: buildOrchestratorExecutionSummary({
            summary: "orchestration-step-limit-exhausted",
            blockers: [`step-limit=${orchestrationStepLimit}`]
          }),
          event: "orchestration_step_limit_exhausted",
          lastCompletedPhase: runRecord.lastCompletedPhase ?? "claim",
          terminationReason: "orchestration_step_limit_exhausted"
        });
      }

      const reviewFeedback = buildExecutionReviewFeedback(
        activePullRequest
          ? extractReviewFeedback(
              await deps.github.listPullRequestReviews(repoSlug, activePullRequest.number, options),
              await deps.github.listPullRequestReviewComments(
                repoSlug,
                activePullRequest.number,
                options
              )
            )
          : { requestedChanges: [], inlineComments: [] },
        reviewResumeContext
      );

      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        issueNumber,
        runId: runRecord.id,
        actor: "issue-orchestrator",
        phase: "orchestration",
        event: "orchestration_started",
        message: `Issue orchestrator started decision step ${runRecord.orchestrationStepCount}.`,
        data: {
          step: runRecord.orchestrationStepCount,
          stepLimit: orchestrationStepLimit
        }
      });
      await keepLease("orchestration");
      const orchestration = await deps.codex.orchestrateGitHubIssue(
        repoRoot,
        workspace?.worktreePath ?? repoPath,
        buildOrchestrationContext({
          issue,
          runRecord,
          workspace,
          shaping: shaping?.payload ?? null,
          execution: execution?.payload ?? null,
          critic: critic?.payload ?? null,
          pullRequest: activePullRequest,
          reviewFeedback,
          branchSync:
            workspace && activePullRequest
              ? {
                  status: "review_pending",
                  baseBranch: workspace.baseBranch,
                  baseRef: `origin/${workspace.baseBranch}`,
                  conflictedFiles: []
                }
              : null,
          resumeContext: reviewResumeContext,
          options
        })
      );
      await keepLease("orchestration_completed");

      const decision = orchestration.payload;
      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        issueNumber,
        runId: runRecord.id,
        actor: "issue-orchestrator",
        phase: "orchestration",
        event: "orchestration_completed",
        message: `Issue orchestrator selected ${buildOrchestratorSummary(decision)}.`,
        data: {
          step: runRecord.orchestrationStepCount,
          action: decision.action,
          workerKind: decision.worker?.kind ?? null,
          mergeReadiness: decision.mergeReadiness ?? "none",
          blockers: decision.blockers ?? []
        }
      });
      await updateRun({
        summary: decision.summary || runRecord.summary,
        orchestrationStepCount: runRecord.orchestrationStepCount
      });

      if (decision.action === "split_issue") {
        const splitPayload = {
          summary: decision.summary || shaping?.payload?.summary || "Issue split by orchestrator.",
          splitIssues:
            (decision.splitIssues ?? []).length > 0
              ? decision.splitIssues
              : (shaping?.payload?.splitIssues ?? [])
        };

        if (splitPayload.splitIssues.length === 0) {
          await keepLease("split_issue_missing_payload");
          return finalizeIssueCommentBlock({
            actor: "issue-orchestrator",
            phase: "orchestration",
            summary:
              "Issue orchestrator requested issue splitting without any child issue definitions.",
            executionSummary: buildOrchestratorExecutionSummary({
              summary: "missing-split-issues",
              blockers: ["split_issue requires at least one child issue definition"]
            }),
            event: "issue_split_missing_payload",
            lastCompletedPhase: runRecord.lastCompletedPhase ?? "claim"
          });
        }

        await keepLease("split_issue_creation");
        const childIssues = await createSplitIssues(repoSlug, splitPayload, deps.github);
        await keepLease("split_issue_creation_completed");
        await keepLease("split_projection");
        return finalizeSplitRoute(splitPayload, childIssues);
      }

      if (decision.action === "block_issue" || decision.action === "create_handoff") {
        if (deps.codex.compatibilityOrchestrator && decision.action === "block_issue") {
          if (shaping?.payload && !execution?.payload && !critic?.payload) {
            await keepLease("shaping_blocked");
            return finalizeIssueCommentBlock({
              actor: "issue-shaper",
              eventActor: "worker",
              phase: "shaping",
              summary: shaping.payload.summary,
              executionSummary: buildShaperExecutionSummary(shaping.payload.route, {
                limits: shaping.payload.summary
              }),
              event: "issue_blocked_after_shaping",
              lastCompletedPhase: "shaping"
            });
          }

          if (execution?.payload && !critic?.payload) {
            await keepLease(
              execution.payload.status === "no_changes"
                ? "execution_no_changes"
                : "execution_blocked"
            );
            return finalizeIssueCommentBlock({
              actor: "issue-cell-executor",
              eventActor:
                execution.payload.status === "no_changes" ? "workspace" : "issue-cell-executor",
              phase: "execution",
              summary: execution.payload.summary || "No code changes were produced.",
              blockers: execution.payload.blockers,
              executionSummary: buildExecutorExecutionSummary(execution.payload, {
                tools: ["codex exec", "github issue edit", "github issue comment"],
                limits: execution.payload.summary || execution.payload.status || "none"
              }),
              event:
                execution.payload.status === "no_changes"
                  ? "execution_no_changes"
                  : "execution_blocked",
              eventData: {
                blockers: execution.payload.blockers
              },
              lastCompletedPhase: "execution"
            });
          }

          if (critic?.payload) {
            await keepLease("critic_blocked");
            return finalizeCriticBlock({
              summary: critic.payload.summary,
              event: "critic_blocked",
              eventData: {
                pullRequestNumber: activePullRequest?.number ?? null,
                pullRequestUrl: activePullRequest?.url ?? null
              },
              pullRequest: activePullRequest
            });
          }
        }

        await keepLease(
          decision.action === "create_handoff" ? "orchestration_handoff" : "orchestration_blocked"
        );
        return finalizeIssueCommentBlock({
          actor: "issue-orchestrator",
          phase: "orchestration",
          summary: decision.summary,
          blockers: decision.blockers,
          executionSummary: buildOrchestratorExecutionSummary(decision, {
            verification:
              decision.action === "create_handoff" ? "handoff-requested" : "orchestration-blocked"
          }),
          event:
            decision.action === "create_handoff"
              ? "issue_handoff_requested"
              : "issue_blocked_by_orchestrator",
          lastCompletedPhase: runRecord.lastCompletedPhase ?? "claim",
          terminationReason:
            decision.action === "create_handoff" ? "handoff_requested" : runRecord.terminationReason
        });
      }

      if (decision.action === "request_merge") {
        if (!critic?.payload || !activePullRequest) {
          await keepLease("merge_request_missing_review_state");
          return finalizeIssueCommentBlock({
            actor: "issue-orchestrator",
            phase: "orchestration",
            summary:
              "Issue orchestrator requested merge readiness before a pull request and ready critic verdict were available.",
            executionSummary: buildOrchestratorExecutionSummary({
              summary: "merge-request-missing-review-state",
              blockers: ["request_merge requires both a pull request and a critic artifact"]
            }),
            event: "merge_request_missing_review_state",
            lastCompletedPhase: runRecord.lastCompletedPhase ?? "claim"
          });
        }

        await keepLease("ready_review");
        await submitProjectedCriticReview(
          activePullRequest,
          critic.payload,
          buildReadyComment(activePullRequest.url, critic.payload)
        );
        await keepLease("merge_enable");
        await deps.github.editIssue(repoSlug, issueNumber, {
          addLabels: ["agent:review"],
          removeLabels: ["agent:claimed", "agent:ready", "agent:blocked"],
          commandOptions: options.commandOptions
        });
        await deps.github.enableAutoMerge(repoSlug, activePullRequest.number, {
          matchHeadCommit: runRecord.commitSha,
          commandOptions: options.commandOptions
        });
        await keepLease("merge_enabled");
        await recordRuntimeEvent(runtimePaths, {
          repoSlug,
          issueNumber,
          runId: runRecord.id,
          actor: "pull-request",
          phase: "review",
          event: "auto_merge_enabled",
          message: `Enabled auto-merge for pull request #${activePullRequest.number}.`,
          data: {
            pullRequestNumber: activePullRequest.number,
            pullRequestUrl: activePullRequest.url,
            commitSha: runRecord.commitSha
          }
        });
        await updateRun({
          lastCompletedPhase: "merge_enabled",
          reviewLoopCount: runRecord.reviewLoopCount,
          reviewLoopsMax: runRecord.reviewLoopsMax
        });
        break;
      }

      if (decision.action !== "spawn_worker" || !decision.worker) {
        await keepLease("invalid_orchestration_action");
        return finalizeIssueCommentBlock({
          actor: "issue-orchestrator",
          phase: "orchestration",
          summary: `Issue orchestrator returned invalid action ${decision.action}.`,
          executionSummary: buildOrchestratorExecutionSummary({
            summary: "invalid-orchestration-action",
            blockers: [`action=${decision.action}`]
          }),
          event: "invalid_orchestration_action",
          lastCompletedPhase: runRecord.lastCompletedPhase ?? "claim"
        });
      }

      const workerKind = decision.worker.kind;
      if (!ORCHESTRATOR_SUPPORTED_WORKER_KINDS.has(workerKind)) {
        await keepLease("unsupported_worker_kind");
        return finalizeIssueCommentBlock({
          actor: "issue-orchestrator",
          phase: "orchestration",
          summary: buildUnsupportedWorkerSummary(workerKind),
          blockers: [workerKind],
          executionSummary: buildOrchestratorExecutionSummary({
            summary: buildUnsupportedWorkerSummary(workerKind),
            blockers: [workerKind]
          }),
          event: "unsupported_worker_kind",
          lastCompletedPhase: runRecord.lastCompletedPhase ?? "claim"
        });
      }

      if (workerKind === "issue-shaper") {
        const reusedShaping = artifactReuse.shaping;
        if (reusedShaping) {
          artifactReuse.shaping = false;
          await recordRuntimeEvent(runtimePaths, {
            repoSlug,
            issueNumber,
            runId: runRecord.id,
            actor: "issue-shaper",
            phase: "shaping",
            event: "shaping_resumed",
            message: `Reused shaping artifact for route ${shaping?.payload?.route ?? "unknown"}.`,
            data: {
              route: shaping?.payload?.route ?? null,
              artifactPath: shapingArtifactPath
            }
          });
        } else {
          await recordRuntimeEvent(runtimePaths, {
            repoSlug,
            issueNumber,
            runId: runRecord.id,
            actor: "issue-shaper",
            phase: "shaping",
            event: "shaping_started",
            message: "Started shaping the issue."
          });
          await keepLease("shaping");
          shaping = await deps.codex.shapeGitHubIssue(repoRoot, repoPath, {
            issue,
            recentComments: issue.comments.slice(-10),
            orchestration: {
              task: decision.worker.task,
              acceptanceFocus: decision.worker.acceptanceFocus,
              summary: decision.summary
            }
          });
          await keepLease("shaping_completed");
          shapingArtifactPath = await persistArtifact(
            runtimePaths,
            runRecord.id,
            "shaping",
            shaping.payload
          );
          await recordRuntimeEvent(runtimePaths, {
            repoSlug,
            issueNumber,
            runId: runRecord.id,
            actor: "issue-shaper",
            phase: "shaping",
            event: "shaping_completed",
            message: `Shaping completed with route ${shaping.payload.route}.`,
            data: {
              route: shaping.payload.route,
              artifactPath: shapingArtifactPath
            }
          });
        }
        await checkpointPhaseArtifact("shaping", shapingArtifactPath, "shaping");
        continue;
      }

      const ensureWorkspaceResult = await ensureWorkspace();
      if (ensureWorkspaceResult) {
        return ensureWorkspaceResult;
      }

      let branchSync = {
        status: "not_required",
        baseBranch: workspace.baseBranch,
        baseRef: `origin/${workspace.baseBranch}`,
        conflictedFiles: []
      };
      if (
        reviewResumeContext.needsRework ||
        runRecord.reviewLoopCount > 0 ||
        artifactReuse.execution ||
        artifactReuse.critic
      ) {
        await keepLease("branch_refresh");
        branchSync = await deps.workspace.refreshIssueBranch(
          workspace.worktreePath,
          workspace.baseBranch
        );
        await keepLease("branch_refresh_completed");
        await recordRuntimeEvent(runtimePaths, {
          repoSlug,
          issueNumber,
          runId: runRecord.id,
          actor: "workspace",
          phase: "workspace",
          event:
            branchSync.status === "merged"
              ? "branch_refreshed"
              : branchSync.status === "conflicted"
                ? "branch_refresh_conflicted"
                : "branch_refresh_skipped",
          message:
            branchSync.status === "merged"
              ? `Refreshed ${workspace.branchName} with ${branchSync.baseRef}.`
              : branchSync.status === "conflicted"
                ? `Refresh from ${branchSync.baseRef} produced conflicts.`
                : `${workspace.branchName} is already up to date with ${branchSync.baseRef}.`,
          data: {
            branchRef: workspace.branchName,
            baseBranch: branchSync.baseBranch,
            baseRef: branchSync.baseRef,
            conflictedFiles: branchSync.conflictedFiles ?? []
          }
        });
      }

      if (workerKind === "issue-cell-executor") {
        const reusedExecution = artifactReuse.execution;
        if (reusedExecution) {
          artifactReuse.execution = false;
          execution = { payload: resumeContext.execution };
          await recordRuntimeEvent(runtimePaths, {
            repoSlug,
            issueNumber,
            runId: runRecord.id,
            actor: "issue-cell-executor",
            phase: "execution",
            event: "execution_resumed",
            message: `Reused execution artifact with status ${execution.payload.status}.`,
            data: {
              status: execution.payload.status,
              artifactPath: executionArtifactPath
            }
          });
        } else {
          await recordRuntimeEvent(runtimePaths, {
            repoSlug,
            issueNumber,
            runId: runRecord.id,
            actor: "issue-cell-executor",
            phase: "execution",
            event: "execution_started",
            message: "Started issue execution."
          });
          await keepLease("execution");
          execution = await deps.codex.executeGitHubIssue(repoRoot, workspace.worktreePath, {
            issue,
            shaping: shaping?.payload ?? null,
            reviewFeedback,
            branchRef: workspace.branchName,
            branchSync,
            orchestration: {
              task: decision.worker.task,
              acceptanceFocus: decision.worker.acceptanceFocus,
              summary: decision.summary
            }
          });
          await keepLease("execution_completed");
          executionArtifactPath = await persistArtifact(
            runtimePaths,
            runRecord.id,
            "execution",
            execution.payload
          );
          await recordRuntimeEvent(runtimePaths, {
            repoSlug,
            issueNumber,
            runId: runRecord.id,
            actor: "issue-cell-executor",
            phase: "execution",
            event: "execution_completed",
            message: `Execution completed with status ${execution.payload.status}.`,
            data: {
              status: execution.payload.status,
              artifactPath: executionArtifactPath
            }
          });
        }
        await checkpointPhaseArtifact("execution", executionArtifactPath, "execution", {
          reviewLoopCount: runRecord.reviewLoopCount,
          reviewLoopsMax: runRecord.reviewLoopsMax
        });

        reviewResumeContext = {
          run: runRecord,
          previousExecution: execution.payload,
          previousCritic: reviewResumeContext.previousCritic,
          needsRework: false
        };
        critic = null;

        if (
          execution.payload.status === "blocked" ||
          execution.payload.status === "split_required" ||
          execution.payload.status === "no_changes"
        ) {
          await updateRun({
            lastCompletedPhase: "execution",
            reviewLoopCount: runRecord.reviewLoopCount,
            reviewLoopsMax: runRecord.reviewLoopsMax
          });
          continue;
        }

        let commitResult;
        if (reusedExecution) {
          const worktreeStatus = await deps.workspace.getWorkingTreeStatus(workspace.worktreePath);
          if (worktreeStatus) {
            await keepLease("commit");
            commitResult = await deps.workspace.commitAllChanges(
              workspace.worktreePath,
              execution.payload.commitMessage || `fix(issue): address #${issueNumber}`
            );
            await keepLease("commit_completed");
          } else {
            commitResult = {
              changed: true,
              commitSha: await deps.workspace.getHeadCommitSha(workspace.worktreePath),
              resumed: true
            };
          }
        } else {
          await keepLease("commit");
          commitResult = await deps.workspace.commitAllChanges(
            workspace.worktreePath,
            execution.payload.commitMessage || `fix(issue): address #${issueNumber}`
          );
          await keepLease("commit_completed");
        }

        if (!commitResult.changed && !commitResult.commitSha) {
          await updateRun({
            lastCompletedPhase: "execution",
            reviewLoopCount: runRecord.reviewLoopCount,
            reviewLoopsMax: runRecord.reviewLoopsMax
          });
          continue;
        }

        runRecord.commitSha = commitResult.commitSha;
        await keepLease("push");
        await recordRuntimeEvent(runtimePaths, {
          repoSlug,
          issueNumber,
          runId: runRecord.id,
          actor: "workspace",
          phase: "execution",
          event: commitResult.resumed ? "commit_reused" : "commit_created",
          message: `${commitResult.resumed ? "Reused" : "Created"} commit ${commitResult.commitSha}.`,
          data: {
            branchRef: workspace.branchName,
            commitSha: commitResult.commitSha
          }
        });
        await updateRun({
          commitSha: commitResult.commitSha,
          lastCompletedPhase: "commit_created",
          reviewLoopCount: runRecord.reviewLoopCount,
          reviewLoopsMax: runRecord.reviewLoopsMax
        });
        await deps.workspace.pushBranch(workspace.worktreePath, workspace.branchName, {
          forceWithLease: reusedExecution || Boolean(activePullRequest)
        });
        await keepLease("push_completed");
        await recordRuntimeEvent(runtimePaths, {
          repoSlug,
          issueNumber,
          runId: runRecord.id,
          actor: "workspace",
          phase: "execution",
          event: "branch_pushed",
          message: `Pushed branch ${workspace.branchName}.`,
          data: {
            branchRef: workspace.branchName,
            forceWithLease: reusedExecution || Boolean(activePullRequest)
          }
        });
        await updateRun({
          lastCompletedPhase: "branch_pushed",
          reviewLoopCount: runRecord.reviewLoopCount,
          reviewLoopsMax: runRecord.reviewLoopsMax
        });

        const pullRequestTitle = execution.payload.prTitle || `Fix #${issueNumber}: ${issue.title}`;
        const pullRequestExecutionSummary = buildExecutorExecutionSummary(execution.payload);
        const pullRequestBody = annotateProjectionBody(
          buildPullRequestBody(issue, execution.payload, {
            summary: execution.payload.verificationSummary
          }),
          {
            actor: "issue-cell-executor",
            phase: "review",
            runId: runRecord.id,
            issueNumber,
            channel: "pull_request_body",
            executionSummary: pullRequestExecutionSummary
          }
        );

        const hadExistingPullRequest = Boolean(activePullRequest);
        await keepLease("pull_request_prepare");
        const pullRequest = hadExistingPullRequest
          ? await deps.github
              .editPullRequest(repoSlug, activePullRequest.number, {
                title: pullRequestTitle,
                body: pullRequestBody,
                commandOptions: options.commandOptions
              })
              .then(() => activePullRequest)
          : await deps.github.createPullRequest(repoSlug, {
              branchName: workspace.branchName,
              baseBranch: workspace.baseBranch,
              title: pullRequestTitle,
              body: pullRequestBody,
              commandOptions: options.commandOptions
            });
        await keepLease("pull_request_prepared");

        activePullRequest = pullRequest;
        runRecord.prNumber = pullRequest.number;
        runRecord.prUrl = pullRequest.url;
        await updateRun({
          prNumber: pullRequest.number,
          prUrl: pullRequest.url,
          lastCompletedPhase: "pull_request_prepared",
          reviewLoopCount: runRecord.reviewLoopCount,
          reviewLoopsMax: runRecord.reviewLoopsMax
        });
        await recordRuntimeEvent(runtimePaths, {
          repoSlug,
          issueNumber,
          runId: runRecord.id,
          actor: "pull-request",
          phase: "review",
          event: hadExistingPullRequest ? "pull_request_reused" : "pull_request_created",
          message: `Prepared pull request #${pullRequest.number}.`,
          data: {
            pullRequestNumber: pullRequest.number,
            pullRequestUrl: pullRequest.url,
            submittedBy: "issue-cell-executor",
            preview: buildContentPreview(pullRequestBody),
            executionSummary: buildExecutionSummary(pullRequestExecutionSummary)
          }
        });
        continue;
      }

      if (!execution?.payload || !activePullRequest) {
        await keepLease("critic_missing_execution_state");
        return finalizeIssueCommentBlock({
          actor: "issue-orchestrator",
          phase: "orchestration",
          summary:
            "Issue orchestrator requested review before execution output and pull request state were available.",
          executionSummary: buildOrchestratorExecutionSummary({
            summary: "critic-missing-execution-state",
            blockers: ["issue-cell-critic requires execution output and an active pull request"]
          }),
          event: "critic_missing_execution_state",
          lastCompletedPhase: runRecord.lastCompletedPhase ?? "claim"
        });
      }

      const reusedCritic = artifactReuse.critic;
      if (reusedCritic) {
        artifactReuse.critic = false;
        critic = { payload: resumeContext.critic };
        await recordRuntimeEvent(runtimePaths, {
          repoSlug,
          issueNumber,
          runId: runRecord.id,
          actor: "issue-cell-critic",
          phase: "review",
          event: "critic_resumed",
          message: `Reused critic artifact with verdict ${critic.payload.verdict}.`,
          data: {
            verdict: critic.payload.verdict,
            verificationVerdict: critic.payload.verificationVerdict,
            artifactPath: criticArtifactPath
          }
        });
      } else {
        await recordRuntimeEvent(runtimePaths, {
          repoSlug,
          issueNumber,
          runId: runRecord.id,
          actor: "issue-cell-critic",
          phase: "review",
          event: "critic_started",
          message: "Started issue critique."
        });
        await keepLease("critic");
        critic = await deps.codex.critiqueGitHubIssue(repoRoot, workspace.worktreePath, {
          issue,
          shaping: shaping?.payload ?? null,
          execution: execution.payload,
          reviewFeedback,
          pullRequest: activePullRequest,
          orchestration: {
            task: decision.worker.task,
            acceptanceFocus: decision.worker.acceptanceFocus,
            summary: decision.summary
          }
        });
        await keepLease("critic_completed");
        criticArtifactPath = await persistArtifact(
          runtimePaths,
          runRecord.id,
          "critic",
          critic.payload
        );
        await recordRuntimeEvent(runtimePaths, {
          repoSlug,
          issueNumber,
          runId: runRecord.id,
          actor: "issue-cell-critic",
          phase: "review",
          event: "critic_completed",
          message: `Critic completed with verdict ${critic.payload.verdict}.`,
          data: {
            verdict: critic.payload.verdict,
            verificationVerdict: critic.payload.verificationVerdict,
            artifactPath: criticArtifactPath
          }
        });
      }

      await checkpointPhaseArtifact("critic", criticArtifactPath, "critic", {
        reviewLoopCount: runRecord.reviewLoopCount,
        reviewLoopsMax: runRecord.reviewLoopsMax
      });

      reviewResumeContext = {
        run: runRecord,
        previousExecution: execution.payload,
        previousCritic: critic.payload,
        needsRework: critic.payload.verdict === "needs_changes"
      };

      if (critic.payload.verdict !== "ready") {
        await keepLease("review_projection");
        await submitProjectedCriticReview(
          activePullRequest,
          critic.payload,
          buildCriticComment(critic.payload)
        );
        await keepLease("review_projected");

        if (critic.payload.verdict === "needs_changes") {
          runRecord.reviewLoopCount += 1;
          if (runRecord.reviewLoopCount > reviewLoopsMax) {
            const exhaustedSummary = buildReviewLoopBudgetExceededSummary(
              critic.payload,
              runRecord.reviewLoopCount,
              reviewLoopsMax
            );
            await keepLease("review_loop_budget_exhausted");
            return finalizeCriticBlock({
              summary: exhaustedSummary,
              event: "review_loop_budget_exhausted",
              eventData: {
                pullRequestNumber: activePullRequest.number,
                pullRequestUrl: activePullRequest.url,
                reviewLoopCount: runRecord.reviewLoopCount,
                reviewLoopsMax
              },
              terminationReason: "review_loop_budget_exhausted",
              pullRequest: activePullRequest,
              extraSummary: {
                reviewLoopCount: runRecord.reviewLoopCount,
                reviewLoopsMax
              }
            });
          }

          await checkpointRun(runtimePaths, repoSlug, runRecord, {
            status: "claimed",
            summary: critic.payload.summary,
            lastCompletedPhase: "review_projected",
            reviewLoopCount: runRecord.reviewLoopCount,
            reviewLoopsMax: runRecord.reviewLoopsMax,
            terminationReason: null
          });
          await recordRuntimeEvent(runtimePaths, {
            repoSlug,
            issueNumber,
            runId: runRecord.id,
            actor: "issue-cell-critic",
            phase: "review",
            event: "review_loop_continued",
            message: `Critic requested changes; returning control to the issue orchestrator (${runRecord.reviewLoopCount}/${reviewLoopsMax}).`,
            data: {
              pullRequestNumber: activePullRequest.number,
              pullRequestUrl: activePullRequest.url,
              reviewLoopCount: runRecord.reviewLoopCount,
              reviewLoopsMax
            }
          });
          continue;
        }

        await keepLease("critic_blocked");
        return finalizeCriticBlock({
          summary: critic.payload.summary,
          event: "critic_blocked",
          eventData: {
            pullRequestNumber: activePullRequest.number,
            pullRequestUrl: activePullRequest.url
          },
          pullRequest: activePullRequest
        });
      }

      await updateRun({
        lastCompletedPhase: "critic",
        reviewLoopCount: runRecord.reviewLoopCount,
        reviewLoopsMax: runRecord.reviewLoopsMax
      });
    }

    await keepLease("reconcile");
    const reconcile = await reconcileIssue(repoSlug, issueNumber, {
      ...options,
      branchName: workspace.branchName
    });
    await keepLease("reconcile_completed");

    const finishedAt = new Date().toISOString();
    await checkpointRun(runtimePaths, repoSlug, runRecord, {
      status: reconcile.status === "closed" ? "merged" : "awaiting_merge",
      mergeStatus: reconcile.status,
      finishedAt,
      summary:
        reconcile.status === "closed"
          ? "Issue merged and closed."
          : "Pull request opened and auto-merge enabled.",
      lastCompletedPhase: "reconciled",
      lease: runRecord.lease,
      leaseFailure: runRecord.leaseFailure,
      reviewLoopCount: runRecord.reviewLoopCount,
      reviewLoopsMax: runRecord.reviewLoopsMax,
      terminationReason: null
    });
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      runId: runRecord.id,
      actor: "worker",
      phase: "reconcile",
      event: "run_completed",
      message:
        reconcile.status === "closed"
          ? "Issue merged and closed."
          : "Pull request opened and auto-merge enabled.",
      data: {
        status: reconcile.status === "closed" ? "merged" : "awaiting_merge",
        pullRequestNumber: activePullRequest?.number ?? null,
        pullRequestUrl: activePullRequest?.url ?? null
      }
    });

    if (reconcile.status === "closed") {
      await deps.workspace.cleanupIssueWorktree(repoPath, workspace.worktreePath, {
        branchName: workspace.branchName,
        deleteBranch: true
      });
    }

    return buildRunSummary(
      reconcile.status === "closed" ? "merged" : "awaiting_merge",
      reconcile.status === "closed"
        ? "Issue merged and closed."
        : "Pull request opened and auto-merge enabled.",
      {
        runId: runRecord.id,
        pullRequest: activePullRequest,
        reviewLoopCount: runRecord.reviewLoopCount,
        reviewLoopsMax: runRecord.reviewLoopsMax
      }
    );
  } catch (error) {
    const runtimePathsLocal = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
    const isLeaseLost = error?.code === "ISSUE_LEASE_LOST";
    const failedRecord = buildRunRecord(issueNumber, {
      id: runRecord.id,
      repoSlug,
      status: "failed",
      startedAt: runRecord.startedAt,
      updatedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      branchRef: runRecord.branchRef,
      worktreePath: runRecord.worktreePath,
      commitSha: runRecord.commitSha,
      prNumber: runRecord.prNumber,
      prUrl: runRecord.prUrl,
      mergeStatus: runRecord.mergeStatus,
      lastCompletedPhase: runRecord.lastCompletedPhase,
      summary: error.message,
      lease: runRecord.lease,
      leaseFailure: runRecord.leaseFailure,
      artifacts: runRecord.artifacts,
      notes: runRecord.notes,
      reviewLoopCount: runRecord.reviewLoopCount,
      reviewLoopsMax: runRecord.reviewLoopsMax,
      terminationReason: error?.terminationReason ?? runRecord.terminationReason
    });

    await persistRunRecord(runtimePathsLocal, failedRecord);
    if (!isLeaseLost) {
      await recordRunUpdate(runtimePathsLocal, repoSlug, failedRecord);
    }
    await recordRuntimeEvent(runtimePathsLocal, {
      repoSlug,
      issueNumber,
      runId: runRecord.id,
      actor: "worker",
      phase: "failure",
      event: "run_failed",
      level: "error",
      message: error.message
    });

    if (!isLeaseLost) {
      try {
        await deps.github.editIssue(repoSlug, issueNumber, {
          addLabels: ["agent:blocked"],
          removeLabels: ["agent:claimed"],
          commandOptions: options.commandOptions
        });
        await postIssueComment(
          runtimePathsLocal,
          deps,
          repoSlug,
          issueNumber,
          buildBlockedComment(error.message),
          {
            actor: "worker",
            phase: "failure",
            runId: runRecord.id,
            executionSummary: buildWorkerExecutionSummary({
              tools: ["github issue edit", "github issue comment"],
              verification: "run-failed",
              limits: error.message
            })
          },
          options
        );
      } catch {
        // Keep the original failure if writeback also fails.
      }
    }

    return buildRunSummary("failed", error.message, {
      runId: runRecord.id
    });
  } finally {
    await leaseSupervisor.stop();
    const runtimePathsLocal = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
    const released = await releaseIssueLease(runtimePathsLocal, issueNumber, runRecord.id);
    await recordRuntimeEvent(runtimePathsLocal, {
      repoSlug,
      issueNumber,
      runId: runRecord.id,
      actor: "worker",
      phase: "lease",
      event: released ? "lease_released" : "lease_release_skipped",
      message: released
        ? `Released lease for issue #${issueNumber}.`
        : `Skipped lease release for issue #${issueNumber} because ownership had changed.`
    });
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
  const runtimePaths = buildRuntimePaths(repoSlug, { runtimeRoot: options.runtimeRoot });
  await ensureRuntimeLayout(runtimePaths);
  await deps.github.ensureLabels(repoSlug);
  const issueWorker = options.runGitHubIssueWorker ?? runGitHubIssueWorker;

  const intervalMs = (options.pollSeconds ?? 60) * 1000;
  const concurrency = Math.max(1, Number(options.concurrency ?? 4));
  const runPass = async () => {
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      actor: "daemon",
      phase: "queue",
      event: "daemon_pass_started",
      message: "Started daemon queue scan.",
      data: {
        concurrency,
        limit: options.limit ?? null
      }
    });
    const fetchLimit = Math.max(Number(options.fetchLimit ?? 500), Number(options.limit ?? 0), 100);
    const issues = await deps.github.listIssues(repoSlug, {
      limit: fetchLimit,
      commandOptions: options.commandOptions
    });
    const recoveredClaims = await recoverStaleClaimedIssues(repoSlug, issues, {
      ...options,
      github: deps.github
    });
    if (recoveredClaims.length > 0) {
      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        actor: "daemon",
        phase: "queue",
        event: "stale_claims_recovered",
        message: `Recovered ${recoveredClaims.length} stale claimed issue(s).`,
        data: {
          issueNumbers: recoveredClaims.map((entry) => entry.issueNumber)
        }
      });
    }
    const refreshedIssues =
      recoveredClaims.length > 0
        ? await deps.github.listIssues(repoSlug, {
            limit: fetchLimit,
            commandOptions: options.commandOptions
          })
        : issues;
    const candidates = refreshedIssues.filter(isConsumerCandidate);
    const queuePlan = await planConsumableIssues(repoSlug, candidates, deps.github, {
      commandOptions: options.commandOptions
    });

    const results = await consumeBatch(
      queuePlan.ready.slice(0, options.limit ?? queuePlan.ready.length),
      concurrency,
      (entry) => issueWorker(repoRoot, repoSlug, repoPath, entry.issue.number, options)
    );

    const summary = {
      checked: refreshedIssues.length,
      candidates: candidates.length,
      consumed: results.length,
      recoveredClaims,
      ready: queuePlan.ready.map((entry) => ({
        issueNumber: entry.issue.number,
        priorityRank: entry.priorityRank,
        dependencies: entry.dependencies
      })),
      blocked: queuePlan.blocked.map((entry) => ({
        issueNumber: entry.issue.number,
        priorityRank: entry.priorityRank,
        unresolvedDependencies: entry.unresolvedDependencies,
        warnings: entry.dependencyWarnings
      })),
      results
    };

    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      actor: "daemon",
      phase: "queue",
      event: "daemon_pass_completed",
      message: "Completed daemon queue scan.",
      data: {
        checked: summary.checked,
        candidates: summary.candidates,
        consumed: summary.consumed,
        recoveredIssueNumbers: recoveredClaims.map((entry) => entry.issueNumber),
        readyIssueNumbers: summary.ready.map((entry) => entry.issueNumber),
        blockedIssueNumbers: summary.blocked.map((entry) => entry.issueNumber)
      }
    });

    return summary;
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
  compareScheduledIssues,
  getIssuePriorityRank,
  isConsumerCandidate,
  parseIssueDependencies,
  planConsumableIssues,
  produceGitHubIssue,
  recoverStaleClaimedIssues,
  recoverIssueRun,
  reconcileIssue,
  runGitHubDaemon,
  runGitHubIssueWorker
};
