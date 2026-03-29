# Methodology

Use this reference when the main skill needs deeper guidance without bloating
`SKILL.md`.

## Core Positioning

Execution briefing is the step between issue shaping and live execution.

It answers:

- What should this run accomplish now?
- What is the current run boundary?
- What must this run explicitly not expand into?
- What path or starting surfaces are most credible from current evidence?
- What checks, evidence, and gates define responsible completion for this run?
- What should trigger stop, reroute, or escalation?

It does **not** answer:

- whether the issue should exist in the first place
- whether the issue is the right scope or needs decomposition
- how to rank the issue against other work
- how to phase a large implementation across multiple workstreams
- what the final verification result was after execution

Think of execution briefing as **run-level translation plus verification
prewiring**.

## Research Anchors Behind This Skill

This skill is grounded in patterns from the local repository and local
reference repos:

- `docs/architecture/issue-driven-agent-operating-system.md`
  - contributed the canonical definition of `Execution Brief` as the
    standardized pre-execution summary containing task boundary, goal,
    non-goals, dependencies, risks, acceptance focus, and suggested path
  - contributed the `Done Contract` fields: required outcomes, required checks,
    required evidence, accepted risks, merge preconditions, and close
    preconditions
  - reinforced that issue-level authority stays with the canonical issue while
    run-level state belongs to the run record
  - reinforced that issue cells consume the brief to decide strategy, build,
    critique, verify, and close
- `docs/architecture/official-agent-best-practices.md`
  - reinforced that plans, evidence, summaries, and handoffs should be explicit
    artifacts rather than chat residue
  - reinforced that execution workers need clear contracts for inputs, outputs,
    and done definitions
- `skills/issue-shaping`
  - established the upstream boundary: execution briefing starts from a shaped
    issue and may expand an execution-brief seed plus done-contract seed
  - reinforced that shaping owns issue readiness while execution briefing owns
    run readiness
- `skills/implementation-planning`
  - provided the contrast case for deep plans, phased sequencing, rollback
    structure, and multi-workstream planning that execution briefing should not
    absorb
- `skills/clarify/references/context-and-handoffs.md`
  - reinforced that unresolved implementation ambiguity should route to clarify
    instead of being hidden inside a brief
- `workspaces/references/alirezarezvani__claude-skills/engineering/spec-driven-workflow`
  - reinforced strong acceptance criteria, explicit out-of-scope handling, and
    the principle that verification should trace back to a contract rather than
    vibes
- `github/spec-kit`
  - reinforced stage handoffs between plan, tasks, and implementation instead
    of collapsing them into one artifact
  - reinforced that execution artifacts work best when the boundary between
    contract, tasking, and implementation is explicit
- `Priivacy-ai/spec-kitty`
  - reinforced deterministic runtime next-step thinking and the value of naming
    the exact review surface that will judge the run
  - reinforced that a runtime review prompt can become an operational source of
    truth for a later gate without replacing the issue or brief
- `workspaces/references/obra__superpowers/skills/writing-plans`
  - provided a contrast pattern showing what a heavy execution plan looks like,
    which helped keep this skill intentionally lighter and more bounded
- `workspaces/references/obra__superpowers/skills/executing-plans`
  - reinforced review-first execution, stop-on-blocker behavior, and the
    distinction between "start the run" and "keep planning"
- `affaan-m/everything-claude-code` `/plan`
  - reinforced explicit approval gates, plan restatement, and risk framing
- `affaan-m/everything-claude-code` `multi-plan`
  - reinforced planning-only boundary discipline and the importance of not
    letting a pre-execution artifact drift into implementation
- `mhattingpete/claude-skills-marketplace`
  - reinforced planner and implementer separation, which maps well to brief
    producer versus execution owner
- `FlineDev/ContextKit`
  - reinforced the value of a quick lane for smaller work plus explicit
    in-scope and out-of-scope confirmation
- `garrytan/gstack`
  - reinforced that approval or engineering review can be a distinct stage,
    rather than an informal comment after execution starts
- `applied-artificial-intelligence/claude-code-toolkit`
  - reinforced next-available task state, durable handoff artifacts, and the
    usefulness of a machine-readable contract when orchestration grows
- `workspaces/references/affaan-m__everything-claude-code/.github/ISSUE_TEMPLATE/copilot-task.md`
  - reinforced the value of a compact execution handoff shape: task, acceptance
    criteria, and context
- `openai/skills`
  - reinforced that official public surfaces currently provide planning and
    brief templates, but not a mature standalone run-brief skill, which
    strengthens the differentiation case

The synthesis rule is simple: translate a shaped issue into one portable
execution contract that a downstream run can trust without replaying the whole
discussion.

