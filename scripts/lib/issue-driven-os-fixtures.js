const fs = require("node:fs/promises");
const path = require("node:path");

const yaml = require("js-yaml");

const { fileExists } = require("./fs-utils");

const SCENARIO_CATEGORIES = new Set(["golden", "gate", "failure", "decomposition"]);
const FIXTURE_PATH_SEGMENTS = ["docs", "examples", "issue-driven-os"];

const OBJECT_KIND_SPECS = [
  {
    prefix: "canonical-issue-",
    kind: "issue",
    requiredFields: [
      "id",
      "version",
      "title",
      "summary",
      "type",
      "source_type",
      "state",
      "priority",
      "risk_level",
      "acceptance_criteria",
      "relationships",
      "created_at",
      "updated_at"
    ]
  },
  {
    prefix: "run-record-",
    kind: "run",
    requiredFields: [
      "id",
      "version",
      "issue_id",
      "state",
      "execution_brief_ref",
      "budget",
      "started_at",
      "updated_at",
      "artifacts"
    ]
  },
  {
    prefix: "change-object-",
    kind: "change",
    requiredFields: [
      "id",
      "version",
      "issue_id",
      "run_id",
      "state",
      "branch_ref",
      "pr_ref",
      "created_at",
      "updated_at"
    ]
  },
  {
    prefix: "verification-report-",
    kind: "verification",
    requiredFields: [
      "id",
      "version",
      "issue_id",
      "run_id",
      "change_id",
      "done_contract_ref",
      "gate_results",
      "overall_result",
      "evidence_refs",
      "created_at"
    ]
  },
  {
    prefix: "handoff-bundle-",
    kind: "handoff",
    requiredFields: [
      "id",
      "version",
      "issue_id",
      "run_id",
      "current_state",
      "completed",
      "remaining",
      "blockers",
      "next_step",
      "artifact_refs",
      "created_at"
    ]
  }
];

const FIXTURE_ID_PREFIXES = [
  ["issue_", "issue"],
  ["run_", "run"],
  ["change_", "change"],
  ["verify_", "verification"],
  ["handoff_", "handoff"]
];

function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function findObjectKind(fileName) {
  return OBJECT_KIND_SPECS.find((spec) => fileName.startsWith(spec.prefix)) ?? null;
}

function addMissingFieldErrors(label, data, requiredFields, errors) {
  for (const field of requiredFields) {
    if (!hasOwn(data, field)) {
      errors.push(`${label}: missing required field "${field}"`);
    }
  }
}

function addArrayTypeError(label, data, field, errors) {
  if (!Array.isArray(data[field])) {
    errors.push(`${label}: "${field}" must be an array`);
  }
}

function addObjectTypeError(label, data, field, errors) {
  if (!isPlainObject(data[field])) {
    errors.push(`${label}: "${field}" must be an object`);
  }
}

function fixtureKindFromId(id) {
  if (typeof id !== "string") return null;
  for (const [prefix, kind] of FIXTURE_ID_PREFIXES) {
    if (id.startsWith(prefix)) {
      return kind;
    }
  }
  return null;
}

function looksLikeFixturePath(value) {
  return (
    typeof value === "string" &&
    (value.includes("/") || value.endsWith(".yaml") || value.endsWith(".yml"))
  );
}

