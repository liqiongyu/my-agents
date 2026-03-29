# Issue-Driven Agent OS Implementation Baseline

**Date:** 2026-03-29  
**Primary architecture:** `/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-operating-system.md`  
**Related optimization plan:** `/Users/liqiongyu/projects/pri/my-agents/docs/plans/2026-03-29-issue-driven-agent-os-blueprint-optimization.md`

## Goal

Freeze the default implementation baseline for the first engineering pass of the Issue-Driven Agent OS so that downstream bridge documents and reference implementations all assume the same starting point.

This document is intentionally narrow. It does **not** replace the master blueprint, runtime contracts, schemas, or evaluation design.
It also does **not** define the complete target architecture.
The complete target architecture remains in the master blueprint; this document only defines the first engineering-pass contraction of that larger system.

## Why This Baseline Exists

The master blueprint has already defined:

- the system ontology
- the component model
- the role and agent boundaries
- the source-of-truth model
- the host/runtime/projection relationship

At this stage, the main implementation risk is no longer architectural ambiguity inside the blueprint. The main risk is that different follow-up documents or prototypes assume different default starting points.

Typical failure modes would be:

- one bridge document assumes `GitHub-Native` while another assumes `Hybrid`
- one prototype behaves like a single executor pipeline while another behaves like a wider swarm
- one package set is written as if every logical role should be instantiated

This baseline exists to prevent that drift.

## Baseline Decisions

### 1. Logical Architecture Baseline

The implementation baseline freezes:

- `逻辑架构 = 选项 B`
- `Control Plane + Issue Cell + On-demand Specialist`

This means:

- the system keeps an explicit control plane
- execution happens inside a per-issue runtime cell
- specialists are called only when tool or judgment boundaries justify them

The implementation baseline does **not** use:

- `选项 A`
  - single linear executor as the whole system
- `选项 C`
  - top-level autonomous swarm as the default runtime model

### 2. Deployment Topology Baseline

The implementation baseline freezes:

- `部署拓扑 = Hybrid`

This means:

- GitHub remains the visible collaboration surface for issues, PRs, reviews, labels, and checks
- external runtime/control-plane components own run-level objects such as:
  - run records
  - workspace lifecycle
  - budget tracking
  - trace and artifact handling
  - learn-oriented runtime state

This baseline does **not** treat:

- `GitHub-Native` as the default implementation assumption
- `External Orchestrator` as the only required deployment model

Instead, it treats `Hybrid` as the default reference topology for the first engineering pass.

## Baseline Runtime Shape

The default runtime form for one issue should be:

- `1` primary execution unit
  - usually combining `Case Owner + Builder`
- `1` independent evaluation path
  - usually covering `Critic / Evaluator`
- `0~2` optional specialists
  - only when tool or judgment boundaries clearly justify them
- control-plane services
  - for state writing, gate enforcement, budget enforcement, merge / close / recycle
- loaded skills, scripts, policies, context packs, and artifact templates
  - as capabilities rather than default agent instances

This baseline explicitly rejects the idea that each logical role in the blueprint should become a default runtime instance.

## Default Implementation Assumptions

All immediate bridge documents and reference work should assume:

- the control plane is real and explicit
- issue execution is cell-based, not globally swarm-based
- the system remains `generalist-first`
- specialists are `tool-bound` or `judgment-bound`, not default persona slots
- `services` remain first-class runtime components
- the current monorepo is a host and projection surface, not the entire runtime body

## What This Baseline Is For

This baseline should govern the next layer of artifacts:

1. canonical schema documents
2. runtime contract documents
3. evaluation artifacts
4. minimal reference implementation slices

Any follow-up document that assumes a different logical architecture or deployment topology should explicitly justify that deviation instead of silently drifting.

## What This Baseline Does Not Decide

This document does **not** settle:

- the final schema fields for every object
- the final control-plane API or protocol surface
- the exact package boundaries in `agents/`, `skills/`, or `packs/`
- the exact orchestrator host or service process model
- the final production rollout strategy

Those belong to the bridge documents and later implementation work.

## Immediate Next Artifacts

After this baseline, the next recommended artifacts are:

### 1. Canonical Schema

Define the minimal canonical schemas for:

- `Issue`
- `Run Record`
- `Change Object`
- `Verification Report`
- `Handoff Bundle`

### 2. Runtime Contract

Define the minimal interaction contracts among:

- `Control Plane`
- `Issue Cell`
- `Specialist`
- `Service`
- `Adapter`

### 3. Evaluation Pack

Prepare the first validation surface for the system:

- golden issues
- gate scenarios
- failure scenarios
- decomposition scenarios

## Acceptance Criteria

This baseline is complete only if:

1. all follow-up planning can assume `Option B + Hybrid` without reopening that debate
2. no immediate bridge artifact needs to guess whether runtime is single-executor, swarm, or hybrid
3. the minimal runtime shape is explicit enough to prevent over-agentization during early implementation
4. the document stays short and does not duplicate the master blueprint

## Recommended Next Step

Use this document as the reference default while authoring the next three bridge artifacts:

1. canonical schema
2. runtime contract
3. evaluation pack

Those artifacts should inherit this baseline unless they explicitly explain why a deviation is necessary.
