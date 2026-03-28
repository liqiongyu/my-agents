# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-03-28

### Added
- Added `projection.json` so runtime projections can omit author-only eval fixtures and unnecessary changelog weight.
- Added `references/templates.md` and `references/context-and-handoffs.md` to move reusable examples, handoff rules, and context-specific guidance out of the main workflow doc.
- Added a durable trigger/evaluation suite under `eval/` focused on hybrid posture, brainstorming near-misses, and proceed-with-assumptions behavior.

### Changed
- Tightened the frontmatter and `skill.json` descriptions so `clarify` stays a hybrid implementation-clarification skill rather than drifting into general direction-finding or brainstorming territory.
- Added explicit `invocation_posture: hybrid` metadata and aligned the body around the same posture.
- Renamed the negative-boundary section to `When Not To Use` and strengthened the boundary against open-ended option exploration.
- Shortened the main `SKILL.md` by moving templates and context-specific detail into references for better progressive disclosure.
- Added an explicit validation section to `SKILL.md` so the canonical package documents how to validate its structure, eval suite, and projections.

## [1.1.0] - 2026-03-28

### Changed
- Rewrote SKILL.md frontmatter description to hybrid invocation posture: explicit trigger ("clarify", "spec this out") plus three high-confidence auto-trigger conditions (contradictions, explicit uncertainty, high-impact missing scope). Removed imperative MUST/IMPORTANT language and over-broad trigger list that would activate on nearly every vague request.
- Fixed `skill.json` capabilities: removed `shell: true` (skill runs no shell commands) and set `filesystemWrite: false` (spec-file saving is optional user action, not a core skill capability). `filesystemRead: true` retained for Phase 1 codebase research.
- Aligned `skill.json` short description to match the new posture.

## [1.0.0] - 2026-03-25

### Added
- Initial release synthesized from 9 community clarify skills.
- Four-phase clarification flow: Detect & Assess, Research Before Asking, Interactive Clarification, Deliver & Proceed.
- T1/T2/T3 decision tier system for autonomous vs. human-required decisions (inspired by corca-ai/clarify).
- Hypothesis-driven questioning with concrete options instead of open-ended questions (from clarify:vague).
- Risk-based triage (LOW/MEDIUM/HIGH) to calibrate clarification depth (from clarify-first).
- Contradiction-first resolution priority (from ed3d-plugins/asking-clarifying-questions).
- Seven-category ambiguity taxonomy (from speckit-clarify + academic research).
- Autonomous clarification mode with documented assumptions and CHANGEME markers for non-interactive environments.
- Context-adaptive clarification patterns for bug fixes, features, refactoring, architecture, debugging, and docs.
- Integration guidance for handoff to brainstorming, writing-plans, review, and deep-research skills.
