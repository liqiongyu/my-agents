# Agentic Issue Orchestrator Architecture

**Date:** 2026-03-30  
**Status:** Proposed target architecture  
**Primary context:** `Issue-Driven Agent OS`  
**Related documents:**

- [issue-driven-agent-operating-system.md](./issue-driven-agent-operating-system.md)
- [issue-driven-agent-os-canonical-schema.md](./issue-driven-agent-os-canonical-schema.md)
- [issue-driven-agent-os-runtime-contract.md](./issue-driven-agent-os-runtime-contract.md)
- [2026-03-29-issue-driven-agent-os-implementation-baseline.md](../plans/2026-03-29-issue-driven-agent-os-implementation-baseline.md)
- [2026-03-30-agentic-issue-runtime-transformation-plan.md](../plans/2026-03-30-agentic-issue-runtime-transformation-plan.md)

## Problem

The current repository already has a strong ontology for an Issue-Driven Agent
OS, but the active runtime implementation still centralizes too much decision
power inside deterministic code. In practice, this produces a system that uses
agents for bounded judgments while keeping the real lifecycle logic inside a
hard-coded phase machine.

That shape is useful as an early bridge implementation, but it is not the
target system we want.

The target system must satisfy a stronger requirement:

- a single issue should be owned by an intelligent orchestrator agent
- that orchestrator should decide how the issue advances
- worker agents should be spawned on demand for execution, review, research,
  debugging, and other bounded tasks
- deterministic code should remain only where determinism materially improves
  safety, replayability, auditability, and operational recovery

This document defines that target architecture.

## Decision Classification

- Problem shape: Complicated moving toward complex
- Reversibility: Mixed
- Core architectural direction: One-way door
- Runtime implementation details: Mostly two-way doors
- Decision owner: Repository maintainers of the Issue-Driven Agent OS

## Context

### Goals

- Build a genuinely agentic Issue-Driven Agent OS rather than a scripted
  workflow with agent-shaped steps.
- Preserve the current ontology and source-of-truth discipline while moving
  issue lifecycle judgment into an orchestrator agent.
- Make one issue the primary autonomy boundary.
- Support dynamic decomposition, bounded delegation, review-repair loops,
  recovery, and handoff without encoding the business flow as a fixed state
  machine.
- Keep the architecture portable across execution backends such as Codex,
  Claude Code, and future agent runtimes.
- Design the repository so `agents/`, `skills/`, `packs/`, runtime services,
  schemas, and docs all have explicit roles.

### Constraints

- Existing canonical documents and object boundaries should remain usable.
- The repository is already a host for reusable packages and must not collapse
  back into one monolithic runtime-only codebase.
- GitHub remains an important collaboration and projection surface.
- The runtime must support leases, replay safety, artifacts, and operational
  recovery.
- High-risk actions such as merge, close, or external side effects must remain
  gated and auditable.

### Non-Goals

- This document does not prescribe one vendor SDK as the permanent orchestration
  framework.
- This document does not turn every logical responsibility into a standalone
  agent.
- This document does not remove deterministic runtime services such as lease
  management, artifact persistence, or projection adapters.
- This document does not define every final JSON schema field or wire protocol.

## Current Alternatives

- Status quo:
  deterministic runtime code owns the main lifecycle progression and calls
  agents at predefined checkpoints
- Partial refinement:
  keep the current runtime but make the hard-coded phase machine more flexible
- Full target direction:
  one issue-level orchestrator agent owns lifecycle judgment while runtime code
  becomes substrate and guardrail

## Options Considered

| Option                                                        | Summary                                                                                           | Best for                                           | Main trade-off                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| A. Scripted phase engine                                      | Keep business flow in code and agents as bounded judges                                           | predictable early prototypes                       | not truly agentic, poor adaptability, hidden coordination pain         |
| B. Per-issue orchestrator with deterministic runtime services | One orchestrator agent owns issue decisions and spawns workers; services own durability and gates | real agentic execution with operational discipline | higher runtime complexity and stricter contract design required        |
| C. Full persistent multi-agent team                           | Many standing agents collaborate on one issue with durable peer roles                             | specialized research or high-parallel domains      | coordination tax, unclear ownership, too much role overhead by default |

## Decision Matrix

