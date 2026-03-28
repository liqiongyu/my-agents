# Skill Researcher Eval Suite

## Overview

This directory contains two complementary eval fixtures for `skill-researcher`.

- `eval-cases.json` tests the full research workflow: hard gates, candidate confirmation, narrow-scope handling, and Fusion Report handoff behavior.
- `trigger-posture-cases.json` is the fast routing suite. It checks whether the skill behaves like a `manual-first` skill: route only on explicit skill-ecosystem research requests, stay quiet on install or general-research requests, and preserve user-supplied scope when the request is intentionally narrow.

Projected runtime surfaces intentionally exclude `eval/`, so run these fixtures from the canonical package or another local copy.

## Validation

```bash
python3 skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/skill-researcher/eval/eval-cases.json
```

```bash
python3 skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/skill-researcher/eval/trigger-posture-cases.json
```

## Fast Start

Seed a workspace for the full workflow suite:

```bash
python3 skills/skill-lifecycle-manager/scripts/seed_eval_workspace.py \
  skill-researcher \
  --eval-file skills/skill-researcher/eval/eval-cases.json
```

Seed a workspace for the posture suite:

```bash
python3 skills/skill-lifecycle-manager/scripts/seed_eval_workspace.py \
  skill-researcher \
  --eval-file skills/skill-researcher/eval/trigger-posture-cases.json
```

Run one posture case through Codex:

```bash
python3 skills/skill-lifecycle-manager/scripts/run_surface_eval.py \
  codex \
  skill-researcher \
  --eval-file skills/skill-researcher/eval/trigger-posture-cases.json \
  --case tp-explicit-ecosystem-survey \
  --workdir .
```

Render the review panel after collecting outputs:

```bash
python3 skills/skill-lifecycle-manager/scripts/render_review_panel.py \
  workspaces/skill-researcher/iteration-1
```

## Suggested Use

- Use `trigger-posture-cases.json` after description changes or boundary edits.
- Use `eval-cases.json` after workflow changes that affect gates, synthesis, or handoff behavior.
- Score borderline cases on reasoning quality, especially when the request is narrowly scoped but still clearly about skill research.
