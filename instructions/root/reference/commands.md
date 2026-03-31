# Build, Test, And Development Commands

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
- `npm test` (alias for `npm run validate`) runs the full validation pipeline: lint, format check, instruction sync check, schema/convention validation, Node.js unit tests (`test:node`), and Python unit tests for `skill-lifecycle-manager` and `agent-lifecycle-manager` via `uv`.
- `npx my-agents install <skill|agent|pack> <name>` (`add` is an alias for `install`), `npx my-agents uninstall <skill|agent|pack> <name>`, `npx my-agents project sync`, and `npx my-agents references <command>` are the canonical runtime commands. Repo-local `npm run install-*`, `npm run uninstall-*`, `npm run sync-project`, and `npm run sync-references` aliases remain available for compatibility. Runtime commands support `--platform claude|codex|all`, `--scope user|project`, and `--manifest <path>` where relevant.
