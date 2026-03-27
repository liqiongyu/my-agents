# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2026-03-27

### Added
- Added two non-meta eval cases to `eval/eval-cases.json` so the suite now covers ordinary utility/content skills in addition to `skill-lifecycle-manager` working on itself.

### Changed
- Made the command examples projection-safe by introducing an `SLM_DIR` command-path model and explicit guidance for canonical versus projected copies.
- Clarified that the documented workflow has 9 phases wrapped around 7 routed lifecycle stages, so readers do not have to infer the mapping themselves.
- Improved `quick_validate.py` frontmatter handling by preferring a real YAML parser when available and documenting the fallback parser's limits.
- Updated the docs to explain that eval fixtures stay canonical/author-only even when scripts are projected into runtime surfaces.

## [0.4.0] - 2026-03-27

### Added
- Added explicit invocation-posture guidance for `manual-first`, `hybrid`, and `auto-first` skill designs.
- Added a dedicated posture-aware trigger suite under `eval/trigger-posture-cases.json`.
- Added focused Python unit tests covering projection-root inference, eval-runner baseline behavior, timeout artifacts, and audit/validation helpers.

### Changed
- Updated the main lifecycle workflow so posture is decided before writing or optimizing a description.
- Updated evaluation guidance so trigger testing depends on whether the target skill should be called explicitly or trigger automatically.
- Updated eval documentation so the lighter posture-aware routing suite is easy to seed, run, and review.
- Updated the posture-aware suite and references to treat overlap-check recommendations and a conservative `hybrid` answer as acceptable in a few explicitly marked boundary cases.
- Hardened the review panel so dynamic case/assertion content is rendered through DOM text nodes instead of interpolated HTML.
- Aligned both eval suite files on the same normalized scoring schema and taught the eval validator to check scoring metadata.
- Hardened `run_surface_eval.py` so `baseline` runs temporarily hide the project-local projection for the active surface and timeout failures still write structured artifacts.
- Tightened projection root inference so project-scope projection commands now fail explicitly instead of silently guessing the wrong root.
- Updated `projection.json` so both `eval/` and `tests/` stay out of runtime projections.
- Expanded `audit_skill_inventory.py` from a basic structure scan into a severity-ranked audit that also checks trigger quality, reference hygiene, readiness signals, projection health, and projection-weight context cost.
- Removed the `sys.path` mutation from the inventory audit script.

## [0.3.0] - 2026-03-27

### Changed
- Shortened the frontmatter and `skill.json` descriptions to prefer precision over recall.
- Reframed the trigger boundary around explicitly skill-focused requests instead of trying to enumerate every possible user verb.
- Added a stronger negative boundary excluding general code tasks and agent-management requests.

## [0.2.0] - 2026-03-27

### Added
- Added platform references for shared core vs platform-specific behavior and for canonical-to-projection workflow.
- Added projection helper scripts to generate and validate Codex and Claude Code skill surfaces.
- Added a structured cross-platform eval suite under `eval/` plus `seed_eval_workspace.py --eval-file` support.
- Added `validate_eval_suite.py` to check eval fixtures before seeding or running them.
- Added `run_surface_eval.py` so eval prompts can be run directly through local `codex` and `claude` CLIs instead of a separate API harness.
- Added `projection.json` support so skills can exclude author-only roots like `eval/` from platform projections without hand-editing projected copies.
- Added `render_review_panel.py` to generate a lightweight static review panel for scoring assertions, taking notes, and exporting review JSON.

### Changed
- Expanded the install/publish stage to explicitly cover projection generation and validation before distribution.
- Made projection writes and local installs replace skill directories atomically instead of deleting the destination first and then copying files back piecemeal.
- Updated eval workspace manifests to record source suite metadata and let the direct CLI runner reuse the latest iteration by default.
- Updated `init_skill.py` so scaffold dates are dynamic, default authors come from the environment when available, and default tags are derived from the skill name plus categories.

## [0.1.0] - 2026-03-27

### Added
- Initial release of `skill-lifecycle-manager` as a thin router across seven lifecycle stages: Discover, Create/Update, Validate, Evaluate, Optimize Trigger, Install/Publish, and Audit/Governance.
- Explicit delegation guidance tying deep discovery to `skill-researcher` instead of duplicating ecosystem research inline.
- Combined OpenAI-style authoring structure with Anthropic-style evaluation and trigger optimization guidance.
- Added `references/lifecycle-modes.md` for stage routing and depth selection.
- Added `references/evaluation-loop.md` for Anthropic-style iteration planning and trigger-only passes.
- Added `references/audit-rubric.md` for library-health audits and issue prioritization.
- Added helper scripts for repo-compatible scaffolding, single-skill validation, eval workspace seeding, and inventory auditing.
