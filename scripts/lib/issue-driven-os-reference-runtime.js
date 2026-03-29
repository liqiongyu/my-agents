const path = require("node:path");

const {
  getIssueDrivenOsExamplesDir,
  loadIssueDrivenOsFixtures,
  looksLikeFixturePath
} = require("./issue-driven-os-fixtures");

const REFERENCE_RUNTIME_ACTORS = {
  control_plane: {
    runtimeType: "governance-plane",
    canonicalFamily: "Governance / Control",
    repoStandIn: {
      packageType: "pack",
      name: "issue-driven-os-governance"
    }
  },
  issue_cell: {
    runtimeType: "execution-cell",
    canonicalFamily: "Issue Cell",
    repoStandIn: {
      packageType: "pack",
      name: "issue-driven-os-core"
    }
  },
  primary_execution_unit: {
    runtimeType: "agent",
    canonicalFamily: "Primary Execution Unit",
    repoStandIn: {
      packageType: "agent",
      name: "issue-cell-executor"
    }
  },
  evaluator_path: {
    runtimeType: "agent",
    canonicalFamily: "Evaluator Path",
    repoStandIn: {
      packageType: "agent",
      name: "issue-cell-critic"
    }
  },
  shaping_decomposition: {
    runtimeType: "agent",
    canonicalFamily: "Shaping / Decomposition",
    repoStandIn: {
      packageType: "agent",
      name: "issue-shaper"
    }
  },
  issue_intake: {
    runtimeType: "agent",
    canonicalFamily: "Intake / Normalization",
    repoStandIn: {
      packageType: "agent",
      name: "issue-intake-normalizer"
    }
  },
  budget_service: {
    runtimeType: "service",
    canonicalFamily: "Budget Enforcement Service",
    repoStandIn: {
      packageType: "skill",
      name: "budget-decision"
    }
  }
};

const SCENARIO_PHASES = {
  golden: ["admission", "run_creation", "execution", "evaluation", "verification", "resolution"],
  gate: ["admission", "run_creation", "execution", "evaluation", "verification", "gate_block"],
  failure: [
    "admission",
    "run_creation",
    "execution",
    "evaluation_loop",
    "budget_termination",
    "handoff"
  ],
  decomposition: [
    "intake_review",
    "shaping",
    "decomposition",
    "issue_graph_update",
    "admission_blocked"
  ]
};

function buildObjectSummary(entry) {
  return {
    kind: entry.kind,
    id: entry.data.id,
    state: entry.data.state ?? null,
    filePath: entry.filePath
  };
}

function buildActorSummary(actorName) {
  const mapping = REFERENCE_RUNTIME_ACTORS[actorName];
  if (!mapping) {
    return {
      actor: actorName,
      runtimeType: "unknown",
      canonicalFamily: "Unknown",
      repoStandIn: null
    };
  }

  return {
    actor: actorName,
    runtimeType: mapping.runtimeType,
    canonicalFamily: mapping.canonicalFamily,
    repoStandIn: mapping.repoStandIn
  };
}

function resolveFixtureReference(scenarioEntry, ref, objectsByPath) {
  if (!looksLikeFixturePath(ref)) {
    return {
      kind: "conceptual",
      ref
    };
  }

  const resolvedPath = path.resolve(path.dirname(scenarioEntry.filePath), ref);
  const entry = objectsByPath.get(resolvedPath);
  if (!entry) {
    return {
      kind: "missing",
      ref,
      filePath: resolvedPath
    };
  }

  return buildObjectSummary(entry);
}

async function loadScenarioBundle(repoRoot, scenarioId) {
  const examplesDir = getIssueDrivenOsExamplesDir(repoRoot);
  const fixtures = await loadIssueDrivenOsFixtures(examplesDir);
  const scenarioEntry = fixtures.scenariosById.get(scenarioId);

  if (!scenarioEntry) {
    const known = [...fixtures.scenariosById.keys()].sort();
    throw new Error(
      `Unknown Issue-Driven OS scenario "${scenarioId}". Known scenarios: ${known.join(", ")}`
    );
  }

  const { data } = scenarioEntry;
  const phases = SCENARIO_PHASES[data.category] ?? [];
  const startingObjects = {};

  for (const [label, ref] of Object.entries(data.starting_objects ?? {})) {
    startingObjects[label] = resolveFixtureReference(scenarioEntry, ref, fixtures.objectsByPath);
  }

  return {
    scenarioId: data.scenario_id,
    category: data.category,
    goal: data.goal,
    notes: data.notes,
    phases,
    requiredRuntimeActors: (data.required_runtime_actors ?? []).map(buildActorSummary),
    startingObjects,
    expectedArtifacts: (data.expected_artifacts ?? []).map((ref) =>
      resolveFixtureReference(scenarioEntry, ref, fixtures.objectsByPath)
    ),
    expectedStateOutcomes: data.expected_state_outcomes ?? {},
    disallowedBehaviors: data.disallowed_behaviors ?? []
  };
}

function formatScenarioBundle(bundle) {
  const lines = [
    `Scenario: ${bundle.scenarioId} (${bundle.category})`,
    `Goal: ${bundle.goal}`,
    `Phases: ${bundle.phases.join(" -> ")}`,
    "",
    "Starting objects:"
  ];

  for (const [label, entry] of Object.entries(bundle.startingObjects)) {
    if (entry.kind === "missing") {
      lines.push(`- ${label}: missing fixture (${entry.filePath})`);
      continue;
    }
    lines.push(`- ${label}: ${entry.id} [${entry.kind}] state=${entry.state ?? "n/a"}`);
  }

  lines.push("", "Required runtime actors:");
  for (const actor of bundle.requiredRuntimeActors) {
    const standIn = actor.repoStandIn
      ? `${actor.repoStandIn.packageType}:${actor.repoStandIn.name}`
      : "none";
    lines.push(`- ${actor.actor}: ${actor.canonicalFamily} -> ${standIn}`);
  }

  lines.push("", "Expected artifacts:");
  for (const artifact of bundle.expectedArtifacts) {
    if (artifact.kind === "conceptual") {
      lines.push(`- conceptual: ${artifact.ref}`);
      continue;
    }
    if (artifact.kind === "missing") {
      lines.push(`- missing fixture: ${artifact.filePath}`);
      continue;
    }
    lines.push(`- ${artifact.id} [${artifact.kind}] state=${artifact.state ?? "n/a"}`);
  }

  lines.push("", "Expected state outcomes:");
  for (const [key, value] of Object.entries(bundle.expectedStateOutcomes)) {
    lines.push(`- ${key}: ${value}`);
  }

  if ((bundle.disallowedBehaviors ?? []).length > 0) {
    lines.push("", "Disallowed behaviors:");
    for (const behavior of bundle.disallowedBehaviors) {
      lines.push(`- ${behavior}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

module.exports = {
  REFERENCE_RUNTIME_ACTORS,
  SCENARIO_PHASES,
  loadScenarioBundle,
  formatScenarioBundle
};
