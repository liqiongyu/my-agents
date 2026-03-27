# Product Manager Pack

This pack bundles the repository's existing product strategy, planning, and research capabilities into one installable unit. It is intended for projects that want a ready-to-use product discovery and planning toolkit without choosing every skill and agent by hand.

## Included Skills

- `clarify`
- `brainstorming`
- `business-plan`
- `deep-research`

## Included Agents

- `explorer`
- `planner`
- `researcher`

The pack keeps membership explicit, including the `explorer` dependency used by `planner`, so catalog output and installation behavior stay aligned.

## Install

```bash
npm run install-pack -- product-manager
npm run install-pack -- product-manager --platform codex --scope project
```

Use project scope when you want the pack projected into the current repository's `.claude/`, `.agents/`, and `.codex/` runtime surfaces rather than your global user home.
