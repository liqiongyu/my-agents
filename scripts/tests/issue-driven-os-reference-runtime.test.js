const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatScenarioBundle,
  loadScenarioBundle
} = require("../lib/issue-driven-os-reference-runtime");

test("loadScenarioBundle resolves the happy-path reference runtime bundle", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const bundle = await loadScenarioBundle(repoRoot, "G1");

  assert.equal(bundle.scenarioId, "G1");
  assert.equal(bundle.category, "golden");
  assert.deepEqual(bundle.phases, [
    "admission",
    "run_creation",
    "execution",
    "evaluation",
    "verification",
    "resolution"
  ]);
  assert.equal(bundle.startingObjects.issue.id, "issue_g1_small_bug_01");
  assert.equal(bundle.startingObjects.run.id, "run_g1_small_bug_01");

  const primaryExecution = bundle.requiredRuntimeActors.find(
    (entry) => entry.actor === "primary_execution_unit"
  );
  assert.deepEqual(primaryExecution.repoStandIn, {
    packageType: "agent",
    name: "issue-cell-executor"
  });

  const controlPlane = bundle.requiredRuntimeActors.find(
    (entry) => entry.actor === "control_plane"
  );
  assert.deepEqual(controlPlane.repoStandIn, {
    packageType: "pack",
    name: "issue-driven-os-governance"
  });

  assert.deepEqual(
    bundle.expectedArtifacts.map((entry) => entry.id),
    ["change_g1_small_bug_01", "verify_g1_pass_01"]
  );
});

test("loadScenarioBundle keeps conceptual decomposition artifacts explicit", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const bundle = await loadScenarioBundle(repoRoot, "D1");

  assert.equal(bundle.category, "decomposition");
  assert.deepEqual(bundle.phases, [
    "intake_review",
    "shaping",
    "decomposition",
    "issue_graph_update",
    "admission_blocked"
  ]);

  const shaping = bundle.requiredRuntimeActors.find(
    (entry) => entry.actor === "shaping_decomposition"
  );
  assert.deepEqual(shaping.repoStandIn, {
    packageType: "agent",
    name: "issue-shaper"
  });

  assert.deepEqual(bundle.expectedArtifacts, [
    { kind: "conceptual", ref: "decomposition_proposal" },
    { kind: "conceptual", ref: "updated_issue_graph" }
  ]);
});

test("formatScenarioBundle renders a readable summary", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const bundle = await loadScenarioBundle(repoRoot, "GT1");
  const rendered = formatScenarioBundle(bundle);

  assert.match(rendered, /Scenario: GT1 \(gate\)/);
  assert.match(rendered, /issue-cell-critic/);
  assert.match(rendered, /change_gt1_review_blocked_01/);
  assert.match(rendered, /gate_block/);
});
