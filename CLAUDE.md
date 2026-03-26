# CLAUDE.md

## Project Overview

This is a monorepo for creating, managing, and publishing reusable Agent skills and sub-agent definitions. Skills are prompt fragments (installed as slash commands); agents are cross-platform sub-agent definitions (installed as Claude Code agents / Codex agent roles).

## Directory Conventions

### Skills

- Each skill lives in `skills/<name>/` and MUST contain:
  - `skill.json` — machine-readable metadata (validated against `schemas/skill.schema.json`)
  - `SKILL.md` — the core skill prompt (trigger conditions, instructions, examples, caveats)
  - `CHANGELOG.md` — per-skill change log in Keep a Changelog format
- Skills MAY contain a `references/` subdirectory for deep-dive docs loaded on demand (progressive disclosure pattern).

### Agents

- Each agent lives in `agents/<name>/` and MUST contain:
  - `agent.json` — machine-readable metadata (validated against `schemas/agent.schema.json`)
  - At least one platform definition file:
    - `claude-code.md` — Claude Code agent definition (Markdown with YAML frontmatter)
    - `codex.toml` — Codex agent role definition (TOML format)
  - `CHANGELOG.md` — per-agent change log in Keep a Changelog format
- `agent.json` MAY reference skills via the `skills` array (referential integrity is validated).
- Platform support is determined by file presence — no explicit declaration needed.

### Common Rules

- Names MUST be kebab-case and match the directory name exactly.
- Categories MUST be drawn from the whitelist in `categories.json`.
- Skill and agent names should be globally unique to avoid confusion (validated as a warning).

## Common Commands

- `npm run new -- <skill-name>` — scaffold a new skill (default)
- `npm run new -- --agent <agent-name>` — scaffold a new agent
- `npm run build` — regenerate `catalog.json`, `SKILLS.md`, and `AGENTS.md`
- `npm test` — validate schemas, file structure, CHANGELOG versions, index freshness, and doc quality
- `npm run install-skill -- <skill-name>` — install a skill to `~/.claude/commands/`
- `npm run install-agent -- <agent-name>` — install an agent to `~/.claude/agents/` and `~/.codex/agents/`

## GitHub

- Repo: https://github.com/liqiongyu/my-agents
- Use `gh` CLI for GitHub operations (auth is configured).
- Tagging `v*` triggers the release workflow (`.github/workflows/release.yml`), which aggregates CHANGELOGs into GitHub Release notes.
- CI runs `npm test` on every push and PR (`.github/workflows/validate.yml`).

## Workflow

After creating or modifying any skill or agent, always run:

```bash
npm run build && npm test
```

## Skill Evaluation

- Eval workspaces go in `workspaces/<skill-name>/` (sibling to `skills/`), not inside the skill directory.
- Knowledge-domain skills (prompt-engineering, debugging methodology) have inherently low auto-trigger rates because Claude already has the knowledge; they work best via explicit `/skill-name` invocation.

## Gotchas

- `catalog.json` contains a volatile `generatedAt` timestamp — validation compares only `schemaVersion` + `skills` + `agents`, not the timestamp.
- To add a new category, update `categories.json` FIRST, then use it in `skill.json` or `agent.json`. Validation will reject unknown categories.
- `schemas/*.schema.json` `$id` fields point to GitHub raw URLs — update them if the repo is renamed or transferred.
- `skill-creator` description optimization (`run_loop.py`) requires `ANTHROPIC_API_KEY` env var — it calls the Anthropic SDK directly, not via `claude -p`.
- When a new skill overlaps with an already-installed skill (e.g., `prompt-engineering` vs `prompt-engineering-patterns`), both appear in the skill list; consider uninstalling the old one to avoid confusion.

## Skill Quality

- SKILL.md must be substantive (>= 200 characters), not just placeholder text.
- SKILL.md should include: Trigger conditions, Instructions, Examples, and Caveats.
- When bumping `version` in `skill.json`, update `CHANGELOG.md` with a matching `## [x.y.z]` section.
- Follow SemVer: MAJOR for breaking changes, MINOR for new capabilities, PATCH for fixes.

## Agent Quality

- `claude-code.md` must be substantive (>= 200 characters).
- `claude-code.md` should include: YAML frontmatter (name, description, tools) + Identity, Instructions, Workflow, Constraints sections.
- `agent.json` requires an `archetype` field: `explorer`, `reviewer`, `implementer`, `planner`, `debugger`, or `custom`.
- Same SemVer and CHANGELOG rules as skills.

## Tooling

- Use `uv` for all Python operations — running scripts (`uv run`), managing packages (`uv pip`), and creating virtual environments. Do NOT use bare `python`/`python3`/`pip` directly.
