---
name: artifact-linking
description: >
  Manual-first workflow for linking issue, run, change, verification, and
  handoff artifacts together and exposing those refs cleanly on projection
  surfaces. Use when artifact traceability matters more than generic
  synchronization or summary writing.
invocation_posture: manual-first
version: 0.1.0
---

# Artifact Linking

Make the runtime artifact graph legible.

This skill is about references and traceability: connecting issues to runs,
runs to changes, changes to verification reports, and failed runs to handoff
bundles. It is narrower than projection sync and should not claim to update all
surface state.

## Outputs

- An artifact-linking note with:
  - source artifact
  - target artifacts
  - link intent
  - missing refs
  - recommended writeback surfaces
- A link-set draft for comments, metadata, or manifests
- A missing-ref note when traceability is not yet good enough

## When To Activate

- The user asks to attach, connect, or expose artifact refs
- A control-plane or review workflow needs explicit traceability between
  canonical objects
- Projection surfaces should show links to evidence, change, or verification
  artifacts

## When Not To Use

- The task is general projection state sync; use `projection-sync`
- The task is just a generic summary
- The task needs canonical object mutation rather than linking

## Core Principles

1. Traceability is part of governance, not decoration.
2. Missing refs should stay visible.
3. Link artifacts explicitly rather than relying on implicit chat history.
4. Linking does not replace lifecycle state ownership.

## Workflow

### Phase 0 - Confirm The Artifact Set

Identify:

- source artifact
- target artifacts
- target projection surfaces if any

### Phase 1 - Read Existing Traceability

Gather:

- current refs
- missing refs
- conflicting refs
- surfaces where those refs should appear

### Phase 2 - Produce The Link Set

Return:

- explicit links to add
- refs still missing
- suggested surface placement

Use [references/output-templates.md](references/output-templates.md).
