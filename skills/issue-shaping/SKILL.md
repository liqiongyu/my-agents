---
name: issue-shaping
description: >
  Manual-first workflow for turning a normalized issue into a shaped, execution-ready work item
  with clear scope, non-goals, acceptance criteria, dependencies, and next-step routing. Use when
  an issue already exists but still needs boundary tightening, execution-readiness judgment, or a
  decomposition recommendation before admission or execution. Do not use for raw issue intake,
  backlog prioritization, or detailed implementation planning.
invocation_posture: manual-first
version: 0.1.0
---

# Issue Shaping

Turn an existing issue into a bounded work item that downstream execution can trust.

This skill starts after issue intake. It does not create the initial issue from raw notes, and it
does not decide priority, schedule, or rollout sequencing. Its job is to answer whether the issue
is sufficiently clear, bounded, and testable to move forward as one unit of work.

## Outputs

- A shaped issue brief with:
  - problem and outcome
  - in-scope and out-of-scope
  - acceptance criteria
  - dependencies and blockers
  - execution risks
  - readiness verdict
  - recommended next workflow
- A decomposition recommendation when the issue is too broad or mixed
- An exploration brief when shaping reveals missing repo reconnaissance, specialist evidence, or
  acceptance work
- An execution brief seed and done-contract seed when the issue is ready to hand off

## When To Activate

- The user explicitly asks to shape, tighten, scope, bound, or make an issue execution-ready
- A normalized issue exists, but it is still too broad, too fuzzy, or too solution-biased to admit
  directly into execution
- An issue needs explicit non-goals, acceptance criteria, dependency notes, or a readiness verdict
- You need to decide whether an issue should stay whole, split, or go back for clarify or
  exploration

## When Not To Use

- The input is still raw notes, bug complaints, handoff residue, or review fragments without a real
  issue draft; use `issue-normalization`
- The main question is whether the work should be prioritized now, what budget it gets, or where it
  belongs in a queue; this is not a prioritization skill
- The user is still deciding what direction to take or what problem to solve; use `brainstorming`
- The issue is already chosen and now needs sequencing, phased rollout, or a deep execution plan;
  use `implementation-planning`
- The real blocker is implementation ambiguity inside a chosen task; use `clarify`
- The goal is to break a shaped issue into concrete child issues or execution slices; use a
  decomposition workflow

## Invocation Posture

This skill is `manual-first`.

False positives are expensive because shaping can create new scope boundaries, new non-goals, and
new split decisions. Prefer explicit invocation or strong local context that clearly says the job is
to shape an existing issue before execution.

## Core Principles

1. **Shape from an issue, not from raw chat.** If the input is still an intake artifact, route back
   to `issue-normalization`.
2. **One issue, one primary job.** A shaped issue should represent one coherent execution boundary.
3. **Non-goals are first-class.** A shaped issue is incomplete if it only says what it includes.
4. **Acceptance criteria must be observable.** If success cannot be checked, the issue is not ready.
5. **Do not hide split pressure.** If one issue wants multiple owners, systems, or success
   boundaries, say so.
6. **Readiness is an explicit verdict.** End with ready, needs-decomposition, needs-clarify,
   needs-exploration, or needs-reframing.
7. **Prefer the lightest next workflow.** Do not escalate to planning or specialist work when a
   smaller shaping correction is enough.

## Workflow

### Phase 0 - Confirm The Input Is Shapeable

Before shaping, verify what kind of object you have:

- raw signal
- normalized issue draft
- existing backlog issue
- review follow-up issue
- broad initiative pretending to be one issue

Hard redirects:

- raw signal or unstructured notes -> `issue-normalization`
- open-ended direction choice -> `brainstorming`
- implementation ambiguity inside a chosen build task -> `clarify`
- detailed sequencing or rollout planning -> `implementation-planning`

### Phase 1 - Read The Current Issue And Evidence

Inspect the current issue shape and the evidence around it:

- stated problem
- current outcome or goal
- current evidence
- existing acceptance criteria
- dependencies
- language that suggests the issue is too broad, too vague, or too mixed

If the active repository matters, read the smallest set of files, docs, or tickets needed to avoid
shaping fiction. If the evidence is still too weak, keep that gap visible.

Use the shaping questions from [references/methodology.md](references/methodology.md):

- what single job should this issue own
- what is explicitly out of scope
- what has to be true for this issue to be considered done
- what dependencies or unknowns would block execution
- what would force a split

### Phase 2 - Tighten The Boundary

Turn the current issue into a sharper work unit.

At minimum, shape:

- `Problem`
- `Desired outcome`
- `In scope`
- `Out of scope / Non-goals`
- `Acceptance criteria`
- `Dependencies / blockers`
- `Execution risks`
- `Recommended next workflow`

Common shaping moves:

- narrow a broad initiative to one execution-worthy slice
- convert solution-biased wording into problem and outcome language
- separate optional enhancements from the primary job
- rewrite vague success language into testable checks
- isolate external dependencies and unresolved decisions
- flag whether the issue needs clarify, exploration, or decomposition before admission

Use [references/output-templates.md](references/output-templates.md) for shaped issue and
execution-brief seed templates.

### Phase 3 - Run The Readiness Challenge

Before you call the issue shaped, challenge it:

- **Clarity**: another agent can state the job in one sentence
- **Boundary**: the issue has one primary acceptance boundary
- **Testability**: acceptance criteria can be checked without guessing
- **Dependency hygiene**: blockers and upstream dependencies are visible
- **Execution unit**: one owner or one coordinated execution cell could plausibly work it
- **Escalation honesty**: the issue clearly says whether it needs clarify, exploration, or
  decomposition

If the issue fails this gate, choose the smallest honest verdict:

- `needs-clarify`
- `needs-exploration`
- `needs-decomposition`
- `needs-reframing`

### Phase 4 - Deliver The Shaped Artifact

Return the smallest artifact that enables the next owner to move:

- shaped issue brief
- decomposition recommendation if needed
- execution brief seed if ready
- done-contract seed if helpful

Typical handoffs:

- `issue-decomposition` when the problem is real but one issue is too broad
- `clarify` when implementation-relevant requirements are still contradictory or underspecified
- explorer or specialist evidence gathering when the issue cannot be shaped honestly from current
  evidence
- `implementation-planning` only after the issue is shaped and directionally stable

## Validation

Validate the canonical package and its eval fixtures:

```bash
uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py \
  skills/issue-shaping

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/issue-shaping/eval/trigger-cases.json

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/issue-shaping/eval/quality-cases.json

uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py \
  skills/issue-shaping --platform all
```

If you change projections, regenerate them from the canonical package instead of hand-editing
projected runtime copies:

```bash
uv run python skills/skill-lifecycle-manager/scripts/project_skill.py \
  skills/issue-shaping --platform all
```

## Example Prompts

- Take this normalized issue and shape it into something execution-ready.
- Tighten the scope and acceptance criteria for this issue before we admit it.
- Tell me whether this issue is ready, needs decomposition, or should go back for clarify.
- Shape this backlog item into one coherent slice and draft the execution brief seed.