| Criteria                           | Weight | A. Scripted phase engine | B. Per-issue orchestrator | C. Full multi-agent team | Notes                                                   |
| ---------------------------------- | ------ | ------------------------ | ------------------------- | ------------------------ | ------------------------------------------------------- |
| True agency at issue boundary      | High   | Low                      | High                      | High                     | B and C satisfy the core requirement                    |
| Operational clarity                | High   | Medium                   | High                      | Low                      | B keeps one owner per issue                             |
| Adaptability under uncertainty     | High   | Low                      | High                      | Medium                   | B handles dynamic split, rework, and specialist routing |
| Recovery and auditability          | High   | High                     | High                      | Medium                   | B preserves deterministic substrate                     |
| Social-technical fit for this repo | High   | Medium                   | High                      | Low                      | C over-instantiates roles relative to current structure |
| Extensibility across backends      | Medium | Medium                   | High                      | Medium                   | B cleanly separates orchestration from adapters         |
| Complexity overhead                | Medium | Low                      | Medium                    | High                     | B is more complex than A, but materially cleaner than C |

## Uncertainty Map

| Unknown                                                             | Why it matters                                               | Confidence | Resolution path                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------ | ---------- | -------------------------------------------------------------------- |
| Best concrete agent runtime host for orchestrator sessions          | Affects session control, tracing, handoffs, and tool routing | Medium     | Implement runtime contracts first, evaluate host adapters second     |
| Exact artifact schema delta from current bridge docs                | Affects persistence and recovery behavior                    | Medium     | Freeze target artifact ownership before runtime migration            |
| How much governance should be agentic vs service-owned              | Affects risk posture and human oversight                     | Medium     | Keep irreversible actions service-gated and evaluate later expansion |
| Final package boundaries for runtime services vs authoring packages | Affects repo organization and maintainability                | Medium     | Land architecture first, then execute phased reorganization          |

## Recommendation

Adopt **Option B: Per-Issue Orchestrator With Deterministic Runtime Services**
as the target architecture.

This option is the strongest fit because it moves issue lifecycle judgment into
the correct place, the issue-level orchestrator agent, without sacrificing the
operational discipline that deterministic services provide for leases,
artifacts, adapters, recovery, and governance.

We explicitly reject:

- Option A as insufficiently agentic
- Option C as over-agentized for the default runtime form

## Now / Next / Option Value

- Now:
  re-center the system on one intelligent orchestrator per issue
- Next:
  turn the current hard-coded runtime path into substrate services and worker
  tools
- Option Value:
  preserve backend flexibility by keeping the orchestration contract
  framework-agnostic and the runtime services deterministic

## Core Design Principles

1. **Issue-owned intelligence**
   One issue has one primary orchestrator agent that owns lifecycle reasoning.
2. **Deterministic substrate**
   Services own leases, persistence, projection, replay, gating, and recovery.
3. **Bounded workers**
   Workers are spawned for explicit bounded jobs and return structured artifacts.
4. **Artifact-first memory**
   Durable state lives in canonical artifacts, not only in transcripts.
5. **Agent decides, service commits**
   Agents propose and decide; services execute irreversible or authoritative
   state writes when gates pass.
6. **Generalist-first, specialist-on-demand**
   The orchestrator is the default cognitive owner; specialists appear only
   when their tools or judgment domains are materially distinct.
7. **Projection is derived**
   GitHub issues, PRs, checks, labels, comments, `.agents/`, `.codex/`, and
   other runtime surfaces are projections, not the canonical ontology.

## Architecture Layers

### 1. Ontology And Artifact Framework

This layer defines the system body.

It includes:

- `Canonical Issue`
- `Run Record`
- `Change Object`
- `Verification Report`
- `Handoff Bundle`
- supporting references such as briefs, worker reports, policy decisions, and
  trace summaries

Ownership rules:

- issue identity and task boundary live in `Canonical Issue`
- execution attempt facts live in `Run Record`
- code-delivery state lives in `Change Object`
- gate outcomes live in `Verification Report`
- recovery context lives in `Handoff Bundle`

This layer is the source of truth for task semantics.

### 2. Global Control Plane Framework

This layer is not a persona agent. It is the deterministic governance and
operations substrate.

Primary responsibilities:

- queue scanning and admission
- lease ownership and collision prevention
- budget enforcement
- artifact registration and indexing
- workspace provisioning
- adapter execution
- merge and close gating
- recovery supervision
- human approval checkpoints

This layer must not decide whether an issue should split, execute, or rework.
That belongs to the issue orchestrator.

### 3. Issue Orchestrator Framework

This is the central runtime pattern for one issue.

Each active issue gets one `issue-orchestrator` session with:

- canonical issue context
- current run record
- accessible tool registry
- policy bundle
- budget envelope
- durable artifact history

The orchestrator owns:

