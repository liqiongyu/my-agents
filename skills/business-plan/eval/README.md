# Business Plan Eval Suite

## Overview

This directory contains two complementary eval fixtures for `business-plan`.

- `eval-cases.json` checks the main workflow outputs for business-plan, financial-analysis, and pitch-deck scenarios.
- `trigger-posture-cases.json` is the fast routing suite. It checks whether the skill behaves like a conservative `hybrid` skill: route on explicit or high-confidence business-planning requests, stay out of open-ended ideation, and hand off fresh-research or artifact-production requests to adjacent skills.

Projected runtime surfaces intentionally exclude `eval/`, so run these fixtures from the canonical package or another local copy.

## Validation

```bash
python3 skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/business-plan/eval/eval-cases.json
```

```bash
python3 skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/business-plan/eval/trigger-posture-cases.json
```

## Fast Start

Seed a workspace for the main workflow suite:

```bash
python3 skills/skill-lifecycle-manager/scripts/seed_eval_workspace.py \
  business-plan \
  --eval-file skills/business-plan/eval/eval-cases.json
```

Seed a workspace for the trigger suite:

```bash
python3 skills/skill-lifecycle-manager/scripts/seed_eval_workspace.py \
  business-plan \
  --eval-file skills/business-plan/eval/trigger-posture-cases.json
```

## Suggested Use

- Use `trigger-posture-cases.json` after description or boundary edits.
- Use `eval-cases.json` after workflow or reference changes that affect output quality.
- Score the trigger suite on routing quality, not on whether it tries to be maximally broad.
