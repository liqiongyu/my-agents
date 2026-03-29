# Fusion Report: Handoff Bundle Writing Skills

**Date**: 2026-03-29
**Mode**: Deep
**Status**: Research handoff complete
**Target**: `handoff-bundle-writing`
**Candidate groups analyzed**: 17 discovered, 11 materially analyzed
**Artifacts read**: 15+

## Executive Summary

The strongest conclusion is that the ecosystem has many patterns for
continuation, transition, and multi-agent orchestration, but very few examples
of a clean, standalone skill whose sole job is to write a resume-safe handoff
bundle for an interrupted or transferred run.

The best sources converge on a few important ideas: separate durable memory
from session-specific state, make the next step explicit, preserve blockers and
artifact references, and treat the handoff as transfer context rather than a
shadow source of truth. That matches the updated local architecture very well.

## Source Inventory

| # | Name | Source | URL | Signals | Key Strength |
| --- | --- | --- | --- | --- | --- |
| 1 | `handoff` command | GitHub | https://github.com/applied-artificial-intelligence/claude-code-toolkit | Explicit transition artifact, session continuation focus | Clean split between durable memory and session-specific transition document |
| 2 | `next` command | GitHub | https://github.com/applied-artificial-intelligence/claude-code-toolkit | Continuation workflow | Strong next-step and state-driven resume logic |
| 3 | `on-call-handoff-patterns` | GitHub | https://github.com/wshobson/agents | Direct handoff skill | Best direct template reference for structured handoff contents |
| 4 | `context-driven-development` | GitHub | https://github.com/wshobson/agents | Artifact-first context system | Strong canonical-artifact and artifact-boundary discipline |
| 5 | `artifact-templates` | GitHub | https://github.com/wshobson/agents | Template-heavy | Useful starter artifact shapes and field discipline |
| 6 | `workflow-patterns` | GitHub | https://github.com/wshobson/agents | Phase checkpoint flow | Good model for recording progress, pending work, and execution continuity |
| 7 | `browse` handoff / resume | GitHub | https://github.com/garrytan/gstack | State-preserving user takeover | Strongest example of preserving live state across handoff and resume |
| 8 | CEO review handoff note | GitHub | https://github.com/garrytan/gstack | Resume note for paused review | Good example of pause-safe context note that avoids re-asking prior questions |
| 9 | `spec-kitty-runtime-next` | GitHub | https://github.com/Priivacy-ai/spec-kitty | Deterministic runtime loop | Strong blocked / next / terminal modeling for continuation logic |
| 10 | `agent-workflow-designer` | GitHub | https://github.com/alirezarezvani/claude-skills | Explicit handoff contract language | Strong methodology anchor for bounded handoff payloads |
| 11 | `resume` | GitHub | https://github.com/alirezarezvani/claude-skills | Paused experiment recovery | Clear resume process: load context, summarize state, ask for next action |
| 12 | `delegating-work` | GitHub | https://github.com/liqiongyu/lenny_skills_plus | Context handoff pack | Helpful non-coding reference for pack structure and guardrails |
| 13 | `spec-kit` command chain | GitHub | https://github.com/github/spec-kit | 83k+ stars, high-signal SDD | Useful only as a stage-handoff contrast, not a direct handoff-bundle model |
| 14 | `multi-execute` | GitHub | https://github.com/affaan-m/everything-claude-code | Session reuse and resume | Useful only as continuation contrast; not a bundle-writing workflow |
| 15 | `orchestrate` | GitHub | https://github.com/affaan-m/everything-claude-code | Agent-to-agent handoff docs | Useful as a handoff-edge format reference, but too orchestration-centric |
| 16 | `openai/skills` baseline | GitHub | https://github.com/openai/skills | Official Codex baseline | Has brief and implementation-plan templates, but no direct handoff-bundle skill |
| 17 | `anthropics/skills` baseline | GitHub | https://github.com/anthropics/skills | Official skills baseline | No direct standalone handoff or resume-writing analogue surfaced |

