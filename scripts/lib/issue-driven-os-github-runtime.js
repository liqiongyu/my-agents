const {
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
  renewIssueLease,
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

const DEFAULT_PRIORITY_RANK = 2;
const PRIORITY_LABEL_RANKS = new Map([
  ["agent:priority-critical", 0],
  ["priority:critical", 0],
  ["priority:p0", 0],
  ["p0", 0],
  ["agent:priority-high", 1],
  ["priority:high", 1],
  ["priority:p1", 1],
  ["p1", 1],
  ["agent:priority-medium", 2],
  ["priority:medium", 2],
  ["priority:normal", 2],
  ["priority:p2", 2],
  ["p2", 2],
  ["agent:priority-low", 3],
  ["priority:low", 3],
  ["priority:p3", 3],
  ["p3", 3]
]);
const GITHUB_VERIFICATION_STATUS_CONTEXT = "issue-driven-os/verification";
const GITHUB_STATUS_DESCRIPTION_MAX_LENGTH = 140;

function labelSet(issue) {
  return new Set(issue?.labels ?? []);
}

function normalizeStateName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function parseIssueDependencies(issue, defaultRepoSlug) {
  const lines = String(issue?.body ?? "").split(/\r?\n/);
  const dependencies = new Map();

  function addDependency(rawValue) {
    const refPattern = /(?:(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+))?#(?<number>\d+)/g;

    for (const match of rawValue.matchAll(refPattern)) {
      const issueNumber = Number.parseInt(match.groups?.number ?? "", 10);
      if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
        continue;
      }

      const repoSlug =
        match.groups?.owner && match.groups?.repo
          ? `${match.groups.owner}/${match.groups.repo}`
          : defaultRepoSlug;
      const key = `${repoSlug}#${issueNumber}`;

      if (!dependencies.has(key)) {
        dependencies.set(key, {
          repoSlug,
          issueNumber,
          raw: match[0]
        });
      }
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const marker = /^(depends[- ]on|blocked[- ]by)\s*:(.*)$/i.exec(line);

    if (!marker) {
      continue;
    }

    const inlineRefs = marker[2].trim();
    if (inlineRefs) {
      addDependency(inlineRefs);
      continue;
    }

    for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
      const nextLine = lines[nextIndex].trim();

      if (!nextLine || /^(depends[- ]on|blocked[- ]by)\s*:/i.test(nextLine)) {
        break;
      }

      if (/^#{1,6}\s/.test(nextLine)) {
        break;
      }

      if (/^[-*]\s+/.test(nextLine) || /#\d+/.test(nextLine)) {
        addDependency(nextLine);
        continue;
      }

      break;
    }
  }

  return [...dependencies.values()];
}

function getIssuePriorityRank(issue) {
  let rank = Number.POSITIVE_INFINITY;

  for (const label of issue?.labels ?? []) {
    const normalizedLabel = normalizeStateName(typeof label === "string" ? label : label?.name);
    if (!normalizedLabel) {
      continue;
    }

    if (PRIORITY_LABEL_RANKS.has(normalizedLabel)) {
      rank = Math.min(rank, PRIORITY_LABEL_RANKS.get(normalizedLabel));
    }
  }

  return Number.isFinite(rank) ? rank : DEFAULT_PRIORITY_RANK;
}

function compareScheduledIssues(left, right) {
  const priorityDelta = left.priorityRank - right.priorityRank;
  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const leftCreatedAt = Date.parse(left.issue.createdAt ?? "");
  const rightCreatedAt = Date.parse(right.issue.createdAt ?? "");
  const safeLeftCreatedAt = Number.isFinite(leftCreatedAt)
    ? leftCreatedAt
    : Number.MAX_SAFE_INTEGER;
  const safeRightCreatedAt = Number.isFinite(rightCreatedAt)
    ? rightCreatedAt
    : Number.MAX_SAFE_INTEGER;
  const createdAtDelta = safeLeftCreatedAt - safeRightCreatedAt;

  if (createdAtDelta !== 0) {
    return createdAtDelta;
  }

  return left.issue.number - right.issue.number;
}

function isDependencySatisfied(issue) {
  if (!issue) {
    return false;
  }

  return normalizeStateName(issue.state) !== "open" || labelSet(issue).has("agent:done");
}

