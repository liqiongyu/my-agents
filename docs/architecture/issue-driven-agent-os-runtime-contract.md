# Issue-Driven Agent OS Runtime Contract

**Date:** 2026-03-29  
**Primary blueprint:** `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-operating-system.md`  
**Implementation baseline:** `/Users/liqiongyu/projects/pri/my-agents/docs/plans/2026-03-29-issue-driven-agent-os-implementation-baseline.md`  
**Canonical schema:** `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-canonical-schema.md`

## 0. Purpose

This document defines the bridge-layer runtime contract for the Issue-Driven Agent OS.

It answers one question:

- once the canonical objects exist, how do the main runtime actors interact without blurring ownership, authority, or lifecycle boundaries?

This document is not:

- an API spec
- a transport protocol
- a vendor-specific workflow
- a final orchestrator implementation design

It is the minimal interaction contract that lets the system move from blueprint to reference implementation.

## 1. Scope

This document defines the contract among:

- `Control Plane`
- `Issue Cell`
- `Specialist`
- `Service`
- `Adapter`

It assumes the canonical objects already exist conceptually:

- `Canonical Issue`
- `Run Record`
- `Change Object`
- `Verification Report`
- `Handoff Bundle`

## 2. Contract Principles

### 2.1 Control Plane Owns Formal State Progression

The Control Plane is the only layer that should formally advance:

- issue lifecycle
- run lifecycle
- change lifecycle
- merge / close / recycle outcomes

Other actors may propose, recommend, or supply evidence, but they should not become competing state authorities.

### 2.2 Issue Cell Owns Local Execution Context

The Issue Cell owns:

- local task execution context
- execution progress inside a run
- evidence generation
- decision proposals
- specialist requests
- handoff preparation

It does not own final state transitions.

### 2.3 Specialists Own Bounded Judgments

Specialists should only be invoked for:

- tool-bound work
- judgment-bound work
- explicit gate-oriented evaluation
- bounded delegated subtasks

They should return structured outputs, not free-form authority.

### 2.4 Services Own Operational Responsibilities

Services should own system-level runtime responsibilities such as:

- workspace lifecycle
- artifact storage
- routing
- budget checking
- gate execution
- adapter translation

They should not be treated as persona-style agents.

### 2.5 Adapters Translate, Not Decide

Adapters map canonical runtime intent into platform-specific execution surfaces.

They should not:

- redefine canonical state
- become a new source of truth
- silently change lifecycle semantics

## 3. Runtime Actors

### 3.1 Control Plane

The Control Plane is the governance kernel.

Primary responsibilities:

- admit or reject execution
- create and close runs
- enforce budgets and policies
- consume structured reports
- write formal lifecycle transitions
- trigger merge / close / recycle
- escalate to human governance when necessary

### 3.2 Issue Cell

The Issue Cell is the per-issue runtime execution unit.

Primary responsibilities:

- consume execution brief and canonical issue context
- run the main execution loop
- request specialists when needed
- produce evidence, decisions, verification requests, and handoff context
- signal when a run is ready for gate evaluation or should be escalated

### 3.3 Specialist

A Specialist is an on-demand bounded runtime participant.

Primary responsibilities:

- advisory judgment
- gate-oriented evaluation
- delegated subtask execution
- escalation back to shaping or governance when the issue no longer fits the current autonomy boundary

### 3.4 Service

A Service is a runtime component with explicit operational ownership.

Primary responsibilities vary by service type, but may include:

- workspace provisioning
- artifact storage and retrieval
- specialist routing
- budget enforcement
- verification execution
- projection sync

### 3.5 Adapter

An Adapter translates internal runtime intent into external execution-engine or collaboration-platform actions.

Examples:

- Codex adapter
- Claude Code adapter
- GitHub projection adapter

## 4. Contract Surface By Actor

### 4.1 Control Plane Contract

#### Inputs

- canonical issue state
- shaping / decomposition results
- run proposals
- evidence and decision artifacts
- verification reports
- handoff bundles
- policy and budget context

#### Outputs

- run creation
- formal lifecycle writes
- gate requests
- merge / close / recycle decisions
- escalation decisions
- service calls

#### Allowed Writes

- `Canonical Issue`
- `Run Record`
- `Change Object`
- `Verification Report` registration or acceptance
- formal projection sync triggers

#### Not Allowed To Rely On

- raw conversational statements as sole authority
- unstructured comments as gate truth
- projection surfaces as canonical state

### 4.2 Issue Cell Contract

#### Inputs

- canonical issue context
- execution brief
- done contract
- current run record
- accessible context packs, skills, and tool affordances

#### Outputs

- evidence packets
- decision packets
- specialist requests
- change proposals
- verification requests
- handoff bundles
- escalation proposals

#### Allowed Writes

- evidence artifacts
- decision artifacts
- handoff artifacts
- local execution outputs through adapters or services

#### Not Allowed To Do

- formally close issues
- formally merge changes
- formally override budget rules
- become the final authority on gate success

### 4.3 Specialist Contract

#### Inputs

- specialist trigger context
- relevant canonical issue / run / change references
- specialist-specific context pack
- explicit task framing: advisory, gate, delegated subtask, or escalation

#### Outputs

- structured specialist result
- gate conclusion or advisory notes
- delegated result artifact
- escalation recommendation

#### Allowed Writes

- specialist evidence
- specialist decision output
- bounded task artifacts

#### Not Allowed To Do

- redefine issue identity
- redefine run lifecycle directly
- silently widen their own scope