## What Was Actually Read

This report is based on actual content reads, not only repository metadata.
Representative artifacts reviewed include:

- `applied-artificial-intelligence/claude-code-toolkit`
  - `plugins/transition/commands/handoff.md`
  - `plugins/workflow/commands/next.md`
- `wshobson/agents`
  - `plugins/incident-response/skills/on-call-handoff-patterns/SKILL.md`
  - `plugins/conductor/skills/context-driven-development/SKILL.md`
  - `plugins/conductor/skills/context-driven-development/references/artifact-templates.md`
  - `plugins/conductor/skills/workflow-patterns/SKILL.md`
- `garrytan/gstack`
  - `browse/SKILL.md`
  - `plan-ceo-review/SKILL.md`
  - `BROWSER.md`
- `Priivacy-ai/spec-kitty`
  - `.agents/skills/spec-kitty-runtime-next/SKILL.md`
- `alirezarezvani/claude-skills`
  - `engineering/agent-workflow-designer/SKILL.md`
  - `engineering/autoresearch-agent/skills/resume/SKILL.md`
- `liqiongyu/lenny_skills_plus`
  - `skills/delegating-work/SKILL.md`
- `github/spec-kit`
  - `templates/commands/implement.md`
- `affaan-m/everything-claude-code`
  - `commands/multi-execute.md`
  - `commands/orchestrate.md`
- `openai/skills`
  - `skills/.curated/notion-research-documentation/SKILL.md`
  - `skills/.curated/notion-research-documentation/reference/quick-brief-template.md`
  - `skills/.curated/notion-spec-to-implementation/reference/standard-implementation-plan.md`
- `anthropics/skills`
  - `README.md`

## Pattern Analysis

### Common Workflow Patterns

The most useful recurring pattern is:

1. identify whether work is pausing, transferring, or resuming
2. extract the smallest state that another worker needs
3. preserve the next step explicitly
4. preserve blockers, warnings, and supporting artifacts
5. hand off without pretending the handoff document is the system of record

The best samples also separate two different jobs:

- durable knowledge or canonical records
- current-session or current-run transfer context

That distinction matters a lot for the local skill, because the architecture now
explicitly says `Handoff Bundle` is recovery context, not canonical lifecycle
state.

### Taxonomy

The candidate set clusters into five useful families:

1. **Direct handoff artifact writers**
   - AAI `/handoff`
   - `on-call-handoff-patterns`
2. **Resume and continuation workflows**
   - AAI `/next`
   - `resume`
   - `spec-kitty-runtime-next`
3. **State-preserving takeover patterns**
   - gstack `browse` handoff / resume
4. **Handoff-contract methodology**
   - `agent-workflow-designer`
   - `delegating-work`
5. **Boundary and contrast references**
   - `context-driven-development`
   - `workflow-patterns`
   - `spec-kit`
   - `multi-execute`
   - `orchestrate`

For the local skill, family 1 should dominate the design, families 2 and 3
should inform continuation semantics, family 4 should inform contract language,
and family 5 should mostly be used to preserve boundaries.

### Escalation Model

Across the sample, the natural escalation ladder looks like this:

- **Simple status continuation**
  - explicit `next step`
  - quick handoff variant
- **Structured transfer**
  - completed / remaining / blockers / next move
  - active context + references
- **Resume-aware recovery**
  - load prior artifacts
  - restore state
  - avoid re-asking resolved questions
- **Governed reroute**
  - escalate to review, planning, specialist help, or human takeover

This suggests `handoff-bundle-writing` should activate after work has started
and when a run is being paused, interrupted, or transferred, not when a task is
still in intake or shaping.

### Output Patterns

Recurring fields across the strongest examples:

