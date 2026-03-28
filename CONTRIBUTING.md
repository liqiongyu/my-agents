# Contributing Guide

This repository uses `uv` for Python-backed validation and test helpers. If a workflow or `npm test` exercises packaged Python checks, prefer the documented `uv run ...` commands instead of relying on a manually managed virtualenv.

## Adding a New Skill

```bash
npm run new -- my-skill
npm run build
npm test
```

Conventions:

- Directory name must match `skill.json` `name` field (kebab-case)
- Required files: `skill.json`, `SKILL.md`, `CHANGELOG.md`
- Categories must be from the whitelist in `categories.json`
- `SKILL.md` must be substantive (>= 200 characters) and include:
  - **Trigger** — when the skill should activate
  - **Instructions** — core behavioral prompt
  - **Examples** — concrete input/output demonstrations
  - **Caveats** — limitations and edge cases

## Updating a Skill

1. Edit `skills/<name>/SKILL.md` with your changes
2. Bump `version` in `skills/<name>/skill.json` (SemVer)
3. Add a matching `## [x.y.z] - YYYY-MM-DD` section to `skills/<name>/CHANGELOG.md`
4. Run:

```bash
npm run build
npm test
```

Version guidance:

- `MAJOR`: Breaking changes (incompatible input/output/behavior)
- `MINOR`: Backward-compatible new capabilities
- `PATCH`: Backward-compatible bug fixes or doc improvements

## Adding a New Agent

```bash
npm run new -- --agent my-agent
npm run build
npm test
```

Conventions:

- Directory name must match `agent.json` `name` field (kebab-case)
- Required files: `agent.json`, at least one platform file (`claude-code.md` / `codex.toml`), `CHANGELOG.md`
- `agent.json` requires an `archetype` field: `explorer`, `reviewer`, `implementer`, `planner`, `debugger`, or `custom`
- `claude-code.md` must be substantive (>= 200 characters) and include:
  - **YAML frontmatter** — name, description, tools
  - **Identity** — role and expertise
  - **Instructions** — core behavioral prompt
  - **Workflow** — step-by-step process
  - **Constraints** — boundaries and limitations
- The `skills` array in `agent.json` references skills by name; validation checks they exist

## Metadata

Field definitions are in `schemas/skill.schema.json` and `schemas/agent.schema.json` (enforced by CI).

Skill minimum required fields: `name`, `displayName`, `description`, `version`, `maturity`, `categories`, `authors`

Agent minimum required fields: all of the above plus `archetype`

## Adding a New Category

If your skill or agent needs a category not in `categories.json`, add it there first, then use it in `skill.json` or `agent.json`.