async function listYamlFiles(dirPath) {
  if (!(await fileExists(dirPath))) return [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter(
      (entry) => entry.isFile() && (entry.name.endsWith(".yaml") || entry.name.endsWith(".yml"))
    )
    .map((entry) => path.join(dirPath, entry.name))
    .sort();
}

async function readYamlObject(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const data = yaml.load(raw);
  if (!isPlainObject(data)) {
    throw new Error("expected a YAML object at the document root");
  }
  return data;
}

async function loadIssueDrivenOsFixtures(examplesDir) {
  const objectsDir = path.join(examplesDir, "objects");
  const scenariosDir = path.join(examplesDir, "scenarios");

  const objectFiles = await listYamlFiles(objectsDir);
  const scenarioFiles = await listYamlFiles(scenariosDir);
  const objectsById = new Map();
  const objectsByPath = new Map();
  const scenariosById = new Map();
  const scenariosByPath = new Map();

  for (const filePath of objectFiles) {
    const fileName = path.basename(filePath);
    const spec = findObjectKind(fileName);
    if (!spec) {
      continue;
    }

    const entry = {
      kind: spec.kind,
      data: await readYamlObject(filePath),
      filePath,
      label: toPosixPath(path.relative(examplesDir, filePath))
    };

    if (typeof entry.data.id === "string" && entry.data.id.length > 0) {
      objectsById.set(entry.data.id, entry);
    }
    objectsByPath.set(filePath, entry);
  }

  for (const filePath of scenarioFiles) {
    const entry = {
      data: await readYamlObject(filePath),
      filePath,
      label: toPosixPath(path.relative(examplesDir, filePath))
    };

    if (typeof entry.data.scenario_id === "string" && entry.data.scenario_id.length > 0) {
      scenariosById.set(entry.data.scenario_id, entry);
    }
    scenariosByPath.set(filePath, entry);
  }

  return {
    objectsById,
    objectsByPath,
    scenariosById,
    scenariosByPath
  };
}

function addReferenceError(label, field, refId, expectedKind, entryById, errors) {
  if (typeof refId !== "string" || refId.length === 0) {
    errors.push(`${label}: "${field}" must be a non-empty string`);
    return null;
  }

  const target = entryById.get(refId);
  if (!target) {
    errors.push(`${label}: "${field}" references unknown ${expectedKind} "${refId}"`);
    return null;
  }

  if (target.kind !== expectedKind) {
    errors.push(
      `${label}: "${field}" must reference a ${expectedKind} but resolved to ${target.kind}`
    );
    return null;
  }

  return target;
}

function addFixtureArtifactReferenceErrors(label, refs, field, entryById, errors) {
  if (refs == null) return;
  if (!Array.isArray(refs)) {
    errors.push(`${label}: "${field}" must be an array when present`);
    return;
  }

  for (const refId of refs) {
    const expectedKind = fixtureKindFromId(refId);
    if (!expectedKind) continue;
    addReferenceError(label, field, refId, expectedKind, entryById, errors);
  }
}

function validateObjectEntry(entry, entryById, errors) {
  const { data, kind, label } = entry;

  if (kind === "issue") {
    addArrayTypeError(label, data, "acceptance_criteria", errors);
    addObjectTypeError(label, data, "relationships", errors);
    if (isPlainObject(data.relationships)) {
      for (const key of ["children", "dependencies", "duplicates"]) {
        if (!Array.isArray(data.relationships[key])) {
          errors.push(`${label}: relationships.${key} must be an array`);
        }
      }
    }
    return;
  }

  if (kind === "run") {
    const issue = addReferenceError(label, "issue_id", data.issue_id, "issue", entryById, errors);
    addObjectTypeError(label, data, "budget", errors);
    addObjectTypeError(label, data, "artifacts", errors);

    if (isPlainObject(data.artifacts)) {
      addFixtureArtifactReferenceErrors(
        label,
        data.artifacts.verification,
        "artifacts.verification",
        entryById,
        errors
      );
      addFixtureArtifactReferenceErrors(
        label,
        data.artifacts.handoff,
        "artifacts.handoff",
        entryById,
        errors
      );

      if (issue && Array.isArray(data.artifacts.verification)) {
        for (const refId of data.artifacts.verification) {
          const verification = entryById.get(refId);
          if (verification && verification.data.issue_id !== issue.data.id) {
            errors.push(
              `${label}: verification artifact "${refId}" points to issue "${verification.data.issue_id}" instead of "${issue.data.id}"`
            );
          }
        }
      }
    }
    return;
  }

  if (kind === "change") {
    const issue = addReferenceError(label, "issue_id", data.issue_id, "issue", entryById, errors);
    const run = addReferenceError(label, "run_id", data.run_id, "run", entryById, errors);
    if (issue && run && run.data.issue_id !== issue.data.id) {
      errors.push(
        `${label}: change issue_id "${issue.data.id}" does not match run issue_id "${run.data.issue_id}"`
      );
    }
    if (hasOwn(data, "review_refs") && data.review_refs != null) {
      addArrayTypeError(label, data, "review_refs", errors);
    }
    return;
  }

  if (kind === "verification") {
    const issue = addReferenceError(label, "issue_id", data.issue_id, "issue", entryById, errors);
    const run = addReferenceError(label, "run_id", data.run_id, "run", entryById, errors);
    const change = addReferenceError(
      label,
      "change_id",
      data.change_id,
      "change",
      entryById,
      errors
    );

    if (issue && run && run.data.issue_id !== issue.data.id) {
      errors.push(
        `${label}: verification issue_id "${issue.data.id}" does not match run issue_id "${run.data.issue_id}"`
      );
    }
    if (issue && change && change.data.issue_id !== issue.data.id) {
      errors.push(
        `${label}: verification issue_id "${issue.data.id}" does not match change issue_id "${change.data.issue_id}"`
      );
    }
    if (run && change && change.data.run_id !== run.data.id) {
      errors.push(
        `${label}: verification run_id "${run.data.id}" does not match change run_id "${change.data.run_id}"`
      );
    }

    addObjectTypeError(label, data, "gate_results", errors);
    addArrayTypeError(label, data, "evidence_refs", errors);
    return;
  }

  if (kind === "handoff") {
    const issue = addReferenceError(label, "issue_id", data.issue_id, "issue", entryById, errors);
    const run = addReferenceError(label, "run_id", data.run_id, "run", entryById, errors);

    if (issue && run && run.data.issue_id !== issue.data.id) {
      errors.push(
        `${label}: handoff issue_id "${issue.data.id}" does not match run issue_id "${run.data.issue_id}"`
      );
    }

    addArrayTypeError(label, data, "completed", errors);
    addArrayTypeError(label, data, "remaining", errors);
    addArrayTypeError(label, data, "blockers", errors);
    addFixtureArtifactReferenceErrors(
      label,
      data.artifact_refs,
      "artifact_refs",
      entryById,
      errors
    );
  }
}

function addScenarioObjectPathError(
  scenarioLabel,
  objectLabel,
  relPath,
  expectedKind,
  objectByPath,
  errors,
  scenarioPath
) {
  if (!looksLikeFixturePath(relPath)) {
    errors.push(`${scenarioLabel}: starting_objects.${objectLabel} must point to a fixture path`);
    return null;
  }

  const resolvedPath = path.resolve(path.dirname(scenarioPath), relPath);
  const entry = objectByPath.get(resolvedPath);
  if (!entry) {
    errors.push(
      `${scenarioLabel}: starting_objects.${objectLabel} points to missing fixture "${relPath}"`
    );
    return null;
  }

  if (entry.kind !== expectedKind) {
    errors.push(
      `${scenarioLabel}: starting_objects.${objectLabel} must resolve to a ${expectedKind}, not ${entry.kind}`
    );
    return null;
  }

  return entry;
}

function validateScenarioEntry(entry, objectByPath, errors) {
  const { data, label, filePath } = entry;
  const requiredFields = [
    "scenario_id",
    "category",
    "goal",
    "starting_objects",
    "required_runtime_actors",
    "expected_artifacts",
    "expected_state_outcomes",
    "disallowed_behaviors",
    "notes"
  ];

  addMissingFieldErrors(label, data, requiredFields, errors);

  if (!SCENARIO_CATEGORIES.has(data.category)) {
    errors.push(
      `${label}: category "${data.category}" must be one of ${[...SCENARIO_CATEGORIES].join(", ")}`
    );
  }

  addObjectTypeError(label, data, "starting_objects", errors);
  addArrayTypeError(label, data, "required_runtime_actors", errors);
  addArrayTypeError(label, data, "expected_artifacts", errors);
  addObjectTypeError(label, data, "expected_state_outcomes", errors);
  addArrayTypeError(label, data, "disallowed_behaviors", errors);

  if (!isPlainObject(data.starting_objects)) {
    return;
  }

  const issue = hasOwn(data.starting_objects, "issue")
    ? addScenarioObjectPathError(
        label,
        "issue",
        data.starting_objects.issue,
        "issue",
        objectByPath,
        errors,
        filePath
      )
    : null;
  const run = hasOwn(data.starting_objects, "run")
    ? addScenarioObjectPathError(
        label,
        "run",
        data.starting_objects.run,
        "run",
        objectByPath,
        errors,
        filePath
      )
    : null;
  const change = hasOwn(data.starting_objects, "change")
    ? addScenarioObjectPathError(
        label,
        "change",
        data.starting_objects.change,
        "change",
        objectByPath,
        errors,
        filePath
      )
    : null;

  if (issue && run && run.data.issue_id !== issue.data.id) {
    errors.push(
      `${label}: starting run "${run.data.id}" points to issue "${run.data.issue_id}" instead of "${issue.data.id}"`
    );
  }

  if (issue && change && change.data.issue_id !== issue.data.id) {
    errors.push(
      `${label}: starting change "${change.data.id}" points to issue "${change.data.issue_id}" instead of "${issue.data.id}"`
    );
  }

  if (run && change && change.data.run_id !== run.data.id) {
    errors.push(
      `${label}: starting change "${change.data.id}" points to run "${change.data.run_id}" instead of "${run.data.id}"`
    );
  }

  if (Array.isArray(data.expected_artifacts)) {
    for (const artifactRef of data.expected_artifacts) {
      if (!looksLikeFixturePath(artifactRef)) continue;
      const resolvedPath = path.resolve(path.dirname(filePath), artifactRef);
      if (!objectByPath.has(resolvedPath)) {
        errors.push(`${label}: expected_artifact points to missing fixture "${artifactRef}"`);
      }
    }
  }
}

async function validateIssueDrivenOsFixtures(examplesDir, errors) {
  const objectsDir = path.join(examplesDir, "objects");
  const scenariosDir = path.join(examplesDir, "scenarios");

  if (!(await fileExists(objectsDir))) {
    errors.push(
      `${toPosixPath(path.relative(examplesDir, objectsDir))}: missing fixtures directory`
    );
    return;
  }

  if (!(await fileExists(scenariosDir))) {
    errors.push(
      `${toPosixPath(path.relative(examplesDir, scenariosDir))}: missing scenarios directory`
    );
    return;
  }

  const objectFiles = await listYamlFiles(objectsDir);
  const scenarioFiles = await listYamlFiles(scenariosDir);
  const entryById = new Map();
  const objectByPath = new Map();
  const scenarioIds = new Set();

  for (const filePath of objectFiles) {
    const relPath = toPosixPath(path.relative(examplesDir, filePath));
    const fileName = path.basename(filePath);
    const spec = findObjectKind(fileName);
    if (!spec) {
      errors.push(`${relPath}: unsupported object fixture filename`);
      continue;
    }

    let data;
    try {
      data = await readYamlObject(filePath);
    } catch (err) {
      errors.push(`${relPath}: invalid YAML (${err.message})`);
      continue;
    }

    addMissingFieldErrors(relPath, data, spec.requiredFields, errors);

    const entry = {
      kind: spec.kind,
      data,
      filePath,
      label: relPath
    };

    if (typeof data.id === "string") {
      if (entryById.has(data.id)) {
        errors.push(`${relPath}: duplicate fixture id "${data.id}"`);
      } else {
        entryById.set(data.id, entry);
      }
    }

    objectByPath.set(filePath, entry);
  }

  for (const entry of objectByPath.values()) {
    validateObjectEntry(entry, entryById, errors);
  }

  for (const filePath of scenarioFiles) {
    const relPath = toPosixPath(path.relative(examplesDir, filePath));
    let data;
    try {
      data = await readYamlObject(filePath);
    } catch (err) {
      errors.push(`${relPath}: invalid YAML (${err.message})`);
      continue;
    }

    if (typeof data.scenario_id !== "string" || data.scenario_id.length === 0) {
      errors.push(`${relPath}: missing required field "scenario_id"`);
      continue;
    }

    if (scenarioIds.has(data.scenario_id)) {
      errors.push(`${relPath}: duplicate scenario_id "${data.scenario_id}"`);
      continue;
    }
    scenarioIds.add(data.scenario_id);

    validateScenarioEntry(
      {
        data,
        filePath,
        label: relPath
      },
      objectByPath,
      errors
    );
  }
}

function getIssueDrivenOsExamplesDir(repoRoot) {
  return path.join(repoRoot, ...FIXTURE_PATH_SEGMENTS);
}

module.exports = {
  SCENARIO_CATEGORIES,
  FIXTURE_PATH_SEGMENTS,
  getIssueDrivenOsExamplesDir,
  loadIssueDrivenOsFixtures,
  looksLikeFixturePath,
  validateIssueDrivenOsFixtures
};
