# Agentic Issue Runtime Transformation Plan

## Goal

Transform the current Issue-Driven Agent OS runtime from a hard-coded
phase-machine implementation into an agentic architecture where each active
issue is owned by a real `issue-orchestrator` agent and deterministic runtime
services provide substrate, safety, and recovery.

## Scope

- Define the runtime contracts for `issue-orchestrator` and spawned workers
- Reframe current lifecycle code as deterministic services rather than business
  flow owner
- Introduce explicit tool contracts, artifact writes, and policy gates
- Reorganize the repository so runtime services become first-class alongside
  `agents/`, `skills/`, and `packs/`
- Add the evaluation and operations surfaces required for the new runtime shape

## Not In Scope

- Full production rollout of every future specialist worker
- Final vendor lock-in to one external orchestration SDK
- Rewriting every existing skill package immediately
- Broad UI or dashboard work beyond what the runtime needs for audit and ops
- Expanding global governance into a fully autonomous multi-agent control plane

## What Already Exists

- A durable system ontology:
  - [`docs/architecture/issue-driven-agent-operating-system.md`](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-operating-system.md)
  - [`docs/architecture/issue-driven-agent-os-canonical-schema.md`](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-canonical-schema.md)
  - [`docs/architecture/issue-driven-agent-os-runtime-contract.md`](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-runtime-contract.md)
- A bridge implementation baseline:
  - [`docs/plans/2026-03-29-issue-driven-agent-os-implementation-baseline.md`](/Users/liqiongyu/projects/pri/my-agents/docs/plans/2026-03-29-issue-driven-agent-os-implementation-baseline.md)
- Current runtime code that already provides useful substrate pieces:
  - [`scripts/lib/issue-driven-os-github-runtime.js`](/Users/liqiongyu/projects/pri/my-agents/scripts/lib/issue-driven-os-github-runtime.js)
  - [`scripts/lib/issue-driven-os-state-store.js`](/Users/liqiongyu/projects/pri/my-agents/scripts/lib/issue-driven-os-state-store.js)
  - [`scripts/lib/issue-driven-os-workspace.js`](/Users/liqiongyu/projects/pri/my-agents/scripts/lib/issue-driven-os-workspace.js)
  - [`scripts/lib/issue-driven-os-github-adapter.js`](/Users/liqiongyu/projects/pri/my-agents/scripts/lib/issue-driven-os-github-adapter.js)
  - [`scripts/lib/issue-driven-os-codex-runner.js`](/Users/liqiongyu/projects/pri/my-agents/scripts/lib/issue-driven-os-codex-runner.js)
- Existing authoring packages that can be repurposed into the new model:
  - `agents/issue-intake-normalizer`
  - `agents/issue-shaper`
  - `agents/issue-cell-executor`
  - `agents/issue-cell-critic`
  - `agents/explorer`
  - the current governance and execution skills under `skills/`

## Constraints

- The migration must preserve issue, run, artifact, and recovery visibility.
- Existing GitHub-backed workflows must keep working during the transition.
- Lease safety, replay safety, and irreversible action gating cannot regress.
- The system should stay backend-agnostic at the architecture level even if the
  first implementation continues to use current Codex and GitHub paths.
- Repository package hygiene must remain aligned with existing validation rules.

## Success Criteria

- A single issue can be executed end to end by a real `issue-orchestrator`
  agent that dynamically chooses between split, execution, review, rework,
  handoff, and merge recommendation.
- Deterministic runtime services no longer own the business flow sequencing for
  per-issue execution.
- Worker agents are called through explicit spawn and artifact contracts rather
  than hard-coded phase branches.
- Artifact persistence, recovery, and audit remain as strong or stronger than
  the current runtime.
- The repository has a clear home for runtime services, agent packages, skill
  packages, pack bundles, and evaluation assets.

## Assumptions

- The first orchestrator implementation will target GitHub-backed issue flows.
- Existing `issue-shaper`, `issue-cell-executor`, and `issue-cell-critic`
  capabilities can be evolved into worker roles rather than discarded outright.
