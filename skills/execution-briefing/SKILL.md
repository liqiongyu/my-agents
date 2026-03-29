---
name: execution-briefing
description: >
  Manual-first workflow for converting a shaped issue into an execution-ready
  brief, optional approval checkpoint, and initial done contract for a run. Use
  when the issue boundary is already chosen and the next need is a clear run
  brief, verification focus, gate framing, or pre-execution handoff before
  execution. Do not use for raw intake, issue shaping, backlog prioritization,
  or deep implementation planning.
invocation_posture: manual-first
version: 0.2.0
---

# Execution Briefing

Turn a shaped issue into a run-ready brief that a downstream execution unit can
consume without replaying the whole issue history.

This skill starts after issue shaping. It does not create the issue from raw
signals, and it does not replace a deep implementation plan. Its job is to
translate issue-level intent into a compact execution contract for one run or
one execution cell.

## Outputs

- An execution brief with:
  - current run goal
  - issue boundary recap
  - explicit non-goals
  - recommended path or starting surfaces
  - dependencies and blockers
  - execution risks
  - acceptance focus
  - required checks
  - required evidence
  - gate expectations
  - escalation triggers
- An initial done contract aligned with the issue's acceptance criteria
- An optional approval checkpoint note when the user or workflow wants explicit
  sign-off before execution begins
- An optional machine-readable brief contract example when another workflow may
  need to consume the run contract programmatically
- A routing verdict when the brief cannot be produced honestly:
  - `brief-ready`
  - `needs-shaping`
  - `needs-clarify`
  - `needs-exploration`
  - `needs-planning`
- An optional short kickoff or handoff summary when another execution unit will
  pick up the run immediately

## When To Activate

- The user explicitly asks for an execution brief, run brief, kickoff brief, or
  pre-execution handoff from an existing issue
- A shaped or accepted issue exists, and the next need is to hand it to a
  builder, case owner, or issue cell
- You need to turn issue-level acceptance into run-level checks, evidence
  expectations, and gate framing
- The repository context is known well enough to suggest a starting path, but
  the task does not justify a full deep plan

## When Not To Use

- The input is still raw notes, bug complaints, handoff residue, or review
  fragments without a real issue object; use `issue-normalization`
- The issue is still too broad, too mixed, or too fuzzy to admit into one run;
  use `issue-shaping`
- The main question is whether the work should be prioritized, admitted now, or
  budget-approved; this is not an admission skill
- The work clearly needs phased sequencing, multi-workstream planning, or a
  rollout strategy; use `implementation-planning`
- The blocker is an unresolved implementation decision inside a chosen task; use
  `clarify`
- The user wants code written right now; use the normal execution flow instead
  of spending time on a separate briefing artifact unless they asked for it

## Invocation Posture

This skill is `manual-first`.

False positives are expensive because an execution brief can accidentally
freeze the wrong run boundary, hide the need for planning, or create fake
confidence that a task is ready to execute. Prefer explicit invocation or
strong local evidence that the job is specifically to produce a pre-execution
brief.

## Briefing Lanes

Use the lightest lane that still tells the truth:

- **Quick lane**
  - for compact, already-stable issues where the run goal, non-goals, likely
    starting surface, and verification expectations are all easy to state
  - still requires explicit checks, evidence, and escalation triggers
  - should not be used when the task has heavy gate pressure, unclear repo
    surfaces, or meaningful uncertainty about the starting path
- **Standard lane**
  - default
  - use when the run needs fuller risk, dependency, gate, or handoff framing
- **Approval checkpoint variant**
  - wrap either lane when the user or local workflow wants explicit sign-off
    before the brief is handed to an execution owner
  - produce the brief, mark the hold point clearly, and avoid quietly starting
    execution

## Core Principles

1. **Execution briefs are derived artifacts.** They help a run start cleanly,
   but they do not override the canonical issue.
2. **One brief, one run goal.** If the artifact tries to cover several
   independent jobs, it should route back to shaping or planning.
3. **Stay lighter than a plan.** Name the recommended path and starting
   surfaces, but do not expand into a full multi-phase implementation plan.
4. **Done contract beats vague confidence.** The brief should say what must be
   true, what must be checked, and what evidence is required before claiming
   done.
5. **Verification starts before coding.** Required checks, evidence, and gates
   belong in the brief, not only at the end of the run.
6. **Named gates should stay visible.** If later verification depends on a
   named review prompt, QA checklist, or approval gate, reference that surface
   in the brief instead of leaving it implicit.
7. **Escalation triggers are part of the contract.** A good brief says when the
   run must stop, reroute, or ask for help.
8. **Route outward honestly.** If responsible execution still needs shaping,
   clarify, exploration, or deep planning, say so explicitly.

## Workflow

### Phase 0 - Confirm The Preconditions

Before briefing, confirm what kind of object you have:

- shaped issue
- accepted backlog issue with enough structure
- execution-brief seed from shaping
- broad initiative pretending to be run-ready
- implementation request that still lacks a stable issue boundary

Hard redirects:

- raw or noisy source material -> `issue-normalization`
- issue still needs scope tightening or non-goals -> `issue-shaping`
- unresolved build-time decision -> `clarify`
- clearly multi-phase or cross-cutting rollout work -> `implementation-planning`

### Phase 1 - Read The Issue And Minimal Execution Context

Inspect the smallest reliable set of materials needed to brief responsibly:

- shaped issue or existing issue body
- acceptance criteria and non-goals
- dependencies and blockers already known
- any execution-brief or done-contract seed from shaping
- relevant codebase surfaces, docs, or recent changes when the repository
  matters

Do not invent repo context. If the brief needs a starting surface but the
current evidence does not support one, keep that gap visible and route to
exploration.

Use the briefing questions from [references/methodology.md](references/methodology.md):

- what should this run accomplish now
- what must this run not expand into
- what starting path is most credible from current evidence
- what must be checked and evidenced before the run can claim done
- what should force stop, reroute, or escalation

### Phase 2 - Choose The Lightest Honest Lane

Pick the smallest artifact shape that can carry the run safely:

- Choose the **quick lane** when all of these are true:
  - one run goal is obvious
  - non-goals are already stable
  - the most credible starting surface is easy to name
  - required checks and evidence are straightforward
  - no meaningful approval or governance checkpoint is being requested
- Choose the **standard lane** when risk, dependencies, gate pressure, or
  handoff depth require more explicit framing
- Add the **approval checkpoint variant** when the user asks for sign-off or the
  workflow should hold the run until a brief is approved

If you cannot choose a lane honestly, that is usually a signal to route back to
shaping, clarify, exploration, or planning.

### Phase 3 - Translate The Issue Into A Run Contract

Draft the execution brief by translating issue-level intent into run-level
instructions.

At minimum, include:

- `Goal`
- `Issue boundary recap`
- `This run owns`
- `This run must not expand into`
- `Recommended path / Starting surfaces`
- `Dependencies / blockers`
- `Execution risks`
- `Acceptance focus`
- `Required checks`
- `Required evidence`
- `Required gates or preconditions`
- `Gate sources of truth`
- `Escalation triggers`

Then draft the initial done contract with:

- required outcomes
- required checks
- required evidence
- known accepted risks
- merge preconditions
- close preconditions

Use [references/output-templates.md](references/output-templates.md) for the
execution-brief, quick-brief, done-contract, machine-readable contract,
approval-checkpoint, and route-back templates.

If a later review or verification workflow will judge success from a named gate
prompt or checklist, cite it under `Gate sources of truth`. That does not make
the gate artifact the new issue authority. It only makes the downstream pass or
fail surface explicit early.

### Phase 4 - Run The Briefing Gate

Before handing off the brief, challenge it:

- **Legibility**: another agent can state the run goal quickly
- **Run boundary**: the brief describes one current run, not the whole project
- **Strategy realism**: the recommended path is plausible from the evidence
- **Verification readiness**: checks and evidence are concrete enough to use
- **Escalation honesty**: the brief says when to stop or reroute
- **No plan drift**: the result has not turned into a full phased
  implementation plan

If the artifact fails this gate, choose the smallest honest verdict:

- `needs-shaping`
- `needs-clarify`
- `needs-exploration`
- `needs-planning`

### Phase 5 - Deliver The Artifact

Return the smallest artifact that lets the next execution owner move:

- quick execution brief or standard execution brief
- done contract
- optional machine-readable brief contract example
- approval checkpoint note when sign-off is required
- route-back note if not ready
- short kickoff summary if another agent or run will pick it up immediately

Typical handoffs:

- `issue-shaping` when the issue boundary is still unstable
- `clarify` when a key implementation-relevant question is unresolved
- explorer or specialist evidence gathering when repo or domain evidence is too
  thin
- `implementation-planning` when the work needs real sequencing, phasing, or
  rollback design
- the normal execution flow when the brief is ready and the user wants to start
  implementation

## Validation

Validate the canonical package and its eval fixtures:

```bash
uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py \
  skills/execution-briefing

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/execution-briefing/eval/trigger-cases.json

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/execution-briefing/eval/quality-cases.json

uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py \
  skills/execution-briefing --platform all
```

If you change projections, regenerate them from the canonical package instead
of hand-editing projected runtime copies:

```bash
uv run python skills/skill-lifecycle-manager/scripts/project_skill.py \
  skills/execution-briefing --platform all
```

## Example Prompts

- Draft the execution brief for this shaped issue before we hand it to the
  builder.
- Turn this accepted issue into a run brief with required checks and done
  contract.
- Prepare a kickoff brief for this issue cell and say if it still needs shaping
  or planning first.
- Convert this execution-brief seed into a run-ready artifact with explicit
  gates and escalation triggers.
