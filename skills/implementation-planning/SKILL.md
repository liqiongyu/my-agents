---
name: implementation-planning
description: >
  Manual-first heavy planning protocol for complex technical implementation work. Use when the
  user or the planner agent explicitly needs a deep executable plan for a feature, refactor,
  migration, or architecture change after the direction is already chosen. Do not use for
  brainstorming, choosing between competing directions, requirements clarification, business
  planning, generic project management, or code execution.
---

# Implementation Planning

Produce deep technical implementation plans for complex engineering work.

This skill is primarily for the `planner` agent after it has already gathered enough context to
plan responsibly. It is not the default planning path for every task. Small and medium tasks
should usually stay inside the planner's normal workflow without invoking this heavier protocol.

## Outputs

- A complexity decision: stay with normal planning or enter a deep implementation-planning pass
- A scoped planning contract: goal, constraints, non-goals, assumptions, and success criteria
- A scope-challenge pass that checks whether the current ask is too large, too vague, or more
  complex than it needs to be
- A structured implementation plan with phases, dependencies, touched files or components,
  verification, risks, and rollback or containment notes
- A concise handoff summary for the next execution step

## When Not To Use

- The user is still exploring options or deciding direction. Use `brainstorming`.
- The user asks which of several directions is better, even if they also ask for a plan.
- The request is ambiguous, contradictory, or missing acceptance criteria. Use `clarify`.
- The task is small enough that a short inline plan is sufficient.
- The work is business, fundraising, market, financial, or go-to-market planning. Use `business-plan`.
- The user wants code written or files changed right now. Use the normal implementation flow.
- The need is plan review or critique of an existing plan rather than authoring a new one.

## Invocation Posture

This skill is `manual-first`.

Its primary caller is the `planner` agent when the task is clearly in scope and the complexity
justifies a deeper planning protocol.

Use it when at least two of these are true:

- the task is cross-cutting or spans multiple subsystems
- the task includes migration, staged rollout, or compatibility risk
- the work touches many files, components, or interfaces
- the sequencing is non-trivial and dependencies matter
- the rollback or containment path needs to be explicit
- the task is important enough that a shallow plan would likely miss risk

If those signals are absent, do not invoke this skill. A shorter plan is usually better.

If the request asks this skill to **choose between directions**, **decide what to build**, or
**resolve contradictory scope before planning**, do not treat that as an in-scope deep-plan
request just because the user used the word "plan".

Even if the user explicitly names `implementation-planning`, that explicit invocation does **not**
override the boundary above.

## Platform Compatibility

Use whatever question tool the platform provides:

| Platform | Question tool |
|----------|---------------|
| Claude Code | `AskUserQuestion` |
| Codex | `request_user_input` |
| Gemini | `ask_user` |
| Other / chat-only surfaces | Present numbered options in chat and wait for the user's reply |

**Language**: respond in the same language the user uses. User-facing output should match the
user's language even if internal workflow labels stay in English.

## Core Principles

1. **Evidence before sequencing.** Read the relevant repo, spec, docs, and recent changes before drafting phases.
2. **Challenge the scope before honoring it.** Ask whether the task can be smaller, safer, or split.
3. **What exists first.** Reuse the current system shape when it is good enough; do not plan greenfield work on top of a brownfield codebase.
4. **Decisions are not tasks.** Keep unresolved choices visible instead of burying them inside execution steps.
5. **Verification is part of the plan.** Every substantial phase should say how success is checked.
6. **Containment matters.** For risky work, include rollback, fallback, or partial-release handling.
7. **Do not fake certainty.** If a spike or research checkpoint is needed, put it in the plan explicitly.

## Workflow

### Phase 1: Complexity Gate

Before invoking the full protocol, decide whether this task really needs it.

Use normal planner behavior instead when:

- the change is small and local
- the sequencing is obvious
- there is no meaningful rollback or migration risk
- a 5-10 step inline plan would be enough

