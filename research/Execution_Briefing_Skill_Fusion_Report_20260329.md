# Fusion Report: Execution Briefing Skills

**Date**: 2026-03-29
**Mode**: Deep
**Status**: Research handoff complete
**Target**: [execution-briefing](/Users/liqiongyu/projects/pri/my-agents/skills/execution-briefing/SKILL.md)
**Candidate groups analyzed**: 12
**Artifacts read**: 20+

## Executive Summary

The strongest conclusion is that the ecosystem has many good patterns around
`spec -> plan -> tasks -> execute -> review`, but almost no strong standalone
skill for the missing middle layer: a compact, pre-execution, run-level brief.

Most systems jump directly from a spec or plan into task execution, or they
treat handoff as a post-run transition artifact. That leaves a clear opening
for a dedicated `execution-briefing` skill whose job is to translate a shaped
issue into one run goal, explicit non-goals, required checks, required
evidence, gate expectations, and escalation triggers before execution starts.

The current local
[execution-briefing](/Users/liqiongyu/projects/pri/my-agents/skills/execution-briefing/SKILL.md)
is directionally correct. The best external ideas to borrow are not a new core
concept, but sharper supporting patterns:

- contract-first acceptance translation
- planner/executor separation
- task-state and next-step clarity
- explicit review or gate surfaces
- stronger handoff/resume ergonomics

## Source Inventory

| # | Name | Source | URL | Signals | Key Strength |
| --- | --- | --- | --- | --- | --- |
| 1 | `spec-kit` command chain | GitHub | https://github.com/github/spec-kit | 83k+ stars, official-style SDD toolkit | Clean `plan -> tasks -> implement` lifecycle with explicit handoffs between stages |
| 2 | `spec-kitty` runtime chain | GitHub | https://github.com/Priivacy-ai/spec-kitty | 900+ stars, highly structured | Deterministic runtime progression, isolated work packages, runtime review prompts |
| 3 | `spec-driven-workflow` | Claude skills | https://github.com/alirezarezvani/claude-skills | 7.7k+ stars repo | Strong contract discipline, acceptance criteria, bounded autonomy, scope control |
| 4 | `writing-plans` | Superpowers | https://github.com/obra/superpowers | 121k+ stars repo | Deep implementation plan structure, explicit execution handoff |
| 5 | `executing-plans` | Superpowers | https://github.com/obra/superpowers | 121k+ stars repo | Review-first execution from an existing plan, stop-on-blocker discipline |
| 6 | `/plan` + `planner` | everything-claude-code | https://github.com/affaan-m/everything-claude-code | 115k+ stars | Clear plan approval gate, restatement, risks, phased plan generation |
| 7 | `multi-plan` | everything-claude-code | https://github.com/affaan-m/everything-claude-code | multi-model planning pattern | Strong planning-only boundary, code sovereignty, stop-loss rules |
| 8 | `autoplan` | gstack | https://github.com/garrytan/gstack | 54k+ stars repo | Sequential plan review pipeline with explicit approval pressure |
| 9 | `plan-eng-review` | gstack | https://github.com/garrytan/gstack | engineering review pattern | Pre-implementation engineering review for architecture, edge cases, tests, performance |
| 10 | `feature-planning` + `plan-implementer` | claude-skills-marketplace | https://github.com/mhattingpete/claude-skills-marketplace | curated engineering workflow | Explicit planner/executor split with task-level implementation handoff |
| 11 | `ContextKit` plan workflow | GitHub | https://github.com/FlineDev/ContextKit | context/planning system | Strong interactive intent validation, explicit in-scope/out-of-scope, quick vs full planning lanes |
| 12 | `plan / next / handoff` workflow | Claude Code toolkit | https://github.com/applied-artificial-intelligence/claude-code-toolkit | session/work-unit oriented | Task state, next-available execution, durable handoff document |

## What Was Actually Read

This report is based on actual content reads, not only repository metadata.
Representative artifacts reviewed include:

- `github/spec-kit`
  - `templates/commands/plan.md`
  - `templates/commands/tasks.md`
  - `templates/commands/implement.md`
