const {
  DEFAULT_LEASE_TTL_MS,
  appendRuntimeEvent,
  buildLeaseHistoryRecord,
  renewIssueLease
} = require("../../scripts/lib/issue-driven-os-state-store");

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

async function recordRuntimeEvent(runtimePaths, data) {
  try {
    return await appendRuntimeEvent(runtimePaths, data);
  } catch {
    return null;
  }
}

function snapshotLeaseForRun(lease) {
  if (!lease || typeof lease !== "object") {
    return null;
  }

  const snapshot = { ...lease };
  delete snapshot.leasePath;
  return snapshot;
}

function buildRecoveredLeaseSnapshot(lease, options = {}) {
  if (!lease || typeof lease !== "object") {
    return null;
  }

  const recoveredAt = options.recoveredAt ?? new Date().toISOString();
  const recoveredAtDate = new Date(recoveredAt);
  const snapshotNow = Number.isNaN(recoveredAtDate.getTime()) ? new Date() : recoveredAtDate;
  const previousLease = buildLeaseHistoryRecord(lease, snapshotNow);

  if (!previousLease) {
    return null;
  }

  const recoveryReason =
    options.recoveryReason ?? (previousLease.leaseStatus === "expired" ? "expired" : "force");
  const lastOutcome =
    options.lastOutcome ?? (recoveryReason === "expired" ? "expired_recovered" : "force_recovered");

  return {
    ...previousLease,
    updatedAt: recoveredAt,
    lastOutcome,
    recoveredAt,
    recoveryReason,
    leaseStatus: "released",
    previousLease
  };
}

function isLeaseOwnedByRun(lease, runRecord) {
  if (!lease || !runRecord?.id) {
    return false;
  }

  return (
    lease.holderId === runRecord.id &&
    (lease.runId === null || lease.runId === undefined || lease.runId === runRecord.id)
  );
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

function buildLeaseLossMessage(issueNumber, reason, observedLease, details = {}) {
  const reasonText =
    reason === "holder_mismatch"
      ? "another worker recovered or replaced this lease"
      : reason === "expired"
        ? "this lease expired before it could be renewed"
        : reason === "missing"
          ? "the lease record disappeared"
          : reason === "error"
            ? (details.errorMessage ?? "lease renewal failed")
            : `lease renewal reported ${reason}`;

  return [
    `Lease lost for issue #${issueNumber}: ${reasonText}.`,
    observedLease?.holderId ? `Current holder: ${observedLease.holderId}.` : null,
    observedLease?.runId ? `Current run: ${observedLease.runId}.` : null,
    observedLease?.lastOutcome ? `Observed outcome: ${observedLease.lastOutcome}.` : null
  ]
    .filter(Boolean)
    .join(" ");
}

function buildLeaseLostError(issueNumber, runRecord, phase, reason, observedLease, details = {}) {
  const error = new Error(buildLeaseLossMessage(issueNumber, reason, observedLease, details));
  error.code = "ISSUE_LEASE_LOST";
  error.terminationReason = "lease_lost";
  error.phase = phase ?? null;
  error.leaseReason = reason;
  error.observedLease = snapshotLeaseForRun(observedLease);
  error.runId = runRecord?.id ?? null;
  return error;
}

function getLeaseRenewIntervalMs(options = {}) {
  const explicitHeartbeat = normalizeNonNegativeInteger(options.leaseHeartbeatMs, null);
  if (explicitHeartbeat !== null) {
    return explicitHeartbeat;
  }

  const explicit = normalizeNonNegativeInteger(options.leaseRenewIntervalMs, null);
  if (explicit !== null) {
    return explicit;
  }

  const ttlMs = normalizeNonNegativeInteger(options.leaseTtlMs, DEFAULT_LEASE_TTL_MS);
  return Math.max(5 * 1000, Math.min(Math.floor(ttlMs / 3), 60 * 1000));
}

function createLeaseSupervisor(runtimePaths, repoSlug, issueNumber, runRecord, options = {}) {
  const ttlMs = normalizeNonNegativeInteger(options.leaseTtlMs, DEFAULT_LEASE_TTL_MS);
  const intervalMs = getLeaseRenewIntervalMs(options);
  const state = {
    lost: false,
    lossError: null,
    timer: null,
    inFlight: Promise.resolve()
  };

  function markLost(reason, phase, observedLease, details = {}) {
    if (state.lost) {
      return state.lossError;
    }

    const detectedAt = new Date().toISOString();
    const observedLeaseSnapshot = snapshotLeaseForRun(observedLease);
    const message = buildLeaseLossMessage(issueNumber, reason, observedLeaseSnapshot, details);
    runRecord.leaseFailure = {
      reason,
      detectedAt,
      observedLease: observedLeaseSnapshot
    };
    runRecord.notes.push(message);
    state.lost = true;
    state.lossError = buildLeaseLostError(
      issueNumber,
      runRecord,
      phase,
      reason,
      observedLeaseSnapshot,
      details
    );
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    void recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      runId: runRecord.id,
      actor: "worker",
      phase: "lease",
      event: "lease_lost",
      level: "error",
      message,
      data: {
        reason,
        phase,
        observedLease: observedLeaseSnapshot
      }
    });
    return state.lossError;
  }

  async function runRenewal(phase = "heartbeat") {
    if (state.lost) {
      throw state.lossError ?? buildLeaseLostError(issueNumber, runRecord, phase, "lease_lost");
    }

    let renewed;
    try {
      renewed = await renewIssueLease(runtimePaths, issueNumber, runRecord.id, {
        ttlMs,
        runId: runRecord.id
      });
    } catch (error) {
      throw markLost("error", phase, null, { errorMessage: error.message });
    }

    if (!renewed.renewed) {
      throw markLost(renewed.reason, phase, renewed.lease);
    }

    if (isLeaseOwnedByRun(renewed.lease, runRecord)) {
      runRecord.lease = snapshotLeaseForRun(renewed.lease);
    }
    await recordRuntimeEvent(runtimePaths, {
      repoSlug,
      issueNumber,
      runId: runRecord.id,
      actor: "worker",
      phase: "lease",
      event: "lease_renewed",
      message: `Renewed lease for issue #${issueNumber}.`,
      data: {
        renewalCount: renewed.lease?.renewalCount ?? 0,
        expiresAt: renewed.lease?.expiresAt ?? null,
        phase
      }
    });
    return renewed.lease;
  }

  function renew(phase = "heartbeat") {
    const operation = state.inFlight.then(() => runRenewal(phase));
    state.inFlight = operation.catch(() => {});
    return operation;
  }

  async function assertActive(phase = "lease_check") {
    if (state.lost) {
      throw state.lossError ?? buildLeaseLostError(issueNumber, runRecord, phase, "lease_lost");
    }
  }

  async function stop() {
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    await state.inFlight;
  }

  state.timer = setInterval(() => {
    void renew("heartbeat");
  }, intervalMs);
  state.timer.unref?.();

  return {
    assertActive,
    renew,
    stop
  };
}

module.exports = {
  buildLeaseCollisionSummary,
  buildLeaseLossMessage,
  buildLeaseLostError,
  buildLeaseRecoveryNote,
  buildRecoveredLeaseSnapshot,
  buildReviewLoopBudgetExceededSummary,
  createLeaseSupervisor,
  getLeaseRenewIntervalMs,
  getReviewLoopsMax,
  isLeaseOwnedByRun,
  normalizeNonNegativeInteger,
  resolveReviewLoopsMax,
  snapshotLeaseForRun
};
