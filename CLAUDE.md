> This file is generated from `instructions/root/shared.md` and `instructions/root/claude.md`.
> Edit those source fragments instead of hand-editing this file.
> Run `npm run sync-instructions` after changing them. The versioned `pre-commit` hook auto-syncs and stages this file, and `npm test` plus CI fail if it drifts.

# Repository Guidelines

## Instruction Source Of Truth

The root `AGENTS.md` and `CLAUDE.md` files are generated outputs. Edit `instructions/root/shared.md` plus the relevant platform fragment (`instructions/root/codex.md` or `instructions/root/claude.md`) instead of hand-editing the generated files. Run `npm run sync-instructions` after changing those source files. The repo's versioned `pre-commit` hook auto-syncs and stages the generated files, and `npm test` plus CI fail if they drift.

## Project Structure & Module Organization

This repository is a monorepo for reusable skills, agents, and installable packs. Edit canonical sources in `skills/<name>/`, `agents/<name>/`, and `packs/<name>/`, not projected runtime copies in `.agents/`, `.claude/`, or `.codex/`.

- Skill packages should contain `skill.json`, `SKILL.md`, and `CHANGELOG.md`; `references/`, `scripts/`, `assets/`, and `projection.json` are optional.
- Agent packages should contain `agent.json`, at least one platform definition file such as `claude-code.md` or `codex.toml`, and `CHANGELOG.md`.
- Pack packages should contain `pack.json`, `README.md`, and `CHANGELOG.md`.
- Shared schemas live in `schemas/`; authoring tools live in `scripts/`; generated catalogs live in `docs/catalog/` and `dist/catalog.json`; longer research notes live in `research/`.
- Local-only external reference repositories should live under `workspaces/references/`. If `.my-agents/reference-repos.json` exists, treat it as the discovery index for those references, but do not commit the manifest or the cloned repositories.

## Build, Test, And Development Commands

Use Node.js 18+ and install `uv` when running Python-backed skill checks.

- `npm install` installs repo dependencies and configures the repo's versioned Git hooks for this clone.
- `npm run lint` lints the repository's JavaScript tooling with ESLint.
- `npm run lint:fix` applies safe ESLint auto-fixes.
- `npm run format` formats supported source files with Prettier.
- `npm run format:check` verifies formatting without modifying files.
- `npm run sync-instructions` regenerates root `AGENTS.md` and `CLAUDE.md`.
- `npm run sync-instructions -- --check` verifies the generated root instruction files are current.
- `npm run new -- my-skill`, `npm run new -- --agent my-agent`, and `npm run new -- --pack my-pack` scaffold canonical packages.
- `npm run build` regenerates `dist/catalog.json`, `docs/catalog/skills.md`, `docs/catalog/agents.md`, and `docs/catalog/packs.md`.
- `npm test` runs repository validation, including packaged Python unit tests that are wired into the shared validation path through `uv`.
- `npx my-agents install <skill|agent|pack> <name>`, `npx my-agents uninstall <skill|agent|pack> <name>`, `npx my-agents project sync`, and `npx my-agents references <command>` are the canonical runtime commands. Repo-local `npm run install-*`, `npm run uninstall-*`, `npm run sync-project`, and `npm run sync-references` aliases remain available for compatibility. Runtime commands support `--platform claude|codex|all`, `--scope user|project`, and `--manifest <path>` where relevant.

## Coding Style & Naming Conventions

Match the existing style in surrounding files. JavaScript in `scripts/` uses CommonJS, 2-space indentation, semicolons, and double quotes. Python helpers use 4-space indentation and should stay deterministic and CLI-friendly. Use kebab-case for package directories and keep `name` fields in `skill.json`, `agent.json`, and `pack.json` aligned with the folder name. Prefer ASCII Markdown. Do not hand-edit generated catalogs, `dist/catalog.json`, or the generated root instruction files.

## Quality & Validation Rules