### 4.4 Service Contract

#### Inputs

- service request from control plane or issue cell
- canonical references
- policy or budget inputs where relevant

#### Outputs

- deterministic result
- structured service record
- operational artifact reference
- success / failure / blocked result

#### Allowed Writes

- service-owned operational records
- service outputs or artifacts
- adapter-facing translation results when applicable

#### Not Allowed To Do

- invent new lifecycle semantics
- replace canonical governance decisions

### 4.5 Adapter Contract

#### Inputs

- canonical object references
- runtime intent
- platform-specific projection config

#### Outputs

- projected branch / PR / issue / check actions
- platform-facing references
- projection sync records

#### Allowed Writes

- platform-facing projection surfaces
- projection metadata

#### Not Allowed To Do

- become the canonical source of truth
- silently mutate ontology to satisfy platform limitations

## 5. Core Interaction Contracts

### 5.1 Control Plane -> Issue Cell

The Control Plane may start or resume an Issue Cell only when:

- the issue is in an executable issue state
- a run has been created
- budget exists
- an execution brief is available

Minimum handoff:

- issue reference
- run reference
- execution brief reference
- done contract reference
- current budget envelope
- current policy context

### 5.2 Issue Cell -> Control Plane

The Issue Cell should communicate back only through structured outputs, such as:

- run progress checkpoint
- specialist request
- verification request
- escalation proposal
- handoff bundle
- termination signal

It should not rely on implicit conversational state for lifecycle control.

### 5.3 Issue Cell -> Specialist

The Issue Cell may invoke a Specialist only with:

- a declared specialist mode
  - `advisory`
  - `gate`
  - `delegated_subtask`
  - `escalation`
- the relevant issue / run / change references
- the minimum required context pack
- the expected output contract

### 5.4 Specialist -> Issue Cell / Control Plane

The Specialist must return:

- declared mode
- structured conclusion
- supporting evidence refs
- any required follow-up action

If the mode is `gate`, the result must be consumable by the verification path or control plane without narrative interpretation.

### 5.5 Control Plane -> Services

The Control Plane may call services for:

- workspace lifecycle
- budget checks
- verification execution
- merge / close / recycle actions
- projection synchronization

The return value should always be structured enough to support audit and retry.

### 5.6 Issue Cell -> Services

The Issue Cell may call services only for bounded operational needs such as:

- artifact persistence
- workspace access
- trace writes
- deterministic utility execution

It should not use service calls to bypass the Control Plane's governance role.

### 5.7 Control Plane / Issue Cell -> Adapter

Adapters may be invoked to:

- create or update platform-facing artifacts
- map branch / PR / issue references
- emit platform-native checks or sync results

Adapters should return:

- external reference IDs
- projection result
- any projection error or incompatibility note

## 6. Runtime State Responsibilities

### 6.1 Who Owns What

| Domain             | Primary owner                     | Supporting actors      |
| ------------------ | --------------------------------- | ---------------------- |
| issue lifecycle    | Control Plane                     | Issue Cell, Specialist |
| run lifecycle      | Control Plane                     | Issue Cell, Service    |
| change lifecycle   | Control Plane                     | Issue Cell, Adapter    |
| execution evidence | Issue Cell                        | Specialist, Service    |
| gate result        | Verification path / Control Plane | Specialist             |
| workspace state    | Workspace service                 | Control Plane          |
| projection state   | Adapter / projection service      | Control Plane          |

### 6.2 What Issue Cell May Suggest But Not Finalize

The Issue Cell may suggest:

- issue progression
- run completion
- change readiness
- specialist need
- decomposition need
- escalation

But those suggestions become formal only after Control Plane consumption and writeback.

## 7. Termination And Escalation Contract

### 7.1 Successful Completion

A run may be treated as successfully complete only when:

- Issue Cell indicates readiness
- required verification succeeds
- gate results are formalized
- Control Plane advances the relevant states

### 7.2 Failed Completion

A run may fail when:

- budget is exhausted
- required artifacts cannot be produced
- blockers cannot be cleared
- evaluation does not converge

Failure should still produce a structured termination reason and, when possible, a handoff bundle.

### 7.3 Escalation

Escalation should occur when:

- issue boundaries no longer hold
- decomposition is needed
- risk exceeds autonomy boundary
- required authority is unavailable

Escalation is not failure by itself. It is a valid runtime outcome.

## 8. Minimum Artifacts Per Run

Each run should aim to leave behind, at minimum:

- updated `Run Record`
- at least one evidence or decision artifact when meaningful work occurred
- a `Verification Report` if a gate was attempted
- a `Handoff Bundle` if the run did not cleanly terminate into final closure

This is what allows recovery and continuity across sessions or retries.

## 9. Reserved For Later Layers

The following are intentionally deferred:

- transport protocol details
- REST / GraphQL / file API design
- exact event bus format
- exact orchestration host model
- exact adapter command sequences
- exact service storage model

These belong to later implementation layers.

## 10. Acceptance Criteria

This runtime contract is complete only if:

1. each actor has a clear responsibility boundary
2. writes and suggestions are explicitly distinguished
3. specialists cannot become shadow control planes
4. services cannot become pseudo-personas
5. adapters cannot become silent truth sources
6. downstream implementation work can wire a minimal reference runtime without reopening ownership debates

## 11. Recommended Next Step

Use this document together with the canonical schema to author the next bridge artifact:

- `evaluation pack`

That artifact should define how to pressure-test these contracts with golden issues, gates, failure cases, and decomposition cases.
