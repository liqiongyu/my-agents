# Plan

## Goal

Create and refine `skill-lifecycle-manager` so it can route skill work across discovery, creation/update, validation, evaluation, trigger optimization, install/publish, and audit/governance, with a tighter trigger boundary on both Codex and Claude Code.

## Scope

- Add a new repo skill under `skills/skill-lifecycle-manager/`
- Include repo-compatible metadata files: `skill.json`, `SKILL.md`, `CHANGELOG.md`
- Add focused references and lightweight Python helpers for scaffolding, validation, and inventory audit
- Tighten the frontmatter description and short metadata description without broad body churn unless eval evidence shows the body is implicated
- Refresh Codex and Claude Code projections so trigger behavior is measured against the current canonical source
- Capture before/after trigger-boundary evidence with targeted cross-surface prompts
- Regenerate generated indexes if validation requires it

## Acceptance criteria

- The new skill explicitly covers all seven lifecycle stages: Discover, Create/Update, Validate, Evaluate, Optimize Trigger, Install/Publish, and Audit/Governance.
- The skill treats `skill-researcher` as the preferred deep discovery subflow rather than re-embedding the whole research workflow inline.
- The skill encodes OpenAI-style structure discipline and Anthropic-style evaluation guidance in a single coherent router workflow.
- Description changes stay focused on frontmatter and package metadata unless fresh eval evidence shows the body is part of the trigger failure.
- The canonical description clearly distinguishes skill lifecycle work from adjacent tasks like using an already-known skill, managing agents, or operating on non-skill packages and artifacts.
- Codex and Claude Code projections are refreshed from the canonical source before post-change trigger claims are made.
- Targeted cross-surface eval evidence covers at least one should-trigger prompt and one should-not-trigger near miss and shows a tighter boundary after the change.
- `skills/skill-lifecycle-manager/skill.json`, `skills/skill-lifecycle-manager/SKILL.md`, and `skills/skill-lifecycle-manager/CHANGELOG.md` pass repo validation requirements.
- The new helper scripts are runnable with `uv run python ...` and provide at least basic scaffold, single-skill validation, and inventory audit support.

## Risks

- Generated files (`catalog.json`, `SKILLS.md`, `AGENTS.md`) are already dirty in the worktree, so verification may surface unrelated freshness drift.
- Repo validation may fail on pre-existing unrelated issues, making it harder to attribute failures to this change only.
- A lifecycle skill can easily become too broad; the draft must stay router-oriented instead of collapsing into a giant monolith.
- Runtime trigger behavior can drift from the canonical package if projected skill surfaces are stale, so projection sync is part of the proof, not just packaging hygiene.

## Validation

- `uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/skill-lifecycle-manager`
- `uv run python skills/skill-lifecycle-manager/scripts/audit_skill_inventory.py --root skills --format markdown`
- `uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-lifecycle-manager/eval/eval-cases.json`
- `uv run python skills/skill-lifecycle-manager/scripts/project_skill.py skills/skill-lifecycle-manager --platform all --scope project`
- `uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/skill-lifecycle-manager --platform all --scope project`
- `uv run python skills/skill-lifecycle-manager/scripts/run_surface_eval.py codex skill-lifecycle-manager --eval-file workspaces/skill-lifecycle-manager/trigger-eval/surface-trigger-evals.json --workdir /Users/liqiongyu/projects/pri/my-agents --workspace-root workspaces --timeout-sec 240 --new-iteration`
- `uv run python skills/skill-lifecycle-manager/scripts/run_surface_eval.py claude-code skill-lifecycle-manager --eval-file workspaces/skill-lifecycle-manager/trigger-eval/surface-trigger-evals.json --workdir /Users/liqiongyu/projects/pri/my-agents --workspace-root workspaces --timeout-sec 240`
- `npm run build`
- `npm test`

## Rollback

- Remove `skills/skill-lifecycle-manager/`
- Remove any new trigger-eval fixture or iteration artifacts created for this refinement if the change is abandoned
- Re-run `npm run build` to remove generated catalog entries
- Delete this change record if the draft is abandoned before adoption

## Dependencies

- Existing repo schema and generated catalog conventions
- Existing `skill-creator` and `skill-researcher` patterns already present in the repository
