# Execution Briefing Eval Suites

## Overview

This directory contains two lightweight evaluation suites for
`execution-briefing`:

- `trigger-cases.json` checks whether the skill activates for explicit
  execution-brief requests and stays out of issue intake, issue shaping,
  clarify-only tasks, and deep planning asks.
- `quality-cases.json` supports human-reviewed checks on run-brief quality for
  representative execution handoff and route-back scenarios.

Projected runtime surfaces intentionally exclude `eval/`, so run these fixtures
from the canonical skill package or another local copy.

## Trigger Suite

Use [trigger-cases.json](trigger-cases.json) when you have changed:

- the frontmatter `description`
- the execution-briefing boundary wording
- the invocation posture
- the routing guidance to shaping, clarify, exploration, or planning

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/execution-briefing/eval/trigger-cases.json
```

## Quality Suite

Use [quality-cases.json](quality-cases.json) when you want a lightweight
manual review pass over output quality.

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/execution-briefing/eval/quality-cases.json
```

## Suggested Review Flow

1. Run the relevant prompt with `execution-briefing` available.
2. Capture the execution brief, done contract, or route-back note.
3. Score each assertion in the chosen suite as `pass`, `partial`, or `fail`.
4. Add reviewer notes for anything that felt overplanned, under-verified, or
   weakly bounded.
5. Use the results to decide whether to tune:
   - the trigger description
   - the boundary against issue-shaping or implementation-planning
   - the required fields in the brief
   - the done-contract guidance

## Pass Criteria

- Trigger regressions should be treated as blocking for boundary changes.
- Quality-suite results are qualitative and are meant to guide iteration rather
  than force brittle automation over execution judgment.
- A healthy result stays run-focused, names explicit non-goals, pre-wires
  checks and evidence, and routes to planning or shaping honestly when needed.
