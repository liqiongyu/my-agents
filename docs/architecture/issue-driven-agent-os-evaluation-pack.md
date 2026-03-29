# Issue-Driven Agent OS Evaluation Pack

**Date:** 2026-03-29  
**Primary blueprint:** `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-operating-system.md`  
**Implementation baseline:** `/Users/liqiongyu/projects/pri/my-agents/docs/plans/2026-03-29-issue-driven-agent-os-implementation-baseline.md`  
**Canonical schema:** `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-canonical-schema.md`  
**Runtime contract:** `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-runtime-contract.md`

## 0. Purpose

This document defines the first evaluation pack for the Issue-Driven Agent OS.

Its job is simple:

- turn the blueprint, canonical schema, and runtime contract into a concrete validation surface

This is not a benchmark leaderboard and not a final automated test suite.
It is the bridge artifact that answers:

- what scenarios must the system survive
- what outputs must exist after each scenario
- what failure modes must be detectable
- what counts as passing behavior vs. architecture drift

## 1. Scope

This evaluation pack covers four scenario families:

1. `Golden Issue Scenarios`
2. `Gate Scenarios`
3. `Failure Scenarios`
4. `Decomposition Scenarios`

Together, they are the minimum set needed to pressure-test:

- issue-driven execution
- control-plane authority
- runtime contract boundaries
- specialist invocation
- recovery behavior
- decomposition behavior

## 2. Evaluation Principles

### 2.1 Evaluate The System, Not Just The Model

The target is not “can a model write code.”
The target is whether the full system behaves correctly:

- right object boundaries
- right runtime responsibilities
- right state progression
- right escalation behavior
- right artifact production

### 2.2 Evidence Over Narrative

A scenario should pass because the right canonical objects, artifacts, and transitions exist, not because a run “looked reasonable.”

### 2.3 Minimal Runtime Shape Must Hold

The evaluation pack should detect drift away from the intended runtime baseline:

- `1` primary execution unit
- `1` evaluation path
- `0~2` specialists
- services as operational components

If a scenario silently turns into a many-agent swarm, that should count as architectural drift.

### 2.4 Failure Is A First-Class Outcome

The system must be evaluated not only on success paths, but also on:

- budget exhaustion
- non-convergence
- gating failure
- decomposition need
- escalation need

### 2.5 Scenarios Must Be Reusable

The evaluation pack should define scenarios in a way that can later support:

- manual walkthroughs
- dry-run validation
- scripted checks
- future automated harnesses

## 3. What Each Scenario Must Specify

Every scenario in the evaluation pack should specify at least:

- `scenario_id`
- `category`
- `goal`
- `starting objects`
- `required runtime actors`
- `expected artifacts`
- `expected state outcomes`
- `disallowed behaviors`
- `notes`

This keeps the evaluation layer aligned with the runtime contract rather than drifting into vague demos.

## 4. Scenario Categories

### 4.1 Golden Issue Scenarios

These validate the normal happy-path system shape.

They answer:

- can the system admit, execute, verify, and close work correctly?
- do canonical objects remain well separated?
- does the runtime stay within the minimal issue-cell shape?

### 4.2 Gate Scenarios

These validate whether gate behavior is correct.

They answer:

- are required gates triggered?
- are gate results formalized through `Verification Report`?
- are merge / close decisions blocked when gates fail?

### 4.3 Failure Scenarios

These validate recovery, containment, and non-success outcomes.

They answer:

- does the system terminate cleanly when work fails?
- are failure reasons explicit?
- does the system leave behind enough artifacts to recover or escalate?

### 4.4 Decomposition Scenarios

These validate whether the system can correctly split work.

They answer:

- can it identify oversized or mixed-boundary work before execution?
- can it trigger decomposition during execution when hidden complexity emerges?
- does it return to shaping instead of blindly continuing?

## 5. Starter Evaluation Pack

The first evaluation pack should include at least the following scenarios.

### 5.1 Golden Issue Scenarios

#### G1. Small Bug, No Specialist

- Goal:
  - validate the simplest successful issue path
- Shape:
  - one bug issue
  - one run
  - one change
  - no specialist
- Expected:
  - issue progresses correctly
  - run produces evidence and verification
  - change reaches merge-ready or merged
- Disallowed:
  - extra agents with no reason
  - issue-level state polluted by run details

#### G2. Feature With Critic Loop

- Goal:
  - validate the internal builder / critic revision loop
- Shape:
  - one feature issue
  - at least one review correction cycle
- Expected:
  - decision and evidence artifacts accumulate correctly
  - final verification reflects corrected implementation rather than initial draft
- Disallowed:
  - critic comments treated as final gate without verification

#### G3. UI Task Requiring Browser QA Specialist

- Goal:
  - validate on-demand specialist invocation
- Shape:
  - UI-facing issue
  - browser QA specialist required
- Expected:
  - specialist is invoked for a real tool-bound reason
  - browser evidence appears
  - gate result depends on structured verification
- Disallowed:
  - specialist invoked as decoration
  - browser QA result left only in chat text

### 5.2 Gate Scenarios

#### GT1. Review Gate Blocks Merge

- Goal:
  - ensure merge does not proceed when review gate fails
- Expected:
  - `Verification Report` records failure
  - `Change Object` does not enter merged state
  - Control Plane does not close the issue prematurely

#### GT2. Architecture Gate Required

