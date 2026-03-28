# Prompt Engineering Eval Suite

## Overview

This directory contains a lightweight evaluation suite for the
`prompt-engineering` skill. The goal is to test whether the skill behaves like a
workflow skill instead of collapsing into generic prompt tips.

The suite focuses on whether the response:

- defines success criteria before rewriting
- chooses the smallest effective prompt intervention
- adapts advice to the target model or runtime
- includes a realistic evaluation plan
- handles safety and output control when the task is risky

## Files

- `eval-cases.json`: reusable evaluation cases and assertion definitions

## Validate The Fixture

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/prompt-engineering/eval/eval-cases.json
```

## Suggested Review Pattern

1. Run one eval prompt with the skill available.
2. Capture the response or workspace artifact.
3. Score each assertion as `pass`, `partial`, or `fail`.
4. Note whether the skill stayed workflow-first or drifted into generic
   technique dumping.

## Best First Cases

- `pe-design-system-prompt`: tests drafting from requirements plus measurable
  success criteria
- `pe-debug-json-drift`: tests failure diagnosis and smallest-effective-change
  reasoning
- `pe-migrate-cross-model`: tests model-calibrated migration guidance
- `pe-harden-agent-prompt`: tests injection defense and output validation
