# Plan

## Goal

Harden `skill-lifecycle-manager` so its tooling matches its documented lifecycle promises more closely: eval runs should support baselines and fail more cleanly, projection root inference should be safer, audit automation should cover more of the published rubric, versioning should reflect shipped work, and the Python helpers should gain focused tests.

## Scope

- Update `skills/skill-lifecycle-manager/scripts/run_surface_eval.py` for baseline automation and timeout handling
- Update `skills/skill-lifecycle-manager/scripts/projection_support.py` so project-root inference fails or warns explicitly instead of silently guessing
- Expand `skills/skill-lifecycle-manager/scripts/audit_skill_inventory.py` to automate more of the published audit rubric and remove the current `sys.path` import hack
- Refresh `skills/skill-lifecycle-manager/SKILL.md`, `skills/skill-lifecycle-manager/CHANGELOG.md`, and `skills/skill-lifecycle-manager/skill.json` so workflow/version semantics match the shipped implementation
- Make the command examples projection-safe so the canonical docs and projected surfaces use the same path-resolution model
- Clarify the relationship between the 9 workflow phases and the 7 routed lifecycle stages
- Broaden `eval/eval-cases.json` with non-meta scenarios so the suite tests more than `skill-lifecycle-manager` acting on itself
- Improve `quick_validate.py` frontmatter parsing behavior and/or document the parser limits clearly enough to avoid confusing false positives
- Add focused Python tests under the skill package for validation, projection, audit, and eval-runner helper behavior
- Regenerate projections and any generated catalog artifacts required by repo validation

## Acceptance Criteria

- `run_surface_eval.py` can write results for both `with-skill` and `baseline` stages, and timeout failures produce structured artifacts instead of raw tracebacks.
- Projection helpers no longer silently fall back to an arbitrary parent when the repo root cannot be inferred; callers get an explicit failure or an intentional override path.
- Inventory audit output now covers more than package integrity and duplicate names, including automated checks for trigger quality, projection health, evaluation readiness, and related rubric dimensions where deterministic checks exist.
- `audit_skill_inventory.py` imports shared helpers without mutating `sys.path`.
- `CHANGELOG.md` and `skill.json` reflect shipped hardening work with a matching released version section instead of leaving shipped changes only under `Unreleased`.
- Projected-surface users can follow the validation/eval commands without hand-translating `skills/skill-lifecycle-manager/...` repo-root paths.
- The skill documentation clearly explains that Phase 1 and Phase 9 are meta-phases around the 7 routed lifecycle stages.
- `eval/eval-cases.json` includes at least one or two non-meta scenarios that exercise ordinary skill-management behavior rather than only `skill-lifecycle-manager` improving itself.
- `quick_validate.py` either parses the supported frontmatter shapes more robustly or clearly documents the limitations of the fallback parser.
- Focused Python tests cover the new projection, audit, validation, and eval-runner behavior.
- `quick_validate.py`, `validate_eval_suite.py`, projection generation/validation, `npm run build`, and `npm test` pass after the changes.

## Risks

- Tightening project-root inference may break commands that accidentally relied on the old silent fallback; error messages need to be actionable.
- Audit automation can become noisy if heuristics are too aggressive, especially for trigger-quality and script-safety warnings.
- Baseline automation may expose differences between Codex and Claude workflows that require documentation updates in addition to code changes.
- Repo-generated artifacts are already dirty in this workspace, so `npm run build` may refresh unrelated catalog/index files alongside this work.

## Validation

- `uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/skill-lifecycle-manager`
- `uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-lifecycle-manager/eval/eval-cases.json`
- `uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-lifecycle-manager/eval/trigger-posture-cases.json`
- `uv run python -m unittest discover -s skills/skill-lifecycle-manager/tests -p 'test_*.py'`
- `uv run python skills/skill-lifecycle-manager/scripts/project_skill.py skills/skill-lifecycle-manager --platform all --scope project`
- `uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/skill-lifecycle-manager --platform all --scope project`
- `npm run build`
- `npm test`

## Rollback

- Revert changes under `skills/skill-lifecycle-manager/`, `.agents/skills/skill-lifecycle-manager/`, and `.claude/skills/skill-lifecycle-manager/`
- Remove the new test files if this hardening pass must be abandoned
- Re-run `npm run build` so generated catalog artifacts return to the prior state
- Re-run `npm test` to confirm the repo is back to the previous baseline

## Dependencies

- Existing projection helpers and eval workspace conventions under `skills/skill-lifecycle-manager/scripts/`
- Repo validation rules in `scripts/validate.js` and the root zone manifest
- Local `codex`, `claude`, `uv`, and `rctl` CLIs already available in this workspace
