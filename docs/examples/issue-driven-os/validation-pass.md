# Validation Pass

This page is the Phase 4 minimal validation pass for the Issue-Driven Agent OS reference slice.

It checks whether the slice can already represent the four starter scenarios without inventing extra architecture beyond the bridge-layer documents.

## Validation Rules

> **Note:** This validation was originally performed against three bridge-layer
> documents (canonical schema, runtime contract, evaluation pack) that have
> since been removed. The current architecture reference is
> [issue-agent-os-architecture.md](../../architecture/issue-agent-os-architecture.md).

Each scenario was checked against object boundaries, runtime actor and handoff boundaries, and scenario intent and expected coverage.

The slice passes this phase only if it can show:

- one success path
- one gate-blocked path
- one failure path with recovery trail
- one pre-execution decomposition path

## Summary Table

| Scenario | Category      | Representable in current slice | Key artifacts present                            | Result              |
| -------- | ------------- | ------------------------------ | ------------------------------------------------ | ------------------- |
| `G1`     | golden        | yes                            | issue, run, change, verification                 | pass                |
| `GT1`    | gate          | yes                            | issue, change, verification                      | pass                |
| `F1`     | failure       | yes                            | run, handoff                                     | pass                |
| `D1`     | decomposition | yes                            | issue, decomposition intent via scenario outcome | pass with noted gap |

## Scenario Checks

### `G1`

Scenario:

- [G1-small-bug-no-specialist.yaml](./scenarios/G1-small-bug-no-specialist.yaml)

Validated objects:

- [canonical-issue-g1-small-bug.yaml](./objects/canonical-issue-g1-small-bug.yaml)
- [run-record-g1-success.yaml](./objects/run-record-g1-success.yaml)
- [change-object-g1-success.yaml](./objects/change-object-g1-success.yaml)
- [verification-report-g1-pass.yaml](./objects/verification-report-g1-pass.yaml)

Validation result:

- the slice can represent admission, execution, evaluation, verification, and merge-ready resolution
- the scenario stays within the minimal runtime form
- no specialist is required

Why it passes:

- required actors are representable
- expected artifacts exist
- expected state outcomes are explicit
- disallowed behaviors are already ruled out by the fixture set

### `GT1`

Scenario:

- [GT1-review-gate-blocks-merge.yaml](./scenarios/GT1-review-gate-blocks-merge.yaml)

Validated objects:

- [canonical-issue-gt1-review-gate.yaml](./objects/canonical-issue-gt1-review-gate.yaml)
- [change-object-gt1-review-blocked.yaml](./objects/change-object-gt1-review-blocked.yaml)
- [verification-report-gt1-fail.yaml](./objects/verification-report-gt1-fail.yaml)

Validation result:

- the slice can represent a blocked review gate without inventing hidden state
- merge remains blocked
- issue remains active

Why it passes:

- review failure is formalized in verification
- change lifecycle remains distinct from issue lifecycle
- the scenario prevents free-text-only gate logic

### `F1`

Scenario:

- [F1-budget-exhaustion.yaml](./scenarios/F1-budget-exhaustion.yaml)

Validated objects:

- [run-record-f1-budget-exhausted.yaml](./objects/run-record-f1-budget-exhausted.yaml)
- [handoff-bundle-f1-budget-exhausted.yaml](./objects/handoff-bundle-f1-budget-exhausted.yaml)
- [change-object-gt1-review-blocked.yaml](./objects/change-object-gt1-review-blocked.yaml)
- [verification-report-gt1-fail.yaml](./objects/verification-report-gt1-fail.yaml)

Validation result:

- the slice can represent budget-aware failure
- failure leaves a usable recovery trail
- the issue is not falsely resolved

Why it passes:

- run termination reason is explicit
- blockers are captured
- handoff bundle records remaining work and next step
- silent failure is explicitly disallowed

### `D1`

Scenario:

- [D1-pre-execution-decomposition.yaml](./scenarios/D1-pre-execution-decomposition.yaml)

Validated object:

- [canonical-issue-d1-oversized-feature.yaml](./objects/canonical-issue-d1-oversized-feature.yaml)

Validation result:

- the slice can represent a pre-execution decomposition decision
- no run is created
- no change exists yet

Why it passes:

- the scenario clearly requires decomposition before execution
- the expected state outcomes stay at issue-graph level, not run level

Current gap:

- the slice does not yet include a dedicated decomposition proposal artifact or updated issue-graph object example
- for this phase, the scenario definition is sufficient to validate the architectural path
- this becomes a good candidate for a future refinement if decomposition artifacts need their own concrete example files

## What This Validation Pass Confirms

- the reference slice can already represent the four starter scenario classes promised in the plan
- the slice does not need a full orchestrator to demonstrate the architecture
- the bridge-layer docs are sufficient for an inspectable first slice
- the minimal runtime form remains intact

## Ambiguities Still Left Open

These are acceptable at this stage and do not block the reference slice:

- exact decomposition artifact schema
- exact adapter command sequence for projection sync
- exact GitHub workflow implementation for gate enforcement
- whether a later slice should package any of these examples into a thin pack

## Exit Decision

Phase 4 is considered passed because:

- success, gate block, failure, and decomposition are all representable
- no new canonical object type had to be invented during validation
- no projection surface had to become a truth source
- the slice still reflects `Option B + Hybrid`

## Next Step

The next decision is no longer architectural.
It is whether to keep the slice example-only for now or add one very thin projection package as an optional demonstration.
