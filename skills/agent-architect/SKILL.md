---
name: agent-architect
description: >
  Analyze a coding project and design a tailored AI development environment:
  recommend agents, skills, instruction files, MCP servers, and workflow
  composition across Claude Code and Codex. Also audit an existing AI setup
  for gaps, overlap, or bloat. Use when setting up, overhauling, or auditing
  a project's AI tooling as a whole, not for individual agent edits or skill
  management.
---

# Agent Architect

Analyze a codebase and design a complete AI development environment. This skill answers "what agents, skills, instructions, and infrastructure does this project need?" — the architect layer above individual agent and skill management.

## Route First

Classify the request before doing anything:

| Mode | When | Key action |
| --- | --- | --- |
| **Scan** | Understand the project before recommending | Analyze codebase, produce project profile |
| **Design** | Recommend what agents/skills/infra to use | Produce architecture plan with rationale |
| **Generate** | Create the files after design approval | Write platform-specific agent + instruction files |
| **Audit** | Evaluate an existing AI setup | Inventory, gap/overlap analysis, recommendations |

Most requests are Scan → Design → Generate in sequence. Summarize the chosen mode before proceeding.

## Scan

Build a project profile by reading the codebase. Consult [codebase-signals.md](references/codebase-signals.md) for what to look for and in what order.

Produce a structured profile covering:

- **Tech stack** — languages, frameworks, package managers
- **Project type** — frontend, backend, fullstack, data/ML, monorepo, library
- **Project phase** — early (scaffolding), active (features), mature (maintenance)
- **Existing AI config** — CLAUDE.md, AGENTS.md, installed agents, MCP servers, other AI tools
- **Team signals** — CI/CD, test coverage, linting, commit conventions
- **Monorepo structure** — workspace layout and domain boundaries (if applicable)

Present the profile and **pause for user confirmation** before designing. The profile is the foundation — a wrong profile produces wrong recommendations.

## Design

Using the confirmed profile, produce an architecture recommendation covering five areas:

### 1. Agents

Recommend which subagents the project needs and why. Consult [project-type-patterns.md](references/project-type-patterns.md) for the catalog of patterns by project type and phase.

Apply the creation gate from `agent-lifecycle-manager` to every candidate:

1. Does a dedicated agent add value beyond inline execution? (context isolation, permission narrowing, parallelism, behavioral contract)
2. Can you name the behavioral contract?
3. Is there an existing agent that could be adjusted instead?
4. Will this be spawned frequently enough to justify its existence?
5. Can you write the instructions in 5-8 lines?

If most answers are "no", drop the candidate. Fewer well-chosen agents beats many overlapping ones.

### 2. Skills

Recommend from the ecosystem first:

1. Check installed skills in the current project
2. Search community catalogs (skills.sh, VoltAgent collections, community repos)
3. Only propose a custom skill when nothing existing covers the need

### 3. Instructions

Recommend what belongs in root instruction files vs delegated to skills/agents:

- **CLAUDE.md**: under 200 lines, project conventions the model would get wrong without guidance
- **AGENTS.md**: under 32 KiB, same content adapted for Codex discovery
- **Per-directory CLAUDE.md**: only for monorepos with distinct domain conventions
- **Move detail to skills**: anything over ~10 lines that is reusable workflow, not project convention

### 4. MCP Servers

Recommend based on tech stack signals. Common patterns:

- Database projects → database MCP server
- GitHub-heavy workflows → GitHub MCP server
- Documentation needs → context7 or docs MCP server
- Multi-service projects → relevant API MCP servers

### 5. Workflow Composition

Define how agents relate to each other:

| Pattern | When |
| --- | --- |
| Parallel | Independent reviews or research (security + code review on same PR) |
| Sequential | Dependent phases (plan → implement → review) |
| Router | Domain-specific routing in monorepos |
| Writer/Reviewer | Quality via fresh-context review |
| Tiered model | Cost optimization (Opus lead, Sonnet workers, Haiku explorers) |

Present the full design as a structured plan. **Pause for user review** before generating files.

## Generate

After design approval, produce platform-specific files. Consult [platform-output.md](references/platform-output.md) for templates and conventions.

### Agent Files

For each recommended agent, generate the canonical package:

- `agents/<name>/agent.json` — metadata
- `agents/<name>/claude-code.md` — Claude Code instructions (5-8 lines behavioral contract)
- `agents/<name>/codex.toml` — Codex instructions with explicit model/sandbox settings

Keep semantics aligned across platforms — one routing boundary, one role, same behavioral contract.

### Instruction Files

- Draft or update `CLAUDE.md` at appropriate scope
- Draft or update `AGENTS.md` at appropriate scope
- Use progressive disclosure: overview in root file, detail in references or skills

### MCP Configuration

Recommend server entries for `.claude/settings.json` or equivalent project config.

### Delegation

Delegate individual agent creation to `agent-lifecycle-manager` when the agent needs full lifecycle treatment (validation, evaluation, trigger optimization). This skill designs the set; the lifecycle manager implements individuals.

## Audit

Evaluate an existing project's AI development environment:

1. **Inventory** all agent definitions, instruction files, skills, and MCP configs
2. **Gap analysis** — missing roles for the project type and phase
3. **Overlap analysis** — agents or skills with duplicate intent
4. **Bloat check** — CLAUDE.md/AGENTS.md over recommended limits, redundant instructions
5. **Drift check** — configs that don't match actual project state (e.g., agent for a framework no longer used)
6. **Platform parity** — Claude Code and Codex configs in sync or intentionally divergent

Report findings with severity (critical / warning / suggestion) and recommended actions.

## When Not To Use

- Individual agent creation or update → `agent-lifecycle-manager`
- Individual skill management → `skill-lifecycle-manager`
- General software architecture → `future-aware-architecture`
- Multi-agent runtime debugging → `agentic-development`
- Writing a single CLAUDE.md without broader architecture context → just edit the file directly

## Operating Rules

1. **Scan before design.** Never recommend agents without understanding the project first.
2. **Minimalism over completeness.** 3 well-chosen agents beats 12 overlapping ones. Apply the creation gate to every candidate.
3. **Dual-platform by default.** Generate for both Claude Code and Codex unless the user says otherwise.
4. **Ecosystem-first for skills.** Search for existing skills before proposing custom ones.
5. **Phase-appropriate.** Early projects need planners; mature projects need reviewers and auditors. Don't over-provision.
6. **Delegate granular work.** This skill designs the architecture; `agent-lifecycle-manager` handles individual agent lifecycle.
7. **Interactive at boundaries.** Pause after Scan and after Design before generating.
8. **Right-size instructions.** CLAUDE.md under 200 lines. Agent prompts under 8 lines. Move detail to references.

## Example Prompts

- Analyze this project and recommend what agents and skills we need.
- Set up the AI development environment for this repo.
- Audit our current agent setup — are there gaps or overlap?
- We're starting a new Next.js + FastAPI project. What agents should we create?
- Redesign our CLAUDE.md and agent architecture — it's gotten messy.
- What MCP servers should we add for this project?
