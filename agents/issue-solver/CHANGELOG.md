# Changelog

All notable changes to this agent will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-03-31

### Added

- Added `codex-cn.toml` as a Chinese Codex-authored definition for `issue-solver` while keeping the existing `codex.toml` contract unchanged.

## [0.2.1] - 2026-03-31

### Changed

- Replaced descriptive workflow with gate-based contract — each phase has a required output that must exist before advancing.
- Added required evidence fields in output report (`pickup_comment_url`, `triage_verdict`, `branch_name`, `pr_url`, `review_verdict`, `merge_result`).
- Hardened identity rule: issue URLs must match current project repo or the run stops.
- Added PR discovery fallback when coder doesn't return PR number.
- Added draft-to-ready step before merge (coder creates draft PRs).
- Defined post-limit terminal state: `blocked` after 2 review rounds exhausted.
- Strengthened "never do specialist work yourself" as a hard rule, not guidance.

## [0.2.0] - 2026-03-31

### Changed

- Rewrote instructions from 308-line procedural playbook to concise workflow-and-delegation spec (~50 lines).
- Removed all specific CLI commands — trust the model and worker agents to know their tools.
- Removed JavaScript runtime helper dependencies (`scripts/lib/issue-driven-os-*.js`).
- Removed aspirational Codex primitives (`spawn_agent`/`wait_agent`/`close_agent`).
- Removed lease management, run records, artifact persistence, and runtime event tracking.
- Removed complex GitHub label state machine.

### Added

- Worker agents wired in workspace `config.toml`: triager, coder, planner, reviewer, debugger, splitter.
- Clear delegation table mapping triage verdicts to worker agents.

## [0.1.0] - 2026-03-30

- Initial release of the `issue-solver` single-issue orchestrator agent.
