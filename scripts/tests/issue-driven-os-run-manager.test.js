const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  createReferenceRuntimeSession,
  runReferenceScenario
} = require("../lib/issue-driven-os-run-manager");
const { simulateScenario } = require("../lib/issue-driven-os-scenario-harness");

test("createReferenceRuntimeSession builds a stateful transcript artifact", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const simulation = await simulateScenario(repoRoot, "GT1");
  const session = createReferenceRuntimeSession(simulation, {
    id: "reference_run_gt1_fixed",
    startedAt: "2026-03-29T12:00:00Z",
    finishedAt: "2026-03-29T12:05:00Z"
  });

  assert.equal(session.kind, "reference-runtime-session");
  assert.equal(session.mode, "phase-simulation");
  assert.equal(session.id, "reference_run_gt1_fixed");
  assert.equal(session.transcript.length, 6);
  assert.ok(
    session.artifactTrail.some(
      (entry) => entry.phase === "gate_block" && entry.kind === "verification"
    )
  );
  assert.deepEqual(session.finalStateOutcomes, {
    issue: "active",
    run: "failed",
    change: "changes_requested"
  });
});

test("runReferenceScenario persists a session artifact by default", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "issue-driven-os-run-"));

  try {
    const outputPath = path.join(tmp, "g1-session.json");
    const { session } = await runReferenceScenario(repoRoot, "G1", {
      outputPath,
      startedAt: "2026-03-29T12:10:00Z",
      finishedAt: "2026-03-29T12:11:00Z"
    });

    const saved = JSON.parse(await fs.readFile(outputPath, "utf8"));
    assert.equal(saved.id, session.id);
    assert.equal(saved.scenarioId, "G1");
    assert.equal(saved.status, "completed");
    assert.ok(saved.artifactTrail.length >= 2);
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});

test("runReferenceScenario can skip persistence for stdout/json flows", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "issue-driven-os-run-no-write-"));

  try {
    const outputPath = path.join(tmp, "d1-session.json");
    const result = await runReferenceScenario(repoRoot, "D1", {
      outputPath,
      persist: false,
      startedAt: "2026-03-29T12:20:00Z",
      finishedAt: "2026-03-29T12:20:30Z"
    });

    await assert.rejects(fs.access(outputPath));
    assert.equal(result.session.scenarioId, "D1");
    assert.equal(result.session.artifactTrail[0].kind, "conceptual");
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
