# Skill Lifecycle Manager — Cross-Platform Eval Suite

## Overview

This directory contains a structured evaluation suite for the `skill-lifecycle-manager` skill. The suite focuses on the claim that the skill can manage a canonical skill package while handling Codex and Claude Code as distinct projection targets instead of one undifferentiated platform.

When copying the commands below, set `SLM_DIR` to the active skill directory:

- Canonical repo copy: `SLM_DIR=skills/skill-lifecycle-manager`
- Codex projection: `SLM_DIR=.agents/skills/skill-lifecycle-manager`
- Claude Code projection: `SLM_DIR=.claude/skills/skill-lifecycle-manager`

If you need to self-validate this skill package itself, also set `SLM_CANONICAL_DIR=skills/skill-lifecycle-manager`.
If you want to use the reusable fixtures in this folder, also set `SLM_EVAL_FILE` to a canonical/local path such as `skills/skill-lifecycle-manager/eval/eval-cases.json`. For the posture suite, use `SLM_TRIGGER_EVAL_FILE`, for example `skills/skill-lifecycle-manager/eval/trigger-posture-cases.json`. Projected runtime surfaces intentionally exclude `eval/`, so projected copies need an external fixture path or inline `--eval` prompts.
Projected runtime surfaces also exclude `tests/`, and Claude Code projections exclude `skill.json` plus `CHANGELOG.md`, so self-validation of this skill package is canonical-only even though projected copies still ship reusable helper scripts.

## What This Suite Tests

The suite checks whether the skill can:

- choose the right lifecycle stages for the task
- keep the canonical skill package as the source of truth
- generate or validate both Codex and Claude Code projections
- protect self-contained package boundaries during install and publish work
- treat trigger optimization as a separate pass
- preserve bounded discovery scope instead of widening user-supplied source sets
- apply the discovery-depth gate only when it is actually needed
- preserve delegated research checkpoints before authoring resumes
- report the next lifecycle step clearly

## Test Cases

| ID | Focus | Expected route |
| --- | --- | --- |
| `eval-1` | Create a new dual-platform skill | Create/Update -> Validate -> Project/Install/Publish |
| `eval-2` | Tighten trigger boundaries | Optimize Trigger -> Validate -> Evaluate |
| `eval-3` | Audit cross-platform readiness | Audit/Governance -> Validate |
| `eval-4` | Create a narrow utility skill | Create/Update -> Validate -> Project/Install/Publish |
| `eval-5` | Rehabilitate an ordinary content skill | Create/Update -> Validate -> Evaluate -> Optimize Trigger |
| `eval-6` | Pause after delegated research candidate inventory | Discover |
| `eval-7` | Broad documentation skill without a chosen discovery depth | Discover |
| `eval-8` | Broad skill with bounded sources | Discover -> Create/Update -> Validate |
| `eval-9` | Broad skill with explicit Standard depth | Discover |
| `eval-10` | Repair package boundary before install | Create/Update -> Validate -> Project/Install/Publish |

## Assertions

The suite uses these shared assertions:

1. `stage_routing_correct`
2. `canonical_core_created_or_preserved`
3. `projection_strategy_explicit`
4. `package_boundary_respected`
5. `codex_projection_present`
6. `claude_projection_filtered`
7. `validation_executed`
8. `trigger_work_separated`
9. `delegated_research_protocol_respected`
10. `bounded_scope_respected`
11. `depth_gate_respected`
12. `candidate_pause_respected`
13. `no_authoring_before_confirmation`
14. `next_step_explicit`

See [eval-cases.json](eval-cases.json) for the detailed assertion definitions and per-case checks.

For a narrower, posture-aware routing suite, use [trigger-posture-cases.json](trigger-posture-cases.json). That fixture is built for the newer `manual-first` / `hybrid` / `auto-first` workflow and keeps every prompt classification-only so it is faster to review than the full end-to-end suite. A few cases intentionally preserve bounded judgment so the review can capture realistic cross-surface differences instead of forcing a false exact match.

## Fast Start

Smoke-test the packaged Python helpers from the canonical repo copy before surface evals when you have changed validation, projection, or eval-runner code:

```bash
uv run python "$SLM_CANONICAL_DIR/scripts/run_unit_tests.py"
```

Seed an evaluation workspace directly from the suite:

```bash
uv run python "$SLM_DIR/scripts/seed_eval_workspace.py" \
  skill-lifecycle-manager \
  --eval-file "$SLM_EVAL_FILE"
```

Seed just one case:

```bash
uv run python "$SLM_DIR/scripts/seed_eval_workspace.py" \
  skill-lifecycle-manager \
  --eval-file "$SLM_EVAL_FILE" \
  --case eval-2
```

If you want to append more runs to the latest iteration instead of creating a new one:

