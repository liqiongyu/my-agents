# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.3] - 2026-03-28

### Changed
- Clarified that Quick/Standard/Deep is a required gate only for broad discovery, not for bounded user-supplied source comparisons.
- Updated the search playbook and canonical workflow wording so narrow supplied-source comparisons can proceed directly as constrained research without an extra depth-mode stop.

## [0.2.2] - 2026-03-28

### Added
- Added `eval/trigger-posture-cases.json`, a classification-only trigger suite for `skill-researcher` that checks manual-first routing, negative boundaries, and constrained-source handling without running the full research workflow.
- Added `eval/README.md` with quick-start commands for the main lifecycle suite and the new posture-focused suite.

### Changed
- Updated the canonical skill validation guidance to include the new trigger-posture eval fixture.
- Bumped package metadata to `0.2.2` so the new eval surface is versioned alongside the canonical package.

## [0.2.1] - 2026-03-28

### Added
- Added `references/scope-rules.md`, `references/search-playbook.md`, and `references/fusion-report-template.md` so the canonical skill keeps heavy search and reporting detail out of the main body.
- Added a dedicated Validation section to `SKILL.md` that points at the structural, eval-suite, and projection checks for this package.

### Changed
- Tightened the skill trigger around a manual-first invocation posture and shortened the package description to better fit a high-precision meta-skill.
- Clarified that cross-platform search is the default, but user-supplied source or platform constraints must be respected instead of widened automatically.
- Rewrote the main `SKILL.md` to keep the core platform-neutral, including replacing platform-specific handoff phrasing with downstream-workflow language.

## [0.2.0] - 2026-03-27

### Added
- Added a structured eval suite under `eval/eval-cases.json` covering candidate-inventory pauses, confirmed follow-up synthesis, non-research install requests, and narrow-source comparison requests.
- Added `projection.json` so author-only eval fixtures stay out of projected runtime surfaces.
- Added minimal `requirements` metadata so the package now declares its network expectations alongside capabilities.

### Changed
- Elevated depth-mode selection and candidate confirmation into explicit hard gates instead of soft guidance.
- Clarified that the default output is a separate Fusion Report handoff artifact and that this skill should not silently continue into target-skill authoring.
- Removed time-sensitive popularity snapshots from the curated-source list, clarified that Quick mode targets 5-7 candidates so Standard owns 8-15 cleanly, and documented fallback behavior when `npx skills` is unavailable.

## [0.1.0] - 2026-03-26

### Added
- Initial release: 5-phase workflow (Scope → Discover → Collect → Analyze → Synthesize)
- 3-tier source discovery: CLI/API search, web search, known collections
- Structured Fusion Report output template with source inventory, pattern analysis, and fusion strategy
- Quick/Standard/Deep depth modes (5–8 / 8–15 / 15–25+ candidates)
- Parallel execution support for search and collection phases
- User confirmation checkpoint between discovery and collection
- Quality gates for report completeness
- Handoff guidance to skill-creator for the writing phase
