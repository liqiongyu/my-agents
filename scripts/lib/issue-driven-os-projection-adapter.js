const fs = require("node:fs/promises");
const path = require("node:path");

const PASS_STATUS = "success";
const FAIL_STATUS = "failure";
const SKIP_STATUS = "skipped";

async function readReferenceRuntimeSession(sessionPath) {
  const raw = await fs.readFile(sessionPath, "utf8");
  return JSON.parse(raw);
}

function findStartingIssue(session) {
  return (session.startingObjects ?? []).find((entry) => entry.kind === "issue") ?? null;
}

function findArtifactByKind(session, kind) {
  const matches = (session.artifactTrail ?? []).filter((entry) => entry.kind === kind);
  return matches.at(-1) ?? null;
}

function toIssueLabels(issue) {
  const labels = [];
  if (issue?.type) labels.push(`type:${issue.type}`);
  if (issue?.priority) labels.push(`priority:${issue.priority}`);
  if (issue?.riskLevel) labels.push(`risk:${issue.riskLevel}`);
  return labels;
}

function projectReviewState(verification) {
  const reviewGate = verification?.gateResults?.review_gate;
  if (reviewGate === "pass") return "approved";
  if (reviewGate === "fail") return "changes_requested";
  return "not_applicable";
}

function projectMergeEligibility(session, verification) {
  if (verification?.gateResults?.merge_gate === "pass") {
    return "merge_ready";
  }
  if (session.finalStateOutcomes?.change === "changes_requested") {
    return "blocked";
  }
  if (session.finalStateOutcomes?.run === "failed") {
    return "blocked";
  }
  return "pending";
}

function gateStatusToCheckConclusion(value) {
  if (value === "pass") return PASS_STATUS;
  if (value === "fail") return FAIL_STATUS;
  return SKIP_STATUS;
}

function buildChecks(verification, session) {
  const checks = [];
  if (verification?.gateResults) {
    for (const [gate, result] of Object.entries(verification.gateResults)) {
      checks.push({
        name: gate,
        conclusion: gateStatusToCheckConclusion(result),
        sourceVerificationId: verification.id ?? null
      });
    }
  } else if (session.finalStateOutcomes?.run === "failed") {
    checks.push({
      name: "runtime_attempt",
      conclusion: FAIL_STATUS,
      sourceVerificationId: null
    });
  }
  return checks;
}

function buildArtifactLinks(session) {
  return (session.artifactTrail ?? [])
    .filter((entry) => entry.id || entry.ref)
    .map((entry) => ({
      kind: entry.kind,
      id: entry.id ?? null,
      ref: entry.ref ?? null,
      sourcePhase: entry.phase
    }));
}

function buildProjectionComments(session, handoff) {
  const comments = [
    {
      kind: "runtime-session-link",
      body: `Reference runtime session ${session.id} derived from scenario ${session.scenarioId}.`
    }
  ];

  if (handoff?.id) {
    comments.push({
      kind: "handoff-link",
      body: `Handoff bundle available: ${handoff.id}.`
    });
  }

  if (session.finalStateOutcomes?.run === "failed") {
    comments.push({
      kind: "failure-note",
      body: `Run finished in failed state for scenario ${session.scenarioId}; projection should remain open and recoverable.`
    });
  }

  return comments;
}

function createProjectionPayload(session) {
  const issue = findStartingIssue(session);
  const change = findArtifactByKind(session, "change");
  const verification = findArtifactByKind(session, "verification");
  const handoff = findArtifactByKind(session, "handoff");

  return {
    schemaVersion: 1,
    kind: "reference-projection-payload",
    source: {
      sessionId: session.id,
      scenarioId: session.scenarioId,
      canonicalIssueId: issue?.id ?? null,
      canonicalRunState: session.finalStateOutcomes?.run ?? null
    },
    issueProjection: {
      canonicalIssueId: issue?.id ?? null,
      title: issue?.title ?? null,
      summary: issue?.summary ?? null,
      labels: toIssueLabels(issue),
      visibleState: session.finalStateOutcomes?.issue ?? issue?.state ?? null,
      projectionStateMarker: "derived_from_reference_session"
    },
    pullRequestProjection: {
      branchRef: change?.branchRef ?? null,
      prRef: change?.prRef ?? null,
      reviewState: projectReviewState(verification),
      mergeEligibility: projectMergeEligibility(session, verification)
    },
    checksProjection: buildChecks(verification, session),
    artifactLinks: buildArtifactLinks(session),
    commentIntents: buildProjectionComments(session, handoff),
    driftPolicy: {
      sourceOfTruth: "canonical_and_reference_runtime",
      onMismatch: "mark_drift_and_request_repair",
      projectionMayNotOverrideCanonicalState: true
    }
  };
}

function buildDefaultProjectionPath(repoRoot, session) {
  return path.join(repoRoot, ".tmp", "issue-driven-os-projections", `${session.id}.json`);
}

async function writeProjectionPayload(outputPath, payload) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function projectReferenceRuntimeSession(repoRoot, sessionPath, options = {}) {
  const session = await readReferenceRuntimeSession(sessionPath);
  const payload = createProjectionPayload(session);
  const outputPath = options.outputPath ?? buildDefaultProjectionPath(repoRoot, session);

  if (options.persist !== false) {
    await writeProjectionPayload(outputPath, payload);
  }

  return {
    session,
    payload,
    outputPath
  };
}

module.exports = {
  buildDefaultProjectionPath,
  createProjectionPayload,
  projectReferenceRuntimeSession,
  readReferenceRuntimeSession,
  writeProjectionPayload
};
