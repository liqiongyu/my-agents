# Reference Runtime Walkthrough

This page is the Phase 2 walkthrough for the Issue-Driven Agent OS reference slice.

Its purpose is not to simulate a full orchestrator.
Its purpose is to show how the architecture can already be exercised with the smallest stable runtime form:

- one control-plane path
- one primary execution path
- one independent evaluation path
- zero to two specialists only when justified
- supporting services that may still be conceptual rather than implemented

## Minimal Runtime Form

The reference slice follows the frozen implementation baseline:

- logical architecture
  - `Option B`
  - `Control Plane + Issue Cell + On-demand Specialist`
- deployment topology
  - `Hybrid`
- default runtime form
  - one primary execution unit
  - one evaluator path
  - zero to two specialists
  - services for state, budget, verification, workspace, and projection concerns

In other words, one issue does not become a swarm.
It becomes one small execution cell inside a governed runtime.

## Stand-Ins Used In This Repo

This walkthrough uses existing repository assets only as temporary stand-ins:

- primary execution unit
  - [`agents/implementer`](../../../agents/implementer)
- evaluator path
  - [`agents/reviewer`](../../../agents/reviewer)
- optional exploration support
  - [`agents/explorer`](../../../agents/explorer)
- optional shaping or planning support
  - [`agents/planner`](../../../agents/planner)

These stand-ins exist to make the reference slice concrete.
They do not redefine the canonical ontology, and they do not mean every logical role deserves a permanent agent package.

## Services In This Walkthrough

The following runtime services are treated as part of the reference path even when they are still conceptual:

- admission and scheduling service
- shaping and decomposition service
- verification and gate engine
- budget governance service
- workspace and sandbox manager
- agent engine adapters

The important point is not whether every service is implemented today.
The important point is that the runtime path already distinguishes:

- what an execution unit may do
- what an evaluator may do
- what only services or the control plane may do

## Happy Path: `G1`

This is the smallest successful path and should remain within the minimal runtime form.

Scenario:

- [G1-small-bug-no-specialist.yaml](./scenarios/G1-small-bug-no-specialist.yaml)

Starting objects:

- [canonical-issue-g1-small-bug.yaml](./objects/canonical-issue-g1-small-bug.yaml)
- [run-record-g1-success.yaml](./objects/run-record-g1-success.yaml)

Expected artifacts:

- [change-object-g1-success.yaml](./objects/change-object-g1-success.yaml)
- [verification-report-g1-pass.yaml](./objects/verification-report-g1-pass.yaml)

### Step 1: Admission

The control plane reads the canonical issue and decides it is executable as-is.

Why it is admitted directly:

- the issue is already `ready`
- risk is `low`
- there are no child issues or unresolved dependencies
- the scenario forbids unnecessary specialist usage

At this point the runtime does not need decomposition, escalation, or extra tooling.

### Step 2: Run Creation

The control plane creates a run record and hands an execution brief into the issue cell.

The run shows the key runtime limits:

- token budget
- review-loop budget
- elapsed-time budget
- `specialist_calls_max: 0`

That last point is important.
It shows that the baseline path is intentionally generalist-first.

### Step 3: Primary Execution

The primary execution unit, represented here by [`agents/implementer`](../../../agents/implementer), performs the bug fix and produces a change object.

Result:

- branch exists
- PR exists
- change state is `merge_ready`

This is the point where the slice demonstrates a crucial boundary:

- the execution unit may produce code and evidence
- it does not unilaterally decide the final gate outcome

### Step 4: Independent Evaluation

The evaluator path, represented here by [`agents/reviewer`](../../../agents/reviewer), checks the change against the done contract and evidence.

The verification report records:

- `review_gate: pass`
- `acceptance_gate: pass`
- `browser_qa_gate: not_required`
- `merge_gate: pass`

This is why the happy path can advance without any specialist.
The gate result is formalized in the verification artifact rather than inferred from conversational comments.

### Step 5: Resolution

Only after the verification report passes does the governed path treat the change as merge-ready and the issue as resolved.

What this path demonstrates:

- one issue
- one primary execution path
- one evaluator path
- no specialist
- no run-state leakage into the issue lifecycle

## Gate-Blocked Path: `GT1`

This path shows that the system blocks merge when evaluation fails.

Scenario:

- [GT1-review-gate-blocks-merge.yaml](./scenarios/GT1-review-gate-blocks-merge.yaml)

Key objects:

- [canonical-issue-gt1-review-gate.yaml](./objects/canonical-issue-gt1-review-gate.yaml)
- [change-object-gt1-review-blocked.yaml](./objects/change-object-gt1-review-blocked.yaml)
- [verification-report-gt1-fail.yaml](./objects/verification-report-gt1-fail.yaml)

The important behavior is:

- the change remains `changes_requested`
- the issue stays `active`
- merge does not proceed

What this path proves:

- failed review is not just text in a PR thread
- it becomes a structured verification outcome
- control-plane progression is blocked until a later run or revision clears the gate

## Budget-Exhausted Path: `F1`

This path shows that failure is valid only if the runtime leaves behind a usable recovery artifact.

Scenario:

- [F1-budget-exhaustion.yaml](./scenarios/F1-budget-exhaustion.yaml)

Key objects:

- [run-record-f1-budget-exhausted.yaml](./objects/run-record-f1-budget-exhausted.yaml)
- [handoff-bundle-f1-budget-exhausted.yaml](./objects/handoff-bundle-f1-budget-exhausted.yaml)

The run fails because the budget envelope is exhausted during repeated review loops.

What must still happen:

- the issue remains active rather than being falsely resolved
- the run records `termination_reason: budget_exhausted`
- a handoff bundle captures completed work, remaining work, blockers, and the next recommended step

This path is where the budget governance service becomes visible.
Even if that service is still conceptual in the reference slice, the architecture already requires a formal budget-aware termination rule.

## Pre-Execution Decomposition Path: `D1`

This path proves that oversized work is split before execution begins.

Scenario:

- [D1-pre-execution-decomposition.yaml](./scenarios/D1-pre-execution-decomposition.yaml)

Starting object:

- [canonical-issue-d1-oversized-feature.yaml](./objects/canonical-issue-d1-oversized-feature.yaml)

This issue spans pricing logic, UI, tax rules, and invoice generation.
The shaping and decomposition path therefore acts before any run is created.

Expected outcomes:

- decomposition proposal exists
- issue graph is updated
- run state is `not_created`
- change state is `no_change_yet`

In the reference slice, this service is still conceptual.
If the repo later chooses a thin stand-in, [`agents/planner`](../../../agents/planner) is the most natural temporary candidate.

## What This Slice Already Proves

- the architecture can be exercised without building a full orchestrator first
- the smallest stable runtime form is concrete
- evaluation and verification are independent from primary execution
- budget exhaustion and decomposition are first-class runtime outcomes
- existing repo assets can act as stand-ins without redefining the system ontology

## What This Slice Does Not Claim

- it does not claim that the real control plane already exists in code
- it does not claim that every logical role deserves a permanent agent package
- it does not claim that GitHub projection defines canonical meaning
- it does not claim that the current stand-in agents are the final runtime decomposition

## Where To Go Next

- for the current architecture:
  - [issue-agent-os-architecture.md](../../architecture/issue-agent-os-architecture.md)
- for the full system blueprint:
  - [issue-driven-agent-operating-system.md](../../architecture/issue-driven-agent-operating-system.md)
