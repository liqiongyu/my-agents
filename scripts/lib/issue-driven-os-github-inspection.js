const path = require("node:path");

const {
  buildRuntimePaths,
  compareIssueNumbers,
  listIssueLeases,
  listRunArtifactFiles,
  listRunRecords,
  readRunRecord,
  readRuntimeState
} = require("./issue-driven-os-state-store");

function compareIssueSummaryRecords(left, right) {
  const issueCompare = compareIssueNumbers(left.issueNumber, right.issueNumber);
  if (issueCompare !== 0) {
    return issueCompare;
  }

  return String(left.latestRunId ?? "").localeCompare(String(right.latestRunId ?? ""));
}

function normalizeIssueSummary(issueSummary = {}) {
  return {
    issueNumber: issueSummary.issueNumber ?? null,
    latestRunId: issueSummary.latestRunId ?? null,
    status: issueSummary.status ?? null,
    updatedAt: issueSummary.updatedAt ?? null,
    branchRef: issueSummary.branchRef ?? null,
    prNumber: issueSummary.prNumber ?? null
  };
}

function normalizeLease(lease = {}) {
  return {
    issueNumber: lease.issueNumber ?? null,
    holderId: lease.holderId ?? null,
    holderType: lease.holderType ?? null,
    runId: lease.runId ?? null,
    createdAt: lease.createdAt ?? null,
    expiresAt: lease.expiresAt ?? null,
    leasePath: lease.leasePath ?? null
  };
}

function normalizeRunSummary(runRecord = {}) {
  return {
    id: runRecord.id ?? null,
    issueNumber: runRecord.issueNumber ?? null,
    status: runRecord.status ?? null,
    startedAt: runRecord.startedAt ?? null,
    updatedAt: runRecord.updatedAt ?? null,
    finishedAt: runRecord.finishedAt ?? null,
    branchRef: runRecord.branchRef ?? null,
    prNumber: runRecord.prNumber ?? null,
    prUrl: runRecord.prUrl ?? null,
    summary: runRecord.summary ?? null,
    runPath: runRecord.runPath ?? null
  };
}

function normalizeArtifactFile(file = {}) {
  return {
    kind: file.kind ?? null,
    name: file.name ?? null,
    path: file.path ?? null,
    sizeBytes: file.sizeBytes ?? null,
    updatedAt: file.updatedAt ?? null
  };
}

function renderListSection(lines, title, entries, emptyLine) {
  lines.push("", title);

  if (entries.length === 0) {
    lines.push(`- ${emptyLine}`);
    return;
  }

  lines.push(...entries);
}