- initial orientation
- split vs execute vs clarify vs block judgment
- worker selection and delegation
- acceptance of worker outputs
- review-repair loop control
- escalation, pause, and handoff decisions
- recommendation of merge readiness

The orchestrator does not directly own:

- formal global state authority
- irreversible tool execution without gates
- queue-wide scheduling

### 4. Worker Agent Framework

Workers are spawned by the orchestrator and must have explicit task contracts.

Default worker classes:

- `execution-worker`
  writes code, tests, and local evidence
- `review-worker`
  performs PR or diff review and returns structured findings
- `explorer`
  gathers bounded repo evidence
- `debugger`
  diagnoses failures and proposes or applies targeted fixes
- `docs-researcher`
  verifies API or framework behavior against official sources
- `browser-qa`
  performs browser-based acceptance checks when justified
- `architecture-specialist`
  used only when the issue explicitly needs architecture judgment

Workers must return structured artifacts rather than free-form authority.

### 5. Skill Framework

Skills are reusable decision and execution methods loaded by orchestrators or
workers. Skills are not runtime owners by default.

Skill families:

- orchestration skills
  - issue triage, issue decomposition, run briefing, handoff writing
- worker skills
  - review, debugging, docs verification, browser QA, acceptance verification
- governance skills
  - risk gating, admission routing, priority scoring, backlog curation
- architecture and planning skills
  - agentic-development, future-aware-architecture, implementation-planning
- packaging and lifecycle skills
  - skill lifecycle, agent lifecycle, projection sync, artifact linking

The key rule is:

- skills shape behavior
- agents own runtime context
- services own deterministic execution responsibilities

### 6. Projection And Integration Framework

This layer maps canonical intent onto external systems.

Adapters include:

- GitHub issue adapter
- GitHub PR adapter
- GitHub check and status adapter
- Codex execution adapter
- Claude Code execution adapter
- future backend adapters

Projection responsibilities:

- show canonical state on collaboration surfaces
- carry worker outputs to PR comments, statuses, and labels
- register merge readiness and review outcomes

Projection must never redefine canonical truth.

### 7. Evaluation And Operations Framework

This layer makes the system governable.

It includes:

- capability evals
- regression suites
- tool correctness checks
- state recovery tests
- adversarial and misuse cases
- trace review workflows
- cost and latency budgets
- rollout gates and rollback triggers

This is a first-class architecture layer, not a later add-on.

## Framework Taxonomy For This Repository

To design the repo coherently, we separate five framework surfaces.

### A. Authoring Framework

What maintainers edit in the repository:

- `agents/`
- `skills/`
- `packs/`
- `schemas/`
- `docs/`

### B. Runtime Service Framework

Deterministic code that runs the substrate:

- queue scanning
- leases
- artifact persistence
- adapter execution
- workspaces
- policy gates
- recovery

Recommended home:

- `runtime/` or `services/` as a first-class repo subtree

### C. Agent Runtime Framework

Contracts for orchestrator and workers:

- session lifecycle
- spawn and handoff protocol
- tool registry
- artifact read and write interfaces
- resume and checkpoint behavior

### D. Projection Framework

Install, sync, and projection surfaces:

- project and user installs
- platform-specific projections
- GitHub and repository-facing visibility surfaces

### E. Evaluation Framework

All eval harnesses, scenario fixtures, scorecards, trace reviews, and rollout
criteria for agentic runtime behavior.

## Role Manifestation Matrix

| Role                        | Default manifestation                 | Standalone when                                                  | Not responsible for                   |
| --------------------------- | ------------------------------------- | ---------------------------------------------------------------- | ------------------------------------- |
| Intake normalization        | Single agent                          | source material is messy and issue creation is needed            | queue scheduling or lifecycle control |
| Issue orchestration         | Standalone agent per issue            | always for active issue execution                                | global control-plane writes           |
| Execution                   | Spawned worker                        | code or artifact production is needed                            | final merge readiness authority       |
| Review                      | Spawned worker                        | PR or diff critique is needed                                    | issue ownership                       |
| Exploration                 | Optional worker                       | repo context is unclear                                          | state authority                       |
| Debugging                   | Optional worker                       | failure diagnosis is needed                                      | final governance decisions            |
| Docs verification           | Optional worker                       | external API truth matters                                       | delivery ownership                    |
| Browser QA                  | Optional worker                       | UI acceptance requires browser evidence                          | issue decomposition                   |
| Acceptance verification     | Usually skill plus worker artifact    | explicit done-contract check is needed                           | queue-wide routing                    |
| Merge / close               | Service                               | irreversible platform write needed                               | business reasoning                    |
| Recovery                    | Service plus orchestrator handoff     | lease loss, crash, or replay occurs                              | changing task scope                   |
| Priority / risk / admission | Governance agent or human-backed path | backlog or high-risk issue needs explicit control-plane judgment | issue-local coding loop               |

