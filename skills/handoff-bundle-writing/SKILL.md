---
name: handoff-bundle-writing
description: >
  Manual-first workflow for turning an in-progress, paused, interrupted, or
  transferred run into a structured handoff bundle with current state,
  completed work, remaining work, blockers, next step, and artifact references
  for safe resume. Use when execution has already started and the next need is
  transfer, pause, or recovery context. Do not use for pre-execution briefing,
  memory writeback, generic summarization, or run-state sync.
invocation_posture: manual-first
version: 0.1.0
---

# Handoff Bundle Writing

Turn an in-progress run into a resume-safe handoff bundle that another
execution owner, issue cell, or control-plane workflow can use without
reconstructing the whole run from chat history.

This skill starts after execution has already begun. It does not create the
run, it does not replace the canonical run record, and it does not perform
state sync. Its job is to produce transfer context: what state the run is in,
what is complete, what remains, what is blocked, what should happen next, and
which artifacts matter for safe recovery.

## Outputs

- A standard handoff bundle with:
  - handoff reference
  - issue reference
  - run reference
  - current state snapshot
  - completed work
  - remaining work
  - blockers
  - recommended next step
  - artifact references needed for safe resume
  - created-at timestamp
  - optional budget snapshot
  - optional resume notes
  - optional warnings
  - optional specialist-pending notes
- A quick handoff bundle for short pauses or user takeovers
- An optional machine-readable handoff bundle example when another workflow may
  need to consume the artifact programmatically
- A routing verdict when the handoff cannot be produced honestly:
  - `handoff-ready`
  - `needs-run-context`
  - `needs-execution-brief`
  - `needs-exploration`
  - `needs-state-sync`
- An optional short resume checklist for the next execution owner

## When To Activate

- The user explicitly asks for a handoff bundle, handoff note, transfer
  artifact, resume bundle, pause note, or interruption handoff for a run that
  already started
- A run is being paused, interrupted, transferred to another owner, or prepared
  for later recovery
- The next step is continuation safety rather than more execution right now
- You need to preserve blockers, artifact refs, warnings, and the exact next
  step so another execution owner can resume cleanly

## When Not To Use

- The work has not started yet and the real need is a pre-execution artifact;
  use `execution-briefing`
- The input is still raw notes, comments, or review residue without a real
  issue object; use `issue-normalization`
- The issue boundary is still unstable or the work unit itself is not yet
  execution-ready; use `issue-shaping`
- The main need is to update canonical run state, projection surfaces, or other
  system records; do that via the appropriate state-sync or control-plane flow
  before finalizing the handoff
- The user only wants a generic summary of the conversation; use ordinary
  summarization instead of forcing a handoff artifact
- The main goal is durable memory curation or long-term learning capture; this
  skill is for run-transfer context, not memory writeback

## Invocation Posture

This skill is `manual-first`.

False positives are expensive because not every interrupted conversation needs a
formal handoff bundle. A handoff should be written when transfer or recovery
really matters, not every time a task changes topic or someone asks for a
general summary.

## Handoff Lanes

Use the lightest lane that still preserves safe resume:

- **Quick lane**
  - for short pauses, user takeovers, or same-day continuation where the state
    is simple and the next step is obvious
  - still requires current state, blockers if any, next step, and the minimum
    artifact context needed to continue
  - should not be used when blockers, verification state, or pending specialist
    work would become ambiguous
- **Standard lane**
  - default
  - use when the run is being transferred across sessions or owners, when
    blockers or warnings matter, or when artifact refs and pending work must be
    preserved carefully

## Core Principles

1. **Handoff bundles are transfer context.** They help recovery and transfer,
   but they do not replace canonical issue, run, or verification state.
2. **One bundle, one run moment.** A handoff bundle describes a specific pause
   or transfer point, not a whole project history.
3. **Resume safety beats narrative.** Capture the minimum state another owner
   needs to resume safely, not a diary of everything that happened.
4. **Preserve references, not vibes.** Link the artifacts that matter instead
   of paraphrasing them away.
5. **The next step must be executable.** A good handoff says what should happen
   next, not only what already happened.
6. **Blockers and warnings stay visible.** Do not hide risk to make the
   handoff look cleaner.
7. **Keep durable memory separate.** Long-term project learnings belong in
   memory or documentation flows, not in the handoff bundle itself.
8. **Route outward honestly.** If there is not enough stable run context to
   write the handoff, say so explicitly instead of fabricating continuity.

## Workflow

### Phase 0 - Confirm The Preconditions

Before writing the bundle, confirm what kind of transition you are handling:

- an in-progress run that is pausing
- an interrupted run that must resume later
- a transfer to another execution owner
- a user takeover or specialist takeover
- a task that never really started and is pretending to need a handoff

Hard redirects:

- pre-execution work that still needs a run contract -> `execution-briefing`
- raw or noisy source material -> `issue-normalization`
- issue boundary still unstable -> `issue-shaping`
- missing canonical run or projection state that must be synchronized first ->
  state-sync or control-plane flow

### Phase 1 - Read The Minimal Run Context

Inspect the smallest reliable set of materials needed to write the handoff
honestly:

- issue reference and run reference
- current execution brief if one exists
- current change, evidence, decision, and verification artifacts
- known blockers, warnings, and pending specialist work
- recent meaningful decisions that are not otherwise obvious

Do not invent state. If an artifact ref or blocker is missing but clearly
matters, keep that gap visible and route to exploration or state-sync rather
than papering over it.

Use the handoff questions from [references/methodology.md](references/methodology.md):

- what state is the run in right now
- what is already complete
- what still remains
- what is blocking or risky
- what exact next step should happen next
- what artifacts are required to resume safely

### Phase 2 - Choose The Lightest Honest Lane

Pick the smallest artifact shape that can preserve the transfer safely:

- Choose the **quick lane** when all of these are true:
  - the run state is easy to summarize in one short snapshot
  - the next step is obvious
  - blockers are absent or very simple
  - artifact refs are few and easy to name
  - no heavy warning, budget, or specialist context is needed
- Choose the **standard lane** when blockers, pending gates, warnings, or
  artifact references need fuller structure

If you cannot choose a lane honestly, that is usually a signal that the real
problem is missing run context or missing state synchronization.

### Phase 3 - Translate The Run Into A Transfer Artifact

Draft the handoff bundle by translating the current run moment into structured
recovery context.

At minimum, include:

- `Handoff reference`
- `Issue reference`
- `Run reference`
- `Created at`
- `Current state`
- `Completed`
- `Remaining`
- `Blockers`
- `Next step`
- `Artifact refs`

Then add optional fields when they materially affect recovery:

- `Budget snapshot`
- `Resume notes`
- `Warnings`
- `Specialist pending`

Use [references/output-templates.md](references/output-templates.md) for the
standard handoff bundle, quick handoff bundle, route note, resume checklist,
and machine-readable handoff bundle example.

If a stable ID or reference is unavailable in the current surface, keep that
absence explicit instead of silently omitting the field. Unknown is safer than
fiction.

### Phase 4 - Run The Handoff Gate

Before delivering the artifact, challenge it:

- **Resume safety**: another owner could resume without replaying the whole run
- **Authority boundary**: the bundle does not pretend to be canonical issue,
  run, or verification state
- **Next-step clarity**: the next action is concrete enough to execute
- **Artifact traceability**: required evidence, decisions, changes, or reports
  are linkable
- **Blocker honesty**: blockers and warnings are visible
- **Lane fit**: quick vs standard lane was chosen honestly
- **No shadow state**: the bundle did not quietly rewrite scope or lifecycle

If the artifact fails this gate, choose the smallest honest verdict:

- `needs-run-context`
- `needs-execution-brief`
- `needs-exploration`
- `needs-state-sync`

### Phase 5 - Deliver The Artifact

Return the smallest artifact that lets the next execution owner move safely:

- quick handoff bundle or standard handoff bundle
- optional machine-readable handoff bundle example
- optional resume checklist
- route note if the handoff is not ready

Typical handoffs:

- the next execution owner when work should resume later
- the same owner after a pause or context reset
- a specialist or reviewer taking over the next step
- a control-plane or state-sync flow when the canonical records must be updated
  before safe continuation

## Validation

Validate the canonical package and its eval fixtures:

```bash
uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py \
  skills/handoff-bundle-writing

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/handoff-bundle-writing/eval/trigger-cases.json

uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py \
  skills/handoff-bundle-writing/eval/quality-cases.json

uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py \
  skills/handoff-bundle-writing --platform all
```

If you change projections, regenerate them from the canonical package instead
of hand-editing projected runtime copies:

```bash
uv run python skills/skill-lifecycle-manager/scripts/project_skill.py \
  skills/handoff-bundle-writing --platform all
```

## Example Prompts

- Write the handoff bundle for this paused run so another issue cell can resume
  it tomorrow.
- Turn this interrupted run into a resume-safe handoff with blockers, next step,
  and artifact refs.
- Prepare a quick handoff note for this user takeover, then say exactly what
  should happen when we resume.
- Convert the current run state into a structured handoff bundle and flag any
  missing state we need to sync before handoff.
