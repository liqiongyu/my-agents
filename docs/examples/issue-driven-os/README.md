# Issue-Driven Agent OS Reference Slice

This directory contains the first concrete reference slice for the Issue-Driven Agent OS.

It is intentionally example-first.
Its purpose is to make the bridge-layer documents tangible before building a full runtime implementation.

## What Is Here

- `runtime-walkthrough.md`
  - Phase 2 walkthrough for the minimal runtime path and the three deviation paths
- `projection-boundary-demonstration.md`
  - Phase 3 example showing how canonical objects derive GitHub-like projection surfaces
- `validation-pass.md`
  - Phase 4 check of the four starter scenarios against the bridge-layer documents
- `packaging-decision.md`
  - Phase 5 decision on whether the slice should stay example-only or project into a thin pack
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

## Recommended Reading Order

1. Read [runtime-walkthrough.md](./runtime-walkthrough.md)
2. Read [projection-boundary-demonstration.md](./projection-boundary-demonstration.md)
3. Read [validation-pass.md](./validation-pass.md)
4. Read [packaging-decision.md](./packaging-decision.md)
5. Pick one scenario under [scenarios/](./scenarios/)
6. Follow the referenced objects under [objects/](./objects/)
7. Compare the object shapes against:
   - [/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-canonical-schema.md](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-canonical-schema.md)
8. Compare the actor and handoff boundaries against:
   - [/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-runtime-contract.md](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-runtime-contract.md)
9. Compare the scenario intent against:
   - [/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-evaluation-pack.md](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-evaluation-pack.md)

## How To Read This Slice

This slice is meant to answer three questions quickly:

- What is the smallest runtime form the architecture expects?
- Which existing repository assets can stand in for that runtime today?
- Where are services still conceptual rather than implemented?

The walkthrough page answers those questions first.
The scenario and object files then provide the concrete fixtures behind that story.

## Runtime Bundle Helper

This slice now includes a thin reference-runtime helper.
It does not run a full orchestrator.
It resolves one starter scenario into a concrete runtime bundle that shows:

- starting canonical objects
- required runtime actors
- current repo stand-ins
- expected artifacts
- expected state outcomes

Run it with:

```bash
npm run issue-driven-os:bundle -- G1
```

For machine-readable output:

```bash
npm run issue-driven-os:bundle -- GT1 --json
```

## Reference Stand-Ins

This slice does not claim that the existing repo already contains the real Agent OS runtime.
Instead, it uses existing repository assets only as narrow stand-ins:

- primary execution path
  - `agents/implementer`
- evaluator path
  - `agents/reviewer`
- optional exploration support
  - `agents/explorer`
- optional shaping or planning support
  - `agents/planner`

These are stand-ins for the reference slice only.
They are not a commitment that future runtime roles must map 1:1 to these package names.

## Notes

- These examples are canonical-side fixtures, not GitHub-native projections.
- The slice is intentionally small and does not imply a full orchestrator exists yet.
- Runtime services such as admission, budget checks, verification gates, workspace management, and adapters are still described conceptually in this slice unless a file explicitly shows otherwise.
- Projection examples in this directory are illustrative only and remain derived from canonical objects.
- The validation pass records what this slice can already represent without inventing additional architecture.
- The packaging decision records why the slice currently remains example-first instead of becoming a pack.
