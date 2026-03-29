---
name: admission-routing
description: >
  Manual-first workflow for deciding the next governance route for a normalized
  or shaped issue: admit now, hold, send back for shaping or clarify, or
  escalate. Use when the issue exists and the next need is an explicit routing
  verdict rather than execution or queue scoring.
invocation_posture: manual-first
version: 0.1.0
---

# Admission Routing

Turn a candidate issue into an explicit governance route.

This skill does not normalize raw notes, and it does not assign detailed queue
priority by itself. Its job is to say what should happen next to the issue:
admit, hold, reshape, clarify, or escalate.

## Outputs

- An admission-routing note with:
  - issue under review
  - readiness summary
  - gating blockers
  - routing verdict
  - recommended next workflow
- A route-back note when shaping or clarify is still required
- A hold note when the issue should wait without pretending it is rejected

## When To Activate

- The user asks whether an issue is ready to admit, route, hold, or escalate
- A governance workflow needs an explicit next-state recommendation for an
  issue that already exists
- The issue is normalized or shaped, but the control plane still needs a formal
  route decision

## When Not To Use

- The input is still raw and needs issue creation; use `issue-normalization`
- The issue still needs boundary work; use `issue-shaping`
- The main question is queue order; use `priority-scoring`
- The main question is proceed/hold under risk; use `risk-gating`

## Core Principles

1. Route from the current issue state, not from vibes.
2. Admit only when the issue is bounded enough to become one execution unit.
3. Holding is a real outcome.
4. Route-back should be specific about the smallest next workflow.
5. Escalation is a governance result, not a failure to think.

## Workflow

### Phase 0 - Confirm The Candidate

Verify that you have a real issue candidate or shaped issue.

### Phase 1 - Read The Readiness Signals

Gather:

- boundary clarity
- acceptance readiness
- visible blockers
- missing clarifications
- external dependency pressure

### Phase 2 - Choose The Route

Use one of:

- `route-admit`
- `route-hold`
- `route-back-to-shaping`
- `route-back-to-clarify`
- `route-escalate`

### Phase 3 - Deliver The Routing Artifact

Return the smallest routing artifact that the control plane can consume.

Use [references/output-templates.md](references/output-templates.md).
