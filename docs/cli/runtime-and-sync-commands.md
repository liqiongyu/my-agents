# Runtime And Sync Commands

This reference covers the commands that install runtime artifacts, synchronize project state, regenerate contributor instructions, and manage local-only reference repositories.

For GitHub-backed issue runs, the runtime also projects a GitHub-visible commit
status with context `issue-driven-os/verification` onto the pull request head
commit. That status is derived from runtime truth and complements, rather than
replaces, the persisted run and critic artifacts.

## Inspect GitHub Runtime State

Use `issue-driven-os github inspect` when you need operator diagnostics for one GitHub-backed runtime root without opening `state.json`, `leases/*.json`, `runs/*.json`, or `artifacts/<runId>/` by hand:

```bash
npx my-agents issue-driven-os github inspect owner/repo
npx my-agents issue-driven-os github inspect owner/repo --runtime-root ~/.my-agents/issue-driven-os/owner__repo
npx my-agents issue-driven-os github inspect owner/repo --runtime-root ~/.my-agents/issue-driven-os/owner__repo --json
npx my-agents issue-driven-os github inspect owner/repo --runtime-root ~/.my-agents/issue-driven-os/owner__repo --run run_issue_123_20260329T151315Z
```

The command:

- scopes inspection to one `<owner>/<repo>`
- shows active leases, issue summary state, and recent runs in deterministic order
- supports `--run <id>` to show one persisted run record plus concrete artifact file locations
- supports `--json` for machine-readable diagnostics
- honors `--runtime-root` the same way the existing GitHub runtime commands do

## Add External Official Assets

Use `add` when you want to append one trusted GitHub-hosted external asset to a project manifest without hand-writing the structured locator fields:

```bash
npx my-agents add https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering
npx my-agents add https://github.com/affaan-m/everything-claude-code/blob/main/agents/code-reviewer.md
npx my-agents add https://github.com/VoltAgent/awesome-codex-subagents/blob/main/categories/01-core-development/api-designer.toml
npx my-agents add https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering --manifest path/to/my-agents.project.json
```

The command:

- accepts one GitHub URL that already points to one external asset
- resolves the declared ref to an immutable commit SHA
- writes a structured object entry into `skills` or `agents`

V1 accepted URL shapes:

- Claude skill directory: GitHub `tree/...`
- Claude agent Markdown file: GitHub `blob/.../*.md`
- Codex agent TOML file: GitHub `blob/.../*.toml`

V1 rejected URL shapes:

- repo root URLs
- category or collection directories that contain multiple assets
- GitHub URLs that do not point to one addable asset

## Install Into Runtime Surfaces

Use these commands when you want tracked skills, agents, or packs projected into the local runtime surfaces:

```bash
npx my-agents install skill clarify
npx my-agents install skill clarify --platform codex
npx my-agents install skill clarify --scope user
npx my-agents install agent explorer
npx my-agents install agent explorer --platform codex
npx my-agents install pack product-manager
npx my-agents install pack product-manager --platform codex
```

The install tool also supports:

- `--all`
- `--platform claude|codex|all`
- `--scope user|project`
- matching `npx my-agents uninstall skill|agent|pack`

By default, installs go to project scope across all supported platforms.

Repo-local compatibility aliases remain available:

- `npm run install-skill -- <name>`
- `npm run install-agent -- <name>`
- `npm run install-pack -- <name>`
- `npm run uninstall-skill -- <name>`
- `npm run uninstall-agent -- <name>`
- `npm run uninstall-pack -- <name>`

## Sync A Project Manifest

Use `project sync` when the repository has a `my-agents.project.json` file that defines the desired project-scope baseline:

```bash
cp docs/examples/my-agents.project.example.json my-agents.project.json
npx my-agents project sync
npx my-agents project sync --platform codex
npx my-agents project sync --prune
```

`project sync` installs the declared packs, extra skills, and extra agents into project scope. CLI `--platform` overrides the manifest's default `platforms`.

Project manifests can mix local strings and external object entries. External entries install only to their declared platform and `project sync` fails clearly if the selected effective platforms do not include that platform.

The command records managed state in `.my-agents/project-sync-state.json` so `--prune` only removes members it previously managed.

Repo-local compatibility alias:

- `npm run sync-project -- [options]`

## Sync Root Instruction Files

Use these commands after editing `instructions/root/`:

```bash
npm run sync-instructions
npm run sync-instructions -- --check
```

`sync-instructions` regenerates `AGENTS.md` and `CLAUDE.md`. The versioned pre-commit hook also runs the write mode automatically and stages the generated files when needed.

## Manage Local Reference Repositories

Use `references` for local-only external reference repos that should stay out of version control:

```bash
npx my-agents references list
npx my-agents references add https://github.com/example/agent-reference-repo
npx my-agents references sync
npx my-agents references remove example__agent-reference-repo
```

The command reads `.my-agents/reference-repos.json` and clones repos into `workspaces/references/`. The manifest and cloned repos stay ignored, but the tracked repository instructions can still point agents at the manifest path as a discovery entrypoint.

Repo-local compatibility alias:

- `npm run sync-references -- <command> [options]`
