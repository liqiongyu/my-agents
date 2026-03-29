const fs = require("node:fs/promises");
const path = require("node:path");

const { simulateScenario } = require("./issue-driven-os-scenario-harness");

function toCompactTimestamp(isoString) {
  return isoString.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildDefaultSessionId(scenarioId, startedAt) {
  return `reference_run_${scenarioId.toLowerCase()}_${toCompactTimestamp(startedAt)}`;
}

function buildDefaultOutputPath(repoRoot, scenarioId, startedAt) {
  return path.join(
    repoRoot,
    ".tmp",
    "issue-driven-os-runs",
    `${scenarioId.toLowerCase()}-${toCompactTimestamp(startedAt)}.json`
  );
}

function buildArtifactTrail(transcript) {
  return (transcript ?? []).flatMap((phase) =>
    (phase.expectedArtifacts ?? []).map((artifact) => ({
      phaseIndex: phase.index,
      phase: phase.phase,
      actor: phase.actor.actor,
      kind: artifact.kind,
      id: artifact.id ?? null,
      ref: artifact.ref ?? null,
      state: artifact.state ?? null
    }))
  );
}

function buildStartingObjectSummary(simulation) {
  const firstPhase = simulation.transcript?.[0];
  if (!firstPhase) return [];
  return (firstPhase.inputs ?? []).map((input) => ({
    label: input.label,
    kind: input.kind,
    id: input.id,
    state: input.state ?? null
  }));
}

function createReferenceRuntimeSession(simulation, options = {}) {
  const startedAt = options.startedAt ?? new Date().toISOString();
  const finishedAt = options.finishedAt ?? startedAt;
  const id = options.id ?? buildDefaultSessionId(simulation.scenarioId, startedAt);

  return {
    id,
    kind: "reference-runtime-session",
    mode: "phase-simulation",
    scenarioId: simulation.scenarioId,
    category: simulation.category,
    goal: simulation.goal,
    status: "completed",
    startedAt,
    finishedAt,
    startingObjects: buildStartingObjectSummary(simulation),
    transcript: simulation.transcript ?? [],
    artifactTrail: buildArtifactTrail(simulation.transcript),
    finalStateOutcomes: simulation.finalStateOutcomes ?? {},
    disallowedBehaviors: simulation.disallowedBehaviors ?? []
  };
}

async function writeReferenceRuntimeSession(outputPath, session) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(session, null, 2)}\n`, "utf8");
}

async function runReferenceScenario(repoRoot, scenarioId, options = {}) {
  const simulation = await simulateScenario(repoRoot, scenarioId);
  const session = createReferenceRuntimeSession(simulation, {
    startedAt: options.startedAt,
    finishedAt: options.finishedAt,
    id: options.id
  });

  const outputPath =
    options.outputPath ?? buildDefaultOutputPath(repoRoot, scenarioId, session.startedAt);

  if (options.persist !== false) {
    await writeReferenceRuntimeSession(outputPath, session);
  }

  return {
    outputPath,
    session
  };
}

module.exports = {
  buildArtifactTrail,
  buildDefaultOutputPath,
  buildDefaultSessionId,
  createReferenceRuntimeSession,
  runReferenceScenario,
  writeReferenceRuntimeSession
};
