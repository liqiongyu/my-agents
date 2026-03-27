---
name: agent-lifecycle-manager
description: >
  Manage the lifecycle of sub-agents: create or update agent packages, validate
  cross-surface agent contracts, evaluate routing behavior, tighten invocation
  boundaries, tune Codex runtime defaults, install or publish agents, or audit
  an agent library. Use only when the request is explicitly about agents or
  agent libraries, not for ordinary coding, implementation, or general project
  planning.
version: 0.3.1
---

# Agent Lifecycle Manager

Manage agent work as a lifecycle, not as isolated edits to `agent.json`, `claude-code.md`, or `codex.toml`. This skill is a thin router: it identifies which lifecycle stage matters now, runs only those stages, and keeps agent contract work, trigger tuning, install work, and governance concerns separate.

The design bias is:

- Use **`skill-lifecycle-manager` discipline** for routing, validation-before-claims, and explicit next steps
- Reuse **`skill-lifecycle-manager` tooling** for validation, projection, and eval harness work unless agent-specific behavior truly needs its own script path
- Use **repo-local agent conventions** for `agents/<name>/`, `agent.json`, `claude-code.md`, `codex.toml`, `CHANGELOG.md`, install targets, and generated catalogs
- Use **manual-first posture** for meta agent-management requests unless a narrower posture is clearly better

## Outputs

Depending on the lifecycle stage, produce one or more of:

- A new or updated agent package (`agent.json`, `claude-code.md`, `codex.toml`, `CHANGELOG.md`) with an explicit invocation posture and agent-contract brief
- A validation report with concrete schema, structure, or cross-surface parity failures
- An evaluation plan or benchmark note with realistic prompts under `workspaces/agent-lifecycle-manager/`
- A Discover handoff brief capturing delegated research before authoring begins
- A trigger-optimization note with before/after wording for descriptions
- An audit report covering overlap, overreach, runtime drift, and dependency-graph risk
- An install or publish checklist for Claude Code and Codex targets

## When Not To Use

Do not use this skill when:

- The task is ordinary coding, debugging, review, or product planning rather than explicit agent work
- The user wants to create or manage a skill rather than an agent; use `skill-lifecycle-manager` or `skill-creator`
- The user only wants to install a known agent and does not need lifecycle guidance; use the normal install flow directly
- The workflow is still too vague to say what the agent should own; clarify the mission before authoring anything

## Router First

Do not force every lifecycle stage every time. Route the request first:

| Stage | Primary question |
| --- | --- |
| **Discover** | Do we need overlap analysis, platform verification, or external agent-pattern research before authoring? |
| **Create / Update** | Are we authoring a new agent or materially revising an existing one? |
| **Validate** | Does the package satisfy structure, schema, and cross-surface parity? |
| **Evaluate** | Does the agent actually help on realistic requests? |
| **Optimize Invocation** | Is the agent under-triggering, over-triggering, or poorly described? |
| **Install / Publish** | Does the user need the agent activated on a target surface? |
| **Audit / Governance** | Is the problem about library health, overlap, drift, or overreach? |

Read [invocation-posture.md](references/invocation-posture.md) before writing or tuning the trigger boundary. Read [archetypes.md](references/archetypes.md) before choosing or questioning an archetype. Read [platform-surfaces.md](references/platform-surfaces.md) when deciding how the agent contract should map across authored files and installed targets. Read [research-handoff.md](references/research-handoff.md) when Discover needs delegated research before authoring. Read [evaluation-loop.md](references/evaluation-loop.md) when running a serious behavior pass. Read [audit-rubric.md](references/audit-rubric.md) when producing a formal audit.

## Operating Rules

1. **Runtime defaults are part of the contract.** For Codex agents, decide whether `model`, `model_reasoning_effort`, `sandbox_mode`, and `web_search` should be explicit; do not rely on accidental parent-session inheritance when stable defaults matter.
2. **Prefer existing repo mechanisms.** Reuse `npm run new -- --agent`, `npm run build`, `npm test`, and `npm run install-agent` instead of inventing parallel flows.
3. **Research is an input, not silent permission to author.** If Discover delegates to `docs-researcher` or `researcher`, capture the handoff separately and resume `Create / Update` only after the open contract questions are grounded.
4. **This skill is intentionally thin.** Keep agent-specific routing, references, and eval fixtures here, but reuse the shared `skills/skill-lifecycle-manager/scripts/` harness unless duplicating it would buy clear agent-specific behavior.
5. **Structure tracks `skill-lifecycle-manager`.** This skill's 9-phase / 7-stage workflow is intentionally derived from `skill-lifecycle-manager`. When the parent's workflow structure evolves, check whether this skill needs a matching update.

