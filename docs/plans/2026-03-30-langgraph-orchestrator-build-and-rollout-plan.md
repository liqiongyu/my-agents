# LangGraph Orchestrator Build And Rollout Plan

## Goal

Deliver a phased build and rollout plan for a LangGraph-based issue coordinator
that manages specialist workers and human approval checkpoints without
regressing artifact durability, replay safety, or operational control.

## Scope

- Implement the first production-capable coordinator on LangGraph
- Preserve deterministic substrate services for leases, artifacts, workspace,
  projection, and recovery
- Define specialist worker invocation contracts and approval gates
- Roll out through fixtures, pilot issues, and controlled expansion
- Keep an explicit fallback path to the current bridge runtime during rollout

## Not In Scope

- Building every possible specialist before the first pilot
- Replacing deterministic service gates with autonomous agent actions
- Full UI or dashboard investment beyond trace inspection and rollout evidence
- Committing to a permanently exclusive framework beyond this implementation
  slice

## What Already Exists

- Target architecture for an issue-owned orchestrator with deterministic
  services:
  [`docs/architecture/agentic-issue-orchestrator-architecture.md`](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/agentic-issue-orchestrator-architecture.md)
- Current runtime and transformation baseline:
  [`docs/plans/2026-03-30-agentic-issue-runtime-transformation-plan.md`](/Users/liqiongyu/projects/pri/my-agents/docs/plans/2026-03-30-agentic-issue-runtime-transformation-plan.md)
- Existing runtime substrate modules under `scripts/lib/issue-driven-os-*`
- Existing reusable worker-like agents such as `issue-shaper`,
  `issue-cell-executor`, `issue-cell-critic`, `explorer`, and
  `docs-researcher`
- Existing canonical ontology and runtime contract docs under
  [`docs/architecture/`](/Users/liqiongyu/projects/pri/my-agents/docs/architecture)

## Constraints

- Human approval remains required for high-risk actions such as merge, close,
  and equivalent external side effects.
- Existing GitHub-backed workflows must continue to function while the
  LangGraph path is introduced.
- Artifact-first recovery, lease safety, and replay safety cannot regress.
- The first release should minimize new worker types and minimize repo
  reshaping until the coordinator path proves itself.

## Success Criteria

- One issue can complete a full orchestrated run through LangGraph using
  bounded specialist workers and service-gated approval steps.
- Coordinator state is reconstructable from durable artifacts plus LangGraph
  checkpoint state without relying on hidden transcript history.
- Human approval checkpoints are explicit, inspectable, and enforced by
  services rather than prompt convention alone.
- Pilot rollout demonstrates at least one successful execution path, one
  rework path, and one paused or recovery path.
- The bridge runtime remains available as a containment path until rollout
  gates are passed.

## Assumptions

- LangGraph will be used as the coordinator runtime host for the first
  implementation.
- Existing worker packages can be wrapped or adapted behind bounded task
  contracts instead of rewritten from scratch.
- Approval checkpoints will be modeled as interruptible gates in the graph, but
  the authoritative action execution will stay in deterministic services.
- The initial rollout can be limited to GitHub-backed issue flows and a narrow
  issue class.

## Open Decisions

- Final path for runtime modules:
  `runtime/` vs `services/`
- Whether LangGraph state persistence should be layered directly on the current
  state store or via an adapter boundary
- Exact initial worker set for pilot:
  `executor + reviewer + explorer` only, or include `docs-researcher`
- Whether issue shaping is performed inside the coordinator graph or as a
  pre-admission prerequisite for v1 pilot scope

## Phases

### Phase 0: Freeze The Pilot Boundary

- Outcome:
  a small, reversible first slice with clear rollout criteria
- Files / components:
  - [`docs/architecture/agentic-issue-orchestrator-architecture.md`](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/agentic-issue-orchestrator-architecture.md)
  - [`docs/plans/2026-03-30-agentic-issue-runtime-transformation-plan.md`](/Users/liqiongyu/projects/pri/my-agents/docs/plans/2026-03-30-agentic-issue-runtime-transformation-plan.md)
  - this plan
- Steps:
  - lock the v1 pilot scope to a single issue class and a minimal worker set
  - define which actions require human approval in v1
  - define explicit non-goals for the pilot so graph complexity stays bounded
  - set rollout entry and exit criteria before implementation starts
