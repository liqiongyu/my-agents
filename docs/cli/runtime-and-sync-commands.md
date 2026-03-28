# Runtime And Sync Commands

This reference covers the commands that install runtime artifacts, synchronize project state, regenerate contributor instructions, and manage local-only reference repositories.

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
npm run install-skill -- clarify
npm run install-skill -- clarify --platform codex
npm run install-skill -- clarify --scope user
npm run install-agent -- explorer
npm run install-agent -- explorer --platform codex
npm run install-pack -- product-manager
npm run install-pack -- product-manager --platform codex
```

The install tool also supports:

- `--all`
- `--platform claude|codex|all`
- `--scope user|project`
- matching `npm run uninstall-skill`, `npm run uninstall-agent`, and `npm run uninstall-pack`

By default, installs go to project scope across all supported platforms.

## Sync A Project Manifest

Use `sync-project` when the repository has a `my-agents.project.json` file that defines the desired project-scope baseline:

```bash
cp docs/examples/my-agents.project.example.json my-agents.project.json
npm run sync-project
npm run sync-project -- --platform codex
npm run sync-project -- --prune
```

`sync-project` installs the declared packs, extra skills, and extra agents into project scope. CLI `--platform` overrides the manifest's default `platforms`.

Project manifests can mix local strings and external object entries. External entries install only to their declared platform and `sync-project` fails clearly if the selected effective platforms do not include that platform.

The command records managed state in `.my-agents/project-sync-state.json` so `--prune` only removes members it previously managed.

## Sync Root Instruction Files

Use these commands after editing `instructions/root/`:

```bash
npm run sync-instructions
npm run sync-instructions -- --check
```

`sync-instructions` regenerates `AGENTS.md` and `CLAUDE.md`. The versioned pre-commit hook also runs the write mode automatically and stages the generated files when needed.

## Manage Local Reference Repositories

Use `sync-references` for local-only external reference repos that should stay out of version control:

```bash
npm run sync-references -- list
npm run sync-references -- add https://github.com/example/agent-reference-repo
npm run sync-references -- sync
npm run sync-references -- remove example__agent-reference-repo
```

The command reads `.my-agents/reference-repos.json` and clones repos into `workspaces/references/`. The manifest and cloned repos stay ignored, but the tracked repository instructions can still point agents at the manifest path as a discovery entrypoint.
