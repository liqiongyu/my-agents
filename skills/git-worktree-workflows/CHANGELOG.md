# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.4] - 2026-03-28

### Fixed

- Replaced the runtime handoff to an absent "broader Git skill" with neutral broader advanced-Git guidance so the boundary stays clear without implying a missing local companion skill
- Expanded the eval runner with `--suite behavior|trigger|all` so behavior and trigger-posture checks are easier to list and score without passing raw file paths
- Made `run_eval.py --suite all --score` fail when any selected suite has no matched scored cases instead of treating missing coverage as success

### Added

- Added behavior eval coverage for portable worktree `lock` / `unlock` guidance on removable storage
- Added behavior eval coverage for intentional `git worktree move` workflows, including the official move limitations
- Added trigger-posture coverage for explicit portable-worktree locking and intentional Git-managed worktree relocation

## [0.1.3] - 2026-03-28

### Fixed

- Tightened the runtime trigger language so the skill stays manual-first while explicitly deferring repo bootstrap and broader advanced-Git sessions where worktrees are incidental
- Restored trigger-facing coverage for compare, cleanup, and repair requests so supported worktree maintenance routes remain easy to route into
- Replaced the body's hardcoded `.worktrees` ignore check with a generic candidate-path check and kept side-by-side comparison inside Git with `git diff --no-index`
- Refreshed the remote-review example to fetch the target branch with an explicit remote-tracking refspec before creating a review worktree
- Surfaced the pre-2.23 `git restore` fallback directly in the runtime compare-and-merge workflow instead of leaving it only in references

### Added

- Added a `Repair / Recover` behavior eval case for manually moved worktrees
- Expanded trigger-posture coverage with near-miss and overlap cases for subtree, submodule, and broader advanced-Git sessions
- Added positive trigger-posture coverage for cleanup and repair requests plus behavior eval coverage for explicit remote-review fetches and in-repo candidate-path checks
- Documented `git diff --no-index`, `git restore` version caveats, and overlap-trigger rationale in supporting references

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
