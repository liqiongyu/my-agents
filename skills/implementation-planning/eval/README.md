# Implementation Planning Eval Notes

This skill has two durable eval fixtures:

- `eval-cases.json` for behavior and plan-quality checks
- `trigger-posture-cases.json` for boundary and routing checks

Validate the fixtures with:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/implementation-planning/eval/eval-cases.json

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/implementation-planning/eval/trigger-posture-cases.json
```

These fixtures are designed for manual or review-panel scoring rather than hard automated grading.
The main questions are:

- Does the skill engage only when the task truly needs heavy technical planning?
- Does it route back out when brainstorming, clarification, or a lighter planner pass is the better move?
- When it does engage, does the plan include scope challenge, current-state grounding, verification, and rollback thinking?
