const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatScenarioSimulation,
  simulateScenario
} = require("../lib/issue-driven-os-scenario-harness");

test("simulateScenario builds a phase-driven transcript for the happy path", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const simulation = await simulateScenario(repoRoot, "G1");

  assert.equal(simulation.scenarioId, "G1");
  assert.equal(simulation.transcript.length, 6);
  assert.equal(simulation.transcript[0].phase, "admission");
  assert.equal(simulation.transcript[0].actor.actor, "control_plane");
  assert.equal(simulation.transcript[2].phase, "execution");
  assert.equal(simulation.transcript[2].actor.actor, "primary_execution_unit");
  assert.deepEqual(simulation.finalStateOutcomes, {
    issue: "resolved",
    run: "succeeded",
    change: "merge_ready"
  });
});

test("simulateScenario keeps budget termination and handoff explicit for failure paths", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const simulation = await simulateScenario(repoRoot, "F1");

  const budgetTermination = simulation.transcript.find(
    (entry) => entry.phase === "budget_termination"
  );
  assert.equal(budgetTermination.actor.actor, "budget_service");
  assert.equal(budgetTermination.actor.repoStandIn.name, "budget-decision");

  const handoff = simulation.transcript.find((entry) => entry.phase === "handoff");
  assert.ok(
    handoff.expectedArtifacts.some(
      (artifact) => artifact.kind === "handoff" && artifact.id === "handoff_f1_budget_exhausted_01"
    )
  );
});

test("formatScenarioSimulation renders a readable transcript", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const simulation = await simulateScenario(repoRoot, "D1");
  const rendered = formatScenarioSimulation(simulation);

  assert.match(rendered, /Scenario simulation: D1 \(decomposition\)/);
  assert.match(rendered, /shaping_decomposition/);
  assert.match(rendered, /conceptual=decomposition_proposal/);
  assert.match(rendered, /admission_blocked/);
});