- Goal:
  - ensure specialist gate behavior is explicit when architecture-sensitive changes occur
- Expected:
  - architecture specialist or architecture review path is triggered
  - gate result is formalized
  - run outcome depends on that result

#### GT3. Gate Not Required Path

- Goal:
  - ensure the system does not over-trigger specialists or gates
- Expected:
  - not-required gates are explicitly marked as such
  - simple issues are allowed to stay simple

### 5.3 Failure Scenarios

#### F1. Budget Exhaustion

- Goal:
  - validate budget-aware termination
- Expected:
  - run ends with explicit termination reason
  - issue is not silently marked resolved
  - handoff or failure artifact exists

#### F2. Critic Loop Non-Convergence

- Goal:
  - validate loop termination and escalation behavior
- Expected:
  - loop count or convergence rule triggers
  - system escalates or fails cleanly
  - no infinite revise/review cycle

#### F3. Tool / Environment Blocker

- Goal:
  - validate blocked-path handling
- Expected:
  - blocker is recorded in `Run Record`
  - system does not fake completion
  - handoff or escalation path is available

### 5.4 Decomposition Scenarios

#### D1. Pre-Execution Decomposition

- Goal:
  - validate that oversized work is split before execution
- Expected:
  - shaping produces child issues or decomposition proposal
  - execution does not begin as if the issue were already execution-ready

#### D2. In-Execution Decomposition

- Goal:
  - validate decomposition after hidden complexity emerges
- Expected:
  - active run does not continue blindly
  - issue returns to shaping / decomposition path
  - follow-up or child issue structure is created

#### D3. Escalation Instead Of Decomposition

- Goal:
  - ensure the system distinguishes “needs split” from “needs higher-risk human or governance decision”
- Expected:
  - escalation is explicit
  - decomposition is not used as a substitute for governance

## 6. Evaluation Dimensions

Each scenario should be scored across the following dimensions.

### 6.1 Object Integrity

Checks:

- are the right canonical objects present?
- are object boundaries respected?
- are states stored in the correct object domain?

### 6.2 Runtime Boundary Integrity

Checks:

- did the system preserve `Control Plane` vs `Issue Cell` authority?
- did specialists remain bounded?
- did services remain operational rather than persona-like?

### 6.3 State Plane Integrity

Checks:

- was issue state kept distinct from run state?
- was change / PR state kept distinct from run state?
- were transitions formalized in the right layer?

### 6.4 Gate Integrity

Checks:

- were required gates triggered?
- were not-required gates skipped cleanly?
- did gate outcomes flow through `Verification Report`?

### 6.5 Recovery Integrity

Checks:

- on failure or interruption, is there enough state to resume?
- are blockers explicit?
- is the handoff sufficient?

### 6.6 Minimal Runtime Integrity

Checks:

- did the runtime stay close to the intended minimal form?
- did the system avoid accidental swarm growth?

## 7. Scenario Record Template

Each scenario should later be expressible in a simple structured form like:

```yaml
scenario_id: G1
category: golden
goal: Validate small bug success path without specialist invocation.
starting_objects:
  issue: issue_fixture_bug_01
required_runtime_actors:
  - control_plane
  - issue_cell
expected_artifacts:
  - run_record
  - change_object
  - verification_report
expected_state_outcomes:
  issue: resolved
  run: succeeded
  change: merge_ready
disallowed_behaviors:
  - specialist_without_reason
  - issue_state_contains_run_state
notes: >
  Simplest baseline success path.
```

This template is intentionally lightweight so that it can later be encoded in files, fixtures, or test harnesses.

## 8. Minimum Artifact Expectations Per Scenario

At minimum, a scenario should leave behind enough artifacts to answer:

- what issue was evaluated
- what run occurred
- whether a change was produced
- whether verification occurred
- whether handoff was required
- why the scenario passed, failed, or escalated

For most non-trivial scenarios, the minimum artifact set should include:

- `Run Record`
- at least one evidence or decision artifact
- `Verification Report` when a gate was attempted
- `Handoff Bundle` when the run did not fully close the work

## 9. What Counts As Evaluation Failure

The system should be considered to have failed a scenario if any of the following occur:

- canonical object ownership becomes ambiguous
- lifecycle states are written in the wrong object domain
- specialists are invoked without meaningful tool or judgment need
- gate results exist only in free text
- merge / close occurs without structured verification
- failure or escalation leaves no usable recovery trail
- the runtime silently expands into an uncontrolled many-agent pattern

## 10. What This Pack Is For

This evaluation pack should be used for:

- manual architecture walkthroughs
- dry-run simulations
- first reference runtime validation
- future automated harnesses

It should not be mistaken for:

- a single model benchmark
- a pure unit-test plan
- a release checklist

## 11. Acceptance Criteria

This bridge document is complete only if:

1. the starter pack covers success, gate, failure, and decomposition paths
2. every scenario category ties back to blueprint and runtime-contract concerns
3. pass / fail conditions are defined at the system level, not just at the model-output level
4. the document remains bridge-layer and does not collapse into implementation-specific test code

## 12. Recommended Next Step

Use this evaluation pack together with the canonical schema and runtime contract to define:

- the first minimal reference implementation slice

That slice should be chosen to exercise at least:

- `G1`
- `GT1`
- `F1`
- `D1`

Those four scenarios are enough to pressure-test the basic shape of the system before scaling out.