- `Priivacy-ai/spec-kitty`
  - `.agents/skills/spec-kitty-runtime-next/SKILL.md`
  - `.agents/skills/spec-kitty-runtime-review/SKILL.md`
  - `docs/how-to/implement-work-package.md`
- `alirezarezvani/claude-skills`
  - `engineering/spec-driven-workflow/SKILL.md`
- `obra/superpowers`
  - `skills/writing-plans/SKILL.md`
  - `skills/executing-plans/SKILL.md`
- `affaan-m/everything-claude-code`
  - `commands/plan.md`
  - `commands/multi-plan.md`
  - `agents/planner.md`
- `garrytan/gstack`
  - `autoplan/SKILL.md`
  - `plan-eng-review/SKILL.md`
- `mhattingpete/claude-skills-marketplace`
  - `engineering-workflow-plugin/skills/feature-planning/SKILL.md`
  - `engineering-workflow-plugin/agents/plan-implementer.md`
- `FlineDev/ContextKit`
  - `Templates/Commands/plan/quick.md`
  - `Templates/Commands/plan/1-spec.md`
  - `Templates/Commands/plan/3-steps.md`
- `applied-artificial-intelligence/claude-code-toolkit`
  - `plugins/workflow/commands/plan.md`
  - `plugins/workflow/commands/next.md`
  - `plugins/transition/commands/handoff.md`
- `openai/skills`
  - `skills/.curated/notion-spec-to-implementation/reference/quick-implementation-plan.md`
  - `skills/.curated/notion-spec-to-implementation/reference/standard-implementation-plan.md`
  - `skills/.curated/notion-research-documentation/reference/quick-brief-template.md`

## Pattern Analysis

### Common Workflow Patterns

The strongest recurring structure is not a single skill but a lifecycle:

1. define or refine requirements
2. generate a plan or spec
3. break work into tasks
4. execute tasks
5. review or approve
6. hand off or continue

Within that lifecycle, the most portable patterns are:

- explicit `before code` planning or specification gates
- acceptance criteria attached to planning artifacts
- task decomposition with dependencies and parallel markers
- execution as a separate workflow from planning
- review as a separate workflow from implementation
- transition artifacts for continuation or resumption

What is notably weak or missing is a dedicated artifact that says:

- what this run should do now
- what it must not expand into
- what must be checked before claiming done
- what evidence is expected from this run

That gap is exactly the slot `execution-briefing` can own.

### Taxonomy

The ecosystem clusters into six artifact families:

1. **Spec contract**
   - what should be built
   - why
   - acceptance criteria
   - explicit exclusions
2. **Implementation plan**
   - phases
   - dependencies
   - architecture decisions
   - risk notes
3. **Task graph**
   - executable tasks
   - ordering
   - status tracking
4. **Execution workflow**
   - how tasks are run
   - where work happens
   - how completion is marked
5. **Review / gate workflow**
   - how quality is checked
   - how approval or rejection works
6. **Handoff / transition**
   - how work resumes in another session or by another worker

The underrepresented family is:

7. **Run brief / execution kickoff contract**
   - one current run goal
   - non-goals
   - starting path
   - required checks
   - required evidence
   - escalation triggers

Most systems implicitly smuggle this into a plan, a task, or a prompt file.
Very few model it as a first-class reusable skill.

### Escalation Model

Across sources, the natural escalation ladder looks like this:

- **Lightweight understanding / quick planning**
  - ContextKit `quick`
- **Specification or heavy planning**
  - `spec-driven-workflow`
  - `writing-plans`
  - `/plan`
  - `spec-kit`
- **Task decomposition**
  - `spec-kit.tasks`
  - ContextKit steps generation
  - AAI plan state
- **Execution**
  - `executing-plans`
  - `spec-kitty` implement WP
  - AAI `/next`
- **Review / gate**
  - `spec-kitty-runtime-review`
  - `plan-eng-review`
  - `autoplan`
- **Transition / resume**
  - AAI `/handoff`
  - `spec-kitty-runtime-next`

This ladder suggests `execution-briefing` should sit after shaping and before
execution, and should route upward to planning or sideways to review inputs when
needed.

### Output Patterns

Recurring output shapes across the sample:

- `spec.md`
- `plan.md`
- `tasks.md`
- `implementation-plan.md`
- `state.json`
- generated execution prompt files
- review prompt files
- transition or handoff documents
- checklist and gate artifacts