- Deterministic service code will continue to exist and remain important.
- Maintainers are willing to add a first-class runtime subtree to the repo.

## Open Decisions

- Final name and package shape for the new orchestrator agent
- Exact home for runtime services:
  `runtime/` vs `services/`
- Whether acceptance verification remains a worker, a skill, or a service gate
- Whether the first orchestrator session host should be an evolved Codex-backed
  runner or a new runtime shell
- Which subset of optional specialists should be in the first transformation
  slice

## Phases

### Phase 1: Freeze The Target Contracts

- Outcome:
  a stable architecture and runtime contract for the agentic target state
- Files / components:
  - [`docs/architecture/agentic-issue-orchestrator-architecture.md`](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/agentic-issue-orchestrator-architecture.md)
  - existing architecture docs under `docs/architecture/`
- Steps:
  - approve the target architecture document
  - identify which current bridge contracts remain valid
  - identify what new contracts are required for orchestrator sessions and
    worker artifacts
  - define the authoritative ownership boundaries for agents vs services
- Verify:
  - architecture document is internally consistent
  - target roles, services, packages, and artifacts are all accounted for
  - review with repository maintainers before implementation begins
- Depends on:
  - none

### Phase 2: Promote Runtime Services To First-Class Repo Structure

- Outcome:
  runtime substrate code is clearly separated from agent authoring packages
- Files / components:
  - current `scripts/lib/issue-driven-os-*.js`
  - new `runtime/` or `services/` subtree
  - docs and validation references if needed
- Steps:
  - carve out queue, lease, artifact, workspace, adapter, and recovery services
    from the current monolithic runtime modules
  - define a stable module boundary for service-owned deterministic behavior
  - keep backward-compatible exports where useful during migration
- Verify:
  - existing tests for state store, workspace, adapters, and related helpers
    still pass
  - service modules can be imported without bringing the old phase machine with
    them
- Depends on:
  - Phase 1

### Phase 3: Define The Orchestrator And Worker Contracts

- Outcome:
  the system has explicit contracts for orchestrator sessions and worker
  delegation
- Files / components:
  - new orchestrator contract docs or schemas
  - `agents/issue-orchestrator/`
  - evolved worker agent packages
  - runtime tool registry modules
- Steps:
  - define orchestrator tool interfaces:
    `spawn_worker`, `read_artifact`, `write_artifact`, `request_gate`,
    `create_child_issue`, `create_change`, `handoff_issue`, and similar
  - define structured worker return artifacts
  - redefine current `issue-shaper`, `issue-cell-executor`, and
    `issue-cell-critic` as worker-facing contracts under the new model
- Verify:
  - contracts are typed and replay-aware
  - each worker has a bounded purpose and clear return schema
  - no worker is accidentally granted lifecycle authority
- Depends on:
  - Phase 2

### Phase 4: Implement The First Issue Orchestrator Runtime Slice

- Outcome:
  one issue can be run through a real orchestrator loop instead of the current
  fixed branching flow
- Files / components:
  - current GitHub runtime entrypoints
  - new orchestrator runner modules
  - orchestrator agent package
- Steps:
  - create the orchestrator runtime entrypoint
  - hydrate issue context from current artifacts and projections
  - replace hard-coded `shape -> execute -> critic` sequencing with a
    policy-driven orchestrator loop
  - keep using deterministic services for leases, workspace, artifact writes,
    and projections
- Verify:
  - representative issue fixtures show dynamic branching
  - orchestrator can choose split, execute, review, and rework paths without
    code-level business flow rewiring
- Depends on:
  - Phase 3

### Phase 5: Rebuild Review-Repair As An Evaluator-Optimizer Loop

- Outcome:
  review and rework are orchestrator-controlled loops rather than hard-coded
  retry branches
- Files / components:
  - review worker contracts
  - verification artifact paths
  - PR projection code
- Steps:
  - let the orchestrator decide when to spawn review workers
  - make reviewer outputs drive explicit decision artifacts
  - ensure the orchestrator can route to rework, additional specialists,
    handoff, or merge recommendation
  - keep `reviewLoopsMax` and similar budgets as service-level policies instead
    of embedding them into the business flow code