## Target Agent Inventory

### Orchestration Agents

- `issue-orchestrator`
- `intake-normalizer`
- optional `backlog-governor`
- optional `governance-decider`

### Worker Agents

- `execution-worker`
- `review-worker`
- `explorer`
- `debugger`
- `docs-researcher`
- `browser-qa`
- `architecture-specialist`

### Non-Agent Service Components

- `queue-service`
- `lease-manager`
- `artifact-store`
- `workspace-manager`
- `adapter-router`
- `gate-engine`
- `recovery-supervisor`
- `approval-gateway`
- `projection-sync-service`

## Target Skill Inventory

### Orchestrator Skills

- `issue-decomposition`
- `execution-briefing`
- `handoff-bundle-writing`
- `artifact-linking`
- `projection-sync`

### Execution And Review Skills

- `review`
- `acceptance-verification`
- `systematic-debugging`
- `deep-research`
- `web-design-guidelines`

### Governance Skills

- `issue-normalization`
- `issue-shaping`
- `admission-routing`
- `priority-scoring`
- `risk-gating`
- `budget-decision`
- `backlog-curation`

### System Design Skills

- `agentic-development`
- `future-aware-architecture`
- `implementation-planning`

## Target Pack Inventory

Recommended future pack families:

- `agentic-issue-core`
  - issue orchestrator
  - execution worker
  - review worker
  - core orchestration skills
- `agentic-governance`
  - intake, shaping, admission, priority, risk, and backlog capabilities
- `agentic-specialists`
  - explorer, debugger, docs researcher, browser QA, architecture specialist
- `agentic-platform-codex`
  - Codex runtime and projection adapters
- `agentic-platform-claude`
  - Claude runtime and projection adapters
- `agentic-eval-ops`
  - evaluation fixtures, trace review, recovery checks, rollout gates

These packs are distribution bundles, not the ontology itself.

## Repository Structure Direction

The current repo should evolve toward:

```text
agents/
  issue-orchestrator/
  execution-worker/
  review-worker/
  explorer/
  debugger/
  docs-researcher/
  browser-qa/
skills/
  ...
packs/
  ...
runtime/
  control-plane/
  services/
  adapters/
  artifacts/
  evals/
schemas/
docs/
```

Key rule:

- `agents/`, `skills/`, and `packs/` are authoring and distribution units
- `runtime/` is the deterministic substrate
- `docs/architecture/` defines the durable system contracts

## Tool And Action Contract Model

Every tool exposed to orchestrators or workers must have:

- a typed input and output schema
- an owner
- a replay contract
- a risk band
- a confirmation rule if needed

### Risk Bands

- `low`
  - read-only repo inspection
  - artifact reads
  - trace queries
- `medium`
  - create worktree
  - write artifact
  - create child issue
  - commit and push branch
  - update PR body
- `high`
  - merge PR
  - close issue
  - delete branch
  - external notifications
  - security-sensitive or irreversible writes

High-risk tools must go through service-enforced policy gates even when the
orchestrator recommends the action.

## State And Memory Plan

The system must separate four state classes.

### 1. Working Context

Ephemeral context inside the current orchestrator or worker session.

Examples:

- current plan
- current tool results
- active reasoning scratchpad

### 2. Task Artifacts

Durable shared state between sessions and roles.

Examples:

- canonical issue
- run record
- worker output artifact
- verification report
- handoff bundle

### 3. Long-Term Memory

Durable knowledge that is not a per-issue artifact.

Examples:

- project conventions
- user preferences
- known repository quirks
- learned routing heuristics

### 4. Telemetry

Operational evidence, not semantic task memory.

Examples:

- traces
- tool logs
- cost metrics
- latency metrics
- eval scores

The system must not collapse these four classes into one transcript blob.

## Issue Orchestrator Loop

The issue orchestrator follows a policy-driven loop rather than a hard-coded
business phase machine.

### Step 1: Hydrate

- load issue, current run, open artifacts, policy bundle, budget, and prior
  handoffs

### Step 2: Orient

- determine the current task reality
- inspect whether the issue is blocked, already partly solved, merged, split,
  or waiting on prior review feedback

### Step 3: Decide Intent

Possible intents:

- `split`
- `clarify`
- `execute`
- `research`
- `debug`
- `review`
- `rework`
- `handoff`
- `ready_for_merge`
- `blocked`

