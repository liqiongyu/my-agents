# CLAUDE.md

## Project Overview

This is a monorepo for creating, managing, and publishing reusable Agent skills (Claude Code skills).

## Directory Conventions

- Each skill lives in `skills/<name>/` and MUST contain:
  - `skill.json` — machine-readable metadata (validated against `schemas/skill.schema.json`)
  - `SKILL.md` — the core skill prompt (trigger conditions, instructions, examples, caveats)
  - `CHANGELOG.md` — per-skill change log in Keep a Changelog format
- Skill names MUST be kebab-case and match the directory name exactly.
- Categories MUST be drawn from the whitelist in `categories.json`.

## Common Commands

- `npm run new -- <skill-name>` — scaffold a new skill
- `npm run build` — regenerate `catalog.json` and `SKILLS.md`
- `npm test` — validate schemas, file structure, CHANGELOG versions, index freshness, and SKILL.md quality
- `npm run install-skill -- <skill-name>` — install a skill to `~/.claude/commands/`

## Workflow

After creating or modifying any skill, always run:

```bash
npm run build && npm test
```

## Skill Quality

- SKILL.md must be substantive (>= 200 characters), not just placeholder text.
- SKILL.md should include: Trigger conditions, Instructions, Examples, and Caveats.
- When bumping `version` in `skill.json`, update `CHANGELOG.md` with a matching `## [x.y.z]` section.
- Follow SemVer: MAJOR for breaking changes, MINOR for new capabilities, PATCH for fixes.
