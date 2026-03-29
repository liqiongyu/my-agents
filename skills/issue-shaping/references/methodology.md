# Methodology

Use this reference when the main skill needs deeper shaping guidance without bloating `SKILL.md`.

## Core Positioning

Issue shaping is the step between normalization and execution.

It answers:

- Is this issue clear enough to work?
- Does it have one primary execution boundary?
- What is explicitly in scope and out of scope?
- What acceptance criteria define done at issue level?
- What dependencies, blockers, or exploration gaps still matter?
- Should this stay whole, split, route back, or move forward?

It does **not** answer:

- whether the issue is important enough to do now
- how to rank the issue against others
- how to phase the implementation in detail
- what broader product or architecture direction should win

Think of shaping as **boundary tightening plus readiness judgment**.

## Research Anchors Behind This Skill

This skill is grounded in patterns from the local repository and local reference repos:

- `docs/architecture/issue-driven-agent-operating-system.md`
  - contributed the key shaping questions: is the issue clear, directly executable, too broad,
    missing acceptance criteria, or in need of decomposition or exploration
  - contributed the expected outputs: `shaped issue`, `decomposition proposal`, and `execution
    brief` seed
- `skills/issue-normalization`
  - established the upstream boundary: shaping starts from a normalized issue rather than raw
    source material
  - reinforced preserving evidence, uncertainty, and next-workflow routing
- `workspaces/references/liqiongyu__lenny_skills_plus/skills/problem-definition`
  - reinforced solution-neutral problem framing, explicit assumptions, and crisp problem statements
- `workspaces/references/liqiongyu__lenny_skills_plus/skills/scoping-cutting`
  - reinforced non-goals, scope discipline, and the importance of a coherent slice rather than a
    grab-bag initiative
- `workspaces/references/liqiongyu__lenny_skills_plus/skills/writing-specs-designs`
  - reinforced testable acceptance criteria, edge-case awareness, and translating ambiguity into
    buildable shape

The synthesis rule is simple: turn a plausible issue into one unit of work that a downstream owner
can either execute or reject with explicit reasons.

## Boundary With Adjacent Workflows

| Workflow | Main question | Why it is not issue-shaping |
| --- | --- | --- |
| `issue-normalization` | "What is the issue candidate?" | Normalization creates the issue object from raw signals. Shaping tightens an issue that already exists. |
| `clarify` | "What exact implementation decision is still ambiguous?" | Clarify resolves build-time ambiguity inside a chosen task. Shaping decides whether the task itself is well-formed enough to proceed. |
| `brainstorming` | "What should we do?" | Brainstorming chooses direction. Shaping refines a specific chosen issue. |
| Prioritization / admission | "Should we do this now?" | Shaping improves issue quality; it does not rank the backlog. |
| `issue-decomposition` | "How should this split into child issues or execution slices?" | Shaping may recommend a split, but it should not fully design every child issue. |
| `implementation-planning` | "How do we sequence and deliver this?" | Planning begins after the issue is shaped and accepted as a real work unit. |

## Readiness States

Use one of these explicit verdicts at the end of a shaping pass:

- **`ready`**
  - the issue has one coherent scope
  - acceptance criteria are usable
  - dependencies are visible
- **`needs-clarify`**
  - a key implementation-relevant ambiguity still blocks responsible execution
- **`needs-exploration`**
  - repo reconnaissance, specialist evidence, or technical discovery is still needed
- **`needs-decomposition`**
  - the issue is real but too large, too mixed, or too coupled to stay whole
- **`needs-reframing`**
  - the current issue statement is still solving the wrong problem or mixing strategy with
    execution

These states are more useful than vague comments like "probably okay" or "might be too big".

## The Six Shaping Questions

Every shaping pass should answer six questions:

### 1. What single job should this issue own?

If you cannot answer this in one sentence, the issue is probably not shaped yet.

### 2. What is explicitly out of scope?

Non-goals prevent downstream drift and forced coupling.

### 3. What would count as done?

Acceptance criteria should describe observable success, not just implementation intent.

### 4. What dependencies matter?

Name upstream blockers, required inputs, external approvals, and coupled systems.

### 5. What could force a split?

Warning signs:

- multiple owners
- multiple systems with weak coupling
- multiple acceptance boundaries
- one exploratory branch plus one implementation branch
- one part can ship without the other

### 6. What is the next workflow?

Every shaped issue should end with the lightest honest next step:

- ready for admission or execution
- go to clarify
- go to exploration
- go to decomposition
- go back for reframing

## Canonical Shaping Fields

A healthy shaped issue usually includes:

- **Title**
  - specific and bounded
- **Problem**
  - what is wrong, missing, or risky
- **Desired outcome**
  - what successful change looks like
- **In scope**
  - what this issue owns
- **Out of scope / Non-goals**
  - what this issue deliberately does not own
- **Acceptance criteria**
  - the issue-level checks for done
- **Dependencies / blockers**
  - upstream conditions or coupled work
- **Execution risks**
  - the main failure modes or uncertainty pockets
- **Readiness verdict**
  - ready, needs-clarify, needs-exploration, needs-decomposition, or needs-reframing
- **Recommended next workflow**
  - the immediate next owner or workflow

Optional when helpful:

- **Execution brief seed**
- **Done-contract seed**
- **Split axes**

## Shaping Moves

Use these moves deliberately:

### Convert broad initiatives into one execution slice

Broad:

- "Redesign the notifications system"

Shaped:

- "Stabilize notification delivery retries for failed email sends and define the observable success
  checks"

This does not mean solving everything. It means finding one issue boundary that another workflow can
trust.

### Turn feature lists into boundary decisions

When a draft issue contains many bullets, sort them into:

- must-have for this issue
- explicit non-goal
- follow-up candidate
- dependency outside this issue

### Rewrite vague success language

Weak:

- "Make onboarding better"

Stronger:

- "Users can complete the first-run setup without hitting the current permissions dead-end, and the
  error path is testable"

### Separate exploration from delivery

If the issue both says "we need to figure out what is happening" and "we should build the fix",
that is usually two different units:

- an exploration issue
- an implementation issue

### Preserve evidence without drowning the brief

Shaped issues should point to evidence, not reproduce every log line or discussion thread.

## Quality Dimensions

Use these six dimensions as the shaping quality gate:

1. **Legibility**
   - a new reader can restate the job quickly
2. **Boundary discipline**
   - one issue, one primary acceptance boundary
3. **Testability**
   - acceptance criteria are checkable
4. **Dependency hygiene**
   - blockers and coupled work are visible
5. **Execution realism**
   - the issue could plausibly be owned and executed as one work item
6. **Routing clarity**
   - the next workflow is explicit

If two or more dimensions are weak, the issue is not ready.

## Minimal Shaping Question Bank

Ask only when the answer would materially change the shaped issue:

- What is the single job this issue should own?
- What is explicitly not included?
- What must be observable for this to count as done?
- What blocker or dependency could prevent direct execution?
- Is this still one issue, or are we forcing multiple jobs into one ticket?

If current docs, repo evidence, or the issue itself already answer the question, do not ask again.

## Failure Patterns

- **Shaping drift**: shaping quietly becomes prioritization, admission, or planning
- **Acceptance theater**: criteria sound polished but cannot actually be checked
- **Non-goal omission**: the issue only names what to do, not what to exclude
- **Split avoidance**: an obviously mixed issue is kept whole to avoid the cost of saying no
- **Exploration denial**: a repo or specialist evidence gap is hidden behind fake certainty
- **Execution fantasy**: the issue is called ready even though no single execution unit could own it
