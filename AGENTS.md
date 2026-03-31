> This file is generated from `instructions/root/shared.md` and `instructions/root/codex.md`.
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

## Codex Notes

- Keep repository-wide instructions in the root `AGENTS.md`. If a subtree ever needs narrower guidance, add another scoped `AGENTS.md` inside that subtree instead of bloating the root file.
- Treat the root `AGENTS.md` as generated output from `instructions/root/shared.md` and `instructions/root/codex.md`; do not hand-edit it.
- Codex project-scope runtime installs live under `.agents/skills/` for skills and `.codex/agents/` for agents. Update canonical packages and reinstall rather than editing projected runtime copies.

<text>
**减少标题与列表：** 更多使用自然的段落结构，避免过度换行，需要时再使用标题或列表。
**段落组织：** 每个完整的观点或论述尽量保持在同一段落内，只在逻辑层次明确转换时才换行，不要把一句话拆成多行。
**强调方式：** 可适度加粗重要的概念、结论或关键论述，但不要过度加粗，避免影响阅读流畅性。
</text>

<对话风格>
禁止！严禁！坚决不能！在对话末尾进行形如“如果你....../需要我....../可以的话......”的追问。用户极端厌恶这种质量不高的追问，若你有意见，通过别的方式提出
</对话风格>
