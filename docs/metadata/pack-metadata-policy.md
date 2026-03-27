# Pack Metadata Policy

Status: draft
Scope: `packs/*/pack.json`

This document defines how to use pack metadata consistently so packs stay searchable, installable, and predictable across platforms.

## Goals

- Keep packs as a clean composition layer above atomic `skills/` and `agents/`.
- Make role-oriented or team-oriented distributions easy to install and document.
- Keep pack membership explicit so install behavior matches what the catalog shows.
- Leave room for future expansion without over-designing v1.

## Non-Goals

- This document does not introduce pack nesting in v1.
- This document does not define per-member version pinning.
- This document does not add runtime prompt overrides or platform-specific behavior patches.

## Core Distinction

Use pack metadata for grouping semantics, not for runtime behavior.

- `categories`: search and filtering labels shared with skills and agents
- `persona`: the target audience or role the pack serves
- `packType`: the kind of grouping this pack represents

Do not use `categories` as a substitute for installation groups. A category such as `business` or `testing` should help discovery, but the actual installable unit is the pack itself.

## `packType` Policy

The schema currently supports:

- `role-pack`: a pack curated for a role, discipline, or workflow
- `agent-team`: a pack centered on a cooperating set of agents

Use `role-pack` by default. Only use `agent-team` when the pack is explicitly describing a reusable team of agents with a clear lead agent and collaboration story.

## `persona` Policy

`persona` is optional, but recommended when the pack clearly targets a role such as `product-manager`, `qa-engineer`, or `tech-lead`.

Use a stable kebab-case identifier. Keep it broad enough to stay reusable across projects; do not encode organization-specific team names unless the repository intentionally publishes organization-specific packs.

## Membership Policy

Packs must list members explicitly.

- `skills` lists the atomic skills the pack installs
- `agents` lists the atomic agents the pack installs

Do not rely on hidden dependency expansion when defining pack membership. If an included agent declares a skill or sub-agent dependency, the pack should list that dependency explicitly. This keeps catalogs, reviews, and installs aligned.

For v1:

- no nested packs
- no transitive-only members
- no per-member version constraints

## Versioning Policy

Each pack has its own SemVer version and changelog.

Bump the pack version when any of these change:

- pack membership (`skills` or `agents`)
- pack positioning (`displayName`, `description`, `persona`, `packType`)
- install or usage guidance in the pack README that changes the pack contract materially

Do not bump the pack version merely because a referenced skill or agent released a new version, unless the pack definition itself changed in the same release.

## `leadAgent` Policy

`leadAgent` is reserved for `agent-team`.

Rules:

- `leadAgent` should be omitted for `role-pack`
- when `packType` is `agent-team`, `leadAgent` is required
- the named lead agent must also appear in the pack's `agents` list

## Category Policy

Packs should use the existing category whitelist in `categories.json`.

Choose categories that help a user find the pack in a catalog, for example:

- `business`, `research`, `productivity` for a product strategy pack
- `testing`, `review`, `coding` for a QA pack

Avoid inventing meta-categories such as `role`, `team`, or `bundle` unless the repository intentionally wants those categories for search.

## Release Hygiene

When shipping pack changes:

- keep in-progress notes under `## [Unreleased]`
- move released notes into a versioned changelog section
- update `pack.json.version` in the same change
- rerun `npm run build` and `npm test`

## Future Extensions

If the repository later needs more expressive packs, prefer a schema revision over ad hoc fields. Likely future directions include:

- nested packs
- platform compatibility hints
- project-level manifests that reference packs
- optional member constraints or install policies
