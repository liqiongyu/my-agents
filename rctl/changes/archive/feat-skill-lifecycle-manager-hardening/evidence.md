# Evidence

## Planning

- `./.venv/bin/rctl enforce . --dry-run`
  - Passed with one expected warning for catalog freshness in a dirty workspace.
- Reviewed:
  - `skills/skill-lifecycle-manager/scripts/run_surface_eval.py`
  - `skills/skill-lifecycle-manager/scripts/projection_support.py`
  - `skills/skill-lifecycle-manager/scripts/audit_skill_inventory.py`
  - `skills/skill-lifecycle-manager/scripts/quick_validate.py`
  - `skills/skill-lifecycle-manager/references/audit-rubric.md`
  - `skills/skill-lifecycle-manager/eval/eval-cases.json`
  - `skills/skill-lifecycle-manager/eval/trigger-posture-cases.json`

## Implementation

- Updated `skills/skill-lifecycle-manager/scripts/run_surface_eval.py`
  - added `baseline` stage support
  - temporarily hides the project-local surface projection during baseline runs
  - writes structured timeout artifacts instead of surfacing only a traceback
- Updated `skills/skill-lifecycle-manager/scripts/projection_support.py`
  - added explicit ancestor-marker lookup helpers
  - made project-root inference fail clearly when no repo marker is found
- Rewrote `skills/skill-lifecycle-manager/scripts/audit_skill_inventory.py`
  - removed the `sys.path` mutation
  - added severity-ranked findings
  - added automated checks for trigger quality, boundary clarity, reference hygiene, script safety, readiness signals, projection health, and projection-weight context cost
- Updated `skills/skill-lifecycle-manager/projection.json`
  - excludes both `eval/` and `tests/` from runtime projections
- Updated `skills/skill-lifecycle-manager/skill.json`
  - bumped version to `0.4.0`
- Updated docs:
  - `skills/skill-lifecycle-manager/SKILL.md`
  - `skills/skill-lifecycle-manager/references/evaluation-loop.md`
  - `skills/skill-lifecycle-manager/eval/README.md`
  - `skills/skill-lifecycle-manager/CHANGELOG.md`
- Added focused tests under `skills/skill-lifecycle-manager/tests/`
- Follow-up implementation:
  - updated the docs to use an `SLM_DIR` command-path model and explicit canonical-vs-projected eval fixture guidance
  - clarified the 9 workflow phases versus the 7 routed lifecycle stages
  - expanded `eval/eval-cases.json` with two non-meta scenarios
  - updated `quick_validate.py` so it prefers PyYAML when available and documents the fallback parser limits
  - added a frontmatter-parsing unit test that covers comments plus block scalars

## Verification

- `python3 -m py_compile skills/skill-lifecycle-manager/scripts/*.py`
  - Passed.
- `uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/skill-lifecycle-manager`
  - Passed.
- `uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-lifecycle-manager/eval/eval-cases.json`
  - Passed.
- `uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-lifecycle-manager/eval/trigger-posture-cases.json`
  - Passed.
- `uv run python -m unittest discover -s skills/skill-lifecycle-manager/tests -p 'test_*.py'`
  - Passed (`Ran 8 tests`).
- `uv run python skills/skill-lifecycle-manager/scripts/project_skill.py skills/skill-lifecycle-manager --platform all --scope project`
  - Passed after updating `projection.json` to exclude `tests/` from runtime surfaces.
- `uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/skill-lifecycle-manager --platform all --scope project`
  - Passed after reprojection.
- `uv run python skills/skill-lifecycle-manager/scripts/audit_skill_inventory.py --root skills --format markdown`
  - Passed as a real-repo smoke test and produced a structured "Needs cleanup" report with no critical/high findings. The remaining findings are expected library follow-up items in other skills (mostly missing negative-boundary guidance and weaker readiness metadata).
- `npm run build`
  - Passed.
- `npm test`
  - Passed.
- `uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/skill-lifecycle-manager --platform all --scope project`
  - Re-ran after the follow-up doc/version changes and passed for both Codex and Claude Code.