- Verify:
  - maintainers agree on pilot issue type, worker set, and approval list
  - rollback path to bridge runtime is still intact
- Depends on:
  - none

### Phase 1: Extract Deterministic Services Behind Stable Interfaces

- Outcome:
  LangGraph can orchestrate through service boundaries instead of calling
  monolithic runtime code
- Files / components:
  - current `scripts/lib/issue-driven-os-*.js`
  - new service modules under `runtime/` or `services/`
- Steps:
  - isolate lease, artifact, workspace, projection, recovery, and gate logic
  - define service APIs for artifact read/write, budget checks, approvals, and
    irreversible action execution
  - keep compatibility shims where needed so current runtime keeps working
- Verify:
  - current substrate tests still pass
  - service imports do not pull in old lifecycle sequencing logic
- Depends on:
  - Phase 0

### Phase 2: Define The LangGraph State Model And Node Contracts

- Outcome:
  the graph has a typed state model and bounded nodes aligned to repository
  ontology
- Files / components:
  - new coordinator contract docs or schemas
  - LangGraph coordinator modules
  - artifact and state-store adapters
- Steps:
  - define graph state for issue context, run metadata, active worker task,
    approval status, review status, and recovery markers
  - define node contracts for orient, plan-next-step, spawn-worker,
    inspect-worker-result, request-approval, apply-approved-action, pause, and
    handoff
  - define legal transitions and guardrails for each node
  - map durable artifacts and checkpoints to recovery semantics
- Verify:
  - each node has typed inputs and outputs
  - no node combines orchestration judgment with irreversible side effects
  - recovery can reconstruct the next valid step from persisted state
- Depends on:
  - Phase 1

### Phase 3: Wrap Existing Specialists Behind Bounded Worker Adapters

- Outcome:
  the coordinator can call a small set of workers through one common contract
- Files / components:
  - worker adapter modules
  - existing agent packages under `agents/`
  - worker artifact schemas
- Steps:
  - create a common worker task envelope with task brief, budget, expected
    output schema, and timeout or retry policy
  - adapt `issue-cell-executor` into an execution worker contract
  - adapt `issue-cell-critic` or reviewer flow into a review worker contract
  - adapt `explorer` and optionally `docs-researcher` into evidence workers
  - ensure every worker returns explicit artifacts instead of relying on raw
    transcript interpretation
- Verify:
  - workers are interchangeable from the coordinator's point of view
  - worker outputs can drive the next coordinator decision without bespoke
    branch code
- Depends on:
  - Phase 2

### Phase 4: Implement Human Approval Gates As First-Class Graph Interrupts

- Outcome:
  approval checkpoints are enforceable runtime objects rather than informal
  review steps
- Files / components:
  - approval service modules
  - coordinator gate nodes
  - approval artifact and trace formats
- Steps:
  - define gate types such as merge, close, external write, or elevated action
  - implement graph interrupts or pause states that wait for approval outcomes
  - record approval requests, approver identity, decision time, and rationale
  - make service-side execution contingent on approved gate artifacts
- Verify:
  - blocked high-risk actions cannot proceed without approval artifacts
  - resumed runs continue cleanly after approve, reject, or expire outcomes
- Depends on:
  - Phase 2

### Phase 5: Build The End-To-End Coordinator Slice

- Outcome:
  one issue can run end to end on LangGraph through execute, review, rework,
  and approval paths
- Files / components:
  - LangGraph entrypoint
  - runtime host integration
  - GitHub-backed issue entry adapters
- Steps:
  - wire graph nodes to service adapters and worker adapters
  - implement the main loop:
    orient -> decide -> delegate -> inspect -> rework or approve -> finish or
    handoff
  - keep the bridge runtime available as a fallback entrypoint
  - emit trace summaries and artifact links at each graph milestone
- Verify:
  - fixture runs cover success, rework, blocked, and paused flows
  - coordinator decisions are visible in artifacts and trace logs
- Depends on:
  - Phases 3 and 4

### Phase 6: Harden Recovery, Replay, And Operational Controls

- Outcome:
  the LangGraph path is safe to resume, inspect, and contain
- Files / components:
  - checkpoint persistence adapters
  - recovery supervisor
  - state store and handoff bundle logic