## Command Path Model

The shell commands in this document use canonical repo paths. When reading this skill from a projected runtime copy, substitute the correct prefix:

- Canonical repo: `SLM_DIR=skills/skill-lifecycle-manager`
- Codex projection: `SLM_DIR=.agents/skills/skill-lifecycle-manager`
- Claude Code projection: `SLM_DIR=.claude/skills/skill-lifecycle-manager`

For the agent-lifecycle-manager's own canonical path, substitute similarly:

- Canonical repo: `ALM_DIR=skills/agent-lifecycle-manager`
- Codex projection: `ALM_DIR=.agents/skills/agent-lifecycle-manager`
- Claude Code projection: `ALM_DIR=.claude/skills/agent-lifecycle-manager`

Eval fixtures (`eval/`) are intentionally excluded from projection. Projected-surface users should point `--eval-file` at a canonical repo copy or use inline `--eval` prompts instead.

## Workflow

This workflow uses **9 phases** around **7 routed lifecycle stages**. Phase 1 scopes and routes the work, Phases 2-8 correspond to the routed stages above, and Phase 9 closes the loop.

### Phase 1: Scope And Route

Start by classifying the request:

- **Single-stage**: validate this agent, audit this agent, tighten the trigger
- **Multi-stage**: discover and draft, update then validate, validate then install
- **End-to-end**: create or rehabilitate an agent from discovery through validation and next-step packaging

Then identify the artifact:

- **New agent idea**
- **Existing local agent**
- **Installed agent**
- **Whole agent library**

Before authoring or trigger work, decide the target agent's **invocation posture**:

- **`manual-first`**: explicit invocation is expected and false positives are costly
- **`hybrid`**: explicit invocation is normal, but a few high-confidence automatic selections are helpful
- **`auto-first`**: the agent is narrow, cheap, and expected to be selected automatically often

If the user has not said otherwise, default to `manual-first`. Meta-agents, governance-oriented agents, and wide-write agents should usually stay there.

Before proceeding, summarize the chosen route in one or two sentences so the user can correct course early.

### Phase 2: Discover

Use Discover when the domain is unfamiliar, when overlap with other local agents is plausible, or when platform behavior or external agent patterns need verification before you lock the contract.

Default behavior:

1. Inspect local agent and skill packages for overlap, dependencies, and conventions.
2. Route the research question to the smallest useful helper:
   - `explorer` for local overlap analysis, neighboring packages, dependency-graph mapping, and repo-specific evidence
   - `docs-researcher` for official docs, specs, release notes, or platform-behavior verification
   - `researcher` for broader multi-source comparison, external examples, or mixed official-plus-community pattern research
3. Inspect repo-local install and validation flows:
   - `scripts/new.js`
   - `scripts/validate.js`
   - `scripts/install.js`
   - `schemas/agent.schema.json`
4. If delegated research is broad and the user has not bounded it, choose or ask for a Quick, Standard, or Deep pass before broad discovery begins.
5. Keep the first delegated output separate from authoring. The handoff should capture:
   - source inventory, with official and community sources clearly separated when both matter
   - representative examples or candidate patterns when the field is broad
   - implications for mission and non-goals
   - plausible archetype options
   - tool and permission budget implications
   - Codex runtime-default implications
   - likely skill dependencies or sub-agent graph implications
   - patterns to borrow
   - patterns to reject
   - unresolved unknowns
   - a recommendation on whether `Create / Update` can begin yet
6. If the research is ecosystem-wide and the candidate set could materially change the contract, stop after the source or candidate inventory and let the user confirm direction before deeper synthesis continues.
7. Resume `Create / Update` only after the handoff is complete. Treat it as a separate input to authoring, not as silent permission to start drafting `agent.json`, `claude-code.md`, or `codex.toml`.
8. Convert what you learn into authoring inputs:
   - archetype
   - invocation posture
   - tool and permission budget
   - Codex runtime defaults
   - skill references
   - sub-agent graph
   - surface support expectations

### Phase 3: Create Or Update

When authoring or revising an agent, define the contract before touching wording.

