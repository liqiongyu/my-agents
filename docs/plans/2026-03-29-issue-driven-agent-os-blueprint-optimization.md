# Issue-Driven Agent OS Blueprint Optimization Plan

**Date:** 2026-03-29  
**Primary document:** `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-operating-system.md`

## Goal

Turn the current Issue-Driven Agent OS blueprint from a strong master architecture document into a tighter, more durable final blueprint by fixing two remaining structural weaknesses:

1. `Role / Agent / Skill / Script / Policy / Artifact / Context Pack / Service / Repo Package` boundaries are not yet explicit enough.
2. The current monorepo structure is still slightly too close to the system ontology instead of being treated as a host and projection layer.

This plan is intentionally architecture-first. It does not define implementation sequencing for runtime code, GitHub workflows, or package creation.

## Why This Plan Exists

The current blueprint is already strong in several important ways:

- It has a platform-neutral ontology instead of being written around a single vendor surface.
- It separates control plane, issue cell runtime, specialist capability domains, and repository projection.
- It defines core runtime objects such as canonical issues, issue graphs, runs, workspaces, changes, evidence, verification artifacts, and handoff bundles.
- It already includes governance concepts such as state planes, budget, write authority, and source-of-truth awareness.

However, multiple internal and external reviews converged on the same two remaining problems:

- the document still risks being read as too agent-heavy
- the current repo layout still risks being interpreted as the system body rather than a projection host

This plan exists to close those gaps without changing the overall architecture direction.

## Design Principles

This optimization pass follows six principles:

1. **Architecture-first, projection-second**  
   Define the system ontology first, then project it onto the current repo structure.

2. **Role-first, instance-second**  
   Define logical roles first; instantiate runtime agents only when isolation, autonomy, or responsibility boundaries require it.

3. **Generalist-first, specialist-on-demand**  
   Default to a strong generalist execution cell. Bring in specialists only when tools, permissions, or judgment domains materially differ.

4. **Runtime-minimal, capability-rich**  
   A single issue may load many capabilities, but it should not default to many always-on runtime agents.

5. **Source-of-truth-first, projection-derived-second**  
   Canonical records must be explicit; projections may display, cache, or adapt them but do not redefine them.

6. **Host-not-cage**  
   The current monorepo can host and distribute the system's capabilities, but it must not become the upper-bound constraint on the system's ontology.

## Scope

This plan includes:

- restructuring and tightening the master blueprint
- formalizing the type system used across the blueprint
- defining runtime instantiation rules
- defining source-of-truth and conflict resolution policy
- cleaning up state plane boundaries
- redefining repo compatibility as projection policy
- adding mandatory diagrams and a document acceptance checklist

This plan does not include:

- runtime orchestrator implementation
- GitHub workflow implementation
- package creation in `agents/`, `skills/`, or `packs/`
- schema or protocol implementation details
- rollout order for production adoption

## Architecture Decisions Already Locked

This optimization plan does **not** reopen the blueprint's major architectural choices. The following remain in force:

- The overall system stays Issue-Driven.
- The system keeps a control plane plus per-issue execution cell model.
- `Shaping / Decomposition` remains a first-class subsystem.
- Specialists remain defined by tool domain and judgment domain, not by old human job titles alone.
- The repo continues to act as a capability library and projection surface.

## Problems To Solve

### Problem 1: Over-agentization risk

The blueprint already distinguishes logical roles from physical instances, but some sections can still be read as if every named role should eventually become a standalone runtime agent or package.

That is not aligned with current best practice. Multi-agent expansion should happen only when independent context, tools, permissions, budget, concurrency, or decision responsibility justify it.

### Problem 2: Repo-over-ontology risk

The blueprint correctly states that the ontology is platform-neutral, but the repo mapping sections still carry enough weight that readers may treat the current `agents / skills / packs / docs` structure as the system body instead of one projection of it.

That inversion would make future runtime evolution harder.

## Target End State

After this optimization, the blueprint should make the following immediately clear:

- which things are only logical roles
- which things are real runtime agents
- which things are skills, scripts, policies, artifacts, context packs, or services
- what the minimal runtime form of a single issue looks like
- where the canonical truth lives
- how conflicts between records are resolved
- how `Issue / Run / Change` state planes differ
- how the current repo hosts and projects the system without defining its ontology

## Type System To Formalize

This optimization pass will explicitly define and differentiate the following categories:

