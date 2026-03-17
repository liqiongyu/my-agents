# My Skills

A monorepo for creating, managing, and publishing reusable **Agent skills** (Claude Code skills).

一个用来创建、管理和发布可复用 **Agent Skills**（Claude Code Skills）的 Monorepo。

## Quick Start

```bash
# Install dependencies
npm install

# Create a new skill
npm run new -- <skill-name>

# Rebuild indexes
npm run build

# Validate everything
npm test
```

## Using a Skill

### Option 1: Install locally

```bash
# From this repo
npm run install-skill -- <skill-name>

# This copies SKILL.md → ~/.claude/commands/<skill-name>.md
```

### Option 2: Reference via GitHub raw URL

```
https://raw.githubusercontent.com/liqiongyu/my-skills/main/skills/<skill-name>/SKILL.md
```

### Option 3: Clone and browse

```bash
git clone https://github.com/liqiongyu/my-skills.git
# Browse skills/ directory, copy what you need
```

## Directory Structure

```text
skills/<skill-name>/
  skill.json       # Machine-readable metadata (validated by schema)
  SKILL.md         # The skill prompt (trigger, instructions, examples, caveats)
  CHANGELOG.md     # Per-skill changelog (Keep a Changelog format)

schemas/           # JSON Schemas for skill.json and catalog.json
scripts/           # Build, validate, scaffold, and install tooling
categories.json    # Allowed category whitelist
catalog.json       # Auto-generated skill index (machine-readable)
SKILLS.md          # Auto-generated skill index (human-readable)
```

## Creating a Skill

```bash
npm run new -- my-skill
```

This scaffolds `skills/my-skill/` with:
- `skill.json` — fill in metadata (name, description, version, categories, authors)
- `SKILL.md` — write the skill content (trigger conditions, instructions, examples, caveats)
- `CHANGELOG.md` — document version history

Then:

```bash
npm run build   # regenerate catalog.json and SKILLS.md
npm test        # validate everything
```

## Updating a Skill

1. Edit the skill content in `skills/<name>/SKILL.md`
2. Bump `version` in `skills/<name>/skill.json` (SemVer)
3. Add a `## [x.y.z] - YYYY-MM-DD` section to `skills/<name>/CHANGELOG.md`
4. Run `npm run build && npm test`

## Versioning

- **MAJOR**: Breaking changes (incompatible input/output/behavior)
- **MINOR**: Backward-compatible new capabilities
- **PATCH**: Backward-compatible bug fixes or doc improvements

## Categories

All categories must be listed in `categories.json`. To add a new category, update that file first.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) — Qiongyu Li