Enter `implementation-planning` only when the task is large enough that deeper planning will
reduce real execution risk.

### Phase 2: Preconditions

Before drafting the deep plan, confirm that the planner already has:

- a reasonably chosen direction
- enough codebase or system context to avoid fiction
- the main constraints and success criteria

If not, route back outward first:

- `brainstorming` for option exploration
- `clarify` for missing acceptance criteria
- explorer or researcher context gathering for missing evidence

Do not use this skill as a substitute for missing context.

This is a hard gate:

- If the direction is not chosen yet, route back to `brainstorming`.
- If the scope is contradictory or the acceptance criteria are still unsettled, route back to `clarify`.
- Do not pick a direction for the user and then immediately continue into implementation planning.
- Do not use a local draft plan, prior repo note, or your own architectural preference as permission
  to skip the route-back step. Those can inform brainstorming, but they do not mean the current user
  has chosen the direction for this request.

When the user asks in a **classification-only** form such as "should this use implementation-planning?",
"does this route to the skill?", or "why or why not?", answer the routing verdict first and the next
step second. Do not opportunistically draft the full plan in those routing-only cases.

When the request is "which path should we take?" or "tell us which option is better and give the
plan", stop at the routing verdict and redirect. Do not answer the first half and then sneak into
the second half anyway.

### Phase 3: Planning Contract

Restate the job in a compact contract before drafting details:

- Goal
- Scope
- Not in scope
- Constraints
- Success criteria
- Assumptions

For `deep` tasks, pause for confirmation when the scope or framing could materially change the
resulting plan.

### Phase 4: Scope Challenge

Run a challenge pass before you bless the current scope.

At minimum, ask:

- Is the user solving the right slice of the problem?
- What already exists that should be reused or extended?
- Can this be split into safer phases?
- Which parts are essential now, and which are follow-up work?
- Where is the highest uncertainty or coupling?
- Does any part require a spike before implementation planning can be credible?

Use `references/plan-structure.md` for the required sections and the deep-plan shape.

### Phase 5: Draft The Plan

Build the plan top-down:

1. Identify the phases or workstreams.
2. Order them by dependency.
3. Mark risk points and review gates.
4. Add concrete files, components, services, or interfaces when the evidence supports that level of specificity.
5. Add verification for each substantial phase.
6. Add rollback, fallback, or containment notes where needed.

Prefer phases that leave the system in a working state. If a phase is too large to verify, split it.

When a repository artifact is useful, save the plan under `docs/plans/YYYY-MM-DD-<topic>.md`
unless the project already has a more natural planning location.

### Phase 6: Quality Gate

Before handing off, verify that the plan:

- starts from the real current state
- includes a `What already exists` section
- includes `Not in scope`
- exposes open decisions and assumptions
- avoids speculative architecture that the current task does not need
- gives clear verification for each meaningful phase
- includes rollback or containment notes for risky work

If the plan fails this gate, tighten it before presenting it.

### Phase 7: Handoff

Close with:

- why the task needed deep planning
- the biggest risk or uncertainty
- the recommended next action

If the user wants execution, hand off to the normal implementation flow after the plan is accepted.
Do not merge execution into this skill.

For routing-only answers, the handoff can be just one short paragraph:

- whether the skill should be used
- why
- what workflow should happen next

## Output Contract

Use `references/plan-structure.md`.

At minimum, every plan produced by this skill should include:

- Goal
- Scope
- Not in scope
- What already exists
- Assumptions
- Open decisions
- Phases
- Verification
- Risks
- Rollback or containment
- Next step

## Example Prompts

- Use implementation-planning for this auth migration. The direction is chosen; now make the deep execution plan.
- Draft a deep implementation plan for this cross-cutting refactor before we touch code.
- Turn this architecture change into phased implementation work with verification and rollback.
- The planner already gathered context. Now write the heavy plan, not code.
- Should this route to implementation-planning, or do we still need brainstorming first?
