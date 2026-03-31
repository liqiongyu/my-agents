# Project Structure & Module Organization

This repository is a monorepo for reusable skills, agents, and installable packs. Edit canonical sources in `skills/<name>/`, `agents/<name>/`, and `packs/<name>/`, not projected runtime copies in `.agents/`, `.claude/`, or `.codex/`.

- Skill packages should contain `skill.json`, `SKILL.md`, and `CHANGELOG.md`; `eval/`, `references/`, `scripts/`, `projection.json`, and `tests/` are optional.
- Agent packages should contain `agent.json`, at least one platform definition file such as `claude-code.md` or `codex.toml`, and `CHANGELOG.md`.
- Pack packages should contain `pack.json`, `README.md`, and `CHANGELOG.md`.
- Shared schemas live in `schemas/`; authoring tools live in `scripts/`; generated catalogs live in `docs/catalog/` and `dist/catalog.json`; longer research notes live in `research/`.
- Treat installable skills and agents as self-contained packages. A skill or agent may reference another package conceptually, but it must not depend on another skill or agent package's private script paths. If no formal shared-runtime distribution mechanism exists, prefer local duplication over cross-package runtime dependencies.
- Local-only external reference repositories should live under `workspaces/references/`. If `.my-agents/reference-repos.json` exists, treat it as the discovery index for those references, but do not commit the manifest or the cloned repositories.
