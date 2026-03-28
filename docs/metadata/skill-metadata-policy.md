# Skill Metadata Policy

Status: draft
Scope: `skills/*/skill.json`

This document defines how to use the `requirements` and `maturity` fields in skill metadata so those fields stay consistent across the repository.

## Goals

- Keep metadata comparable across skills.
- Make `requirements` machine-readable without turning it into a dump of every possible tool.
- Keep `maturity` labels meaningful enough to guide adoption decisions.
- Avoid encoding stage-specific nuance in fields that do not support it yet.

## Non-Goals

- This document does not change the current JSON schema.
- This document does not define automated promotion gates yet.
- This document does not replace the behavioral contract in `SKILL.md`.

## Package Boundary Rule

Installable skills should remain self-contained after install.

- A skill may reference or recommend another skill conceptually.
- A skill must not require another skill package's private scripts by path as part of its normal documented workflow.
- If the same helper is needed in multiple packages and there is no formal shared-runtime distribution mechanism, prefer package-local copies over hidden cross-package runtime dependencies.

This rule applies even when the canonical monorepo makes cross-package calls convenient during authoring. Authoring convenience must not silently redefine the installable package boundary.

## Core Distinction

Use `capabilities` and `requirements` for different questions:

- `capabilities`: What kinds of resources the skill may touch if invoked.
- `requirements`: What external prerequisites must exist for the canonical skill to follow its normal path.

Examples:

- A skill can have `"shell": true` in `capabilities` without listing a shell in `requirements.tools`.
- A skill can have `"network": true` in `capabilities` while still setting `"network": "optional"` in `requirements` if it has a documented offline or user-supplied fallback path.

## `requirements` Policy

### General Rule

Only list prerequisites that are genuinely required for the canonical workflow described in `SKILL.md`.

Do not list:

- optional tools with documented fallback paths
- tools used only in a niche or advanced stage
- built-in environment abilities already covered by `capabilities`
- aspirational tools that would be nice to have but are not necessary

If a skill needs different tools for different lifecycle stages, document that in `SKILL.md` for now. Do not overload `requirements.tools` with stage-specific or "preferred" semantics until the schema supports that explicitly.

### `requirements.os`

Use `os` only when the skill truly depends on platform-specific behavior.

Good uses:

- shell snippets that only work on one operating system
- tooling that is only available on certain platforms

Do not use `os` when the skill is cross-platform in principle and only needs small command translation.

### `requirements.runtimes`

List runtimes only when the canonical skill package ships scripts or commands that assume those runtimes exist for the normal path.

Examples:

- include `"python": ">=3.9"` when validation or projection scripts are part of the expected workflow
- include `"node": ">=18"` when build or install steps rely on Node-based scripts

Do not list a runtime just because one optional helper can use it.

### `requirements.tools`

List only hard CLI or external tool prerequisites.

Good uses:

- `git` for a Git workflow skill
- `uv` for a skill whose normal validation path runs Python utilities through `uv`

Do not list:

- `gh` when the skill already documents GitHub MCP or web-based fallback paths
- `npx` when the same discovery work can fall back to other search tiers
- `codex` or `claude` if they are only needed for an optional evaluation or install stage rather than the whole skill's normal path

If a tool is important but not mandatory, call that out in `SKILL.md` instead of `requirements.tools`.

### `requirements.network`

Use these values consistently:

- `none`: the canonical workflow is local-only
- `optional`: network improves the workflow or broadens sources, but documented fallback paths exist
- `required`: the skill cannot meaningfully perform its core workflow without network access

Examples:

- `deep-research`: usually `required`
- `review`: often `none` or omitted
- `skill-researcher`: `optional` if it can still operate on user-supplied sources or narrower local inputs

## `maturity` Policy

The schema supports four maturity levels:

- `experimental`
- `beta`
- `stable`
- `deprecated`

Choose the label based on workflow stability and maintenance expectations, not on subjective confidence alone.

### `experimental`

Use when one or more of these are true:

- the trigger boundary is still moving
- the workflow contract is still being rewritten
- eval coverage is thin or newly added
- projections or automation are still settling
- breaking behavior changes are still likely between minor releases

This should remain the default for new skills.

### `beta`

Use when the core workflow is reusable and the maintainers want broader adoption, but some change is still expected.

Typical signals:

- the main workflow contract is stable enough for repeated use
- there is at least one real validation path
- eval coverage exists for the most important behavior
- known rough edges remain, but they are mostly expansion or polish work rather than contract churn

### `stable`

Use when the skill is expected to be dependable for routine use and breaking behavior changes are exceptional.

Typical signals:

- the contract is clear and rarely changes
- validation and eval coverage are appropriate to the skill's risk
- projections, if relevant, are maintained as part of the normal workflow
- the skill has already seen repeated real-world use with low churn

### `deprecated`

Use when the skill should no longer be adopted for new work.

Requirements:

- set `"deprecated": true`
- set `"replacedBy"` when a successor exists
- explain the deprecation in `CHANGELOG.md`

## Promotion And Demotion Guidance

Treat maturity changes as release-worthy metadata changes.

- Promoting `experimental -> beta` or `beta -> stable` should happen in the same change that updates `skill.json` and `CHANGELOG.md`.
- Demoting a skill is allowed when behavior, maintenance state, or replacement guidance changes materially.
- Do not promote one skill in isolation unless the evidence would also justify the same label for comparable skills in the repository.

## Release Hygiene

When shipping metadata or behavior changes:

- keep in-progress notes under `## [Unreleased]`
- when the work is actually released, move those notes into a versioned changelog section
- update `skill.json.version` in the same change
- if `SKILL.md` has its own frontmatter `version`, update that too

For `0.x` skills in this repository, use version bumps to signal contract changes clearly even before `1.0.0`.

Suggested rule of thumb:

- patch: wording cleanup or metadata clarification with no contract change
- minor: new gates, new required outputs, changed requirements, changed maturity, or meaningful eval/projection expectations
- major: explicit backward incompatibility or replacement

## Future Schema Extensions

Do not invent ad hoc fields in individual skills. If the repository needs more precision later, consider a schema revision for concepts such as:

- preferred but optional tools
- stage-specific requirements
- related or delegated skills
- evidence or promotion criteria for maturity
