# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-03-28

### Fixed

- Removed the runtime-facing link to authoring-only community research so projected copies no longer point at excluded files
- Marked `scripts/` as author-only for projection because `run_eval.py` is an authoring/evaluation helper, not runtime workflow guidance
- Prepared the skill for clean re-projection to Codex and Claude surfaces after the 0.1.1 drift

### Added

- Added a posture-aware trigger suite under `eval/trigger-posture-cases.json` to test the intended `manual-first` boundary against adjacent Git requests

## [0.1.1] - 2026-03-27

### Fixed

- Typo in routing table Compare/Merge row ("cthanges" → "changes")
- Added overlap boundary note in "When Not To Use" for sessions already handled by a broader advanced-Git skill
- Moved `community-patterns.md` to `authoring/` and excluded it from runtime projections; it is authoring-time context, not runtime guidance
- Added `scripts/run_eval.py`: list eval cases with prompts and assertions, or score a recorded results file against the 75% threshold

## [0.1.0] - 2026-03-27

### Added

- Initial research-backed release of `git-worktree-workflows`
- Canonical skill package with explicit safety boundaries and route-based workflows
- Focused references covering official Git behavior and community-pattern synthesis
- Seeded eval suite for future behavioral checks
