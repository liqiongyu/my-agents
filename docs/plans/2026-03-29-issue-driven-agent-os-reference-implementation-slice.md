# Issue-Driven Agent OS Reference Implementation Slice Plan

## Goal

Create the smallest reference implementation slice that can exercise the Agent OS architecture with real repository artifacts, without prematurely building the full runtime system.

When this slice is complete, the repo should contain a minimal, inspectable reference path that demonstrates:

- the canonical object model in concrete example form
- the runtime contract in a runnable or at least walkthrough-ready form
- the intended minimal runtime shape
- validation against the first four starter scenarios:
  - `G1`
  - `GT1`
  - `F1`
  - `D1`

## Scope

- define the first reference-slice artifact set under `docs/examples/`
- create the minimum scenario fixtures and artifact examples needed to represent:
  - one success path
  - one gate-blocked path
  - one budget/failure path
  - one decomposition path
- define a thin reference operator path showing how the slice is exercised
- decide which existing repository assets are used as stand-ins for:
  - primary execution
  - critic / evaluation
  - exploration support
- keep the slice projection-friendly so it can later map to GitHub / Codex / Claude Code surfaces

## Not In Scope

- building the full control-plane runtime
- implementing a production orchestrator
- creating a complete issue graph service
- fully automating merge / close / recycle
- finalizing all future agent, skill, or pack packages
- locking the final transport protocol or API surface
- making all evaluation scenarios executable in automation on day one

## What Already Exists

- the master blueprint exists and is now stabilized in:
  - `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-operating-system.md`
- the bridge-layer documents now exist:
  - `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-canonical-schema.md`
  - `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-runtime-contract.md`
  - `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-evaluation-pack.md`
- the implementation baseline has already frozen:
  - `逻辑架构 = 选项 B`
  - `部署拓扑 = Hybrid`
- the repo already contains generic reusable agents that can serve as reference stand-ins:
  - `implementer`
  - `reviewer`
  - `explorer`
  - `planner`
- the repo already supports canonical package authoring and projection via:
  - `agents/`
  - `skills/`
  - `packs/`
  - `scripts/new.js`
- `docs/examples/` already exists as the natural home for concrete projection and artifact examples

## Constraints

- the slice must preserve the architecture's `generalist-first` and `runtime-minimal` principles
- the slice must not assume that every logical role becomes a runtime agent or package
- the slice should avoid depending on unrelated uncommitted workspace assets
- the slice should stay small enough to validate architecture, not accidentally become v1 of the whole platform
- the slice should leave room for later GitHub / Codex / Claude projection without requiring that projection immediately

## Success Criteria

- there is a concrete reference slice under `docs/examples/` that maps cleanly to the bridge docs
- the slice covers the four starter scenarios:
  - `G1`
  - `GT1`
  - `F1`
  - `D1`
- the slice demonstrates the minimal runtime form:
  - one primary execution path
  - one evaluation path
  - optional specialist only where justified
- the slice produces or defines the expected artifact forms:
  - issue
  - run
  - change
  - verification
  - handoff
- the slice is understandable without inventing a full orchestrator
- the slice can later be used as the anchor for package creation or a thin runtime prototype

## Assumptions

- the next best step is still a reference slice, not immediate package proliferation
- `docs/examples/` is the right initial home for the slice because we are still validating shape, not shipping runtime code
- existing generic agents are sufficient as temporary stand-ins for the primary execution and evaluation roles
- the first slice should optimize for clarity and pressure-testing, not automation completeness

## Open Decisions

- should the first reference slice remain entirely docs/examples-driven, or should it also create one small pack as a projection demo?
- should `implementer` and `reviewer` be used directly as reference stand-ins, or should the slice define thin dedicated wrappers later?
- how much GitHub-surface projection should be shown in the first slice:
  - none
  - example-only
  - partially wired reference

## Phases

### Phase 1: Reference Fixture Layer
- Outcome:
  - the repo gains a coherent example surface for the five canonical objects and the four starter scenarios
- Files / components:
  - `docs/examples/issue-driven-os/`
  - object examples
  - scenario examples
  - artifact examples
- Steps:
  - create a dedicated example subtree for the Agent OS slice
  - add canonical object examples for:
    - issue
    - run
    - change
    - verification
    - handoff
  - add starter scenario definitions for:
    - `G1`
    - `GT1`
    - `F1`
    - `D1`
  - ensure each scenario points at the minimum expected artifacts and state outcomes
