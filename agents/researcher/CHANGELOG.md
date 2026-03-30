# Changelog

All notable changes to the **researcher** agent will be documented in this file.

## [1.1.2] - 2026-03-30

### Changed

- Updated the Codex definition to use `gpt-5.4` with `high` reasoning effort as the default.
- Updated the Claude Code definition to use `opus` as the default model.

## [1.1.1] - 2026-03-27

### Changed

- Added an explicit Codex `model_reasoning_effort = "high"` default so researcher keeps a stable multi-source synthesis posture across caller sessions.

## [1.1.0] - 2026-03-26

### Added

- Detailed Search Strategy section (query techniques, source prioritization, failure recovery).
- Anti-Hallucination Protocol section.
- Local Context Integration section for codebase-aware research.
- Gaps and Limitations section in output format.
- Caller-awareness as core behavior principle.
- Expanded Codex developer_instructions to match Claude Code depth.

## [1.0.0] - 2026-03-25

### Added

- Initial release: web research agent with multi-source verification.
- Claude Code definition with WebSearch, WebFetch, Read, Glob, Grep tools.
- Codex definition with read-only sandbox mode.
- Structured report format (Summary / Findings / Recommendations / Sources).
- Deep-research and clarify skill integrations.
