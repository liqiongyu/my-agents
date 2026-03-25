# My Agents

A monorepo for creating, managing, and publishing reusable **Agent skills** and **sub-agent definitions** for Claude Code, Codex, and other AI coding agents.

一个用来创建、管理和发布可复用 **Agent Skills** 和 **Sub-Agent 定义**的 Monorepo，支持 Claude Code、Codex 等 AI 编程工具。

## Quick Start

```bash
# Install dependencies
npm install

# Create a new skill (default)
npm run new -- <skill-name>

# Create a new agent
npm run new -- --agent <agent-name>

# Rebuild indexes
npm run build

# Validate everything
npm test
```

## Using a Skill

```bash
# Install to ~/.claude/commands/
npm run install-skill -- <skill-name>
```

## Using an Agent

```bash
# Install to ~/.claude/agents/ and ~/.codex/agents/
npm run install-agent -- <agent-name>
```

## Directory Structure

```text
skills/<skill-name>/
  skill.json       # Machine-readable metadata (validated by schema)
  SKILL.md         # The skill prompt (trigger, instructions, examples, caveats)
  CHANGELOG.md     # Per-skill changelog (Keep a Changelog format)

agents/<agent-name>/
  agent.json       # Machine-readable metadata (validated by schema)
  claude-code.md   # Claude Code agent definition (Markdown + YAML frontmatter)
  codex.toml       # Codex agent role definition (TOML)
  CHANGELOG.md     # Per-agent changelog (Keep a Changelog format)

schemas/           # JSON Schemas for skill.json, agent.json, and catalog.json
scripts/           # Build, validate, scaffold, and install tooling
categories.json    # Allowed category whitelist
catalog.json       # Auto-generated index (machine-readable)
SKILLS.md          # Auto-generated skill index (human-readable)
AGENTS.md          # Auto-generated agent index (human-readable)
```

## Creating a Skill

```bash
npm run new -- my-skill
```

This scaffolds `skills/my-skill/` with `skill.json`, `SKILL.md`, and `CHANGELOG.md`.

## Creating an Agent

```bash
npm run new -- --agent my-agent
```

This scaffolds `agents/my-agent/` with `agent.json`, `claude-code.md`, `codex.toml`, and `CHANGELOG.md`.

Then:

```bash
npm run build   # regenerate catalog.json, SKILLS.md, and AGENTS.md
npm test        # validate everything
```

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
