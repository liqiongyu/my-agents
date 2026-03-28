# Docs Governance Eval Suites

## Overview

This directory contains two lightweight evaluation suites for `project-documentation`:

- `trigger-cases.json` checks whether the skill activates for `docs/` directory governance requests and stays out of narrower adjacent workflows.
- `quality-cases.json` supports human-reviewed qualitative checks on representative docs-structure, refresh, consolidation, and verification tasks.

Projected runtime surfaces intentionally exclude `eval/`, so run these fixtures from the canonical skill package or another local copy.

## Trigger Suite

Use [trigger-cases.json](trigger-cases.json) when you have changed:

- the frontmatter `description`
- the skill boundary wording
- structure, refresh, or verify routing cues

What it covers:

- explicit docs-set restructuring, consolidation, refresh, and verification requests
- README-only requests that should stay with `readme-craftsman`
- PR or diff review requests that should stay with `review`
- one-off non-`docs/` document requests, research-heavy requests, and conversion-heavy requests that should stay out of scope

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/project-documentation/eval/trigger-cases.json
```

## Quality Suite

Use [quality-cases.json](quality-cases.json) when you want a lightweight manual review pass over output quality.

The suite currently covers:

- docs landing-page or structure work
- docs refresh after a refactor
- docs-folder consolidation
- runbook verification against current repo reality

Validate the fixture:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/project-documentation/eval/quality-cases.json
```

## Suggested Review Flow

1. Run the relevant prompt with `project-documentation` available.
2. Capture the resulting docs edits, structure plan, or verification report.
3. Score each assertion in the chosen suite as `pass`, `partial`, or `fail`.
4. Add reviewer notes for anything that felt generic, invented, or insufficiently grounded in the repository.
5. Use the results to decide whether to tune:
   - the trigger description
   - docs-governance routing guidance
   - verification guidance or navigation heuristics

## Pass Criteria

- Trigger regressions should be treated as blocking for boundary changes.
- Quality-suite results are qualitative and are meant to guide iteration rather than force brittle automation over subjective writing tasks.
- A healthy result is grounded in repository evidence, improves the docs set as a system, and states verification limits honestly when full confirmation is not possible.