- Steps:
  - implement resume from checkpoint plus artifact state
  - test coordinator crash, worker crash, approval timeout, and lease-loss
    scenarios
  - add budget enforcement and loop ceilings as service policies rather than
    graph prompt logic
  - define operator-visible containment actions such as pause, fall back, retry,
    and abandon
- Verify:
  - no recovery path requires hidden in-memory state
  - operators can safely stop or divert a run without data loss
- Depends on:
  - Phase 5

### Phase 7: Internal Pilot Rollout

- Outcome:
  the LangGraph coordinator is proven on controlled real work before default
  adoption
- Files / components:
  - pilot runbooks
  - rollout docs
  - eval fixtures and trace review assets
- Steps:
  - enable the LangGraph path for a limited set of maintainers and issue types
  - require human approval on all high-risk actions during the pilot
  - review traces after each pilot issue for coordination quality, worker fit,
    and artifact completeness
  - compare pilot outcomes against the bridge runtime on throughput, retries,
    and recovery behavior
- Verify:
  - pilot meets predefined quality and operational gates
  - unresolved failures are categorized as prompt, contract, service, or worker
    issues
- Depends on:
  - Phase 6

### Phase 8: Controlled Expansion And Defaulting

- Outcome:
  the new coordinator becomes the preferred path for the supported issue slice
- Files / components:
  - config flags
  - rollout documentation
  - package docs and catalog references
- Steps:
  - expand issue classes and optional specialist set one step at a time
  - move from opt-in pilot to default-on for supported issue types
  - keep bridge runtime behind a kill switch until multiple stable cycles pass
  - update package and architecture docs to reflect the operational default
- Verify:
  - rollback switch remains tested
  - default-on path shows stable success and recovery rates across multiple runs
- Depends on:
  - Phase 7

### Phase 9: Retire Or Narrow The Bridge Runtime

- Outcome:
  old lifecycle sequencing is removed or reduced to a containment-only path
- Files / components:
  - bridge runtime entrypoints
  - migration notes
  - deprecation docs
- Steps:
  - identify bridge-only branches that are now duplicated by LangGraph
  - remove obsolete business-flow sequencing from deterministic runtime code
  - preserve only the minimum containment path if a fallback still adds value
  - clean up docs, tests, and package claims to match reality
- Verify:
  - no active supported flow depends on bridge-only lifecycle logic
  - deprecation notes and rollback guidance are still clear
- Depends on:
  - Phase 8

## Verification

- Contract verification:
  typed coordinator state, worker task envelopes, approval artifacts, and
  service interfaces
- Runtime verification:
  fixture tests for success, rework, approval, pause, crash, and resume paths
- Operational verification:
  trace review after pilot runs, budget reports, and explicit rollback drills
- Repository verification:
  run `npm run build` and `npm test` after package, docs, or runtime changes

## Risks

- Risk:
  LangGraph state and repository artifact state drift apart
  - Impact:
    broken recovery or confusing operator views
  - Mitigation:
    define one authoritative mapping between graph checkpoints and canonical
    artifacts early in Phase 2

- Risk:
  approval gates are modeled in prompts but not enforced in services
  - Impact:
    high-risk actions can bypass governance
  - Mitigation:
    make service-side execution require approved gate artifacts

- Risk:
  too many workers are introduced before the common contract stabilizes
  - Impact:
    branching complexity and weak reuse
  - Mitigation:
    hold the pilot to a minimal worker set and add specialists only after pilot
    review

- Risk:
  rollout pressure causes the team to remove the bridge fallback too early
  - Impact:
    poor containment during failures
  - Mitigation:
    keep a kill switch and require stable pilot evidence before defaulting

## Rollback Or Containment

- Trigger:
  coordinator cannot resume reliably after interruptions
  - Action:
    restrict the LangGraph path to fixtures and pause pilot expansion until
    recovery semantics are fixed

- Trigger:
  approval or irreversible-action gates are bypassed in testing
  - Action:
    stop rollout immediately and route all affected issue classes back to the
    bridge runtime

- Trigger:
  pilot runs show materially worse throughput or repeated ambiguous traces
  - Action:
    keep the LangGraph path opt-in, narrow the worker set, and repair contract
    clarity before broader use

## Next Step

Approve the pilot boundary and initial worker set, then execute Phases 1 and 2
first. Those phases set the service interfaces and graph-state contracts that
everything else depends on; if they stay fuzzy, the rest of the rollout will
be expensive to unwind.