## Authority Hierarchy

This skill works only if the authority boundaries stay explicit:

- **Canonical issue**
  - authority for task identity, scope, relationships, and issue-level state
- **Execution brief**
  - derived run-facing artifact for current execution framing
- **Done contract**
  - compact run-level completion contract derived from the issue and brief
- **Run record**
  - authority for current attempt status, budget, blockers, and run outcomes
- **Operational gate source**
  - the named review prompt, checklist, approval step, or QA contract that a
    downstream gate will actually use to judge pass or fail
- **Verification report**
  - authority for whether the done contract and gates actually passed
- **Handoff bundle**
  - transfer artifact, not a replacement for issue, run, or verification state

If the brief contradicts the canonical issue, fix the issue or route back to
shaping. Do not silently let the brief become a shadow source of truth.

If a downstream review prompt or gate checklist becomes the operational source
of truth for a specific pass or fail decision, name that explicitly in the
brief. That gate surface governs the later review step, but it still does not
override issue scope, run record state, or verification evidence.

## Boundary With Adjacent Workflows

| Workflow | Main question | Why it is not execution-briefing |
| --- | --- | --- |
| `issue-normalization` | "What is the issue candidate?" | Normalization creates the issue object from raw signals. Execution briefing assumes an issue already exists. |
| `issue-shaping` | "Is this issue well-formed and bounded enough?" | Shaping decides whether the issue is ready as a work unit. Execution briefing translates a ready issue into a run contract. |
| `clarify` | "What implementation-relevant decision is still ambiguous?" | Clarify resolves missing or contradictory requirements. Execution briefing should expose that ambiguity, not bury it. |
| Admission / prioritization | "Should this issue be done now?" | Execution briefing does not decide queue order, budget approval, or governance priority. |
| `implementation-planning` | "How do we sequence and phase the work?" | Planning produces deeper phased plans. Execution briefing stays compact and run-focused. |
| Execution flow | "Can we start building now?" | Execution briefing prepares the handoff artifact. It is not the implementation itself. |
| Handoff bundle writing | "How do we transfer a partially completed run?" | Execution briefing is pre-run. Handoff bundles summarize progress after work has started. |

## Briefing Verdicts

Use one of these explicit verdicts at the end of a briefing pass:

- **`brief-ready`**
  - one run goal is clear
  - non-goals are explicit
  - required checks and evidence are usable
- **`needs-shaping`**
  - the issue boundary is still too broad, mixed, or unstable
- **`needs-clarify`**
  - a key implementation decision is unresolved
- **`needs-exploration`**
  - repo reconnaissance, specialist evidence, or dependency discovery is still
    needed
- **`needs-planning`**
  - the work is too cross-cutting, phased, or risky to start from a compact
    brief alone

These verdicts are more useful than vague comments like "probably enough
context" or "maybe we should think a bit more".

## Lane Model

Use the smallest lane that preserves honesty:

- **Quick lane**
  - use for compact, already-stable shaped issues
  - outputs a shortened execution brief plus the minimum viable done contract
  - still must define goal, non-goals, starting path, checks, evidence, and
    escalation triggers
- **Standard lane**
  - default for most execution-briefing work
  - use when risk, dependencies, gate pressure, or handoff needs deserve the
    full artifact shape
- **Approval checkpoint variant**
  - can wrap either lane
  - use when the user or workflow wants explicit sign-off before implementation
    starts
  - the result should be "brief produced, execution held pending approval", not
    "approval mentioned and then ignored"

## The Five Briefing Questions

Every briefing pass should answer five questions:

### 1. What should this run accomplish now?

State the run goal in one sentence. If you cannot, the brief is not ready.

### 2. What must this run not expand into?

Run drift is one of the fastest ways to break issue discipline.

### 3. What is the most credible starting path?

Name the recommended path or starting surfaces from current evidence. This is
lighter than a phased plan.

### 4. What must be checked and evidenced before claiming done?

Translate issue-level acceptance into concrete run-level checks, artifacts, and
gate expectations.

### 5. What should force stop, reroute, or escalation?

Examples:

- evidence points to a different subsystem than expected
- a dependency is missing or blocked
- the task reveals a hidden split
- responsible completion clearly needs a deeper plan
- a required gate cannot be satisfied from the current run boundary

## Canonical Execution Brief Fields

A healthy execution brief usually includes:

- **Title**
  - bounded and run-specific
- **Goal**
  - what this run should accomplish now
- **Issue boundary recap**
  - the problem and current issue scope in compact form
- **This run owns**
  - what the run is responsible for
- **This run must not expand into**
  - explicit non-goals
