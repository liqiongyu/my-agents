# Platform Surfaces

Use this reference when the user wants one skill to work across more than one agent surface. The important distinction is not "does the platform support `SKILL.md`?" but "what does each platform expect around trigger control, permissions, discovery, and packaging?"

## Shared Core

Across Codex and Claude Code, the most portable part of a skill is:

- `SKILL.md`
- frontmatter `name`
- frontmatter `description`
- reusable `references/`, `scripts/`, and `assets/`

That shared core is what the projection model tries to preserve.

## Where Platforms Differ

| Dimension | Codex | Claude Code | Projection implication |
| --- | --- | --- | --- |
| Discovery path | `.agents/skills/<name>/` | `.claude/skills/<name>/` | Directory layout differs even when core content is shared |
| Explicit invocation | mention skill or use `/skills` tooling | `/skill-name` and automatic relevance loading | Keep `name` stable across targets |
| Trigger control | primarily `description` scope/boundaries | `description` plus optional frontmatter like `disable-model-invocation`, `user-invocable`, `allowed-tools`, `paths`, `model` | Keep the core conservative; add platform-only controls only when needed |
| Optional metadata | `agents/openai.yaml` for appearance/dependencies | Claude-specific frontmatter fields and argument substitutions | Platform-only metadata belongs in projection logic or platform-specific variants |
| Distribution story | skills are authoring format; plugins are installable unit | project skills, plugins, or managed settings | Separate authoring from install/publish |
| Permission behavior | platform-level approvals plus tool policies | permission rules plus skill-level allowances | Validate side-effectful skills on each target separately |

## Practical Rule

Keep the canonical core as platform-neutral as possible. Only put platform-specific behavior into the core when:

- the behavior is harmless on other platforms, or
- the skill is intentionally single-platform

Otherwise, keep the core portable and handle the difference in projection or install/publish steps.