- **Role**  
  A logical responsibility or viewpoint in the system.

- **Agent**  
  A runtime execution unit that deserves its own context, tool boundary, permissions, budget, concurrency, or decision responsibility.

- **Skill**  
  A reusable workflow, method, or bounded procedure that can be loaded by an agent or runtime path.

- **Script / Hook**  
  A deterministic action or utility that should not be delegated to model judgment.

- **Policy**  
  A formal rule for approval, routing, escalation, budget, risk, or governance.

- **Artifact**  
  A produced document or structured runtime object such as a brief, report, verification packet, or handoff bundle.

- **Context Pack**  
  A reusable package of reference material, local rules, or domain context loaded into decision-making.

- **Service**  
  A system-level runtime component with its own operational responsibility that is not an agent and is not merely a reusable skill.

- **Repo Package**  
  A distribution or authoring unit in the current monorepo, such as a package under `agents/`, `skills/`, or `packs/`.

## Service As A First-Class Type

This plan promotes `Service` to a first-class category. The purpose is to prevent system runtime components from being misclassified as either agents or skills.

Representative examples include:

- `Workspace / Sandbox Manager`
- `Trace & Artifact Store`
- `Specialist Registry / Router`
- `Merge / Close / Recycle Controller`
- `Budget Checker`
- `Projection / State Sync`

Only components with clear runtime responsibility should be classified as services. `Service` must not become a miscellaneous bucket.

## Runtime Instantiation Policy

The optimized blueprint should define a narrow default runtime form for one issue:

- `1` primary execution unit  
  Typically combines `Case Owner` and `Builder`

- `1` independent evaluation path  
  Typically covers `Critic / Evaluator`

- `0-2` optional specialists  
  Added only when tool or judgment boundaries justify them

- control-plane services  
  Responsible for state writes, gate enforcement, budget enforcement, and lifecycle transitions

- loaded skills, scripts, policies, context packs, and artifact templates  
  Used as capabilities, not as independent runtime agents by default

This makes the default issue cell minimal without making it weak.

## Role Manifestation Matrix

The optimized blueprint must include a matrix showing how each major logical role manifests by default.

At minimum it should cover:

- `Case Owner`
- `Builder`
- `Critic`
- `Verifier`
- `Closer`
- `Explore Utility`
- `Planning Utility`
- `Diff / Impact Analyst`
- `Trace Summarizer`
- `Learn Synthesizer`
- `Browser QA Specialist`
- `Architecture Specialist`

For each role, the matrix should answer:

- Is it instantiated by default?
- If instantiated, what is its default manifestation?
- Under what conditions does it become a standalone agent?
- Under what conditions is it better expressed as a skill, script, service, policy, or artifact?

## Source-Of-Truth And Conflict Resolution

The optimized blueprint must elevate source-of-truth rules into an explicit policy section.

It should distinguish:

- canonical ontology objects
- runtime records
- projection surfaces
- repo canonical sources
- runtime projection copies

It should also define:

- which record is authoritative for each domain
- which layers are derived only
- which actors may propose corrections
- which components have formal write authority
- how conflicts are resolved when canonical state, runtime records, GitHub surfaces, and runtime projections disagree

## State Plane Cleanup

The optimized blueprint must clean up the semantic boundaries of the existing state planes:

- `Issue Lifecycle` should express business-stage state only
- `Run Lifecycle` should express execution attempt state only
- `Change / PR Lifecycle` should express delivery-object state only

The document should explicitly avoid leaking run-state terms into the issue-state plane.

## Compatibility And Projection Policy

The current repo should be described as:

- a **host**
- a **capability library**
- a **projection surface**

It should **not** be described as the only possible or required runtime host for the entire system.

The blueprint should define when compatibility with the current repo structure is desirable:

- when the structure carries the ontology cleanly
- when projection is low-friction
- when it improves discoverability, packaging, or reuse

It should also define when compatibility should be broken:

- when directory semantics distort ontology
- when the repo structure forces misleading names
- when policy, context, artifacts, or services become second-class
- when projection logic starts to dominate the design

## Required Diagrams And Checklist

The following should become mandatory deliverables in the blueprint, not optional afterthoughts:

- `Role / Agent / Skill / Service Decision Matrix`
- `Role Manifestation Matrix`
- `Core Object Relationship Diagram`
- `Host / Runtime / Projection Diagram`
- `Document Acceptance Checklist`

