const { loadScenarioBundle, resolveRuntimeActor } = require("./issue-driven-os-reference-runtime");

const PHASE_RUNTIME_BEHAVIORS = {
  admission: {
    actor: "control_plane",
    action: "admit_issue",
    intent: "Evaluate whether the shaped issue is allowed to enter governed execution.",
    inputLabels: ["issue"],
    artifactKinds: [],
    stateDomains: ["issue"]
  },
  run_creation: {
    actor: "control_plane",
    action: "create_or_resume_run",
    intent: "Create or resume the run context under the current budget envelope.",
    inputLabels: ["issue", "run"],
    artifactKinds: [],
    stateDomains: ["run"]
  },
  execution: {
    actor: "primary_execution_unit",
    action: "advance_change",
    intent: "Advance the change under the issue cell's primary execution path.",
    inputLabels: ["issue", "run", "change"],
    artifactKinds: ["change"],
    stateDomains: ["change"]
  },
  evaluation: {
    actor: "evaluator_path",
    action: "evaluate_change",
    intent: "Independently evaluate the change against the current done contract.",
    inputLabels: ["issue", "run", "change"],
    artifactKinds: ["verification"],
    stateDomains: ["change", "run"]
  },
  verification: {
    actor: "control_plane",
    action: "formalize_gate_outcome",
    intent: "Translate evaluation evidence into formal gate results and governed next state.",
    inputLabels: ["issue", "run", "change"],
    artifactKinds: ["verification"],
    stateDomains: ["issue", "run", "change"]
  },
  resolution: {
    actor: "control_plane",
    action: "resolve_issue",
    intent: "Mark the issue and change as eligible for completion after verification passes.",
    inputLabels: ["issue", "change"],
    artifactKinds: ["change", "verification"],
    stateDomains: ["issue", "change"]
  },
  gate_block: {
    actor: "control_plane",
    action: "block_merge",
    intent: "Prevent merge or closure when the verification path fails to clear the gate.",
    inputLabels: ["issue", "run", "change"],
    artifactKinds: ["verification", "change"],
    stateDomains: ["issue", "run", "change"]
  },
  evaluation_loop: {
    actor: "evaluator_path",
    action: "iterate_review_loop",
    intent: "Continue the review loop while surfacing unresolved deltas and budget pressure.",
    inputLabels: ["issue", "run", "change"],
    artifactKinds: ["verification", "change"],
    stateDomains: ["run", "change"]
  },
  budget_termination: {
    actor: "budget_service",
    action: "terminate_run_on_budget",
    intent: "Terminate the run when the governed budget envelope is exhausted.",
    inputLabels: ["run", "change"],
    artifactKinds: ["handoff"],
    stateDomains: ["run"]
  },
  handoff: {
    actor: "control_plane",
    action: "emit_handoff_bundle",
    intent: "Produce a recovery-ready handoff bundle after governed failure or pause.",
    inputLabels: ["run", "change"],
    artifactKinds: ["handoff"],
    stateDomains: ["run"]
  },
  intake_review: {
    actor: "control_plane",
    action: "review_issue_intake",
    intent: "Review the intake signal and confirm the issue is ready for shaping attention.",
    inputLabels: ["issue"],
    artifactKinds: [],
    stateDomains: ["issue"]
  },
  shaping: {
    actor: "shaping_decomposition",
    action: "shape_issue",
    intent: "Tighten the issue boundary and prepare a decomposition judgment.",
    inputLabels: ["issue"],
    artifactKinds: [],
    stateDomains: ["issue"]
  },
  decomposition: {
    actor: "shaping_decomposition",
    action: "propose_decomposition",
    intent: "Produce a decomposition outcome before any governed run is allowed to start.",
    inputLabels: ["issue"],
    artifactKinds: ["conceptual"],
    stateDomains: ["issue"]
  },
  issue_graph_update: {
    actor: "control_plane",
    action: "update_issue_graph",
    intent: "Record the decomposition result in the canonical issue graph.",
    inputLabels: ["issue"],
    artifactKinds: ["conceptual"],
    stateDomains: ["issue"]
  },
  admission_blocked: {
    actor: "control_plane",
    action: "withhold_run_creation",
    intent: "Hold execution until decomposition is completed and reflected in the issue graph.",
    inputLabels: ["issue"],
    artifactKinds: [],
    stateDomains: ["run", "change"]
  }
};

function buildActorMap(bundle) {
  const actorMap = new Map();
  for (const actor of bundle.requiredRuntimeActors ?? []) {
    actorMap.set(actor.actor, actor);
  }
  return actorMap;
}