- current work context
- current state snapshot
- completed work
- remaining work
- blockers
- next step
- recent decisions
- relevant artifacts or links
- warnings or escalation notes

Additional patterns worth noting:

- **consumer awareness**
  - outgoing checklist
  - incoming checklist
- **resume notes**
  - how to continue
  - what not to re-ask
- **state location discipline**
  - known file path or artifact location
  - deterministic lookup strategy

What is uncommon in the ecosystem, but important locally:

- explicit issue and run references
- explicit artifact refs as a first-class field
- explicit authority boundary against canonical issue and run state

## Unique Innovations Worth Preserving

| Innovation | From source | Why it matters |
| --- | --- | --- |
| Durable memory vs session transition split | AAI `/handoff` | Strongest model for separating persistent knowledge from run-local transfer context |
| Deterministic next-step recovery | AAI `/next` and `spec-kitty-runtime-next` | Useful for `next_step`, blocked-state, and resume semantics |
| Rich handoff template with active, recent, known, upcoming, and escalation sections | `on-call-handoff-patterns` | Best concrete handoff template reference even though the domain is incident response |
| Live-state preservation across user takeover | gstack `browse` handoff / resume | Strong reminder that handoff can preserve continuation state, not just summarize history |
| Prior-session handoff note that avoids redundant questioning | gstack `plan-ceo-review` | Excellent pattern for `resume_notes` and "do not start from scratch" |
| Explicit bounded handoff payloads | `agent-workflow-designer` | Helps keep transfer artifacts compact, targeted, and edge-specific |
| Resume flow that loads full history then asks for the next action | `resume` | Good model for post-handoff consumption behavior |
| Delegation pack structure with decision rights and guardrails | `delegating-work` | Helpful for writing warnings, open questions, and escalation semantics clearly |

## Anti-Patterns To Avoid

- **Narrative diary handoff**
  - long storytelling with no structured state snapshot
- **Shadow source of truth**
  - handoff document silently changes issue scope, run state, or verification truth
- **No next step**
  - handoff ends with context only, leaving the receiver to rediscover momentum
- **No artifact references**
  - evidence, decisions, change refs, or verification refs are implied but not linked
- **Mixed durability**
  - long-term knowledge and temporary run state are written into one undifferentiated blob
- **Handoff as orchestration glue only**
  - the artifact exists only to pass between agents, not to support safe resume after interruption
- **No consumer contract**
  - no clue who should read the handoff, what they should do next, or what must be revalidated
- **Implicit resume assumptions**
  - assuming resume can happen safely without checking current state, blockers, or missing gates

## Recommended Fusion Strategy

### Core Architecture

The right design for `handoff-bundle-writing` is not:

- a generic conversation summarizer
- a multi-agent orchestration framework
- a memory-writeback skill
- a run-state sync service

It should instead own this narrow contract:

1. confirm a run already exists and work has progressed enough to need transfer
2. read the smallest set of current run artifacts needed to write the bundle
3. capture a short current-state snapshot
4. list completed work, remaining work, blockers, and the recommended next step
5. attach the artifact references needed for safe resume
6. optionally capture budget snapshot, resume notes, warnings, and pending specialist work
7. state clearly that the handoff is transfer context, not canonical state
8. output:
   - handoff bundle
   - optional quick handoff variant
   - optional route note when a proper handoff cannot be written honestly

### Must-Include Elements

These are the strongest elements worth preserving in the local skill:

- **Resume-safe state snapshot**
  - current state, completed, remaining, blockers, next step
- **Artifact references**
  - explicit links or IDs for evidence, decisions, change objects, or verification work
- **Authority boundary**
  - the bundle must not become shadow issue or run state
- **Consumer-aware continuation**
  - say what the next owner should do next, not only what happened
- **Warnings and pending specialist work**
  - preserve risky edges and unresolved external dependencies
- **Optional quick handoff lane**
  - useful when a compact interruption note is enough

### Differentiation Opportunities

