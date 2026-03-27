# Projection Model

Use this reference when the user wants a skill that can live on more than one platform surface without maintaining separate hand-edited copies.

## Canonical First

Treat `skills/<name>/` as the canonical package. That package is allowed to contain repo-oriented metadata such as:

- `skill.json`
- `CHANGELOG.md`
- `agents/openai.yaml`
- helper files for authoring, validation, or auditing

Do not hand-edit projected copies after generation. Regenerate them from the canonical source.

If a skill needs author-only files that should not ship to runtime surfaces, declare them in `projection.json`.
For example, this skill excludes both `eval/` and `tests/` from projections so the runtime surfaces stay focused on the reusable workflow rather than authoring fixtures.

## Projection Targets

### Codex projection

Default target:

```text
.agents/skills/<name>/
```

Keep the skill package largely intact:

- `SKILL.md`
- `references/`, `scripts/`, `assets/`
- `skill.json`
- `CHANGELOG.md`
- `agents/` when present

Only exclude `scripts/` when they are clearly author-only. Many skills need scripts at runtime, so `scripts/` is not filtered by default.

### Claude Code projection

Default target:

```text
.claude/skills/<name>/
```

Project the runtime-relevant files:

- `SKILL.md`
- `references/`, `scripts/`, `assets/`
- other supporting files that help execution

Omit repo-only metadata by default:

- `skill.json`
- `CHANGELOG.md`
- `agents/`
- anything listed in `projection.json`

## Commands

Project a canonical skill:

```bash
SLM_DIR=skills/skill-lifecycle-manager

uv run python "$SLM_DIR/scripts/project_skill.py" \
  "$SLM_DIR" \
  --platform all
```

Validate the projections:

```bash
SLM_DIR=skills/skill-lifecycle-manager

uv run python "$SLM_DIR/scripts/validate_projection.py" \
  "$SLM_DIR" \
  --platform all
```

Use `--output-root <dir>` when testing projections in a temporary directory instead of writing into the current repo.

Optional projection config:

```json
{
  "exclude": ["eval", "tests"],
  "platforms": {
    "claude-code": {
      "exclude": ["internal-notes"]
    }
  }
}
```

Use this when the canonical source needs review fixtures, drafts, or other authoring-only roots that should not be copied into runtime surfaces.

## When Projection Matters

Use projections when:

- one skill should be installable on both Codex and Claude Code
- the canonical source includes repo metadata that should not be copied everywhere
- you want drift detection between the source and platform surfaces

Skip projections when:

- the skill is intentionally single-platform
- you are prototyping a throwaway local skill
- you only need the canonical repo package for now
