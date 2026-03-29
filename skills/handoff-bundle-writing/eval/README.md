# Handoff Bundle Writing Eval Suites

## Overview

This directory contains two lightweight evaluation suites for
`handoff-bundle-writing`:

- `trigger-cases.json` checks whether the skill activates for explicit
  handoff-bundle and resume-context requests while staying out of pre-execution
  briefing, generic summarization, and raw issue intake.
- `quality-cases.json` supports human-reviewed checks on handoff-bundle quality
  for representative paused-run, transfer, quick-handoff, and route-back
  scenarios.

Projected runtime surfaces intentionally exclude `eval/`, so run these fixtures
from the canonical skill package or another local copy.

## Trigger Suite

Use [trigger-cases.json](trigger-cases.json) when you have changed:

- the frontmatter `description`
- the handoff-bundle-writing boundary wording
- the invocation posture
- the routing guidance to execution-briefing, issue-normalization, exploration,
  or state-sync

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/handoff-bundle-writing/eval/trigger-cases.json
```

## Quality Suite

Use [quality-cases.json](quality-cases.json) when you want a lightweight manual
review pass over output quality.

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/handoff-bundle-writing/eval/quality-cases.json
```

## Suggested Review Flow

1. Run the relevant prompt with `handoff-bundle-writing` available.
2. Capture the handoff bundle, quick handoff, resume checklist, or route note.
3. Score each assertion in the chosen suite as `pass`, `partial`, or `fail`.
4. Add reviewer notes for anything that felt unsafe to resume, overly generic,
   or unclear about artifact refs and next-step ownership.
5. Use the results to decide whether to tune:
   - the trigger description
   - the boundary against execution-briefing or generic summarization
   - the required fields in the bundle
   - the route-note guidance

## Pass Criteria

- Trigger regressions should be treated as blocking for boundary changes.
- Quality-suite results are qualitative and are meant to guide iteration rather
  than force brittle automation over recovery judgment.
- A healthy result stays transfer-focused, preserves current state plus next
  step, keeps artifact refs visible, and does not pretend the bundle is the
  canonical source of truth.
