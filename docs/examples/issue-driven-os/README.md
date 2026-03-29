# Issue-Driven Agent OS Reference Slice

This directory contains the first concrete reference slice for the Issue-Driven Agent OS.

It is intentionally example-first.
Its purpose is to make the bridge-layer documents tangible before building a full runtime implementation.

## What Is Here

- `objects/`
  - canonical object examples aligned with the bridge-layer schema
- `scenarios/`
  - starter scenario fixtures aligned with the evaluation pack

## Current Starter Coverage

- `G1`
  - small bug, no specialist
- `GT1`
  - review gate blocks merge
- `F1`
  - budget exhaustion
- `D1`
  - pre-execution decomposition

## How To Read This Slice

1. Start from the scenario file under `scenarios/`
2. Follow the object references into `objects/`
3. Compare the object shapes against:
   - `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-canonical-schema.md`
4. Compare the actor expectations against:
   - `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-runtime-contract.md`
5. Compare the pass/fail shape against:
   - `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-evaluation-pack.md`

## Notes

- These examples are canonical-side fixtures, not GitHub-native projections.
- The slice is intentionally small and does not imply a full orchestrator exists yet.
- Existing repository agents such as `implementer`, `reviewer`, and `explorer` may later act as temporary stand-ins, but this directory does not hard-bind to them yet.
