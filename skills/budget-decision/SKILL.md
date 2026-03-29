---
name: budget-decision
description: >
  Manual-first workflow for proposing or revising a run budget envelope,
  including loop limits, specialist-call limits, and escalation thresholds. Use
  when governance needs an explicit execution budget decision rather than issue
  shaping, risk gating, or implementation planning.
invocation_posture: manual-first
version: 0.1.0
---

# Budget Decision

Turn issue pressure and execution uncertainty into a bounded run budget
recommendation.

This skill defines how much room a run should get to operate before it must
stop, hand off, or escalate. It does not decide backlog priority or final risk
go/no-go on its own.

## Outputs

- A budget decision note with:
  - target issue or run
  - proposed budget envelope
  - loop and specialist limits
  - escalation thresholds
  - reasons for a tighter or looser budget
  - recommended next workflow
- A budget revision note when an existing run budget should change
- An escalation note when the right answer is “do not start another run yet”

## When To Activate

- Governance needs an explicit run budget envelope
- A run has exhausted or is about to exhaust its budget and needs revision
- The user asks how much room a task should get before escalation

## When Not To Use

- The question is queue pressure; use `priority-scoring`
- The question is proceed/hold under safety risk; use `risk-gating`
- The question is shaping the issue boundary; use `issue-shaping`
- The task needs a phased implementation plan; use `implementation-planning`

## Core Principles

1. Budget is a governance control, not a punishment.
2. Tight budgets are useful when uncertainty is high and recovery is cheap.
3. Loose budgets need justification.
4. Specialist and loop limits should be explicit, not implied.
5. Budget exhaustion should produce a recovery trail rather than silent drift.

## Workflow

### Phase 0 - Confirm The Budget Object

Identify whether you are setting:

- a fresh run budget
- a budget revision
- an escalation after exhaustion

### Phase 1 - Gather The Pressure Signals

Read:

- issue size and uncertainty
- risk level
- expected review loops
- expected specialist need
- cost of interruption or restart

### Phase 2 - Propose The Envelope

Recommend:

- token budget
- review loop budget
- specialist-call budget
- elapsed-time budget
- escalation triggers

### Phase 3 - Deliver The Budget Artifact

Return the smallest budget note that governance can consume.

Use [references/output-templates.md](references/output-templates.md).
