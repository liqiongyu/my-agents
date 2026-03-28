# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-03-28

### Changed
- Made the direction-choice boundary stricter so explicit invocation still routes back to `brainstorming` when the user is choosing between options.
- Added guidance that local drafts, prior plan files, or model preference do not count as permission to skip the route-back step.

## [0.1.1] - 2026-03-28

### Changed
- Tightened the hard gate so the skill routes back to `brainstorming` when the direction is not chosen and to `clarify` when contradictions remain.
- Added explicit guidance for routing-only answers so the skill responds with a verdict and next step instead of opportunistically drafting a full plan.

## [0.1.0] - 2026-03-28

### Added
- Initial cross-platform canonical package for `implementation-planning`
- Manual-first deep technical planning workflow for complex features, refactors, migrations, and architecture changes
- Reusable deep-plan template and scope-challenge checklist in `references/plan-structure.md`
- Durable evaluation fixtures for plan-quality checks and trigger-boundary review under `eval/`
