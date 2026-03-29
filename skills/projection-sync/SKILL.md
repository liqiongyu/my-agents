---
name: projection-sync
description: >
  Manual-first workflow for synchronizing canonical issue-driven objects to
  projection surfaces such as GitHub issue, PR, and check metadata without
  letting projections become the source of truth. Use for explicit projection
  updates, not canonical state mutation.
invocation_posture: manual-first
version: 0.1.0
---

# Projection Sync

Project canonical state to an external surface without turning that surface into
the new truth.

This skill is about derived writeback: issue labels, comments, PR links, check
surfaces, or other projection artifacts. It must preserve the source-of-truth
hierarchy defined in the Agent OS blueprint.

## Outputs

- A projection sync plan or note with:
  - canonical source object
  - target projection surface
  - fields to sync
  - writeback intent
  - no-op or conflict notes
- A projection payload draft when the sync should be explicit
- A conflict note when projection state has drifted and cannot safely be synced

## When To Activate

- The user asks to sync canonical issue/run/change/verification state to GitHub
  or another projection surface
- A control-plane workflow needs explicit projection writeback planning
- You need to explain what should be written outward without changing canonical
  state itself

## When Not To Use

- The real need is to mutate canonical state
- The task is generic artifact summarization
- The task is just linking refs; use `artifact-linking`

## Core Principles

1. Projection is derived, not authoritative.
2. Sync only from canonical objects outward.
3. Surface drift should be called out, not silently absorbed.
4. Projection updates should be explicit about target fields and intent.

## Workflow

### Phase 0 - Confirm The Source Of Truth

Identify:

- the canonical object
- the target projection surface
- the fields that may be projected

### Phase 1 - Compare Canonical And Surface State

Read:

- canonical issue/run/change/verification data
- the current outward surface
- drift or mismatch signals

### Phase 2 - Produce The Sync Intent

Return:

- field-by-field sync plan
- no-op when already aligned
- conflict note when a safe sync cannot proceed

Use [references/output-templates.md](references/output-templates.md).
