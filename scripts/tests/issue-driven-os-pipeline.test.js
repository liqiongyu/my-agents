const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const { runIssueDrivenOsPipeline } = require("../lib/issue-driven-os-pipeline");

test("runIssueDrivenOsPipeline persists session and projection artifacts together", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "issue-driven-os-pipeline-"));

  try {
    const outputDir = path.join(tmp, "g1-pipeline");
    const result = await runIssueDrivenOsPipeline(repoRoot, "G1", {
      outputDir,
      startedAt: "2026-03-29T14:30:00Z",
      finishedAt: "2026-03-29T14:31:00Z"
    });

    const session = JSON.parse(await fs.readFile(path.join(outputDir, "session.json"), "utf8"));
    const projection = JSON.parse(
      await fs.readFile(path.join(outputDir, "projection.json"), "utf8")
    );

    assert.equal(result.scenarioId, "G1");
    assert.equal(session.scenarioId, "G1");
    assert.equal(projection.source.sessionId, session.id);
    assert.equal(projection.pullRequestProjection.mergeEligibility, "merge_ready");
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("runIssueDrivenOsPipeline can return JSON-only results without persistence", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "issue-driven-os-pipeline-no-write-"));

  try {
    const outputDir = path.join(tmp, "f1-pipeline");
    const result = await runIssueDrivenOsPipeline(repoRoot, "F1", {
      outputDir,
      persist: false,
      startedAt: "2026-03-29T14:40:00Z",
      finishedAt: "2026-03-29T14:42:00Z"
    });

    await assert.rejects(fs.access(path.join(outputDir, "session.json")));
    await assert.rejects(fs.access(path.join(outputDir, "projection.json")));
    assert.equal(result.payload.issueProjection.visibleState, "active");
    assert.equal(result.payload.pullRequestProjection.mergeEligibility, "blocked");
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
