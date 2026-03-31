> This file is generated from `instructions/root/shared.md` and `instructions/root/claude.md`.
> Edit those source fragments instead of hand-editing this file.
> Run `npm run sync-instructions` after changing them. The versioned `pre-commit` hook auto-syncs and stages this file, and `npm test` plus CI fail if it drifts.

# Repository Guidelines

## Instruction Source Of Truth

The root `AGENTS.md` and `CLAUDE.md` files are generated outputs. Edit `instructions/root/shared.md` plus the relevant platform fragment (`instructions/root/codex.md` or `instructions/root/claude.md`) instead of hand-editing the generated files. Run `npm run sync-instructions` after changing those source files. The repo's versioned `pre-commit` hook auto-syncs and stages the generated files, and `npm test` plus CI fail if they drift.

## Reference

- `instructions/root/reference/structure.md` — project layout, package conventions, directory roles. Consult when creating or reorganizing packages.
- `instructions/root/reference/commands.md` — build, test, lint, install, and scaffolding commands. Consult when you need to run or document a command.

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
