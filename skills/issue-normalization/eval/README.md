# Issue Normalization Eval Suites

## Overview

This directory contains two lightweight evaluation suites for `issue-normalization`:

- `trigger-cases.json` checks whether the skill activates for issue-intake and issue-drafting work
  while staying out of clarify, brainstorming, prioritization, and planning jobs.
- `quality-cases.json` supports human-reviewed checks on output quality for representative issue
  normalization tasks.

Projected runtime surfaces intentionally exclude `eval/`, so run these fixtures from the canonical
skill package or another local copy.

## Trigger Suite

Use [trigger-cases.json](trigger-cases.json) when you have changed:

- the frontmatter `description`
- the skill boundary wording
- the invocation posture
- the routing guidance toward `clarify`, `brainstorming`, or downstream shaping

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/issue-normalization/eval/trigger-cases.json
```

## Quality Suite

Use [quality-cases.json](quality-cases.json) when you want a lightweight manual review pass over
output quality.

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/issue-normalization/eval/quality-cases.json
```

## Suggested Review Flow

1. Run the relevant prompt with `issue-normalization` available.
2. Capture the resulting issue draft, gap log, or split recommendation.
3. Score each assertion in the chosen suite as `pass`, `partial`, or `fail`.
4. Add reviewer notes for anything that felt over-specified, chat-shaped, or weakly evidenced.
5. Use the results to decide whether to tune:
   - the trigger description
   - the boundary against adjacent workflows
   - the normalization method or templates

## Pass Criteria

- Trigger regressions should be treated as blocking for boundary changes.
- Quality-suite results are qualitative and are meant to guide iteration rather than enforce brittle
  automation over issue-writing judgment.
- A healthy result preserves source fidelity, states missing information honestly, and ends with a
  clear next workflow.