- Verify:
  - the system handles `ready`, `needs_changes`, and `blocked` through one
    common loop contract
  - worker disagreement and repeated rework remain observable in artifacts
- Depends on:
  - Phase 4

### Phase 6: Rework Persistence, Resume, And Recovery Around Artifacts

- Outcome:
  crash recovery and resume are orchestrator-aware and artifact-first
- Files / components:
  - state store
  - handoff bundle logic
  - orchestrator resume logic
  - recovery supervisor
- Steps:
  - promote handoff bundles and worker artifacts to first-class resume inputs
  - make orchestrator resume aware of unfinished worker cycles
  - preserve lease loss recovery without letting service code reclaim business
    judgment
- Verify:
  - replay and resume tests cover orchestrator crash, worker crash, lease loss,
    and partial review completion
  - state recovery does not rely on hidden transcript history
- Depends on:
  - Phase 4

### Phase 7: Reorganize Package Inventory Around The New Model

- Outcome:
  repo package taxonomy matches the target architecture instead of the old
  bridge implementation
- Files / components:
  - `agents/`
  - `skills/`
  - `packs/`
  - catalog generation inputs if needed
- Steps:
  - add `issue-orchestrator`
  - rename or reframe current issue-cell agents as workers where appropriate
  - define pack families that match the new architecture
  - keep old packages only where compatibility is intentionally preserved
- Verify:
  - package metadata and docs are aligned
  - no package claims a responsibility that now belongs to services or the
    orchestrator
- Depends on:
  - Phase 3

### Phase 8: Add Evaluation, Trace Review, And Rollout Gates

- Outcome:
  the new runtime is governable before broader adoption
- Files / components:
  - eval fixtures
  - trace review assets
  - recovery test suites
  - rollout documentation
- Steps:
  - create orchestrator capability fixtures
  - create regression comparisons against the current runtime
  - add tool correctness, recovery, and oversight evals
  - define rollout stages and rollback triggers
- Verify:
  - representative traces exist for success, failure, recovery, and rework
  - release criteria can be checked before enabling broader usage
- Depends on:
  - Phases 4, 5, and 6

## Verification

- Architecture verification:
  review the target architecture doc against current ontology and runtime
  contract documents
- Contract verification:
  ensure every orchestrator and worker tool has typed inputs, outputs, risk
  bands, and ownership
- Runtime verification:
  add test coverage for issue branching, worker delegation, resume, and
  recovery
- Operational verification:
  require trace review and budget reporting before wider rollout
- Repository verification:
  run the repository's normal validation flow after package and doc changes

## Risks

- **Risk:** The new orchestrator loop becomes under-specified and drifts.
  - **Impact:** Hidden behavior and weak recovery
  - **Mitigation:** explicit contracts, typed artifacts, trace review
- **Risk:** Migration preserves too much of the old hard-coded logic.
  - **Impact:** fake agency, confusing ownership
  - **Mitigation:** move business sequencing out of service modules on purpose
- **Risk:** Worker roles proliferate too quickly.
  - **Impact:** coordination tax and duplicated context
  - **Mitigation:** require bounded contracts and explicit justification for new
    workers
- **Risk:** Repo reorganization breaks current scripts or tests.
  - **Impact:** contributor friction
  - **Mitigation:** stage service extraction with compatibility shims

## Rollback Or Containment

- Trigger:
  orchestrator slice cannot maintain clear artifacts, replay safety, or bounded
  worker behavior
- Action:
  keep deterministic services and existing bridge runtime as fallback while
  limiting the orchestrator path to controlled fixtures or pilot repos

- Trigger:
  package reorganization causes tooling churn without runtime benefit
- Action:
  pause repo taxonomy changes and continue validating the orchestrator runtime
  against the old package layout temporarily

## Next Step

Approve the target architecture in
[`docs/architecture/agentic-issue-orchestrator-architecture.md`](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/agentic-issue-orchestrator-architecture.md),
then start Phase 2 and Phase 3 together:

- extract deterministic runtime services into a first-class subtree
- define the orchestrator and worker contracts before touching the main runtime
