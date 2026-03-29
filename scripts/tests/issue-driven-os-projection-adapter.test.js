const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createProjectionPayload,
  projectReferenceRuntimeSession
} = require("../lib/issue-driven-os-projection-adapter");
const { runReferenceScenario } = require("../lib/issue-driven-os-run-manager");

test("createProjectionPayload derives a merge-ready projection from a successful session", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "issue-driven-os-projection-g1-"));

  try {
    const sessionPath = path.join(tmp, "g1-session.json");
    const { session } = await runReferenceScenario(repoRoot, "G1", {
      outputPath: sessionPath,
      startedAt: "2026-03-29T13:00:00Z",
      finishedAt: "2026-03-29T13:01:00Z"
    });

    const payload = createProjectionPayload(session);
    assert.deepEqual(payload.issueProjection.labels, ["type:bug", "priority:p2", "risk:low"]);
    assert.equal(payload.issueProjection.visibleState, "resolved");
    assert.equal(payload.pullRequestProjection.reviewState, "approved");
    assert.equal(payload.pullRequestProjection.mergeEligibility, "merge_ready");
    assert.ok(payload.checksProjection.some((check) => check.name === "merge_gate"));
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("createProjectionPayload keeps failed review and recovery artifacts visible", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "issue-driven-os-projection-f1-"));

  try {
    const sessionPath = path.join(tmp, "f1-session.json");
    const { session } = await runReferenceScenario(repoRoot, "F1", {
      outputPath: sessionPath,
      startedAt: "2026-03-29T13:10:00Z",
      finishedAt: "2026-03-29T13:15:00Z"
    });

    const payload = createProjectionPayload(session);
    assert.equal(payload.issueProjection.visibleState, "active");
    assert.equal(payload.pullRequestProjection.mergeEligibility, "blocked");
    assert.ok(
      payload.commentIntents.some((comment) => comment.kind === "handoff-link"),
      "expected handoff link intent for failed run projection"
    );
    assert.ok(
      payload.checksProjection.some((check) => check.name === "runtime_attempt"),
      "expected runtime attempt check when no verification artifact exists"
    );
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("projectReferenceRuntimeSession writes a projection payload artifact", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "issue-driven-os-project-write-"));

  try {
    const sessionPath = path.join(tmp, "gt1-session.json");
    await runReferenceScenario(repoRoot, "GT1", {
      outputPath: sessionPath,
      startedAt: "2026-03-29T13:20:00Z",
      finishedAt: "2026-03-29T13:21:00Z"
    });

    const projectionPath = path.join(tmp, "gt1-projection.json");
    const result = await projectReferenceRuntimeSession(repoRoot, sessionPath, {
      outputPath: projectionPath
    });

    const saved = JSON.parse(await fs.readFile(projectionPath, "utf8"));
    assert.equal(saved.source.sessionId, result.session.id);
    assert.equal(saved.pullRequestProjection.reviewState, "changes_requested");
    assert.equal(saved.pullRequestProjection.mergeEligibility, "blocked");
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