```bash
uv run python "$SLM_DIR/scripts/seed_eval_workspace.py" \
  skill-lifecycle-manager \
  --eval-file "$SLM_EVAL_FILE" \
  --reuse-latest
```

Run a case directly through the local Codex CLI:

```bash
uv run python "$SLM_DIR/scripts/run_surface_eval.py" \
  codex \
  skill-lifecycle-manager \
  --eval-file "$SLM_EVAL_FILE" \
  --case eval-3 \
  --workdir .
```

Run the same case directly through Claude Code:

```bash
uv run python "$SLM_DIR/scripts/run_surface_eval.py" \
  claude-code \
  skill-lifecycle-manager \
  --eval-file "$SLM_EVAL_FILE" \
  --case eval-3 \
  --workdir .
```

The direct CLI runner reuses the latest iteration by default so you can place `codex` and `claude-code` results side by side. Add `--new-iteration` when you want to start a fresh pass.

Run the corresponding project-local baseline through Codex:

```bash
uv run python "$SLM_DIR/scripts/run_surface_eval.py" \
  codex \
  skill-lifecycle-manager \
  --eval-file "$SLM_EVAL_FILE" \
  --case eval-3 \
  --stage baseline \
  --workdir .
```

Render a lightweight static review panel after the runs complete:

```bash
uv run python "$SLM_DIR/scripts/render_review_panel.py" \
  workspaces/skill-lifecycle-manager/iteration-1
```

For the posture-aware trigger suite, a fast path looks like this:

```bash
uv run python "$SLM_DIR/scripts/seed_eval_workspace.py" \
  skill-lifecycle-manager \
  --eval-file "$SLM_TRIGGER_EVAL_FILE"
```

```bash
uv run python "$SLM_DIR/scripts/run_surface_eval.py" \
  codex \
  skill-lifecycle-manager \
  --eval-file "$SLM_TRIGGER_EVAL_FILE" \
  --case tp-manual-audit-skill \
  --workdir .
```

```bash
uv run python "$SLM_DIR/scripts/render_review_panel.py" \
  workspaces/skill-lifecycle-manager/iteration-1
```

## Suggested Execution Pattern

1. Run the prompt on the canonical skill package.
   Direct CLI runs are preferred here over a custom API harness.
2. If the case involves projection behavior, inspect or capture:
   - `.agents/skills/<name>/`
   - `.claude/skills/<name>/`
3. Capture the generated workspace artifacts:
   - `response.md`
   - `stdout.log`
   - `stderr.log`
   - `result.json`
4. Score each assertion as pass, partial, or fail.
5. Record:
   - what the skill changed
   - what validation commands ran
   - what still needs proof

The review panel is designed for this step: it loads the case prompt, expected assertions, captured outputs, and result metadata into one static HTML artifact so a human reviewer can score and annotate without juggling terminal windows.

## Notes

- `eval-1` is the best first smoke test for a new dual-platform workflow.
- `eval-2` is the most useful regression test after description changes.
- `eval-3` is the best fit when the skill is being used as a governance or library-health tool.
- `eval-6` is the regression test for the delegated Discover protocol fix: it should stop at candidate inventory instead of drafting too early.
- `eval-7` checks the new Discover-depth gate for a broad skill request with no declared Quick/Standard/Deep mode.
- `eval-8` checks the bounded-scope exception: keep discovery intentionally narrow when the user already supplied the source set.
- `eval-9` checks the corresponding happy path: when the user already chose Standard depth, do not ask for discovery depth again.
- `eval-10` checks the package-boundary rule: fix cross-skill private runtime dependencies before claiming projection or install readiness.
- The direct CLI runner now automates both `with-skill` and `baseline` runs. For the `baseline` stage it temporarily hides the project-local projection for the active surface when such a projection exists, and records that baseline mode in `result.json`.
- Direct surface evals need the matching platform CLI (`codex` or `claude`) for the surface under test, while `run_unit_tests.py` only requires `uv` plus the canonical package copy because projected surfaces omit `tests/`.
- The generated review panel stores draft state in browser local storage for that iteration and can export the final review as JSON.
- `trigger-posture-cases.json` is the best fit for validating the new invocation-posture workflow because it asks for routing and posture classification without doing broad file edits.
- `tp-manual-broad-docs-skill` and `tp-manual-broad-docs-standard-depth` are the fastest posture-level checks for the new Discover-first gate.
- Both eval suites now use the same normalized scoring model: `pass_threshold` is applied against the assertions that actually apply to each case, rather than a fixed global assertion count.
- In the posture-aware suite, overlap-check behavior is considered a positive signal, not a failure: if the response recommends updating an existing overlapping skill before creating a new one, score that reasoning on its merits.
- The `hybrid` versus `auto-first` boundary is intentionally soft for a few narrow utility cases; prefer scoring the reasoning quality and trigger-boundary discipline over exact label matching when the case notes say a conservative `hybrid` answer is acceptable.
