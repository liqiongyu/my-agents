# Repository Guidelines

## Project Structure & Module Organization
This repository is a monorepo for reusable agent and skill packages. Edit canonical sources in `skills/<name>/` and `agents/<name>/`, not projected runtime copies in `.agents/` or `.claude/`. Each skill package should contain `skill.json`, `SKILL.md`, and `CHANGELOG.md`; each agent package should contain `agent.json`, at least one platform file such as `claude-code.md` or `codex.toml`, and `CHANGELOG.md`. Shared schemas live in `schemas/`, authoring tools live in `scripts/`, and longer research notes live in `research/`.

## Build, Test, and Development Commands
Use Node.js 18+.

- `npm install` installs repo dependencies.
- `npm run new -- my-skill` scaffolds a new skill package.
- `npm run new -- --agent my-agent` scaffolds a new agent package.
- `npm run build` regenerates `dist/catalog.json`, `docs/catalog/skills.md`, and `docs/catalog/agents.md`.
- `npm test` runs the full validation suite through `scripts/validate.js`.
- `npm run install-skill -- clarify --platform codex --scope project` installs a skill into a local runtime surface for testing.

## Coding Style & Naming Conventions
Match the existing style in surrounding files. JavaScript in `scripts/` uses CommonJS, 2-space indentation, semicolons, and double quotes. Python helpers use 4-space indentation and should stay deterministic and CLI-friendly. Use kebab-case for package directories and keep `name` fields in `skill.json` and `agent.json` aligned with the folder name. Prefer ASCII Markdown and do not hand-edit generated catalogs under `docs/catalog/` or `dist/catalog.json`.

## Testing Guidelines
Run `npm run build` and `npm test` before opening a PR, especially after changing package metadata, schemas, or generated catalogs. Validation checks schema compliance, changelog/version alignment, category whitelists, catalog freshness, and minimum documentation length. If you modify Python helpers under `skills/skill-lifecycle-manager/scripts/`, also run `python3 -m unittest discover -s skills/skill-lifecycle-manager/tests`.

## Commit & Pull Request Guidelines
Recent history favors Conventional Commits such as `feat(skills): add skill lifecycle manager workflow` and `chore(catalog): refresh generated metadata`; keep using that format. Keep PRs focused, explain whether the change affects canonical packages, generated catalogs, or install flows, and link any relevant issue or research note. When changing a skill or agent, bump its version and add a matching changelog entry.

## Contributor Notes
Add new categories to `categories.json` before referencing them in package metadata. Keep root guidance concise and put package-specific operating details inside the relevant `SKILL.md`, `claude-code.md`, or changelog.