- Categories must come from `categories.json`; add a new category there before using it in package metadata.
- Skill docs, agent platform docs, and pack READMEs must be substantive and not placeholders.
- When a version changes in `skill.json`, `agent.json`, or `pack.json`, add a matching `## [x.y.z]` entry to the package `CHANGELOG.md`.
- Follow SemVer: MAJOR for breaking changes, MINOR for new capabilities, PATCH for fixes.
- Run `npm run sync-instructions`, `npm run build`, and `npm test` before opening a PR after changing canonical packages, metadata, generated outputs, or contributor instructions.
- The versioned `pre-commit` hook keeps local commits fast: it syncs root instructions, formats staged files, auto-fixes staged JavaScript where possible, and re-stages the results.
- Validation checks schema compliance, directory conventions, changelog/version alignment, category whitelists, pack and project-manifest reference integrity, generated catalog freshness, generated instruction freshness, and packaged Python unit tests that participate in the shared validation path.

## GitHub & Contribution Workflow

Use Conventional Commits such as `feat(skills): add skill lifecycle manager workflow` or `chore(catalog): refresh generated metadata`. Keep PRs focused, explain whether the change affects canonical packages, generated outputs, install flows, or local-only behavior, and link any relevant issue or research note. GitHub Actions runs `npm test` on every push and PR via `.github/workflows/validate.yml`. Tagging `v*` triggers `.github/workflows/release.yml`, which assembles GitHub Release notes from per-skill, per-agent, and per-pack changelogs.

## Common Gotchas

- `dist/catalog.json` contains a volatile `generatedAt` timestamp; freshness checks compare the durable catalog fields, not that timestamp.
- Schema `$id` values under `schemas/` point at GitHub raw URLs; update them if the repo is renamed or transferred.
- Keep root guidance concise and push package-specific operating details into the relevant `SKILL.md`, `claude-code.md`, `codex.toml`, pack `README.md`, or changelog.

## Problem Framing And Execution

Start from the user's real goal rather than mechanically following the surface request.
First determine the right workflow for the task, such as direction exploration, requirements clarification, review, research, planning, or direct execution.
When the proposed path is not the shortest, lowest-cost, or most reversible option, say so and recommend a better alternative with reasons.
Pause only when unresolved uncertainty would materially change the outcome; otherwise, record reasonable assumptions and keep moving.
Prefer the lightest workflow and tool that can solve the problem well, and avoid adding complexity just to follow an established path.

## Observable Completion

After completing work, include an `Execution Summary` using this canonical format by default:

`Execution Summary: agents=<...>; skills=<...>; tools=<...>; verification=<...>; limits=<...>`

- Keep it lightweight and factual. Do not expose hidden reasoning or chain-of-thought.
- `agents`, `skills`, `tools`, and `verification` must always be present. Use `none` when not used.
- `limits` may be omitted if there are no meaningful limits or blockers.
- For trivial tasks, the default one-line format is enough.
- If the summary would be too long, use the same keys on separate lines in the same order.

## Claude Code Notes
- `CLAUDE.md` is intentionally a thin projection of the shared rules plus Claude-specific caveats. If a rule should apply to both Claude Code and Codex, put it in `instructions/root/shared.md`.
- Eval workspaces go in `workspaces/<skill-name>/` (sibling to `skills/`), not inside the skill package.
- Knowledge-domain skills such as `prompt-engineering` or debugging methodology may have low auto-trigger rates in Claude; explicit `/skill-name` invocation can work better.
- `skill-creator` description optimization (`run_loop.py`) requires `ANTHROPIC_API_KEY`; it calls the Anthropic SDK directly, not `claude -p`.
- When overlapping skills are installed, prune older or superseded entries to keep the Claude skill list clear.
- For Python work in this repo, prefer `uv run`, `uv pip`, and other `uv` commands instead of bare `python`, `python3`, or `pip`.
