# Methodology

Use this reference when the main skill needs deeper guidance without bloating
`SKILL.md`.

## Core Positioning

Handoff bundle writing is the step between in-progress execution and safe
recovery or transfer.

It answers:

- What state is the run in right now?
- What is already complete?
- What still remains?
- What is blocking or risky?
- What exact next step should happen next?
- What artifacts are required to resume safely?

It does **not** answer:

- whether the issue should exist in the first place
- whether the issue is well-shaped enough for execution
- whether the run should start now
- what the canonical run record should be updated to
- what the final verification verdict was
- what durable project memory should be curated long term

Think of handoff bundle writing as **run-transfer capture plus recovery
prewiring**.

## Research Anchors Behind This Skill

This skill is grounded in patterns from the local repository and external
reference repos:

- `docs/architecture/issue-driven-agent-operating-system.md`
  - defines `handoff bundle` as a first-class artifact in the trace and
    artifact store
  - explicitly locates `handoff-bundle-writing` as `artifact template + skill`
  - reinforces that the bundle belongs to the execution layer, not to system
    ontology or independent agent logic
- `docs/architecture/issue-driven-agent-os-runtime-contract.md`
  - reinforces that `handoff bundle` is one of the structured outputs an issue
    cell may return to the control plane
  - reinforces that execution should not rely on implicit conversational state
    for lifecycle control
- `docs/architecture/issue-driven-agent-os-canonical-schema.md`
  - contributes the canonical required field set for `Handoff Bundle`
  - reinforces that the bundle should help recovery and resume, not replace
    canonical records
  - reinforces that the bundle is authoritative only as handoff context
- `docs/architecture/issue-driven-agent-os-evaluation-pack.md`
  - reinforces that recovery integrity depends on enough state to resume,
    explicit blockers, and sufficient handoff quality
- `docs/architecture/official-agent-best-practices.md`
  - reinforces that plans, evidence, summaries, and handoffs should be written
    as artifacts instead of living only in chat
  - reinforces that harness design includes artifacts and resume paths, not only
    prompts
- `applied-artificial-intelligence/claude-code-toolkit` `/handoff`
  - reinforces the split between durable memory and session-specific transition
    state
  - reinforces deterministic file placement and continuation ergonomics
- `applied-artificial-intelligence/claude-code-toolkit` `/next`
  - reinforces state-driven continuation and explicit next-step handling
- `wshobson/agents` `on-call-handoff-patterns`
  - reinforces structured handoff sections for active state, recent changes,
    known issues, upcoming items, and escalation notes
- `wshobson/agents` `context-driven-development` and artifact templates
  - reinforce artifact discipline and source-of-truth boundaries between
    canonical context and transfer artifacts
- `garrytan/gstack` `browse` handoff / resume
  - reinforces that a handoff is for preserving continuation state, not only
    summarizing history
- `garrytan/gstack` CEO review handoff note
  - reinforces the value of `resume_notes` that prevent redundant questioning
- `Priivacy-ai/spec-kitty` `runtime-next`
  - reinforces deterministic `next_step`, blocked-state, and terminal-state
    reasoning
- `alirezarezvani/claude-skills` `agent-workflow-designer`
  - reinforces bounded handoff payloads and explicit handoff contract fields
- `alirezarezvani/claude-skills` `resume`
  - reinforces the recovery pattern of loading context, summarizing current
    state, and then choosing the next action
- `liqiongyu/lenny_skills_plus` `delegating-work`
  - reinforces pack-shaped context transfer, guardrails, and open-question
    handling

The synthesis rule is simple: capture exactly enough run state and supporting
artifacts for safe resume, without letting the bundle become a shadow run
record.

## Authority Hierarchy

This skill works only if the authority boundaries stay explicit:

- **Canonical issue**
  - authority for issue identity, scope, relationships, and issue lifecycle
- **Execution brief**
  - authority for the pre-execution run contract
- **Run record**
  - authority for run lifecycle, budget, blockers, and run-scoped artifacts
- **Change object**
  - authority for change / PR lifecycle and delivery references
- **Verification report**
  - authority for done-contract and gate outcomes
- **Handoff bundle**
  - authority only as transfer context for the current pause or transfer moment

If the bundle contradicts canonical issue, run, or verification state, fix the
canonical object or route to the right workflow. Do not let the bundle quietly
become the source of truth.

## Boundary With Adjacent Workflows

| Workflow | Main question | Why it is not handoff-bundle-writing |
| --- | --- | --- |
| `issue-normalization` | "What is the issue candidate?" | Normalization creates issue objects from raw signals. Handoff writing assumes a run already exists or almost exists. |
| `issue-shaping` | "Is this issue well-formed and bounded enough?" | Shaping decides issue readiness. Handoff writing preserves a specific run moment after execution has begun. |
| `execution-briefing` | "What should the next run do before execution starts?" | Execution briefing is pre-run. Handoff writing is for pause, transfer, interruption, or recovery after work has started. |
| State sync / projection flow | "What should canonical run or projection state become?" | Handoff writing does not perform canonical sync or projection updates. |
| Memory writeback / learn flow | "What durable knowledge should be curated?" | Handoff bundles keep transient run-transfer context, not long-term memory. |
| Generic summarization | "Can you summarize this conversation?" | Handoff bundles require resume-safe state, next step, and artifact refs, not just a concise recap. |

## Handoff Verdicts

Use one of these explicit verdicts at the end of a handoff-writing pass:

- **`handoff-ready`**
  - the bundle has enough state, blockers, next-step clarity, and artifact refs
    for safe transfer
- **`needs-run-context`**
  - the run state is too incomplete or ambiguous to write the bundle honestly
- **`needs-execution-brief`**
  - the work has not actually started and the real missing artifact is the
    pre-execution run contract