async function planConsumableIssues(repoSlug, issues, github, options = {}) {
  const openIssueMap = new Map(issues.map((issue) => [`${repoSlug}#${issue.number}`, issue]));
  const dependencyCache = new Map();

  async function loadDependencyIssue(dependency) {
    const dependencyKey = `${dependency.repoSlug}#${dependency.issueNumber}`;

    if (openIssueMap.has(dependencyKey)) {
      return openIssueMap.get(dependencyKey);
    }

    if (!dependencyCache.has(dependencyKey)) {
      dependencyCache.set(
        dependencyKey,
        github
          .viewIssue(dependency.repoSlug, dependency.issueNumber, options)
          .catch((error) => ({ loadError: error }))
      );
    }

    return dependencyCache.get(dependencyKey);
  }

  const analyzedIssues = [];

  for (const issue of issues) {
    const dependencies = parseIssueDependencies(issue, repoSlug);
    const unresolvedDependencies = [];
    const dependencyWarnings = [];

    for (const dependency of dependencies) {
      if (dependency.repoSlug === repoSlug && dependency.issueNumber === issue.number) {
        unresolvedDependencies.push(dependency);
        dependencyWarnings.push(`Issue depends on itself: ${dependency.raw}`);
        continue;
      }

      const dependencyIssue = await loadDependencyIssue(dependency);
      if (dependencyIssue?.loadError) {
        unresolvedDependencies.push(dependency);
        dependencyWarnings.push(
          `Failed to load dependency ${dependency.repoSlug}#${dependency.issueNumber}: ${dependencyIssue.loadError.message}`
        );
        continue;
      }

      if (!isDependencySatisfied(dependencyIssue)) {
        unresolvedDependencies.push(dependency);
      }
    }

    analyzedIssues.push({
      issue,
      priorityRank: getIssuePriorityRank(issue),
      dependencies,
      unresolvedDependencies,
      dependencyWarnings
    });
  }

  const ready = analyzedIssues
    .filter((entry) => entry.unresolvedDependencies.length === 0)
    .sort(compareScheduledIssues);
  const blocked = analyzedIssues
    .filter((entry) => entry.unresolvedDependencies.length > 0)
    .sort(compareScheduledIssues);

  return { ready, blocked };
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

function normalizeNonNegativeInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function getReviewLoopsMax(options = {}) {
  return normalizeNonNegativeInteger(
    options.reviewLoopsMax ?? process.env.ISSUE_DRIVEN_OS_REVIEW_LOOPS_MAX,
    3
  );
}

function resolveReviewLoopsMax(runRecord, options = {}) {
  const explicitReviewLoopsMax = normalizeNonNegativeInteger(options.reviewLoopsMax, null);
  if (explicitReviewLoopsMax !== null) {
    return explicitReviewLoopsMax;
  }

  const persistedReviewLoopsMax = normalizeNonNegativeInteger(runRecord?.reviewLoopsMax, null);
  if (persistedReviewLoopsMax !== null) {
    return persistedReviewLoopsMax;
  }

  return getReviewLoopsMax(options);
}

function buildReviewLoopBudgetExceededSummary(critic, reviewLoopCount, reviewLoopsMax) {
  const baseSummary = critic?.summary?.trim() || "Critic requested additional changes.";
  return `${baseSummary} Review-loop budget exhausted (${reviewLoopCount}/${reviewLoopsMax}).`;
}

function buildLeaseLostError(issueNumber, runId, phase, reason = "lease_lost") {
  const error = new Error(
    `Lease for issue #${issueNumber} is no longer owned by run ${runId}${phase ? ` during ${phase}` : ""}.`
  );
  error.code = "ISSUE_LEASE_LOST";
  error.terminationReason = reason;
  error.phase = phase ?? null;
  return error;
}

async function recordRuntimeEvent(runtimePaths, data) {
  try {
    return await appendRuntimeEvent(runtimePaths, data);
  } catch {
    return null;
  }
}

function getLeaseRenewIntervalMs(options = {}) {
  const explicit = normalizeNonNegativeInteger(options.leaseRenewIntervalMs, null);
  if (explicit !== null) {
    return explicit;
  }

  const ttlMs = normalizeNonNegativeInteger(options.leaseTtlMs, null);
  if (ttlMs === null) {
    return 60 * 1000;
  }

  return Math.max(5 * 1000, Math.min(Math.floor(ttlMs / 3), 60 * 1000));
}

function createLeaseSupervisor(runtimePaths, repoSlug, issueNumber, runRecord, options = {}) {
  const ttlMs = options.leaseTtlMs;
  const intervalMs = getLeaseRenewIntervalMs(options);
  const state = {
    lost: false,
    lossError: null,
    timer: null
  };

  async function renew(reason = "heartbeat") {
    if (state.lost) {
      throw state.lossError ?? buildLeaseLostError(issueNumber, runRecord.id, reason);
    }

    const renewed = await renewIssueLease(runtimePaths, issueNumber, runRecord.id, {
      ttlMs
    });

    if (!renewed.renewed) {
      state.lossError = buildLeaseLostError(issueNumber, runRecord.id, reason);
      state.lost = true;
      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        issueNumber,
        runId: runRecord.id,
        actor: "worker",
        phase: "lease",
        event: "lease_lost",
        level: "error",
        message: state.lossError.message,
        data: {
          reason,
          holderId: renewed.lease?.holderId ?? null,
          runId: renewed.lease?.runId ?? null,
          expiresAt: renewed.lease?.expiresAt ?? null
        }
      });
      throw state.lossError;
    }

    return renewed.lease;
  }

  async function assertActive(reason = "lease_check") {
    if (!state.lost) {
      return;
    }
    throw state.lossError ?? buildLeaseLostError(issueNumber, runRecord.id, reason);
  }

  async function stop() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  if (intervalMs > 0) {
    state.timer = setInterval(() => {
      void renew().catch(() => {});
    }, intervalMs);
    state.timer.unref?.();
  }

  return {
    renew,
    assertActive,
    stop
  };
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

