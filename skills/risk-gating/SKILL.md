---
name: risk-gating
description: >
  Manual-first workflow for deciding whether an issue, run, or change can
  proceed under current risk conditions and which mitigations, specialists, or
  approval gates are required. Use for governance and go/no-go boundary
  setting, not backlog prioritization or final acceptance verification.
invocation_posture: manual-first
version: 0.1.0
---

# Risk Gating

Turn a work item or execution state into an explicit risk verdict so the system
can decide whether to proceed, proceed with mitigation, pause, or escalate.

This skill is about controlled go/no-go judgment. It does not rank backlog
priority, and it does not claim the work is done. Its job is to state the risk
class, required mitigations, required gates, and the smallest honest next move.

## Outputs

- A risk gate note with:
  - scope under review
  - risk factors
  - risk class
  - mitigations required
  - specialist or human gates required
  - proceed / hold / escalate recommendation
  - recommended next workflow
- A mitigation checklist when the issue may proceed only under conditions
- An escalation note when the current actor should stop instead of pushing
  forward

## When To Activate

- The user asks whether a task, run, migration, or change is safe to proceed
- A control-plane or governance workflow needs an explicit risk verdict before
  admission, merge, or rollout
- The work touches infra, migration, security, architecture, or other
  high-consequence surfaces where simple momentum should not decide

## When Not To Use

- The question is queue order or urgency; use `priority-scoring`
- The question is issue boundary or decomposition; use `issue-shaping`
- The question is final done-contract verification; use
  `acceptance-verification`
- The input is still a raw issue candidate; use `issue-normalization`

## Core Principles

1. Risk is not urgency. A task can be urgent and still need a gate.
2. Name the boundary. Say exactly what object is being gated: issue, run,
   change, migration, release, or approval point.
3. Mitigation is part of the answer. A useful gate note says how the risk can be
   reduced, not only that risk exists.
4. Escalation is success when needed. The right result is sometimes to stop.
5. Keep specialist triggers explicit. If browser QA, architecture, security, or
   release specialists are required, say so.

## Workflow

### Phase 0 - Confirm The Gating Object

Identify what is being gated:

- issue admission
- run start or continuation
- change / PR progression
- migration / release

If the object itself is still ambiguous or unstable, route back before trying to
gate it.

### Phase 1 - Gather Risk Signals

Collect the smallest credible set of risk signals:

- blast radius
- rollback difficulty
- state or data mutation
- external dependency sensitivity
- missing evidence
- required privileged actions
- specialist or human dependencies

### Phase 2 - Classify The Gate

Classify the current state as one of:

- `clear-to-proceed`
- `proceed-with-mitigations`
- `gate-blocked`
- `must-escalate`

### Phase 3 - State The Required Conditions

For anything other than `clear-to-proceed`, explicitly state:

- what mitigations are required
- what evidence is still missing
- what specialist or approval gate is needed
- what would change the verdict

### Phase 4 - Deliver The Gate Note

Return the smallest artifact that governance can trust:

- risk gate note
- mitigation checklist
- escalation note

Use [references/output-templates.md](references/output-templates.md).