This is where the local skill can be better than the surveyed ecosystem:

- **Align exactly to issue/run/change/verification ontology**
  - most external samples lack these object boundaries
- **Make `artifact_refs` first-class**
  - many handoffs mention links informally instead of modeling them directly
- **Preserve canonical-state humility**
  - the local blueprint is much clearer than the ecosystem about source-of-truth boundaries
- **Support both interruption and transfer**
  - same skill can cover pause, takeover, specialist return, and run resume
- **Be artifact-first instead of runtime-specific**
  - avoid coupling the skill to one CLI or one slash-command harness

### Recommended Updates To The Eventual Local Skill

Based on the updated architecture, the future local skill should likely:

1. stay `manual-first`
   - false positives are expensive because not every run needs a handoff bundle
2. define a clear activation boundary
   - use only after execution has started and a pause, transfer, interruption, or recovery need exists
3. include a canonical field set aligned to the schema
   - `id`, `issue_id`, `run_id`, `current_state`, `completed`, `remaining`, `blockers`, `next_step`, `artifact_refs`
4. include optional fields aligned to the schema
   - `budget_snapshot`, `resume_notes`, `warnings`, `specialist_pending`
5. offer a quick variant
   - for short pause / takeover scenarios
6. explicitly route away when the needed information is still missing
   - for example when no run exists, no artifact refs exist, or the work has not actually progressed

### Draft Outline

Suggested stable section shape for the eventual skill:

1. Purpose and boundary
2. Outputs
3. When to activate
4. When not to use
5. Authority hierarchy
6. Required fields
7. Optional fields
8. Workflow
9. Quick handoff variant
10. Validation
11. Output templates

## Official-Surface Check

I also checked the public `openai/skills` and `anthropics/skills` trees for
direct `handoff` or `resume` skill analogues.

Result:

- `openai/skills` has useful brief and implementation-plan templates plus a
  research-documentation workflow, but no direct standalone
  `handoff-bundle-writing` skill
- `anthropics/skills` did not surface a direct standalone handoff or resume
  writing skill in code search on `SKILL.md`

This reinforces the main conclusion: the local skill has a real chance to fill
an under-modeled layer rather than copy a saturated official pattern.

## Attribution

Sources consulted:

- https://github.com/applied-artificial-intelligence/claude-code-toolkit
- https://github.com/wshobson/agents
- https://github.com/garrytan/gstack
- https://github.com/Priivacy-ai/spec-kitty
- https://github.com/alirezarezvani/claude-skills
- https://github.com/liqiongyu/lenny_skills_plus
- https://github.com/github/spec-kit
- https://github.com/affaan-m/everything-claude-code
- https://github.com/openai/skills
- https://github.com/anthropics/skills

Local working copies used where available:

- [affaan-m__everything-claude-code](/Users/liqiongyu/projects/pri/my-agents/workspaces/references/affaan-m__everything-claude-code)
- [alirezarezvani__claude-skills](/Users/liqiongyu/projects/pri/my-agents/workspaces/references/alirezarezvani__claude-skills)
- [garrytan__gstack](/Users/liqiongyu/projects/pri/my-agents/workspaces/references/garrytan__gstack)
- [liqiongyu__lenny_skills_plus](/Users/liqiongyu/projects/pri/my-agents/workspaces/references/liqiongyu__lenny_skills_plus)
- [wshobson__agents](/Users/liqiongyu/projects/pri/my-agents/workspaces/references/wshobson__agents)

## Next Step

Hand off to `skill-lifecycle-manager` in **create** mode for a bounded authoring
pass on `handoff-bundle-writing`, with this exact scope:

- keep it `manual-first`
- treat it as `artifact template + skill`, not agent or service
- align required fields to the canonical schema
- align authority boundaries to `issue / run / verification` ownership
- support both standard and quick handoff variants
- do not turn it into generic summarization, memory writeback, or orchestration