function isConsumerCandidate(issue) {
  const labels = labelSet(issue);
  return labels.has("agent:ready") || labels.has("agent:review");
}

function isClaimedIssue(issue) {
  return labelSet(issue).has("agent:claimed");
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
        buildIssueRecoveryComment(recoveredRun, lease, options),
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
    lease: forceRelease.lease ?? lease ?? null
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
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      runId: runRecord.id,
      actor: "worker",
      phase: "lease",
      event: "lease_skipped",
      message: "Issue was already claimed by another active worker.",
      data: {
        holderId: lease.lease?.holderId ?? null
      }
    });
    return buildRunSummary("skipped", "Issue is already claimed by another active worker.", {
      runId: runRecord.id,
      lease: lease.lease
    });
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
      message: `Lease acquired for issue #${issueNumber}.`
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

    let shaping;
    let shapingArtifactPath =
      runRecord.artifacts.find((artifact) => artifact.kind === "shaping")?.path ?? null;
    if (resumeContext?.shaping) {
      shaping = { payload: resumeContext.shaping };
      await recordRuntimeEvent(runtimePaths, {
        repoSlug,
        issueNumber,
        runId: runRecord.id,
        actor: "issue-shaper",
        phase: "shaping",
        event: "shaping_resumed",
        message: `Reused shaping artifact for route ${shaping.payload.route}.`,
        data: {
          route: shaping.payload.route,
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
        recentComments: issue.comments.slice(-10)
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

    if (shaping.payload.route === "split") {
      await keepLease("split_issue_creation");
      const childIssues = await createSplitIssues(repoSlug, shaping.payload, deps.github);
      await keepLease("split_issue_creation_completed");
      await keepLease("split_projection");
      return finalizeSplitRoute(shaping.payload, childIssues);
    }

    if (shaping.payload.route !== "execute") {
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

    const workspace = await deps.workspace.createIssueWorktree(
      repoPath,
      runtimePaths,
      issueNumber,
      {
        branchName: options.branchName ?? runRecord.branchRef,
        reuseExisting: true
      }
    );

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

    let activePullRequest = existingPullRequest;
    let loopResumeContext = resumeContext;

    while (true) {
      let branchSync = {
        status: "not_required",
        baseBranch: workspace.baseBranch,
        baseRef: `origin/${workspace.baseBranch}`,
        conflictedFiles: []
      };
      if (activePullRequest || loopResumeContext || runRecord.reviewLoopCount > 0) {
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
        loopResumeContext
      );

      let execution;
      let executionArtifactPath =
        runRecord.artifacts.find((artifact) => artifact.kind === "execution")?.path ?? null;
      if (loopResumeContext?.execution) {
        execution = { payload: loopResumeContext.execution };
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
          shaping: shaping.payload,
          reviewFeedback,
          branchRef: workspace.branchName,
          branchSync
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

      if (execution.payload.status === "blocked" || execution.payload.status === "split_required") {
        await keepLease("execution_blocked");
        return finalizeIssueCommentBlock({
          actor: "issue-cell-executor",
          phase: "execution",
          summary: execution.payload.summary,
          blockers: execution.payload.blockers,
          executionSummary: buildExecutorExecutionSummary(execution.payload, {
            tools: ["codex exec", "github issue edit", "github issue comment"]
          }),
          event: "execution_blocked",
          eventData: {
            blockers: execution.payload.blockers
          },
          lastCompletedPhase: "execution"
        });
      }

      let commitResult;
      if (loopResumeContext?.execution) {
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

      if (
        (!commitResult.changed && !commitResult.commitSha) ||
        execution.payload.status === "no_changes"
      ) {
        await keepLease("execution_no_changes");
        return finalizeIssueCommentBlock({
          actor: "issue-cell-executor",
          eventActor: "workspace",
          phase: "execution",
          summary: execution.payload.summary || "No code changes were produced.",
          blockers: execution.payload.blockers,
          executionSummary: buildExecutorExecutionSummary(execution.payload, {
            tools: ["codex exec", "github issue edit", "github issue comment"],
            limits: execution.payload.summary || "no_changes"
          }),
          event: "execution_no_changes",
          eventMessage: runRecord.summary,
          eventData: {
            blockers: execution.payload.blockers
          },
          lastCompletedPhase: "execution"
        });
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
        forceWithLease: Boolean(loopResumeContext) || Boolean(activePullRequest)
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
          forceWithLease: Boolean(loopResumeContext) || Boolean(activePullRequest)
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

      let critic;
      let criticArtifactPath =
        runRecord.artifacts.find((artifact) => artifact.kind === "critic")?.path ?? null;
      if (loopResumeContext?.critic) {
        critic = { payload: loopResumeContext.critic };
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
          shaping: shaping.payload,
          execution: execution.payload,
          reviewFeedback,
          pullRequest
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

      if (critic.payload.verdict !== "ready") {
        await keepLease("review_projection");
        await submitProjectedCriticReview(
          pullRequest,
          critic.payload,
          buildCriticComment(critic.payload)
        );
        await keepLease("review_projected");

        if (critic.payload.verdict === "needs_changes") {
          runRecord.reviewLoopCount += 1;
          const shouldContinue = runRecord.reviewLoopCount <= reviewLoopsMax;
          if (shouldContinue) {
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
              message: `Critic requested changes; continuing review loop ${runRecord.reviewLoopCount}/${reviewLoopsMax}.`,
              data: {
                pullRequestNumber: pullRequest.number,
                pullRequestUrl: pullRequest.url,
                reviewLoopCount: runRecord.reviewLoopCount,
                reviewLoopsMax
              }
            });
            loopResumeContext = {
              run: runRecord,
              artifacts: runRecord.artifacts,
              shaping: shaping.payload,
              execution: null,
              critic: null,
              previousExecution: execution.payload,
              previousCritic: critic.payload,
              needsRework: true
            };
            continue;
          }

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
              pullRequestNumber: pullRequest.number,
              pullRequestUrl: pullRequest.url,
              reviewLoopCount: runRecord.reviewLoopCount,
              reviewLoopsMax
            },
            terminationReason: "review_loop_budget_exhausted",
            pullRequest,
            extraSummary: {
              reviewLoopCount: runRecord.reviewLoopCount,
              reviewLoopsMax
            }
          });
        }

        await keepLease("critic_blocked");
        return finalizeCriticBlock({
          summary: critic.payload.summary,
          event: "critic_blocked",
          eventData: {
            pullRequestNumber: pullRequest.number,
            pullRequestUrl: pullRequest.url
          },
          pullRequest
        });
      }

      loopResumeContext = null;
      await keepLease("ready_review");
      await submitProjectedCriticReview(
        pullRequest,
        critic.payload,
        buildReadyComment(pullRequest.url, critic.payload)
      );
      await keepLease("merge_enable");
      await deps.github.editIssue(repoSlug, issueNumber, {
        addLabels: ["agent:review"],
        removeLabels: ["agent:claimed", "agent:ready", "agent:blocked"],
        commandOptions: options.commandOptions
      });
      await deps.github.enableAutoMerge(repoSlug, pullRequest.number, {
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
        message: `Enabled auto-merge for pull request #${pullRequest.number}.`,
        data: {
          pullRequestNumber: pullRequest.number,
          pullRequestUrl: pullRequest.url,
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
