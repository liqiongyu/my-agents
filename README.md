# My Agents

Language: English | [Chinese](README.zh-CN.md)

[![Validate](https://github.com/liqiongyu/my-agents/actions/workflows/validate.yml/badge.svg)](https://github.com/liqiongyu/my-agents/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A monorepo for authoring, validating, and publishing reusable skills, agents, and installable packs for Claude Code, Codex, and similar AI coding agents.

This repository keeps the canonical source of truth under `skills/`, `agents/`, and `packs/`, generates discovery catalogs from that source, and provides scaffold/install tooling so the same content can be projected into different runtime surfaces.

> [!NOTE]
> Edit packages in `skills/`, `agents/`, and `packs/`. Treat generated catalogs and project-scope runtime copies as derived artifacts.
> Root `AGENTS.md` and `CLAUDE.md` are generated contributor instruction files. Edit `instructions/root/` and regenerate them instead of hand-editing the root files.

## Quick Start

Prerequisite: Node.js 18 or newer.

```bash
npm install
npm run new -- my-skill
npm run new -- --agent my-agent
npm run new -- --pack my-pack
npm run lint
npm run build
npm test
```

## Browse the Catalog

- [docs/catalog/skills.md](docs/catalog/skills.md) is the generated human-readable index of tracked skills.
- [docs/catalog/agents.md](docs/catalog/agents.md) is the generated human-readable index of tracked agents.
- [docs/catalog/packs.md](docs/catalog/packs.md) is the generated human-readable index of tracked packs.
- `dist/catalog.json` is the generated machine-readable index consumed by tooling.

If you want a quick sense of the current library shape, start with `skill-lifecycle-manager`, `skill-researcher`, and `agent-lifecycle-manager` in the generated skills catalog. They reflect the repo's current direction around lifecycle routing, research handoffs, and cross-surface packaging.

## Metadata Conventions

- [schemas/skill.schema.json](schemas/skill.schema.json), [schemas/agent.schema.json](schemas/agent.schema.json), [schemas/pack.schema.json](schemas/pack.schema.json), [schemas/project-manifest.schema.json](schemas/project-manifest.schema.json), and [schemas/catalog.schema.json](schemas/catalog.schema.json) define the machine-readable metadata contracts.
- [docs/metadata/skill-metadata-policy.md](docs/metadata/skill-metadata-policy.md) explains how to use `requirements`, `capabilities`, and `maturity` consistently across skill packages.
- [docs/metadata/pack-metadata-policy.md](docs/metadata/pack-metadata-policy.md) explains how to model pack membership, `packType`, and `persona` consistently.
- [docs/metadata/project-manifest-policy.md](docs/metadata/project-manifest-policy.md) explains how to use `my-agents.project.json` for repository bootstrap.
- [instructions/root/shared.md](instructions/root/shared.md) is the source of truth for rules shared by Codex and Claude Code.
- [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md), and [CONTRIBUTING.md](CONTRIBUTING.md) cover contributor workflow, release hygiene, and local conventions.

## Repository Layout

| Path                       | Purpose                                                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `docs/catalog/`            | Generated Markdown catalogs for tracked skills, agents, and packs                                                      |
| `docs/metadata/`           | Repository-level metadata policy and authoring conventions                                                             |
| `skills/<name>/`           | Canonical source packages for reusable skills (`skill.json`, `SKILL.md`, `CHANGELOG.md`)                               |
| `agents/<name>/`           | Canonical source packages for reusable agents (`agent.json`, `claude-code.md`, `codex.toml`, `CHANGELOG.md`)           |
| `packs/<name>/`            | Canonical source packages for installable compositions of skills and agents (`pack.json`, `README.md`, `CHANGELOG.md`) |
| `my-agents.project.json`   | Optional project bootstrap manifest consumed by `npm run sync-project`                                                 |
| `instructions/root/`       | Canonical source fragments used to generate root `AGENTS.md` and `CLAUDE.md`                                           |
| `scripts/`                 | Scaffolding, install, catalog build, and validation tooling                                                            |
| `schemas/`                 | JSON Schemas for skill, agent, and catalog metadata                                                                    |
| `research/`                | Research notes, source digests, and longer-form background documents                                                   |
| `workspaces/<skill-name>/` | Evaluation sandboxes and scratch space for skill development                                                           |
| `.claude/` and `.agents/`  | Project-scope runtime projections created during local installation flows                                              |

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

### Create a pack

```bash
npm run new -- --pack product-manager
npm run build
npm test
```

This scaffolds `packs/product-manager/` with `pack.json`, `README.md`, and `CHANGELOG.md`.

### Install into runtime surfaces

```bash
npm run install-skill -- clarify
npm run install-skill -- clarify --platform codex --scope project
npm run install-agent -- explorer
npm run install-agent -- explorer --platform codex --scope project
npm run install-pack -- product-manager
npm run install-pack -- product-manager --platform codex --scope project
npm run sync-project -- --manifest docs/examples/my-agents.project.example.json
npm run sync-project -- --prune
```

The install tool also supports `--all`, `--platform claude|codex|all`, `--scope user|project`, `--manifest <path>`, and matching `npm run uninstall-skill` / `npm run uninstall-agent` / `npm run uninstall-pack` commands.

Skills can include `projection.json` to exclude author-only files from runtime projections while keeping the canonical package intact in the repository.

### Sync a project manifest

Create a root-level `my-agents.project.json` in the target repository, or start from [docs/examples/my-agents.project.example.json](docs/examples/my-agents.project.example.json):

```bash
cp docs/examples/my-agents.project.example.json my-agents.project.json
npm run sync-project
npm run sync-project -- --platform codex
npm run sync-project -- --prune
```

`sync-project` always installs into project scope. CLI `--platform` overrides the manifest's default `platforms`; if neither is set, both supported platforms are synced.

The sync command records its managed project-scope state in `.my-agents/project-sync-state.json`. Plain sync installs missing desired items; `--prune` also removes previously managed skills and agents that are no longer desired by the manifest.

### Sync root instruction files

```bash
npm run sync-instructions
npm run sync-instructions -- --check
```

`instructions/root/shared.md` holds the shared rules; `instructions/root/claude.md` and `instructions/root/codex.md` hold platform-specific additions. `npm install` configures the repo's versioned `.githooks/pre-commit`, which auto-runs instruction sync and stages `AGENTS.md` plus `CLAUDE.md` on commit. `npm test` also fails if the generated instruction files are stale.

### Lint and format the repo

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

ESLint covers the repo's JavaScript tooling and Prettier covers supported repository source files such as Markdown, JSON, YAML, and TOML. The versioned `pre-commit` hook runs a fast staged-file pass: it syncs root instructions, formats staged files, auto-fixes staged JavaScript when possible, and re-stages the results.

## Installation Targets

| Package type | Claude Code target                                               | Codex target                                                     |
| ------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| Skill        | `~/.claude/skills/<name>/` or `.claude/skills/<name>/`           | `~/.agents/skills/<name>/` or `.agents/skills/<name>/`           |
| Agent        | `~/.claude/agents/<name>.md` or `.claude/agents/<name>.md`       | `~/.codex/agents/<name>.toml` or `.codex/agents/<name>.toml`     |
| Pack         | Installs its referenced skills and agents into the targets above | Installs its referenced skills and agents into the targets above |

## Generated Files

- `npm run build` regenerates `dist/catalog.json`, `docs/catalog/skills.md`, `docs/catalog/agents.md`, and `docs/catalog/packs.md`.
- `npm run sync-instructions` regenerates the root `AGENTS.md` and `CLAUDE.md` files from `instructions/root/`.
- Do not hand-edit those generated indexes; update the underlying packages instead.
- Policy docs under `docs/metadata/` and instruction fragments under `instructions/root/` are source documents and should be edited directly when repository conventions change.

## Validation and Release

- `npm test` runs `npm run validate`.
- Validation checks ESLint, Prettier, schemas, directory conventions, changelog/version alignment, pack reference integrity, optional project manifest integrity, generated index freshness, generated root instruction freshness, and minimum documentation quality.
- When metadata semantics change, update the canonical package, any relevant policy docs, then rerun `npm run build` and `npm test` before committing.
- GitHub Actions runs validation on every push and pull request via `.github/workflows/validate.yml`.
- Dependabot keeps npm and GitHub Actions dependencies fresh via `.github/dependabot.yml`.
- Tagging `v*` triggers `.github/workflows/release.yml`, which assembles GitHub Release notes from per-skill, per-agent, and per-pack changelogs.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for authoring rules and release hygiene.

If you need a new category, add it to [categories.json](categories.json) before using it in `skill.json`, `agent.json`, or `pack.json`.

## License

[MIT](LICENSE) - Qiongyu Li
