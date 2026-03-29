---
name: backlog-curation
description: >
  Manual-first workflow for curating backlog state after execution, review, or
  learning passes: deduping, recycling, follow-up issue generation, and closure
  hygiene. Use when the next need is backlog cleanliness and durable work
  tracking, not fresh intake or queue prioritization.
invocation_posture: manual-first
version: 0.1.0
---

# Backlog Curation

Turn execution residue, follow-up needs, stale work, or duplicate pressure into
clean backlog actions.

This skill is about backlog hygiene after work has already flowed through the
system. It does not create raw issues from scratch, and it does not rank queue
priority. Its job is to say what should be closed, recycled, split into
follow-up issues, or merged with existing work.

## Outputs

- A backlog curation note with:
  - current backlog object
  - duplicate or overlap signals
  - stale or recycle signals
  - follow-up issue candidates
  - closure or archive recommendation
  - recommended next workflow
- A follow-up issue seed when new work should be tracked explicitly
- A recycle or dedupe recommendation when the work should not stay as-is

## When To Activate

- The user asks to curate, clean up, dedupe, recycle, or close backlog items
- Execution or verification produced follow-up work that should become tracked
  issues
- A queue has accumulated stale, duplicate, or half-finished items that need
  explicit backlog hygiene

## When Not To Use

- The input is a fresh issue candidate; use `issue-normalization`
- The question is queue priority; use `priority-scoring`
- The question is implementation readiness; use `issue-shaping`
- The main need is formal memory or learning capture only; use a learning flow
  instead of forcing backlog action

## Core Principles

1. Backlog cleanliness is a system function, not housekeeping theater.
2. Duplicate work should converge, not merely be labeled.
3. Follow-up work deserves explicit issue seeds when it crosses a real
   acceptance boundary.
4. Closure and recycle are different outcomes.
5. Curation should preserve provenance rather than erasing how work got here.

## Workflow

### Phase 0 - Confirm The Backlog Object

Identify whether the target is:

- a stale issue
- a duplicate issue
- a completed issue with follow-up work
- a failed or exhausted run that should recycle into new work

### Phase 1 - Read The Residue

Gather the smallest useful context:

- issue history
- current state
- recent verification or failure signals
- overlapping issues
- potential follow-up boundaries

### Phase 2 - Choose The Curation Outcome

Use one of:

- `curate-close`
- `curate-recycle`
- `curate-follow-up`
- `curate-merge-duplicate`
- `curate-hold`

### Phase 3 - Produce The Curation Artifact

Return:

- a curation note
- a follow-up issue seed when needed
- a dedupe / recycle recommendation

Use [references/output-templates.md](references/output-templates.md).
