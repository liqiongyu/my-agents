# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Updated the packaged unit-test runner to fail with a clear canonical-only message when projected runtime copies omit `tests/`, instead of falling through to a confusing pytest path error.

## [0.4.0] - 2026-03-28

### Added
- Added a package-local `scripts/` tree so `agent-lifecycle-manager` now ships the validation, projection, and eval harness helpers it documents instead of depending on another skill package's private script paths.
- Added packaged Python unit tests for the local harness, including agent-specific validation and inventory-audit coverage.

### Changed
- Replaced every documented `"$SLM_DIR/scripts/..."` command with package-local `"$ALM_DIR/scripts/..."` usage so the skill remains self-contained after install.
- Updated the eval README, eval fixture metadata, and evaluation-loop reference to describe a package-local harness rather than a shared harness dependency.
- Clarified that self-validation of the `agent-lifecycle-manager` skill package itself is canonical-only: projected runtime copies can ship the helper scripts, but they do not ship the authoring-only `eval/` fixture set, and Claude Code projections also omit `skill.json` plus `CHANGELOG.md`.

## [0.3.1] - 2026-03-27

### Added
- Added Command Path Model section so shell commands resolve correctly from projected runtime copies, not just the canonical repo path.
- Added Operating Rule 5 noting that this skill's workflow structure intentionally tracks `skill-lifecycle-manager` and should be checked when the parent evolves.

### Changed
- Replaced hardcoded canonical paths in Phase 4 (Validate), Phase 5 (Evaluate), and Phase 8 (Audit) commands with `$SLM_DIR` and `$ALM_DIR` variables defined in the Command Path Model.
- Updated the benchmark note (`research/agent-lifecycle-manager-benchmark-20260327.md`) with a 0.3.0 section explaining that routing benchmarks remain valid and eval-6/eval-7 await their first surface-eval runs.

## [0.3.0] - 2026-03-27

### Added
- Added `quick_validate_agent.py` in the shared harness for cross-surface contract validation: name alignment, archetype-capability consistency, runtime defaults, tools alignment, and model divergence detection.
- Added `audit_agent_inventory.py` for library-wide agent health auditing with 8 automated dimensions and a quantified health score.
- Added a worked example in SKILL.md showing an audit request flowing through routing, execution, and close-the-loop.
- Referenced both new scripts in Phase 4 (Validate) and Phase 8 (Audit / Governance).

### Changed
- Tightened SKILL.md: compressed the router table, deduplicated operating rules from 10 to 4, condensed the failure patterns section, and consolidated the outputs list.
- Removed the standalone Shared Harness section (now covered by Operating Rule 4).

## [0.2.4] - 2026-03-27

### Added
- Added explicit runtime requirements for Node.js and Python plus CLI tool requirements for `codex` and `claude` so the full evaluation workflow is represented in `skill.json`.
- Added a `Shared Harness` note clarifying that this skill intentionally reuses `skills/skill-lifecycle-manager/scripts/` instead of carrying a duplicate local `scripts/` tree.
- Added a lightweight failure-pattern coverage note to the eval README so the main assertions are easier to trace back to the workflow risks they guard.

### Changed
- Reordered the eval suite cases so the file stays in numeric order and the Discover handoff case reads as an additive case rather than an inserted afterthought.

## [0.2.3] - 2026-03-27

### Added
- Added explicit Discover handoff guidance for `explorer`, `docs-researcher`, and `researcher`, including the agent-specific return checklist needed before `Create / Update`.
- Added `references/research-handoff.md` plus a Discover-focused eval case so delegated research stays a separate input to authoring.

### Changed
- Clarified that broad external agent research should pause at a source or candidate inventory when the contract is still unstable instead of silently drafting package files.

## [0.2.2] - 2026-03-27

### Changed
- Unified the trigger-facing description in `skill.json` and `SKILL.md` frontmatter so catalog discovery and runtime routing use the same boundary language.

## [0.2.1] - 2026-03-27

### Added
- Added benchmark safety guidance for write-capable or approval-seeking surfaces, including worktree checks and reverting unintended edits before scoring a run.

### Changed
- Extended the canonical eval fixture metadata so runtime benchmarking guidance now calls out worktree hygiene explicitly.

## [0.2.0] - 2026-03-27

### Added
- Added explicit archetype guidance so the valid repo archetypes are visible inside the skill instead of only in `schemas/agent.schema.json`.
- Added concrete benchmark and eval-harness guidance for `with-skill` and `baseline` runs by reusing the `skill-lifecycle-manager` evaluation scripts.
- Added richer eval-suite metadata and canonical eval-runner instructions for `agent-lifecycle-manager`.

### Changed
- Tightened the skill metadata description so the catalog copy and the trigger-facing description are closer in scope and emphasis.

## [0.1.1] - 2026-03-27

### Changed
- Corrected the agent-validation workflow so the skill validates target agent packages with repo agent commands, while still documenting the separate skill-validation path used when revising `agent-lifecycle-manager` itself.
- Made Codex runtime defaults an explicit part of the managed agent contract, including guidance for `sandbox_mode`, `model`, `model_reasoning_effort`, and `web_search`.
- Expanded the references and eval suite so runtime-control drift is treated as a first-class audit and evaluation concern.

## [0.1.0] - 2026-03-27

### Added
- Initial release of `agent-lifecycle-manager` as a manual-first meta-skill for creating, updating, validating, evaluating, installing, and auditing sub-agent definitions.
- Added an agent-specific lifecycle workflow that adapts `skill-lifecycle-manager` to archetype choice, tool budgets, dependency graphs, and cross-surface contract alignment.
- Added focused references for invocation posture, platform surfaces, evaluation loops, and agent-library audit criteria.
- Added a seeded eval suite plus projection config for Codex and Claude Code runtime surfaces.