1. Capture 2-4 realistic requests first.
2. Decide the invocation posture.
3. Define the agent contract:
   - mission
   - non-goals
   - archetype
   - read/write/network expectations
   - Codex runtime defaults
   - required skills
   - allowed sub-agents, if any
   - output style and operating rules
4. Decide supported authored files:
   - `agent.json`
   - `claude-code.md`
   - `codex.toml`
   - `CHANGELOG.md`
5. Keep semantics aligned:
   - one short routing boundary across descriptions
   - one consistent role across surfaces
   - runtime defaults that match the permission and cost budget
   - platform-specific details only where the surface truly differs

For Codex surfaces, prefer explicit defaults when the reusable agent should behave consistently across sessions:

- `sandbox_mode` should match the intended permission budget, not the caller's accidental default.
- `model_reasoning_effort` should usually be explicit for reusable repo agents unless inheritance is deliberate.
- `web_search` should only be enabled when the agent's mission genuinely depends on live web access.
- `model` choice should reflect the role's speed-versus-depth tradeoff rather than a copy-paste default.

Use the repo's built-in archetypes unless they clearly fail the mission:

- `explorer`: read-only mapping, discovery, evidence gathering, and impact analysis
- `reviewer`: structured critique, correctness/risk analysis, and findings-first review
- `implementer`: write-focused execution, refactors, and feature delivery
- `planner`: read-only architecture, sequencing, and trade-off planning
- `debugger`: reproduce, isolate, and minimally fix failures
- `custom`: use only when the mission genuinely does not fit the built-ins

If you are tempted to pick `custom`, explain why one of the built-in archetypes is insufficient.

Use `npm run new -- --agent <name>` when you need a fresh scaffold. When updating an existing agent, preserve the name unless the rename is deliberate and accompanied by catalog and install-surface updates.

### Phase 4: Validate

Validation comes before broad behavioral claims.

In this repo, run these checks in order:

1. Confirm the target package exists and includes the expected authored files:
   - `agent.json`
   - `CHANGELOG.md`
   - `claude-code.md` and/or `codex.toml`, depending on the supported surfaces
2. `npm run build`
3. `npm test`
4. For deeper agent-specific contract validation:
   - `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python "$SLM_DIR/scripts/quick_validate_agent.py" agents/<name>`
   - This checks cross-surface alignment, archetype-capability consistency, runtime defaults, and tools alignment
5. If install or runtime copies are part of the request, run:
   - `npm run install-agent -- <name> --platform claude|codex|all --scope project`
   - then confirm the installed copies under `.claude/agents/` and/or `.codex/agents/`

If you are revising this `agent-lifecycle-manager` skill package itself rather than a target agent, switch to the repo's skill validation flow before claiming success:

- `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python "$SLM_DIR/scripts/quick_validate.py" "$ALM_DIR"`
- `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python "$SLM_DIR/scripts/validate_eval_suite.py" "$ALM_DIR/eval/eval-cases.json"`
- `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python "$SLM_DIR/scripts/project_skill.py" "$ALM_DIR" --platform all --scope project`
- `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python "$SLM_DIR/scripts/validate_projection.py" "$ALM_DIR" --platform all --scope project`

Use the results to inspect agent-specific failure modes:

- missing or malformed `agent.json`
- invalid categories or name mismatch
- changelog/version mismatch
- bad references to skills or agents
- Codex runtime-control drift, especially around `sandbox_mode`, `model_reasoning_effort`, `model`, and `web_search`
- risky nested agent graphs
- weak or too-short docs
- generated catalog drift

Fix structural issues before deeper evaluation.

### Phase 5: Evaluate

Use realistic agent requests, not toy prompts.

Create a small prompt mix:

- `should-handle`: a normal request the agent should own
- `should-stretch`: a harder but still in-scope request
- `should-not-handle`: adjacent work that belongs to another agent or to the main session
- `near-miss`: a borderline request that tests boundary clarity

When evaluating this skill itself, or another meta agent-management workflow, prefer at least one `with-skill` run and one `baseline` run when the comparison will answer whether the lifecycle manager adds clarity instead of churn. Use the reusable harness documented in [evaluation-loop.md](references/evaluation-loop.md) and the canonical eval suite under `$ALM_DIR/eval/` (see Command Path Model for the correct prefix).

Evaluate more than file validity:

- did the agent route the right lifecycle stage?
- did it choose a sensible archetype, tool budget, and dependency graph?
- did Codex runtime defaults reinforce the contract instead of inheriting a surprising parent-session posture?
- did it avoid unnecessary lifecycle stages?
- did the Claude Code and Codex surfaces still describe the same agent?