Recurring content fields:

- scope
- requirements summary
- acceptance criteria
- risks
- dependencies
- task ordering
- status or progress
- next step

What is uncommon:

- a standalone `Done Contract`
- a compact `Execution Brief`
- a clean authority boundary between issue scope, run scope, and verification
  authority

That rarity is useful. It means the local skill does not need to mimic an
existing commodity pattern, it can fill a genuine missing layer.

## Unique Innovations Worth Preserving

| Innovation | From source | Why it matters |
| --- | --- | --- |
| Deterministic runtime next-step loop | `spec-kitty-runtime-next` | Gives a strong model for explicit next-step and blocked-state reasoning |
| Review prompt as source of truth for gate checks | `spec-kitty-runtime-review` | Clarifies how execution outputs should be judged without freeform drift |
| Contract-first scope and acceptance discipline | `spec-driven-workflow` | Strongest source for required checks, traceability, and scope control |
| Interactive understanding confirmation with in/out scope | ContextKit | Excellent pre-artifact validation before locking a workflow |
| Planner/executor split | `feature-planning` + `plan-implementer` | Clean separation between planning and implementation responsibilities |
| Planning-only boundary with code sovereignty | ECC `multi-plan` | Helpful contrast for keeping briefing lighter than execution or planning |
| Auto-review gauntlet | `autoplan` | Strong example of treating approval as a separate stage instead of a comment |
| State file with `next_available` tasks | AAI toolkit | Good model for execution continuation and machine-readable readiness |
| Explicit handoff document for session transfer | AAI `/handoff` | Strong post-run artifact pattern that complements, but does not replace, a pre-run brief |
| Command-level handoffs between workflow stages | `spec-kit` | Clear lifecycle handoff contracts between planning, tasking, and implementation |

## Anti-Patterns To Avoid

- **Plan creep**
  - Many systems put everything into a giant plan artifact and leave no room for
    a lighter run contract.
- **Workflow glue overshadowing method**
  - Hook logic, CLI glue, and orchestration plumbing can drown the core
    reusable method.
- **Auto-triggering broad planning too easily**
  - Several plan skills are broad enough that they risk activating for tasks
    that only need a compact brief.
- **No standalone run contract**
  - The common jump is `plan -> execute`, which leaves execution drift under
    controlled only by task descriptions or agent memory.
- **Done criteria buried in other documents**
  - Acceptance criteria often exist, but they are not translated into run-level
    checks, evidence, and gate expectations.
- **Platform lock-in**
  - Some workflows assume very specific slash commands, agent runtimes, or
    local folder conventions, which reduces portability.

## Recommended Fusion Strategy

### Core Architecture

The right design for `execution-briefing` is not:

- a mini implementation planner
- a generic handoff writer
- a task decomposition tool
- a hidden execute-now router

It should instead own this narrow contract:

1. confirm the issue is already shapeable and stable enough
2. load the smallest issue and repo context needed
3. define one current run goal
4. state explicit run-level non-goals
5. suggest the most credible starting path or surfaces
6. translate issue acceptance into required checks, required evidence, and gate
   expectations
7. define escalation triggers and route-back verdicts
8. output:
   - execution brief
   - done contract
   - optional kickoff summary
   - route-back note if not ready

### Must-Include Elements

These are the strongest elements worth preserving in the local skill:

- **Acceptance-to-check translation**
  - Borrowed from spec-first systems
  - Execution briefing should convert acceptance criteria into concrete run
    checks and evidence asks
- **Explicit non-goals**
  - Borrowed from ContextKit and spec-driven patterns
  - Prevents run drift
- **Approval or route-back honesty**
  - Borrowed from `/plan`, `autoplan`, and review workflows
  - If a brief is not safe, it should say so clearly
- **Planner/executor separation**
  - Borrowed from `feature-planning` and `plan-implementer`
  - The brief should not quietly become implementation work
- **Review and gate awareness**
  - Borrowed from `spec-kitty-runtime-review` and `plan-eng-review`
  - The brief should know what later checks matter
- **Handoff friendliness**
  - Borrowed from AAI `/handoff`
  - The artifact should help another execution owner start cleanly