- Verify:
  - every example object maps back to the canonical schema
  - every scenario maps back to the evaluation pack
- Depends on:
  - existing bridge docs

### Phase 2: Reference Runtime Walkthrough
- Outcome:
  - the slice gains a concrete walkthrough showing how one issue moves through the minimal runtime form
- Files / components:
  - `docs/examples/issue-driven-os/README.md`
  - one or more walkthrough or runbook pages
- Steps:
  - describe the minimal runtime path:
    - control-plane admission
    - issue-cell execution
    - critic / evaluation
    - verification
    - failure or decomposition where relevant
  - explicitly state which existing repo assets are used as stand-ins
  - show where services are conceptual rather than implemented
- Verify:
  - a new reader can understand how the slice exercises the architecture without needing the whole blueprint open
- Depends on:
  - Phase 1

### Phase 3: Projection Boundary Demonstration
- Outcome:
  - the slice demonstrates how the examples relate to projection surfaces without locking implementation too early
- Files / components:
  - `docs/examples/issue-driven-os/`
  - optional projection subpages
- Steps:
  - add at least one example mapping from canonical objects to a GitHub-like surface
  - add at least one example of adapter-facing references or projected lifecycle markers
  - keep the examples illustrative, not implementation-binding
- Verify:
  - projection is shown as derived from canonical objects, not the other way around
- Depends on:
  - Phase 1

### Phase 4: Minimal Validation Pass
- Outcome:
  - the reference slice is explicitly checked against the first four starter scenarios
- Files / components:
  - scenario walkthrough results
  - validation notes
- Steps:
  - walk the slice through:
    - `G1`
    - `GT1`
    - `F1`
    - `D1`
  - confirm which artifacts exist in each path
  - note any ambiguity where the bridge documents are still insufficient
- Verify:
  - the slice can represent success, gate block, failure, and decomposition without inventing new architecture
- Depends on:
  - Phase 2
  - Phase 3

### Phase 5: Optional Packaging Decision
- Outcome:
  - decide whether the validated slice should remain example-only for now or also project into one small pack
- Files / components:
  - optional `packs/` addition
  - optional packaging note
- Steps:
  - evaluate whether packaging clarifies the architecture or prematurely hardens it
  - if packaging is useful, limit it to one thin reference-slice pack
  - if packaging is not yet useful, explicitly defer it
- Verify:
  - packaging, if added, does not force premature ontology decisions
- Depends on:
  - Phase 4

## Verification

- check every reference object against the canonical schema document
- check every interaction in the walkthrough against the runtime contract document
- check every scenario against the evaluation pack definitions
- confirm the slice still reflects `Option B + Hybrid`
- confirm the slice still reflects the minimal runtime form
- confirm specialists only appear where tool or judgment boundaries justify them

## Risks

- Risk:
  - the slice grows into a disguised implementation of the whole system
  - Impact:
    - planning debt and premature hardening
  - Mitigation:
    - keep the first slice example-first and scenario-driven

- Risk:
  - the slice relies too heavily on existing generic agents and hides future role gaps
  - Impact:
    - false confidence about runtime fit
  - Mitigation:
    - clearly label stand-ins vs long-term intended roles

- Risk:
  - projection examples start to define canonical meaning
  - Impact:
    - inversion of host/runtime/projection boundaries
  - Mitigation:
    - require all projection examples to point back to canonical objects

- Risk:
  - scope expands to package creation too early
  - Impact:
    - over-agentization and repo-structure-driven design
  - Mitigation:
    - keep packaging optional until after the validation pass

## Rollback Or Containment

- Trigger:
  - the slice starts requiring a full orchestrator to remain coherent
  - Action:
    - reduce the slice back to examples plus walkthroughs; defer runtime implementation details

- Trigger:
  - package decisions start driving architecture decisions
  - Action:
    - stop package creation and continue with docs/examples-only validation

- Trigger:
  - the first four scenarios cannot be represented cleanly with the current bridge docs
  - Action:
    - pause implementation and patch the bridge docs before creating code assets

## Next Step

Execute `Phase 1: Reference Fixture Layer` first.

That is the smallest, most reversible step that turns the bridge documentation into something concrete enough to validate, while still preserving architecture-first discipline.
