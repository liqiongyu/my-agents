# Issue-Driven Agent OS Reference Slice

This directory contains the first concrete reference slice for the Issue-Driven Agent OS.

It is intentionally example-first.
Its purpose is to make the system's canonical objects and runtime expectations
tangible through concrete fixtures.

> **Note:** The bridge-era runtime scripts (`issue-driven-os-cli.js`,
> `issue-driven-os-pipeline.js`, etc.) and the bridge-era agent packages
> (`issue-orchestrator`, `issue-cell-executor`, `issue-cell-critic`,
> `issue-intake-normalizer`, `issue-shaper`) were removed in the migration to
> skill-based architecture. The controller now lives in
> `skills/issue-controller` and dispatches work through the standard agent
> packages (`triager`, `coder`, `reviewer`, `splitter`, `planner`, `debugger`).

## What Is Here

- `runtime-walkthrough.md`
  - Phase 2 walkthrough for the minimal runtime path and the three deviation paths
- `projection-boundary-demonstration.md`
  - Phase 3 example showing how canonical objects derive GitHub-like projection surfaces
- `validation-pass.md`
  - Phase 4 check of the four starter scenarios against the original bridge-layer documents
- `packaging-decision.md`
  - Phase 5 decision on whether the slice should stay example-only or project into a thin pack
- `objects/`
  - canonical object examples aligned with the system schema
- `scenarios/`
  - starter scenario fixtures aligned with the evaluation expectations

## Current Starter Coverage

- `G1`
  - small bug, no specialist
- `GT1`
  - review gate blocks merge
- `F1`
  - budget exhaustion
- `D1`
  - pre-execution decomposition

## Recommended Reading Order

1. Read [runtime-walkthrough.md](./runtime-walkthrough.md)
2. Read [projection-boundary-demonstration.md](./projection-boundary-demonstration.md)
3. Read [validation-pass.md](./validation-pass.md)
4. Read [packaging-decision.md](./packaging-decision.md)
5. Pick one scenario under [scenarios/](./scenarios/)
6. Follow the referenced objects under [objects/](./objects/)
7. For the current architecture, see [issue-agent-os-architecture.md](../../architecture/issue-agent-os-architecture.md)
8. For the full system blueprint, see [issue-driven-agent-operating-system.md](../../architecture/issue-driven-agent-operating-system.md)

## How To Read This Slice

This slice is meant to answer three questions quickly:

- What is the smallest runtime form the architecture expects?
- Which existing repository assets can stand in for that runtime today?
- Where are services still conceptual rather than implemented?

The walkthrough page answers those questions first.
The scenario and object files then provide the concrete fixtures behind that story.

## Current Runtime Agents

The Issue Agent OS now uses the `issue-controller` skill as the top-level
dispatcher. It fans out work to the standard agent packages:

- triage and brief writing
  - `agents/triager`
- code implementation
  - `agents/coder`
- code review
  - `agents/reviewer`
- issue decomposition
  - `agents/splitter`
- design and architecture
  - `agents/planner`
- bug investigation
  - `agents/debugger`

## Notes

- These examples are canonical-side fixtures, not GitHub-native projections.
- Projection examples in this directory are illustrative only and remain derived from canonical objects.
- The validation pass records what this slice can already represent without inventing additional architecture.
- The packaging decision records why the slice currently remains example-first instead of becoming a pack.
