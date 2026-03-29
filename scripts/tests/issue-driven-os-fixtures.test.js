const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getIssueDrivenOsExamplesDir,
  validateIssueDrivenOsFixtures
} = require("../lib/issue-driven-os-fixtures");

test("validateIssueDrivenOsFixtures accepts the checked-in reference fixtures", async () => {
  const repoRoot = path.resolve(__dirname, "..", "..");
  const examplesDir = getIssueDrivenOsExamplesDir(repoRoot);
  const errors = [];

  await validateIssueDrivenOsFixtures(examplesDir, errors);

  assert.deepEqual(errors, []);
});

test("validateIssueDrivenOsFixtures reports broken cross-object and scenario references", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "issue-driven-os-fixtures-"));
  const examplesDir = path.join(tmp, "docs", "examples", "issue-driven-os");
  const objectsDir = path.join(examplesDir, "objects");
  const scenariosDir = path.join(examplesDir, "scenarios");

  try {
    await fs.mkdir(objectsDir, { recursive: true });
    await fs.mkdir(scenariosDir, { recursive: true });

    await fs.writeFile(
      path.join(objectsDir, "canonical-issue-a.yaml"),
      [
        "id: issue_a",
        "version: 0.1",
        "title: Demo issue",
        "summary: Demo summary",
        "type: bug",
        "source_type: feedback",
        "state: ready",
        "priority: p2",
        "risk_level: low",
        "acceptance_criteria:",
        "  - Fix the issue",
        "relationships:",
        "  parent: null",
        "  children: []",
        "  dependencies: []",
        "  duplicates: []",
        "created_at: 2026-03-29T08:00:00Z",
        "updated_at: 2026-03-29T08:05:00Z",
        ""
      ].join("\n"),
      "utf8"
    );

    await fs.writeFile(
      path.join(objectsDir, "run-record-a.yaml"),
      [
        "id: run_a",
        "version: 0.1",
        "issue_id: issue_missing",
        "state: running",
        "execution_brief_ref: brief_a",
        "budget:",
        "  tokens_max: 1000",
        "  specialist_calls_max: 0",
        "  review_loops_max: 1",
        "  elapsed_minutes_max: 10",
        "started_at: 2026-03-29T08:10:00Z",
        "updated_at: 2026-03-29T08:11:00Z",
        "artifacts:",
        "  evidence: []",
        "  decisions: []",
        "  verification: null",
        "  handoff: null",
        ""
      ].join("\n"),
      "utf8"
    );

    await fs.writeFile(
      path.join(scenariosDir, "S1-broken.yaml"),
      [
        "scenario_id: S1",
        "category: golden",
        "goal: Validate broken references are caught.",
        "starting_objects:",
        "  issue: ../objects/missing-issue.yaml",
        "  run: ../objects/run-record-a.yaml",
        "required_runtime_actors:",
        "  - control_plane",
        "expected_artifacts: []",
        "expected_state_outcomes:",
        "  issue: active",
        "  run: failed",
        "  change: no_change_yet",
        "disallowed_behaviors:",
        "  - silent_failure",
        "notes: Demo scenario",
        ""
      ].join("\n"),
      "utf8"
    );

    const errors = [];
    await validateIssueDrivenOsFixtures(examplesDir, errors);

    assert.ok(
      errors.some((error) =>
        error.includes(
          'objects/run-record-a.yaml: "issue_id" references unknown issue "issue_missing"'
        )
      ),
      `expected missing issue reference error, got:\n${errors.join("\n")}`
    );
    assert.ok(
      errors.some((error) =>
        error.includes(
          'scenarios/S1-broken.yaml: starting_objects.issue points to missing fixture "../objects/missing-issue.yaml"'
        )
      ),
      `expected missing scenario fixture error, got:\n${errors.join("\n")}`
    );
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
});