- **`needs-exploration`**
  - a real run exists, but important blockers, refs, or repo facts still need
    targeted exploration before a trustworthy handoff can be written
- **`needs-state-sync`**
  - canonical run or projection surfaces must be updated before the handoff can
    be trusted

These verdicts are more useful than vague comments like "probably enough to
pick up later" or "someone can figure it out from context".

## Lane Model

Use the smallest lane that preserves safe recovery:

- **Quick lane**
  - use for short pauses, user takeovers, or simple same-owner continuation
  - outputs a compact handoff bundle plus the minimum resume context
  - still must define current state, blockers if any, next step, and artifact
    context
- **Standard lane**
  - default for most real transfers or interrupted runs
  - use when blockers, warnings, pending specialists, or artifact refs need the
    full bundle shape

## The Six Handoff Questions

Every handoff-writing pass should answer six questions:

### 1. What state is the run in right now?

State the current run state in one short phrase or sentence. If you cannot, the
handoff is not ready.

### 2. What is already complete?

Make completed work explicit so the next owner does not repeat it.

### 3. What still remains?

List the meaningful unfinished work, not everything in the project.

### 4. What is blocking or risky?

Visible blockers and warnings prevent fake continuity.

### 5. What exact next step should happen next?

The next owner should not need to rediscover momentum from scratch.

### 6. What artifacts are required to resume safely?

Name the evidence, decisions, change refs, verification surfaces, or notes that
matter for the next step.

## Canonical Handoff Bundle Fields

A healthy handoff bundle usually includes:

- **Handoff reference**
  - stable ID if available, otherwise explicit pending or unknown marker
- **Issue reference**
  - the owning issue or issue handle
- **Run reference**
  - the run handle or equivalent run identifier
- **Created at**
  - when the bundle was produced
- **Current state**
  - short structured state snapshot
- **Completed**
  - what is already done
- **Remaining**
  - what still remains for this run or the immediate continuation
- **Blockers**
  - known blockers
- **Next step**
  - recommended next move
- **Artifact refs**
  - required evidence, decision, change, verification, or note references
- **Budget snapshot**
  - optional, when budget materially affects resume
- **Resume notes**
  - optional, when the next owner needs extra recovery guidance
- **Warnings**
  - optional, when risk must stay prominent
- **Specialist pending**
  - optional, when downstream specialist work is still outstanding
- **Handoff verdict**
  - `handoff-ready`, `needs-run-context`, `needs-execution-brief`,
    `needs-exploration`, or `needs-state-sync`

## Keep The Bundle Focused

Handoff bundle:

- should fit one specific run moment
- should enable safe transfer or recovery
- should preserve the next step and the supporting refs
- may include concise recent decisions when they materially change resume logic

Handoff bundle should **not**:

- become a long narrative diary
- restate the whole issue history
- rewrite issue scope or run lifecycle
- replace run-state sync or verification reporting
- turn into long-term memory curation

## Translation Moves

Use these moves deliberately:

### Convert run residue into current state

Weak:

- "We were in the middle of some testing."

Stronger:

- "Current state: backend changes are merged locally, browser validation is
  still pending before the run can claim done."

### Preserve progress as completed vs remaining

Weak:

- "Most of the work is done."

Stronger:

- "Completed: API retry regression test updated. Remaining: run browser checkout
  validation against the new retry behavior."

### Make the next step executable

Weak:

- "Continue later."

Stronger:

- "Next step: trigger browser QA against the checkout retry path, then recheck
  the merge gate if the evidence matches the updated API behavior."

### Preserve artifact refs instead of re-explaining everything

Weak:

- "The relevant test output is in the repo somewhere."

Stronger:

- "Artifact refs: `change_01`, `evidence_retry_logs`, `verification_request_02`,
  plus the latest local test output for retry regression."

## Machine-Readable Contract Pattern

Use a lightweight structured contract only when another workflow or tool would
benefit from it. Do not let the structured shape overshadow the human-readable
bundle.

Recommended fields:

- `id`
- `issue_id`
- `run_id`
- `created_at`
- `current_state`
- `completed`
- `remaining`
- `blockers`
- `next_step`
- `artifact_refs`
- `budget_snapshot`
- `resume_notes`
- `warnings`
- `specialist_pending`
- `verdict`

## Quality Dimensions

Use these seven dimensions as the handoff quality gate:

1. **Resume safety**
   - another owner could continue safely
2. **Authority boundary**
   - the bundle does not claim canonical state it does not own
3. **Trace completeness**
   - important artifact refs are visible
4. **Next-step clarity**
   - the next move is concrete enough to execute
5. **Blocker honesty**
   - blockers and warnings are not hidden
6. **Lane fit**
   - quick vs standard lane was chosen honestly
7. **No shadow state**
   - the bundle did not quietly rewrite scope or lifecycle

If two or more dimensions are weak, the handoff is not ready.

## Minimal Question Bank

Ask only when the answer would materially change the transfer artifact:

- What state is the run in right now?
- What is actually complete?
- What still remains?
- What is blocking the next owner?
- What exact next step should they take?
- Which artifacts must they read or inspect first?

If current artifacts already answer the question, do not ask it again.

## Failure Patterns

- **Narrative diary**
  - the handoff tells a story but does not preserve structured resume state
- **Shadow authority**
  - the bundle quietly changes issue or run truth
- **Missing next step**
  - the next owner must rediscover momentum
- **Missing artifact refs**
  - the right evidence exists but is not linked
- **Hidden blocker optimism**
  - the bundle omits blockers to look cleaner
- **Mixed durability**
  - durable learnings and transient run state are jammed together
- **Fake handoff**
  - the work never actually started, but the artifact pretends there is a real
    run handoff to write
