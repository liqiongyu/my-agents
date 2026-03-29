# Future-Aware Architecture Eval Suite

## Overview

This directory contains two complementary eval fixtures for
`future-aware-architecture`.

- `smoke-cases.json` is the quick behavioral suite. It checks a few
  high-signal architecture behaviors with shorter prompts and lighter output
  expectations than the full methodology suite.
- `eval-cases.json` tests the full methodology: problem-first framing,
  decision classification, current alternatives, social-technical checks,
  specialist evidence routing, uncertainty handling, decision governance, and
  artifact/handoff behavior.
- `trigger-posture-cases.json` is the fast routing suite. It checks whether the
  skill behaves like a `manual-first` architecture skill: trigger only on real
  architecture/selection requests, stay quiet on pure research or review asks,
  and redirect direction-already-chosen work to the right neighbor workflow.

Projected runtime surfaces intentionally exclude `eval/`, so run these fixtures
from the canonical package or another local copy.

## Validation

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/future-aware-architecture/eval/smoke-cases.json
```

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/future-aware-architecture/eval/eval-cases.json
```

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/future-aware-architecture/eval/trigger-posture-cases.json
```

## Fast Start

Seed a workspace for the full methodology suite:

```bash
uv run python skills/skill-lifecycle-manager/scripts/seed_eval_workspace.py \
  future-aware-architecture \
  --eval-file skills/future-aware-architecture/eval/smoke-cases.json
```

Seed a workspace for the full methodology suite:

```bash
uv run python skills/skill-lifecycle-manager/scripts/seed_eval_workspace.py \
  future-aware-architecture \
  --eval-file skills/future-aware-architecture/eval/eval-cases.json
```

Seed a workspace for the posture suite:

```bash
uv run python skills/skill-lifecycle-manager/scripts/seed_eval_workspace.py \
  future-aware-architecture \
  --eval-file skills/future-aware-architecture/eval/trigger-posture-cases.json
```

Run one posture case through Codex:

```bash
uv run python skills/skill-lifecycle-manager/scripts/run_surface_eval.py \
  codex \
  future-aware-architecture \
  --eval-file skills/future-aware-architecture/eval/trigger-posture-cases.json \
  --case tp-explicit-architecture-selection \
  --workdir .
```

Render the review panel after collecting outputs:

```bash
uv run python skills/skill-lifecycle-manager/scripts/render_review_panel.py \
  workspaces/future-aware-architecture/iteration-1
```

## Suggested Use

- Use `trigger-posture-cases.json` after description or boundary changes.
- Use `smoke-cases.json` after ordinary workflow or reference tweaks when you
  want faster regression coverage than the full suite.
- Use `eval-cases.json` after workflow or methodology changes.
- Recommended order for fast iteration:
  - `trigger-posture-cases.json`
  - `smoke-cases.json`
  - `eval-cases.json` only when the change materially affects the method
- When a case fails, classify the failure as either:
  - routing/boundary drift
  - weak problem framing
  - missing uncertainty/governance
  - weak specialist evidence escalation
  - weak artifact or handoff