### Differentiation Opportunities

This is where the local skill can be better than the surveyed ecosystem:

- **Own the missing layer**
  - Most sources cover planning or execution, not pre-execution run briefing
- **Make authority boundaries explicit**
  - Very few systems clearly distinguish canonical issue, derived brief, run
    record, and verification report
- **Ship a standalone done contract**
  - Many systems rely on spec acceptance or plan success criteria, but do not
    make a compact run-level completion contract first-class
- **Stay portable**
  - Avoid deep dependence on a single slash-command runtime
- **Stay lighter than a plan**
  - This is the most important boundary to preserve

### Recommended Updates For The Local Skill

The current local
[execution-briefing](/Users/liqiongyu/projects/pri/my-agents/skills/execution-briefing/SKILL.md)
already captures the main differentiation well. Based on this research, the
next useful update would be a small one, not a rewrite.

Recommended additions for a future `0.1.1` or `0.2.0` update:

1. Add an optional **quick briefing lane**
   - inspired by ContextKit `quick`
   - for smaller issues that do not need the full briefing pass
2. Add an optional **approval checkpoint variant**
   - inspired by `/plan` and `autoplan`
   - useful when the user wants explicit sign-off before execution
3. Add a lightweight **machine-readable brief contract** example
   - inspired by AAI `state.json`
   - useful if future orchestration wants to read brief outputs programmatically
4. Strengthen the wording that **review prompts or gate definitions may become
   downstream sources of truth**
   - inspired by `spec-kitty-runtime-review`
5. Keep resisting any drift toward:
   - phased implementation plans
   - task decomposition
   - direct implementation

### Draft Outline

Suggested stable section shape for the eventual skill:

1. Purpose and boundary
2. Outputs
3. When to activate
4. When not to use
5. Authority hierarchy
6. Core principles
7. Workflow
8. Output contract
9. Validation
10. Example prompts

## Official-Surface Check

I also checked the public `openai/skills` and `anthropics/skills` trees for
`plan`, `brief`, `handoff`, `execute`, `task`, and `review` signals.

Result:

- `openai/skills` shows relevant planning templates under Notion-oriented
  spec-to-implementation flows and a generic quick brief template, but no
  direct standalone `execution-briefing` skill
- `anthropics/skills` did not surface a direct planning or execution-brief
  analogue in the public tree

This reinforces the main conclusion: the specific `execution-briefing` slot is
not saturated by official public skills.

## Attribution

Sources consulted:

- https://github.com/github/spec-kit
- https://github.com/Priivacy-ai/spec-kitty
- https://github.com/alirezarezvani/claude-skills
- https://github.com/obra/superpowers
- https://github.com/affaan-m/everything-claude-code
- https://github.com/garrytan/gstack
- https://github.com/mhattingpete/claude-skills-marketplace
- https://github.com/FlineDev/ContextKit
- https://github.com/applied-artificial-intelligence/claude-code-toolkit
- https://github.com/openai/skills
- https://github.com/anthropics/skills

Local working copies used where available:

- [affaan-m__everything-claude-code](/Users/liqiongyu/projects/pri/my-agents/workspaces/references/affaan-m__everything-claude-code)
- [alirezarezvani__claude-skills](/Users/liqiongyu/projects/pri/my-agents/workspaces/references/alirezarezvani__claude-skills)
- [garrytan__gstack](/Users/liqiongyu/projects/pri/my-agents/workspaces/references/garrytan__gstack)
- [jeremylongshore__claude-code-plugins-plus-skills](/Users/liqiongyu/projects/pri/my-agents/workspaces/references/jeremylongshore__claude-code-plugins-plus-skills)
- [obra__superpowers](/Users/liqiongyu/projects/pri/my-agents/workspaces/references/obra__superpowers)

## Next Step

Hand off to `skill-lifecycle-manager` in **update** mode for a bounded refresh
of the existing local
[execution-briefing](/Users/liqiongyu/projects/pri/my-agents/skills/execution-briefing/SKILL.md),
with this exact scope:

- preserve the current core architecture
- optionally add a quick lane
- optionally add an approval-checkpoint variant
- optionally add a machine-readable brief-contract example
- do not turn the skill into implementation planning