function selectStartingObjects(bundle, inputLabels) {
  return (inputLabels ?? [])
    .map((label) => {
      const entry = bundle.startingObjects?.[label];
      if (!entry || entry.kind === "missing") return null;
      return {
        label,
        kind: entry.kind,
        id: entry.id,
        state: entry.state ?? null
      };
    })
    .filter(Boolean);
}

function selectArtifacts(bundle, artifactKinds) {
  if (!Array.isArray(artifactKinds) || artifactKinds.length === 0) {
    return [];
  }

  const allowConceptual = artifactKinds.includes("conceptual");
  return (bundle.expectedArtifacts ?? [])
    .filter((artifact) => {
      if (artifact.kind === "missing") return false;
      if (artifact.kind === "conceptual") return allowConceptual;
      return artifactKinds.includes(artifact.kind);
    })
    .map((artifact) => {
      if (artifact.kind === "conceptual") {
        return {
          kind: artifact.kind,
          ref: artifact.ref
        };
      }

      return {
        kind: artifact.kind,
        id: artifact.id,
        state: artifact.state ?? null
      };
    });
}

function selectExpectedOutcomes(bundle, stateDomains) {
  const outcomes = {};
  for (const domain of stateDomains ?? []) {
    if (Object.prototype.hasOwnProperty.call(bundle.expectedStateOutcomes ?? {}, domain)) {
      outcomes[domain] = bundle.expectedStateOutcomes[domain];
    }
  }
  return outcomes;
}

function buildPhaseEntry(bundle, actorMap, phase, index) {
  const behavior = PHASE_RUNTIME_BEHAVIORS[phase] ?? {
    actor: "control_plane",
    action: phase,
    intent: "Execute the runtime phase according to the scenario bundle.",
    inputLabels: [],
    artifactKinds: [],
    stateDomains: []
  };

  const actor = actorMap.get(behavior.actor) ?? resolveRuntimeActor(behavior.actor);

  return {
    index,
    phase,
    actor,
    action: behavior.action,
    intent: behavior.intent,
    inputs: selectStartingObjects(bundle, behavior.inputLabels),
    expectedArtifacts: selectArtifacts(bundle, behavior.artifactKinds),
    expectedStateOutcomes: selectExpectedOutcomes(bundle, behavior.stateDomains)
  };
}

async function simulateScenario(repoRoot, scenarioId) {
  const bundle = await loadScenarioBundle(repoRoot, scenarioId);
  const actorMap = buildActorMap(bundle);
  const transcript = bundle.phases.map((phase, index) =>
    buildPhaseEntry(bundle, actorMap, phase, index + 1)
  );

  return {
    scenarioId: bundle.scenarioId,
    category: bundle.category,
    goal: bundle.goal,
    notes: bundle.notes,
    phases: bundle.phases,
    transcript,
    finalStateOutcomes: bundle.expectedStateOutcomes,
    disallowedBehaviors: bundle.disallowedBehaviors
  };
}

function formatScenarioSimulation(simulation) {
  const lines = [
    `Scenario simulation: ${simulation.scenarioId} (${simulation.category})`,
    `Goal: ${simulation.goal}`,
    "",
    "Transcript:"
  ];

  for (const entry of simulation.transcript ?? []) {
    const standIn = entry.actor.repoStandIn
      ? `${entry.actor.repoStandIn.packageType}:${entry.actor.repoStandIn.name}`
      : "none";
    lines.push(
      `${entry.index}. ${entry.phase} -> ${entry.actor.actor} (${entry.actor.canonicalFamily})`
    );
    lines.push(`   action: ${entry.action}`);
    lines.push(`   stand-in: ${standIn}`);
    lines.push(`   intent: ${entry.intent}`);

    if ((entry.inputs ?? []).length > 0) {
      lines.push(
        `   inputs: ${entry.inputs.map((input) => `${input.label}=${input.id}`).join(", ")}`
      );
    }

    if ((entry.expectedArtifacts ?? []).length > 0) {
      const renderedArtifacts = entry.expectedArtifacts.map((artifact) =>
        artifact.id ? `${artifact.kind}=${artifact.id}` : `conceptual=${artifact.ref}`
      );
      lines.push(`   expected artifacts: ${renderedArtifacts.join(", ")}`);
    }

    const stateDomains = Object.entries(entry.expectedStateOutcomes ?? {});
    if (stateDomains.length > 0) {
      lines.push(
        `   expected state outcomes: ${stateDomains.map(([key, value]) => `${key}=${value}`).join(", ")}`
      );
    }
  }

  if ((simulation.disallowedBehaviors ?? []).length > 0) {
    lines.push("", "Disallowed behaviors:");
    for (const behavior of simulation.disallowedBehaviors) {
      lines.push(`- ${behavior}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

module.exports = {
  PHASE_RUNTIME_BEHAVIORS,
  simulateScenario,
  formatScenarioSimulation
};
