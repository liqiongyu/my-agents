# Methodology

Use this reference when the main skill needs deeper intake guidance without turning `SKILL.md`
into a wall of text.

## Core Positioning

Issue normalization is the step that turns raw signals into durable task objects.

It answers:

- What is the problem or opportunity?
- What source produced it?
- What evidence already exists?
- What must be true for the issue to count as solved?
- What information is still missing?
- What workflow should own it next?

It does **not** answer:

- how urgent the issue is relative to the rest of the backlog
- how the issue should be decomposed into sub-issues or execution slices
- which architecture or product direction should win
- how the implementation should be sequenced

Think of normalization as **compression plus structure plus uncertainty preservation**.

## Research Anchors Behind This Skill

This skill is grounded in patterns from the local repository and local reference repos:

- `docs/architecture/issue-driven-agent-operating-system.md`
  - contributed the `Canonical Issue` field set and the lifecycle distinction between `candidate`,
    `normalized`, `shaped`, and `decomposed`
  - reinforced that issue identity, evidence, acceptance criteria, dependencies, and state should
    be explicit objects rather than chat residue
- `workspaces/references/numman-ali__n-skills/.../open-source-maintainer`
  - reinforced the value of explicit actionability and missing-information states
  - showed how issue templates and repo conventions can be mined before inventing intake fields
  - provided a concrete example of normalized item types, evidence capture, and decision framing
- `workspaces/references/affaan-m__everything-claude-code/docs/MEGA-PLAN-REPO-PROMPTS-2026-03-12.md`
  - reinforced the usefulness of a stable issue body shape: `Problem`, `Scope`, `Non-Goals`, and
    `Acceptance Criteria`

The synthesis rule is simple: normalize the signal into one portable object that another workflow
can trust without replaying the original conversation.

## Boundary With Adjacent Workflows

| Workflow | Main question | Why it is not issue-normalization |
| --- | --- | --- |
| `clarify` | "What exactly should we build?" | Clarify resolves implementation ambiguity inside a chosen task. Normalization creates the task object in the first place. |
| `brainstorming` | "What should we do?" | Brainstorming chooses direction. Normalization documents a specific issue. |
| Shaping / decomposition | "Is this issue executable as-is, or should it split?" | Normalization may flag split risk, but it should not perform full decomposition. |
| Prioritization | "Where does this rank?" | Normalization does not decide queue order. |
| Implementation planning | "How do we phase the work?" | Planning starts after the issue is normalized and directionally settled. |
| `review` | "Is this artifact good, safe, or correct?" | Review evaluates an artifact. Normalization can consume review findings and turn them into follow-up issues. |

## Signal Taxonomy

Most inputs fall into one of these shapes:

1. **Bug or regression signal**
   - user complaint
   - failing test or log excerpt
   - incident or support summary
2. **Feature or improvement signal**
   - request note
   - product or UX complaint
   - internal opportunity statement
3. **Follow-up signal**
   - review finding
   - postmortem action
   - handoff bullet
   - failed run or retry note
4. **Governance or maintenance signal**
   - docs drift
   - policy gap
   - backlog hygiene item
5. **Mixed bundle**
   - one message actually contains several unrelated problems

The first job is to classify which shape you are looking at. The second job is to decide whether
it is one issue or multiple.

## The Four-Layer Intake Lens

Every normalization pass should separate the input into four layers:

### 1. Facts

What the source or repository directly shows.

Examples:

- error message
- failing test name
- quoted user complaint
- file or system area mentioned
- existing issue template fields

### 2. Inferences

What you think is likely true, but which the source does not prove directly.

Examples:

- likely affected workflow
- likely root-cause area
- severity guess from context
- assumption that two comments describe the same issue

### 3. Requested Decisions

What a downstream workflow or human still needs to decide.

Examples:

- whether to accept the issue into the backlog
- whether to split one signal into multiple issues
- whether a deeper architecture or product decision is required

### 4. Missing Information

What would materially improve the issue quality.

Examples:

- reproduction steps
- expected versus actual behavior
- environment or version
- proof of impact
- non-goals
- acceptance criteria

Never hide layers 2 through 4 inside polished prose. Keep them visible.

## Canonical Draft Fields

A healthy normalized issue draft should usually include:

- **Title**
  - concrete and scoped
  - one primary job
- **Source / Provenance**
  - where the issue came from
  - which message, handoff, review, or run created it
- **Problem**
  - what is wrong, missing, or risky
- **Why it matters**
  - user impact, operator impact, delivery friction, or maintenance cost
- **Current evidence**
  - logs, tests, screenshots, review notes, or repo evidence
- **Scope**
  - what this issue is about
- **Non-goals**
  - what it deliberately does not include
- **Acceptance criteria**
  - what success would look like at issue level
- **Dependencies / related items**
  - blocking items, related issues, or follow-up relationships
- **Missing information**
  - material gaps that still need filling
- **Recommended next workflow**
  - clarify, shaping, decomposition, review follow-up, research, or admission

Not every issue needs every field at equal depth. The rule is proportional completeness, not blank
perfection.

## Quality Dimensions

Use these six dimensions as the normalization quality gate:

1. **Identity**
   - Can the issue be referenced as one coherent work item?
2. **Legibility**
   - Can a new reader understand it without replaying the full source thread?
3. **Evidence**
   - Is at least one signal or explicit evidence gap recorded?
4. **Boundary**
   - Does the issue have one primary acceptance boundary?
5. **Testability**
   - Do the acceptance criteria describe observable success?
6. **Routing**
   - Is the next workflow obvious?

If two or more dimensions are weak, do not pretend the issue is clean. Mark it as needing more
intake work.

## Normalization Moves

Use these moves deliberately:

### Convert solution bias into problem bias

Raw ask:

- "Add a new retry queue for the importer"

Normalized frame:

- importer failures are not recoverable or inspectable enough
- desired outcome is durable retry handling and clearer operational visibility

Do not erase the proposed solution. Preserve it as source context or a possible direction, but do
not let it masquerade as the problem statement.

### Collapse narrative into one failure or opportunity statement

Long chats often repeat symptoms, emotions, and local context. Keep the signal, lose the chatter.

### Split bundled work

Split when any of these are true:

- different acceptance boundaries
- different owners or systems
- one item can ship without the other
- one part is investigative while the other is implementation

### Preserve provenance

When turning review or handoff output into an issue, retain the origin:

- review source
- run or attempt source
- commit, PR, or artifact source when available

This makes the issue auditable and easier to revisit later.

### Turn impact language concrete

Prefer:

- "login crashes when `displayName` is null"
- "install state cannot answer what modules were installed"

Over:

- "auth is flaky"
- "installer is messy"

## Minimal Intake Question Bank

Ask only when the answer would materially change the normalized issue.

Useful questions:

- What is the smallest observable failure or desired change?
- Who or what is affected?
- What evidence already exists?
- What would count as fixed or done?
- What is explicitly out of scope?
- Is this one issue or several?

If the repo or source already answers the question, do not ask it again.

## Failure Patterns

- **Normalization drift**: the intake step quietly becomes prioritization or planning
- **Fictional confidence**: acceptance criteria are invented with no source support
- **Bundle blindness**: multiple issues stay merged because the source arrived as one message
- **Evidence loss**: the normalized issue no longer points back to its source
- **Uncertainty erasure**: missing facts are converted into polished but fragile assumptions
- **Chat-shaped issue**: the issue only makes sense if the reader saw the original conversation