function formatLeaseLine(lease) {
  return [
    `- issue #${lease.issueNumber}`,
    `holder ${lease.holderId ?? "n/a"} (${lease.holderType ?? "unknown"})`,
    lease.runId ? `run ${lease.runId}` : null,
    `expires ${lease.expiresAt ?? "n/a"}`
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatIssueSummaryLine(issueSummary) {
  return [
    `- issue #${issueSummary.issueNumber}`,
    issueSummary.status ?? "unknown",
    issueSummary.latestRunId ? `latest run ${issueSummary.latestRunId}` : null,
    issueSummary.updatedAt ? `updated ${issueSummary.updatedAt}` : null,
    issueSummary.branchRef ? `branch ${issueSummary.branchRef}` : null,
    issueSummary.prNumber ? `PR #${issueSummary.prNumber}` : null
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatRunSummaryLine(runRecord) {
  return [
    `- ${runRecord.id}`,
    `issue #${runRecord.issueNumber}`,
    runRecord.status ?? "unknown",
    runRecord.updatedAt ? `updated ${runRecord.updatedAt}` : null,
    runRecord.branchRef ? `branch ${runRecord.branchRef}` : null,
    runRecord.prNumber ? `PR #${runRecord.prNumber}` : null,
    !runRecord.prNumber && runRecord.prUrl ? `PR ${runRecord.prUrl}` : null
  ]
    .filter(Boolean)
    .join(" | ");
}

async function inspectGitHubRuntime(repoSlug, options = {}) {
  const runtimePaths = buildRuntimePaths(repoSlug, {
    runtimeRoot: options.runtimeRoot
  });
  const state = await readRuntimeState(runtimePaths, repoSlug);
  const activeLeases = (await listIssueLeases(runtimePaths)).map(normalizeLease);

  if (options.runId) {
    const runRecord = await readRunRecord(runtimePaths, options.runId);
    if (!runRecord) {
      throw new Error(`Run record not found: ${options.runId}`);
    }

    const artifactFiles = (await listRunArtifactFiles(runtimePaths, options.runId)).map(
      normalizeArtifactFile
    );

    return {
      mode: "run",
      repoSlug,
      runtimeRoot: runtimePaths.baseDir,
      stateFilePath: runtimePaths.stateFilePath,
      runId: options.runId,
      run: runRecord,
      issueSummary: normalizeIssueSummary(state.issues[String(runRecord.issueNumber)]),
      activeLease:
        activeLeases.find((lease) => Number(lease.issueNumber) === Number(runRecord.issueNumber)) ??
        null,
      artifacts: {
        directory: path.join(runtimePaths.artifactsDir, options.runId),
        files: artifactFiles,
        references: Array.isArray(runRecord.artifacts) ? runRecord.artifacts : []
      }
    };
  }

  const issueSummaries = Object.values(state.issues ?? {})
    .map(normalizeIssueSummary)
    .sort(compareIssueSummaryRecords);
  const allRuns = await listRunRecords(runtimePaths);
  const recentRunLimit = Math.max(1, Number(options.limit ?? 10));
  const recentRuns = allRuns.slice(0, recentRunLimit).map(normalizeRunSummary);

  return {
    mode: "summary",
    repoSlug,
    runtimeRoot: runtimePaths.baseDir,
    stateFilePath: runtimePaths.stateFilePath,
    recentRunLimit,
    activeLeases,
    issueSummaries,
    recentRuns,
    activeLeaseCount: activeLeases.length,
    trackedIssueCount: issueSummaries.length,
    totalRunCount: allRuns.length
  };
}

function formatGitHubRuntimeInspection(report) {
  const lines = [
    `Repo: ${report.repoSlug}`,
    `Runtime root: ${report.runtimeRoot}`,
    `State file: ${report.stateFilePath}`
  ];

  if (report.mode === "run") {
    const runRecord = report.run;
    lines.push(
      "",
      "Run detail",
      `Run id: ${runRecord.id}`,
      `Run record: ${runRecord.runPath}`,
      `Issue: #${runRecord.issueNumber}`,
      `Status: ${runRecord.status ?? "unknown"}`,
      `Updated: ${runRecord.updatedAt ?? "n/a"}`,
      `Started: ${runRecord.startedAt ?? "n/a"}`,
      `Finished: ${runRecord.finishedAt ?? "n/a"}`,
      `Branch: ${runRecord.branchRef ?? "n/a"}`,
      `PR: ${
        runRecord.prNumber ? `#${runRecord.prNumber}` : runRecord.prUrl ? runRecord.prUrl : "n/a"
      }`,
      `Summary: ${runRecord.summary ?? "n/a"}`,
      `Artifacts dir: ${report.artifacts.directory}`
    );

    renderListSection(
      lines,
      "Artifact files",
      report.artifacts.files.map((file) => `- ${file.kind}: ${file.path}`),
      "none"
    );
    renderListSection(
      lines,
      "Persisted artifact refs",
      (report.artifacts.references ?? []).map(
        (artifact) => `- ${artifact.kind ?? "unknown"}: ${artifact.path ?? "n/a"}`
      ),
      "none"
    );

    if (report.issueSummary?.latestRunId) {
      renderListSection(
        lines,
        "Issue summary state",
        [formatIssueSummaryLine(report.issueSummary)],
        "none"
      );
    }

    if (report.activeLease) {
      renderListSection(lines, "Active lease", [formatLeaseLine(report.activeLease)], "none");
    }

    return `${lines.join("\n")}\n`;
  }

  lines.push(
    `Active leases: ${report.activeLeaseCount}`,
    `Tracked issues: ${report.trackedIssueCount}`,
    `Recent runs shown: ${report.recentRuns.length}/${report.totalRunCount}`
  );

  renderListSection(lines, "Active leases", report.activeLeases.map(formatLeaseLine), "none");
  renderListSection(
    lines,
    "Issue summary state",
    report.issueSummaries.map(formatIssueSummaryLine),
    "none"
  );
  renderListSection(lines, "Recent runs", report.recentRuns.map(formatRunSummaryLine), "none");

  return `${lines.join("\n")}\n`;
}

module.exports = {
  formatGitHubRuntimeInspection,
  inspectGitHubRuntime
};