Capture prompts, outcomes, and failures in durable notes such as the active change's `evidence.md`.
When benchmarking on a surface that may edit files or pause for approvals, prefer a disposable worktree when practical, capture `git status --short` before and after the run, and revert unintended edits before scoring the result.

### Phase 6: Optimize Invocation

Trigger tuning is a separate stage. Run it when:

- the agent is selected too rarely for in-scope requests
- the agent is selected for adjacent work it should avoid
- the user specifically asks to improve the description boundary

Workflow:

1. Confirm the invocation posture again.
2. Draft `should-trigger`, `should-not-trigger`, and `near-miss` prompts.
3. Tighten the short descriptions in the authored package and any install-facing metadata.
4. Avoid broad body rewrites unless the evidence points there.
5. Record the before/after wording and rationale.

### Phase 7: Install Or Publish

Treat distribution as an adapter step.

First identify the target surface:

- canonical repo package only
- Claude Code install
- Codex install
- both local surfaces
- external publication flow

Then choose the least surprising path:

1. Validate first.
2. Use the repository install flow:
   - `npm run install-agent -- <name>`
   - add `--platform claude|codex|all`
   - add `--scope user|project`
3. Confirm the runtime targets:
   - Claude Code: `.claude/agents/<name>.md`
   - Codex: `.codex/agents/<name>.toml`
4. Do not promise publishing unless credentials and target-platform rules are genuinely satisfied.

### Phase 8: Audit / Governance

Audit is for library health, not only one file. For automated inventory-wide audit:

- `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python "$SLM_DIR/scripts/audit_agent_inventory.py" --root agents`

Use the report as a starting point, then inspect for:

- duplicate or overlapping intent
- weak or inconsistent trigger boundaries
- archetype drift
- overly broad tool or permission budgets
- implicit Codex runtime inheritance where explicit defaults would be safer
- stale metadata or version signals
- unresolved Claude/Codex drift
- fragile or too-deep sub-agent graphs
- unclear install or ownership story

Prioritize dangerous overreach and structural breakage before polish.

### Phase 9: Close The Loop

Before finishing, report:

- which lifecycle stage(s) were run
- what artifacts changed
- what was validated versus not yet validated
- the next lifecycle stage, if any

If the request ended mid-lifecycle, explicitly say what remains: for example, "draft completed; next step is evaluation" or "audit completed; next step is consolidation."

## Failure Patterns To Avoid

- Editing one authored file while ignoring cross-surface alignment with the other two
- Letting Codex runtime defaults drift by inheritance when the agent needs stable `sandbox_mode` or `model_reasoning_effort`
- Installing or publishing before the package is structurally valid

See `eval/README.md` Failure Pattern Coverage for the full mapping between workflow risks and eval assertions.

## Example Prompts

- Turn this repeated agent-authoring workflow into a reusable agent package for Claude Code and Codex.
- Audit our `agents/` directory for overlap, overly broad tool budgets, and Claude/Codex drift.
- Standardize `sandbox_mode` and `model_reasoning_effort` across our Codex agents without broadening their permissions.
- Tighten the trigger wording for this agent without rewriting the whole body.
- Update this existing agent, validate it, and tell me the next lifecycle step.
- Check whether this agent should be `manual-first` or `hybrid` before we ship it.

## Worked Example: Audit Request

**User prompt**: "Audit our agent library for overlap and Codex drift."

**Phase 1 — Route**: Single-stage audit. Artifact: whole agent library. No authoring, no trigger work.

**Phase 8 — Audit**: Run `audit_agent_inventory.py --root agents`. Review the report:
- Health score: 0.88 (Healthy)
- Medium: 6 agents have trigger descriptions missing routing keywords
- Low: `docs-researcher`, `explorer`, `researcher` share the `explorer` archetype
- Low: All 7 agents show cross-platform model divergence (intentional per-platform choice)

Prioritize: archetype overlap between `docs-researcher` and `explorer` is the highest-value finding — consider whether one agent should become `custom` or whether the overlap is acceptable given their different missions.

**Phase 9 — Close**: "Audit complete. The library is structurally healthy. Two follow-up candidates: (1) tighten trigger descriptions to include routing keywords, (2) review whether `docs-researcher` should stay as `explorer` archetype or switch to `custom` given its `web_search` capability. Next recommended lifecycle step: Optimize Invocation for the trigger descriptions."
