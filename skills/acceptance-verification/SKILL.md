---
name: acceptance-verification
description: >
  Manual-first workflow for deciding whether current evidence satisfies an
  issue's acceptance criteria and done contract, and for drafting a structured
  verification verdict. Use after execution or before merge when acceptance
  evidence matters; do not use for generic code review or backlog triage.
invocation_posture: manual-first
version: 0.1.0
---

# Acceptance Verification

Turn execution outputs plus evidence into a formal acceptance verdict.

This skill is the bridge between “the code seems done” and “the system can
honestly say the issue meets its acceptance boundary.” It is not generic review
and it is not policy-level risk gating. Its job is to test the current evidence
against the issue's acceptance criteria and done contract.

## Outputs

- A verification note with:
  - issue or run under review
  - acceptance criteria checked
  - evidence considered
  - pass / partial / fail verdict
  - evidence gaps
  - blocker list
  - recommended next workflow
- A verification-report draft when the system needs a formal gate artifact
- A route-back note when the real problem is missing execution evidence, bad
  issue shaping, or unresolved risk gating

## When To Activate

- The user asks whether current work actually satisfies acceptance criteria
- An issue cell or reviewer needs a formal done-contract check before merge or
  closure
- A gate depends on evidence-backed verification rather than open-ended review

## When Not To Use

- The main need is generic code critique; use `review`
- The main need is to score backlog priority; use `priority-scoring`
- The main need is to decide proceed/hold under risk; use `risk-gating`
- The issue boundary is still unclear; use `issue-shaping`

## Core Principles

1. Verify against criteria, not vibes.
2. Evidence gaps are first-class output.
3. Partial pass is not full pass.
4. A failed verification should say what is missing, not just “not done.”
5. Verification is formal enough to support a verification report, but it does
   not replace the control plane's final write authority.

## Workflow

### Phase 0 - Confirm The Acceptance Boundary

Read:

- the issue or run goal
- acceptance criteria
- done contract or gate expectations

If these are missing or unstable, route back.

### Phase 1 - Gather The Evidence

Inspect the smallest reliable evidence set:

- code or change output
- tests and check results
- screenshots, traces, logs, or specialist evidence when relevant
- review findings that materially affect acceptance

### Phase 2 - Check Criterion By Criterion

For each acceptance item, determine:

- satisfied
- partially satisfied
- unsatisfied
- cannot verify yet

### Phase 3 - Form The Verification Verdict

Use one of:

- `verified-pass`
- `verified-partial`
- `verified-fail`
- `needs-more-evidence`

### Phase 4 - Deliver The Verification Artifact

Return:

- a verification note
- a verification-report draft if needed
- a route-back note when the problem lives elsewhere

Use [references/output-templates.md](references/output-templates.md).
