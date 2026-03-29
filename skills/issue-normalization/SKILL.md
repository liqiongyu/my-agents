---
name: issue-normalization
description: >
  Hybrid workflow for turning raw task signals, bug reports, handoff notes, review findings, or
  issue comments into a normalized issue draft with clear problem, evidence, acceptance criteria,
  and missing-info markers before shaping or execution. Use explicitly for issue intake or "turn
  this into an issue" requests, and only auto-activate for high-confidence issue-drafting asks. Do
  not use for prioritization, decomposition, planning, or ordinary implementation clarification.
invocation_posture: hybrid
version: 0.1.0
---

# Issue Normalization

Turn messy input into a canonical issue draft that another workflow can consume.

This skill sits between raw signals and downstream shaping, planning, or execution. Its job is not
to solve, prioritize, or decompose the work. Its job is to make the task legible, bounded, and
portable.

## Outputs

- A normalized issue draft with:
  - title
  - source or provenance
  - problem statement
  - desired outcome
  - current evidence
  - scope and non-goals
  - impact or risk
  - acceptance criteria
  - dependencies or related items
  - missing information
  - recommended next workflow
- A short intake gap log when the source is incomplete or contradictory
- A split recommendation when one raw signal actually contains multiple issues

## When To Activate

- The user explicitly asks to turn notes, chats, bug reports, review findings, handoff text, or
  ad-hoc requests into an issue, ticket, backlog item, or canonical task
- A repo or project needs issue intake hygiene before shaping, prioritization, or execution
- You need to translate review or run output into a follow-up issue without losing source evidence
- The current input is too messy to hand directly to shaping, planning, or implementation

## When Not To Use

- The main question is what direction to choose, whether something is worth doing, or which option
  is best; use `brainstorming`
- The user wants missing implementation requirements clarified for a chosen build task; use
  `clarify`
- The work is already a well-formed issue and now needs sequencing or rollout planning; use
  `implementation-planning`
- The job is to rank backlog items, schedule work, or allocate budget; this skill does not
  prioritize
- The job is to split a normalized issue into parent or child tasks or execution slices; use a
  shaping or decomposition workflow
- The job is to critique an existing artifact rather than mint a new issue from it; use `review`

## Invocation Posture

This skill is `hybrid`.

Prefer explicit invocation. Automatic activation should stay limited to high-confidence
issue-drafting asks such as "turn this into a ticket", "normalize these notes into an issue", or
"write a follow-up issue from this review or handoff". Do not auto-trigger on every vague
implementation request.

## Core Principles

1. **Preserve source fidelity.** Keep the original signal visible through a short provenance note
   instead of silently rewriting history.
2. **Separate fact from inference.** Distinguish what the source says, what the repo proves, and
   what you are inferring.
3. **Normalize without over-solving.** Do not sneak in prioritization, decomposition, design, or
   implementation decisions.
4. **Make uncertainty explicit.** Missing information is an output field, not a hidden assumption.
5. **Prefer problem and outcome language over solution bias.** Convert "build X" into the problem,
   goal, and success signals when that improves clarity.
6. **Split bundles early.** If one message hides multiple materially different problems, recommend
   separate issues.
7. **End with the next workflow.** A normalized issue is only useful if the next owner knows
   whether it needs clarify, shaping, research, review follow-up, or direct admission.

## Workflow

### Phase 0 - Detect Intake Shape

Classify the source before normalizing it.

Common source shapes:

- raw bug report or user complaint
- feature or request note
- handoff or run summary
- review finding or regression note
- roadmap or governance fragment
- mixed bundle that probably contains more than one issue

Decide whether the job is truly normalization or should route elsewhere first.

Hard redirects:

- open-ended direction choice -> `brainstorming`
- implementation ambiguity inside a chosen task -> `clarify`
- existing artifact critique -> `review`
- deep current-state research before the problem can even be framed -> `deep-research`

### Phase 1 - Capture The Signal

Gather the minimum evidence needed to preserve meaning:

- original source type and location
- who or what is affected
- current pain, failure, or opportunity
- any concrete evidence already present
- language that signals urgency, risk, or blocked work

When the repository has issue templates, contributing docs, acceptance conventions, or run
artifacts, read them before inventing a structure. If the source is still thin, record the gap
instead of pretending certainty.

Use the four-layer intake lens from [references/methodology.md](references/methodology.md):

- facts
- inferences
- requested decisions
- missing information

### Phase 2 - Normalize Into A Canonical Draft

Turn the source into a compact issue object that can survive outside the current chat.

At minimum, normalize:

- `Title`
- `Source / Provenance`
- `Problem`
- `Why it matters`
- `Current evidence`
- `Scope`
- `Non-goals`
- `Acceptance criteria`
- `Dependencies / related items`
- `Missing information`
- `Recommended next workflow`

Normalization moves:

- collapse repetitive narrative into one crisp problem statement
- rewrite solution-biased text into outcome language when that improves clarity
- preserve explicit user intent even when the source wording is messy
- split multiple issues when they do not share one acceptance boundary
- translate review comments or handoff bullets into standalone work items with their own success
  criteria

Use [references/output-templates.md](references/output-templates.md) for reusable issue-draft
shapes.

### Phase 3 - Run The Intake Quality Gate

Before you call the issue normalized, check:

- **Legible**: another agent or maintainer can understand the problem without replaying the whole
  chat
- **Bounded**: the issue has one primary job, not three loosely related jobs
- **Evidence-aware**: evidence exists, or the gap is explicitly named
- **Testable**: acceptance criteria or success checks exist at the right fidelity
- **Honest**: assumptions, weak inferences, and unresolved questions are visible
- **Routable**: the next workflow is clear

If the draft fails this gate, do one of three things:

- ask a minimal intake question
- mark the issue as blocked on missing information
- split the issue and normalize the smaller pieces separately

### Phase 4 - Deliver And Hand Off

Return the smallest artifact that downstream work can trust:

- a normalized issue draft
- an intake gap log if needed
- a recommended next step

Typical handoffs:

- `clarify` when implementation-relevant requirements are still contradictory or under-specified
- a shaping or decomposition workflow when the issue is normalized but still too broad
- `review` when the source should first be validated as a real problem before tracking it
- `implementation-planning` only after the issue is chosen, shaped, and directionally settled

## Validation

Validate the canonical package and its eval fixtures:

```bash
uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py \
  skills/issue-normalization

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/issue-normalization/eval/trigger-cases.json

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/issue-normalization/eval/quality-cases.json

uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py \
  skills/issue-normalization --platform all
```

If you change projections, regenerate them from the canonical package instead of hand-editing
projected runtime copies:

```bash
uv run python skills/skill-lifecycle-manager/scripts/project_skill.py \
  skills/issue-normalization --platform all
```

## Example Prompts

- Turn these Slack notes and console logs into a normalized bug issue.
- Normalize this PR review finding into a follow-up issue with acceptance criteria.
- Take this handoff summary and write the canonical issue draft we should track next.
- Convert these mixed product and engineering notes into issue candidates, and tell me if they
  should split.