These should make it possible to understand the system without mentally reconstructing the architecture from dispersed prose alone.

## Planned Changes To The Blueprint

### Chapter 7: Agent System

Refactor this chapter so it reads as a **role catalog plus instantiation rules**, not as a future package inventory.

Changes:

- make the distinction between logical role and runtime agent explicit
- reduce the impression that every role becomes a first-class agent
- move more auxiliary roles toward skill, service, script, or artifact forms

### Chapter 9: Capability Layering

Upgrade this chapter from a descriptive taxonomy into a **judgment framework**.

Changes:

- include `Service` as a first-class type
- define clear upgrade and downgrade rules
- explain when something belongs in a repo package versus the ontology only

### Chapters 10 And 12: State And Truth

Tighten governance language.

Changes:

- clean the state planes
- add conflict resolution order
- clarify write authority by domain
- separate canonical records from projections more rigorously

### Chapter 15: Repo Mapping

Rewrite this chapter as a **projection policy**, not as an implicit statement that the current repo is the natural body of the system.

Changes:

- frame `agents/`, `skills/`, `packs/`, and `docs/` as projection and distribution structures
- state clearly that the runtime system may evolve independently
- preserve the repo's value without letting it over-determine ontology

## Execution Phases

### Phase 1: Harden The Type System

Deliver:

- explicit definitions for `Role / Agent / Skill / Script / Policy / Artifact / Context Pack / Service / Repo Package`
- agent upgrade conditions
- downgrade conditions for non-agent components

Success criteria:

- every major component can be classified cleanly
- `Service` is formalized without becoming a junk drawer

### Phase 2: Shrink Runtime Instantiation

Deliver:

- `Runtime Minimal Form`
- `Role Manifestation Matrix`
- explicit rules for when specialists appear

Success criteria:

- the blueprint no longer reads as if one issue implies many always-on agents
- default issue execution looks small and stable

### Phase 3: Clean Truth Sources And State Planes

Deliver:

- `Source-of-Truth / Conflict Resolution Policy`
- cleaned state plane definitions
- write authority rules

Success criteria:

- `Issue / Run / Change` boundaries are semantically clean
- projection surfaces cannot redefine canonical ontology

### Phase 4: Rewrite Host And Projection Boundaries

Deliver:

- `Compatibility / Projection Policy`
- `Host vs Cage` wording
- `Host / Runtime / Projection` diagram

Success criteria:

- the repo is clearly positioned as host and projection layer
- the blueprint no longer implies repo-structure-first ontology

### Phase 5: Add Visual And Acceptance Scaffolding

Deliver:

- required diagrams
- document acceptance checklist

Success criteria:

- readers can validate the blueprint's boundary quality directly
- the next review round focuses on substance, not on reconstructing missing structure

## Acceptance Criteria For This Optimization Pass

This optimization pass should be considered complete only when all of the following are true:

1. Every major component in the blueprint has a clear category.
2. The default issue runtime is minimal and does not imply unnecessary agent proliferation.
3. `Role` and `Agent` are clearly separated in both prose and structure.
4. `Service` is a first-class type with clear boundaries.
5. `Issue / Run / Change` state planes are cleanly separated.
6. Source-of-truth and conflict resolution rules are explicit.
7. Repo mapping reads as projection policy, not ontology definition.
8. At least two core diagrams exist: object relationships and host/runtime/projection.
9. The document can guide future package design without being shaped by package layout.

## Risks

- `Service` becomes a catch-all category instead of a precise runtime type.
- The document becomes too compressed and loses its current full-system readability.
- The blueprint overcorrects against repo compatibility and undersells the value of the current monorepo as a capability host.
- Undecided questions are accidentally frozen as if they were final architecture decisions.

## Notes For The Rewrite

- Keep the current blueprint's overall architecture intact.
- Favor boundary clarification over new conceptual invention.
- Preserve the document's master-blueprint role.
- Do not turn the blueprint into an implementation spec.
- Use appendices for heavy matrices and acceptance checklists if that keeps the main narrative cleaner.

## Recommended Next Step

Use this plan as the single rewrite guide for the next blueprint revision.

The first editing pass should start with:

1. the `Agent System` chapter
2. the `State / Truth` sections
3. the repo mapping chapter

Those sections carry the highest leverage for reducing both over-agentization and repo-driven distortion.
