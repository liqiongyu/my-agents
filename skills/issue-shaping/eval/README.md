# Issue Shaping Eval Suites

## Overview

This directory contains two lightweight evaluation suites for `issue-shaping`:

- `trigger-cases.json` checks whether the skill activates for shaping requests and stays out of raw
  intake, prioritization, clarify, and planning work.
- `quality-cases.json` supports human-reviewed checks on shaping quality for representative issue
  refinement, decomposition recommendation, and readiness-verdict tasks.

Projected runtime surfaces intentionally exclude `eval/`, so run these fixtures from the canonical
skill package or another local copy.

## Trigger Suite

Use [trigger-cases.json](trigger-cases.json) when you have changed:

- the frontmatter `description`
- the shaping boundary wording
- the invocation posture
- the routing guidance to normalization, clarify, decomposition, or planning

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/issue-shaping/eval/trigger-cases.json
```

## Quality Suite

Use [quality-cases.json](quality-cases.json) when you want a lightweight manual review pass over
output quality.

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/issue-shaping/eval/quality-cases.json
```

## Suggested Review Flow

1. Run the relevant prompt with `issue-shaping` available.
2. Capture the shaped issue brief, decomposition recommendation, or execution-brief seed.
3. Score each assertion in the chosen suite as `pass`, `partial`, or `fail`.
4. Add reviewer notes for anything that felt over-broad, under-tested, or weakly routed.
5. Use the results to decide whether to tune:
   - the trigger description
   - the shaping boundary
   - the readiness-verdict rules
   - the output templates

## Pass Criteria

- Trigger regressions should be treated as blocking for boundary changes.
- Quality-suite results are qualitative and are meant to guide iteration rather than force brittle
  automation over shaping judgment.
- A healthy result tightens scope, strengthens acceptance criteria, states non-goals, and ends with
  an explicit readiness verdict.
