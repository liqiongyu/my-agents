# Tooling Layout

This note explains how the repository's tooling should stay organized as the command surface grows.

## Public Surface

Keep `package.json` scripts stable as the public operator surface. They should stay memorable and thin:

- `build`
- `validate`
- `sync-project`
- `sync-instructions`
- `sync-references`
- authoring commands such as `new`

If internal structure changes, keep these entrypoints unless there is a strong migration reason.

## Internal Structure

Top-level files under `scripts/` should act as entrypoints and orchestration layers. Reusable logic belongs under `scripts/lib/`.

Use `scripts/lib/` for:

- filesystem and JSON helpers
- manifest parsing and normalization
- catalog collection and rendering
- validation-only helpers
- git helpers shared by multiple commands

Avoid adding new one-off helpers to entrypoint files if the logic is likely to be reused elsewhere.

## Documentation Structure

Use the root READMEs for:

- repository identity
- layout overview
- the most common workflows
- links to the deeper docs

Use `docs/cli/` for:

- detailed command reference
- flag behavior
- operational caveats

Use `docs/architecture/` for:

- maintainers' mental models
- tool boundaries
- where new command logic should live

Use `docs/metadata/` for policy and authoring rules tied to schemas or package conventions.

## Local-Only vs. Tracked

Keep local-only operational state under ignored paths such as `.my-agents/` and `workspaces/`. Keep only the generic discovery rules and reusable tooling in tracked files.

This split lets the repository teach agents and humans where to look without committing personal local state.