- **Recommended path / Starting surfaces**
  - the most credible first approach, surfaces, or checkpoints
- **Dependencies / blockers**
  - upstream conditions, inputs, or coupled work
- **Execution risks**
  - main failure modes or uncertainty pockets
- **Acceptance focus**
  - what matters most from the issue's acceptance criteria
- **Required checks**
  - the concrete validations expected before claiming progress or done
- **Required evidence**
  - logs, tests, screenshots, diff summaries, or other proof artifacts
- **Required gates / Preconditions**
  - review, browser QA, security, performance, merge, close, or other gates
- **Gate sources of truth**
  - the named review prompt, checklist, or approval surface that downstream
    verification will rely on
- **Escalation triggers**
  - what forces reroute or pause
- **Done contract**
  - the explicit completion contract for the run
- **Briefing verdict**
  - `brief-ready`, `needs-shaping`, `needs-clarify`, `needs-exploration`, or
    `needs-planning`

Optional when helpful:

- **Suggested specialists**
- **Kickoff summary**
- **Follow-up issue clues**
- **Machine-readable brief contract**

## Keep The Brief Lighter Than A Plan

Execution brief:

- should fit the next run
- should point to the most credible path
- should specify verification expectations
- may name relevant files, systems, or interfaces when the evidence supports it

Execution brief should **not**:

- map a full multi-phase rollout
- enumerate every implementation step in order
- simulate a complete design or architecture plan
- pretend uncertain repo details are already known

If you need those things, route to `implementation-planning`.

## Translation Moves

Use these moves deliberately:

### Convert issue acceptance into run checks

Issue-level:

- "Users can retry failed imports without duplicate rows."

Run-level:

- add or update one verification check for retry behavior
- expect evidence that duplicate-row prevention is covered
- make duplicate inserts an explicit failure condition

### Shrink issue language into the current run

Issue-level:

- "Stabilize notification delivery."

Run-level:

- "This run focuses on retry-path observability for failed email sends and does
  not redesign channel preferences or template management."

### Name the credible path without overplanning

Weak:

- "Implement the fix."

Stronger:

- "Start from the existing retry worker and delivery failure tests, confirm the
  current failure path, then update the smallest surface that can satisfy the
  required checks."

### Surface downstream gate sources of truth

Weak:

- "Review and QA should happen later."

Stronger:

- "Required gate sources of truth: the browser-QA checklist for the import flow
  and the code-review prompt focused on duplicate-row regression risk."

## Machine-Readable Contract Pattern

Use a lightweight structured contract only when another workflow or tool would
benefit from it. Do not let the JSON shadow the human-readable brief.

Recommended fields:

- `brief_version`
- `lane`
- `verdict`
- `goal`
- `non_goals`
- `starting_surfaces`
- `required_checks`
- `required_evidence`
- `required_gates`
- `gate_sources_of_truth`
- `escalation_triggers`
- `approval_required`
- `hold_reason`

### Pre-wire stop conditions

If the issue depends on unknown ownership, uncertain contracts, or hidden
subsystems, name the exact trigger that should stop the run and reroute work.

## Quality Dimensions

Use these six dimensions as the briefing quality gate:

1. **Legibility**
   - a new execution owner can restate the run goal quickly
2. **Run boundedness**
   - one run, one coherent goal
3. **Verification readiness**
   - checks and evidence are concrete enough to use
4. **Strategy realism**
   - the recommended path is plausible from current evidence
5. **Escalation honesty**
   - the brief says when to stop or reroute
6. **No plan drift**
   - the artifact stays lighter than a deep implementation plan
7. **Gate clarity**
   - named downstream gate surfaces are visible when they matter

If two or more dimensions are weak, the brief is not ready.

## Minimal Question Bank

Ask only when the answer would materially change the execution contract:

- What should this run accomplish now?
- What is explicitly out of scope for this run?
- What must be checked before we can claim done?
- What evidence will prove those checks?
- What condition should make us stop and reroute?
- Do we need explicit sign-off before execution begins?

If the issue, repo, or current docs already answer the question, do not ask it
again.

## Failure Patterns

- **Plan creep**: the brief quietly turns into a phased implementation plan
- **Shadow authority**: the brief changes issue scope instead of reflecting it
- **Verification theater**: checks sound polished but cannot be run or judged
- **Missing non-goals**: the run boundary is implied rather than explicit
- **Hidden blocker optimism**: dependencies are known but omitted to keep the
  brief looking simple
- **Escalation denial**: a task obviously needs planning or clarify, but the
  brief pretends execution can start safely
- **Gate ambiguity**: review or QA pressure exists, but the brief never says
  which downstream surface will actually judge pass or fail
