# README Craftsman Eval Suites

## Overview

This directory contains two lightweight evaluation suites for `readme-craftsman`:

- `trigger-cases.json` checks whether the skill activates only for explicit README work and stays quiet on adjacent documentation tasks.
- `quality-cases.json` supports human-reviewed qualitative output checks on representative repository archetypes.

Projected runtime surfaces intentionally exclude `eval/`, so run these fixtures from the canonical skill package or another local copy.

## Trigger Suite

Use [trigger-cases.json](trigger-cases.json) when you have changed:

- the frontmatter `description`
- the skill boundary wording
- create/update/review routing cues

What it covers:

- explicit README create, update, and review prompts
- adjacent non-README documentation prompts that should stay out of scope
- near-miss prompts that test the `manual-first` boundary
- overlap-sensitive README review prompts that should still route to this skill

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/readme-craftsman/eval/trigger-cases.json
```

## Quality Suite

Use [quality-cases.json](quality-cases.json) when you want a lightweight manual review pass over real output quality rather than routing behavior.

The suite currently covers:

- OSS library create
- docs or knowledge-base create
- dataset update
- community or awesome-list review

Each case includes:

- the repo archetype
- the requested README task
- success criteria derived from the skill's own Quality Checklist

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/readme-craftsman/eval/quality-cases.json
```

## Suggested Review Flow

1. Run the relevant prompt with `readme-craftsman` available.
2. Capture the resulting README draft or review report.
3. Score each assertion in the chosen suite as `pass`, `partial`, or `fail`.
4. Add brief reviewer notes for anything that felt generic, inaccurate, or mismatched to the repo type.
5. Use the findings to decide whether you need:
   - trigger tuning
   - body guidance updates
   - reference/template updates

## Pass Criteria

- Trigger regressions should be treated as blocking for boundary changes.
- Quality-suite results are qualitative: they are meant to guide iteration, not to force brittle automation over subjective writing tasks.
- A case is healthy when the README feels tailored to the actual repository and satisfies the skill's own checklist without obvious filler or repo drift.
