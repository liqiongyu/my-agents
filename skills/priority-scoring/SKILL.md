---
name: priority-scoring
description: >
  Manual-first workflow for scoring a normalized or shaped issue for relative
  urgency and queue placement using impact, urgency, reversibility, dependency
  pressure, and confidence. Use after issue intake or shaping when the next
  need is a governance-ready priority recommendation, not implementation
  planning or risk gating.
invocation_posture: manual-first
version: 0.1.0
---

# Priority Scoring

Turn an existing issue into a priority recommendation that the control plane can
consume without treating queue decisions as vibes.

This skill starts after an issue exists. It does not normalize raw notes, and
it does not replace admission policy or risk gating. Its job is to produce a
clear, explicit priority recommendation with evidence, confidence, and pressure
factors made visible.

## Outputs

- A priority scorecard with:
  - issue summary
  - current problem pressure
  - impact estimate
  - urgency estimate
  - reversibility and workaround note
  - dependency or blocking pressure
  - confidence level
  - recommended priority band
  - reasons to accelerate or defer
  - recommended next workflow
- A route-back note when the issue still needs shaping or clarification before
  meaningful scoring
- A tie-break note when two issues are close and the result depends on missing
  governance context

## When To Activate

- The user explicitly asks to score, rank, triage, or assign a priority band to
  an existing issue
- The issue is already normalized or shaped and the next need is queue-ready
  governance judgment
- The control plane or a human owner needs an explicit explanation for why a
  work item should be now, next, later, or parked

## When Not To Use

- The input is still raw notes or bug residue; use `issue-normalization`
- The issue boundary is still unstable or too broad; use `issue-shaping`
- The main question is whether the work is safe to proceed; use `risk-gating`
- The main question is how to implement the work; use `execution-briefing` or
  `implementation-planning`
- The goal is to verify completion; use `acceptance-verification`

## Invocation Posture

This skill is `manual-first`.

False positives are expensive because queue decisions change what gets attention
next. A score should be requested intentionally or triggered by an explicit
admission workflow, not by every issue-like conversation.

## Core Principles

1. Priority is relative, not absolute. A score exists to guide queue order, not
   to claim objective truth.
2. Separate impact from urgency. High impact and high urgency are not the same.
3. Reversibility matters. Easy workarounds or safe deferral should lower
   pressure.
4. Blocking pressure must stay visible. Work that unblocks other accepted work
   deserves explicit weight.
5. Confidence is part of the output. Low-confidence scoring should look
   different from high-confidence scoring.
6. Scoring is not budget approval. Recommend queue pressure without pretending
   to allocate execution resources.

## Workflow

### Phase 0 - Confirm The Issue Is Scorable

Before scoring, confirm you have:

- a normalized or shaped issue
- a legible problem statement
- enough evidence to estimate impact and urgency

Hard redirects:

- raw issue candidate -> `issue-normalization`
- unstable boundary or mixed issue -> `issue-shaping`
- safety/go/no-go question -> `risk-gating`

### Phase 1 - Read The Governance Signals

Gather the smallest credible set of signals:

- what user or system pain exists now
- who is affected and how broadly
- whether a workaround exists
- whether this issue blocks accepted work
- whether deferral grows cost or risk
- how confident the current evidence is

Use the scoring questions from [references/methodology.md](references/methodology.md).

### Phase 2 - Score The Pressure

Produce a relative score using:

- impact
- urgency
- reversibility / workaround
- dependency pressure
- evidence confidence

Translate the result into one of:

- `p0-now`
- `p1-soon`
- `p2-next`
- `p3-later`
- `parked-needs-context`

### Phase 3 - Challenge The Recommendation

Before finalizing, ask:

- am I confusing safety risk with urgency?
- am I treating a vague issue as urgent because it feels important?
- does a workaround or deferral path materially reduce pressure?
- is the score honest about low-confidence evidence?

### Phase 4 - Deliver The Scorecard

Return the smallest artifact that downstream governance can trust:

- priority scorecard
- route-back note
- tie-break note if context is still missing

Use [references/output-templates.md](references/output-templates.md) for the
standard scorecard and route-back template.

## Validation

Validate the canonical package and its eval fixtures:

```bash
uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py \
  skills/priority-scoring

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/priority-scoring/eval/trigger-cases.json

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/priority-scoring/eval/quality-cases.json
```
