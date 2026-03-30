const fs = require("node:fs/promises");
const path = require("node:path");

const {
  buildRuntimePaths,
  inspectRuntimeState: inspectStoredRuntimeState
} = require("./issue-driven-os-state-store");

function compareIssueNumbers(left, right) {
  const safeLeft = Number.isInteger(Number(left)) ? Number(left) : Number.MAX_SAFE_INTEGER;
  const safeRight = Number.isInteger(Number(right)) ? Number(right) : Number.MAX_SAFE_INTEGER;
  return safeLeft - safeRight;
}

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
    prNumber: issueSummary.prNumber ?? null,
    lease: normalizeLease(issueSummary.lease)
  };
}

function normalizeLease(lease = {}) {
  if (!lease || typeof lease !== "object") {
    return null;
  }

  return {
    issueNumber: lease.issueNumber ?? null,
    holderId: lease.holderId ?? null,
    holderType: lease.holderType ?? null,
    runId: lease.runId ?? null,
    createdAt: lease.createdAt ?? null,
    updatedAt: lease.updatedAt ?? null,
    renewedAt: lease.renewedAt ?? null,
    renewalCount: lease.renewalCount ?? null,
    expiresAt: lease.expiresAt ?? null,
    lastOutcome: lease.lastOutcome ?? null,
    recoveredAt: lease.recoveredAt ?? null,
    recoveryReason: lease.recoveryReason ?? null,
    leaseStatus: lease.leaseStatus ?? null,
    previousLease: normalizeLease(lease.previousLease),
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
    lease: normalizeLease(runRecord.lease),
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
  const previousLease =
    lease.previousLease?.holderId || lease.previousLease?.runId
      ? [
          "previous",
          lease.previousLease.holderId ?? "n/a",
          lease.previousLease.runId ? `run ${lease.previousLease.runId}` : null,
          lease.previousLease.leaseStatus ?? null
        ]
          .filter(Boolean)
          .join(" ")
      : null;

  return [
    `- issue #${lease.issueNumber}`,
    lease.leaseStatus ?? "unknown",
    lease.lastOutcome ? `outcome ${lease.lastOutcome}` : null,
    lease.renewalCount ? `renewals ${lease.renewalCount}` : null,
    `holder ${lease.holderId ?? "n/a"} (${lease.holderType ?? "unknown"})`,
    lease.runId ? `run ${lease.runId}` : null,
    `expires ${lease.expiresAt ?? "n/a"}`,
    previousLease
  ]
    .filter(Boolean)
    .join(" | ");
}

function formatLeaseSummary(lease) {
  if (!lease) {
    return null;
  }

  return [
    "lease",
    lease.leaseStatus ?? "unknown",
    lease.lastOutcome && lease.lastOutcome !== "acquired" ? `(${lease.lastOutcome})` : null,
    lease.renewalCount ? `renewals ${lease.renewalCount}` : null
  ]
    .filter(Boolean)
    .join(" ");
}

function formatIssueSummaryLine(issueSummary) {
  return [
    `- issue #${issueSummary.issueNumber}`,
    issueSummary.status ?? "unknown",
    issueSummary.latestRunId ? `latest run ${issueSummary.latestRunId}` : null,
    issueSummary.updatedAt ? `updated ${issueSummary.updatedAt}` : null,
    issueSummary.branchRef ? `branch ${issueSummary.branchRef}` : null,
    issueSummary.prNumber ? `PR #${issueSummary.prNumber}` : null,
    formatLeaseSummary(issueSummary.lease)
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
    !runRecord.prNumber && runRecord.prUrl ? `PR ${runRecord.prUrl}` : null,
    formatLeaseSummary(runRecord.lease)
  ]
    .filter(Boolean)
    .join(" | ");
}

async function inspectGitHubRuntime(repoSlug, options = {}) {
  const runtimePaths = buildRuntimePaths(repoSlug, {
    runtimeRoot: options.runtimeRoot
  });
  const snapshot = await inspectStoredRuntimeState(runtimePaths, repoSlug, {
    runId: options.runId,
    limit: options.limit,
    eventLimit: options.eventLimit
  });
  const state = snapshot.state;
  const activeLeases = (snapshot.activeLeases ?? []).map(normalizeLease);
  const staleLeases = (snapshot.staleLeases ?? []).map(normalizeLease);
  const allLeaseRecords = [...activeLeases, ...staleLeases].sort((left, right) =>
    compareIssueNumbers(left?.issueNumber, right?.issueNumber)
  );

  if (options.runId) {
    const runRecord = snapshot.run
      ? {
          ...snapshot.run,
          runPath: path.join(runtimePaths.runsDir, `${options.runId}.json`)
        }
      : null;
    if (!runRecord) {
      throw new Error(`Run record not found: ${options.runId}`);
    }

    const artifactFiles = await Promise.all(
      (snapshot.artifacts ?? []).map(async (artifact) => {
        let sizeBytes = null;
        let updatedAt = null;
        let name = path.basename(artifact.path ?? "");

        try {
          const stats = await fs.stat(artifact.path);
          sizeBytes = stats.size;
          updatedAt = stats.mtime.toISOString();
        } catch {
          // Preserve inspection output even if a file disappears mid-read.
        }

        return normalizeArtifactFile({
          ...artifact,
          name,
          sizeBytes,
          updatedAt
        });
      })
    );

    return {
      ...snapshot,
      mode: "run",
      repoSlug,
      runtimeRoot: runtimePaths.baseDir,
      stateFilePath: runtimePaths.stateFilePath,
      runId: options.runId,
      run: {
        ...runRecord,
        lease: normalizeLease(runRecord.lease)
      },
      issueSummary: normalizeIssueSummary(state.issues[String(runRecord.issueNumber)]),
      leaseRecord:
        allLeaseRecords.find(
          (lease) => Number(lease.issueNumber) === Number(runRecord.issueNumber)
        ) ?? null,
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
  const allRuns = Object.keys(state.runs ?? {});
  const recentRunLimit = Math.max(1, Number(options.limit ?? 10));
  const recentRuns = (snapshot.recentRuns ?? []).map((runRecord) =>
    normalizeRunSummary({
      ...runRecord,
      runPath: path.join(runtimePaths.runsDir, `${runRecord.id}.json`)
    })
  );

  return {
    ...snapshot,
    mode: "summary",
    repoSlug,
    runtimeRoot: runtimePaths.baseDir,
    stateFilePath: runtimePaths.stateFilePath,
    recentRunLimit,
    activeLeases,
    staleLeases,
    issueSummaries,
    recentRuns,
    activeLeaseCount: activeLeases.length,
    staleLeaseCount: staleLeases.length,
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
      `Lease snapshot: ${formatLeaseSummary(runRecord.lease) ?? "n/a"}`,
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

    if (report.leaseRecord) {
      renderListSection(lines, "Lease record", [formatLeaseLine(report.leaseRecord)], "none");
    }

    return `${lines.join("\n")}\n`;
  }

  lines.push(
    `Active leases: ${report.activeLeaseCount}`,
    `Stale leases: ${report.staleLeaseCount}`,
    `Tracked issues: ${report.trackedIssueCount}`,
    `Recent runs shown: ${report.recentRuns.length}/${report.totalRunCount}`
  );

  renderListSection(lines, "Active leases", report.activeLeases.map(formatLeaseLine), "none");
  renderListSection(lines, "Stale leases", report.staleLeases.map(formatLeaseLine), "none");
  renderListSection(
    lines,
    "Issue summary state",
    report.issueSummaries.map(formatIssueSummaryLine),
    "none"
  );
  renderListSection(lines, "Recent runs", report.recentRuns.map(formatRunSummaryLine), "none");

  return `${lines.join("\n")}\n`;
}

const inspectRuntimeState = inspectGitHubRuntime;

module.exports = {
  formatGitHubRuntimeInspection,
  inspectGitHubRuntime,
  inspectRuntimeState
};
