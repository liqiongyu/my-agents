# My Agents

Language: English | [Chinese](README.zh-CN.md)

[![Validate](https://github.com/liqiongyu/my-agents/actions/workflows/validate.yml/badge.svg)](https://github.com/liqiongyu/my-agents/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A monorepo for authoring, validating, and publishing reusable agent skills and sub-agent packages for Claude Code, Codex, and similar AI coding agents.

This repository keeps the canonical source of truth under `skills/` and `agents/`, generates discovery catalogs from that source, and provides scaffold/install tooling so the same content can be projected into different runtime surfaces.

> [!NOTE]
> Edit packages in `skills/` and `agents/`. Treat generated catalogs and project-scope runtime copies as derived artifacts.
> Root `AGENTS.md` remains the contributor-facing guide for this repository, so generated catalogs live outside the root.

## Quick Start

Prerequisite: Node.js 18 or newer.

```bash
npm install
npm run new -- my-skill
npm run new -- --agent my-agent
npm run build
npm test
```

## Browse the Catalog

- [docs/catalog/skills.md](docs/catalog/skills.md) is the generated human-readable index of tracked skills.
- [docs/catalog/agents.md](docs/catalog/agents.md) is the generated human-readable index of tracked agents.
- `dist/catalog.json` is the generated machine-readable index consumed by tooling.

## Repository Layout

| Path | Purpose |
| --- | --- |
| `skills/<name>/` | Canonical source packages for reusable skills (`skill.json`, `SKILL.md`, `CHANGELOG.md`) |
| `agents/<name>/` | Canonical source packages for reusable agents (`agent.json`, `claude-code.md`, `codex.toml`, `CHANGELOG.md`) |
| `scripts/` | Scaffolding, install, catalog build, and validation tooling |
| `schemas/` | JSON Schemas for skill, agent, and catalog metadata |
| `research/` | Research notes, source digests, and longer-form background documents |
| `workspaces/<skill-name>/` | Evaluation sandboxes and scratch space for skill development |
| `.claude/` and `.agents/` | Project-scope runtime projections created during local installation flows |

## Common Workflows

### Create a skill

```bash
npm run new -- my-skill
npm run build
npm test
```

This scaffolds `skills/my-skill/` with `skill.json`, `SKILL.md`, and `CHANGELOG.md`.

### Create an agent

```bash
npm run new -- --agent my-agent
npm run build
npm test
```

This scaffolds `agents/my-agent/` with `agent.json`, `claude-code.md`, `codex.toml`, and `CHANGELOG.md`.

### Install into runtime surfaces

```bash
npm run install-skill -- clarify
npm run install-skill -- clarify --platform codex --scope project
npm run install-agent -- explorer
npm run install-agent -- explorer --platform codex --scope project
```

The install tool also supports `--all`, `--platform claude|codex|all`, `--scope user|project`, and matching `npm run uninstall-skill` / `npm run uninstall-agent` commands.

Skills can include `projection.json` to exclude author-only files from runtime projections while keeping the canonical package intact in the repository.

## Installation Targets

| Package type | Claude Code target | Codex target |
| --- | --- | --- |
| Skill | `~/.claude/skills/<name>/` or `.claude/skills/<name>/` | `~/.agents/skills/<name>/` or `.agents/skills/<name>/` |
| Agent | `~/.claude/agents/<name>.md` or `.claude/agents/<name>.md` | `~/.codex/agents/<name>.toml` or `.codex/agents/<name>.toml` |

## Generated Files

- `npm run build` regenerates `dist/catalog.json`, `docs/catalog/skills.md`, and `docs/catalog/agents.md`.
- Do not hand-edit those generated indexes; update the underlying packages instead.

## Validation and Release

- `npm test` runs `npm run validate`.
- Validation checks schemas, directory conventions, changelog/version alignment, generated index freshness, and minimum documentation quality.
- GitHub Actions runs validation on every push and pull request via `.github/workflows/validate.yml`.
- Tagging `v*` triggers `.github/workflows/release.yml`, which assembles GitHub Release notes from per-skill and per-agent changelogs.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for authoring rules and release hygiene.

If you need a new category, add it to [categories.json](categories.json) before using it in `skill.json` or `agent.json`.

## License

[MIT](LICENSE) - Qiongyu Li