### Step 4: Act

- spawn a worker or call a deterministic tool
- pass a bounded contract
- require a structured result artifact

### Step 5: Integrate

- inspect worker output
- update artifacts
- revise internal plan
- decide whether the issue is complete, needs another worker, or should pause

### Step 6: Commit Recommendation

- if a high-risk or authoritative transition is needed, the orchestrator
  produces a decision artifact and hands it to a service gate

### Step 7: Stop Or Continue

Stop when:

- issue is successfully merged and closed
- issue is blocked with explicit reason
- issue is handed off
- budget or policy says stop

Continue when:

- another bounded worker action materially advances the issue

## Lifecycle Model

### Issue Lifecycle

Recommended issue states:

- `new`
- `normalized`
- `ready_for_orchestration`
- `active`
- `waiting_on_children`
- `waiting_on_review`
- `blocked`
- `merge_candidate`
- `done`

### Run Lifecycle

Recommended run states:

- `created`
- `claimed`
- `orchestrating`
- `worker_running`
- `awaiting_gate`
- `handoff_ready`
- `completed`
- `failed`
- `recovered`

### Change Lifecycle

Recommended change states:

- `not_started`
- `working`
- `pushed`
- `in_review`
- `changes_requested`
- `merge_candidate`
- `merged`

The state planes must remain separate. Issue state must not leak execution-loop
details from the run plane.

## Human Oversight Model

Humans should appear at explicit boundaries, not as vague fallbacks.

Recommended checkpoints:

- high-risk tool execution
- policy override requests
- unresolved governance disputes
- merge of sensitive changes
- security- or compliance-relevant actions
- repeated evaluator disagreement

## Evaluation And Operations Plan

### Capability Evals

- does the orchestrator pick the right next intent
- does it split when it should split
- does it call workers with bounded contracts
- does it converge on merge-ready output for representative issue classes

### Regression Evals

- compare orchestrator runs across fixed issue fixtures
- compare issue outcomes and budget use against prior versions

### Tool Correctness Evals

- schema adherence
- idempotent replay
- invalid argument handling
- high-risk action gating

### Recovery Evals

- resume after orchestrator crash
- recover after worker failure
- replay after lease loss
- handoff correctness

### Oversight Evals

- did approval triggers fire when expected
- did irreversible actions stay gated

### Trace Review

Every release candidate should include:

- representative successful traces
- representative failed traces
- one recovery trace
- one adversarial or malformed-input trace

## Risks And Mitigations

- **Risk:** The orchestrator becomes a hidden monolith prompt.
  - **Mitigation:** Keep tools typed, worker contracts bounded, artifacts explicit,
    and evals tied to trace review.
- **Risk:** Too many worker roles recreate a coordination swamp.
  - **Mitigation:** Keep the default runtime to one orchestrator plus bounded
    on-demand workers.
- **Risk:** Deterministic services start reabsorbing business logic.
  - **Mitigation:** Limit services to substrate, gates, and persistence.
- **Risk:** Artifacts drift from the real runtime flow.
  - **Mitigation:** Make artifact writes part of the runtime contract and test
    them in recovery suites.
- **Risk:** The repo keeps conflating package authoring with runtime execution.
  - **Mitigation:** Promote runtime services to a first-class subtree and keep
    ontology documents explicit.

## Assumptions

- GitHub remains a primary collaboration surface in the near term.
- Codex and Claude-style coding agents remain important execution backends.
- The repository continues to host reusable authoring packages rather than
  becoming a single-app runtime repo.
- High-risk actions will continue to require deterministic gates even in a more
  agentic system.

## Review Triggers

- Review date: after the first end-to-end orchestrator slice is implemented
- Revisit when:
  - the orchestrator cannot maintain bounded worker contracts
  - service logic starts reclaiming lifecycle judgment
  - recovery or replay evidence shows artifact model gaps
  - backend adapters materially change agent session capabilities

## Decision Governance

- Decision owner: repository maintainers for the Issue-Driven Agent OS
- Consulted: runtime maintainers, package maintainers, workflow authors
- Informed: contributors using the packs and projected runtime installs
- Kill trigger:
  if a simpler deterministic system proves equally adaptive for issue execution
- Continue trigger:
  if the orchestrator materially improves routing quality, review-repair
  convergence, and recovery transparency

## Next Step

Use [2026-03-30-agentic-issue-runtime-transformation-plan.md](../plans/2026-03-30-agentic-issue-runtime-transformation-plan.md)
as the implementation planning companion for migrating the current codebase
toward this target architecture.
