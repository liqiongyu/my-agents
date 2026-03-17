# Contributing Guide

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

## Metadata (skill.json)

Field definitions are in `schemas/skill.schema.json` (enforced by CI).

Minimum required fields:

- `name` / `displayName` / `description`
- `version` / `maturity` / `categories`
- `authors`

## Adding a New Category

If your skill needs a category not in `categories.json`, add it there first, then use it in `skill.json`.
