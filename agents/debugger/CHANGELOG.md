# Changelog

All notable changes to the **debugger** agent will be documented in this file.

## [1.0.2] - 2026-03-27

### Changed

- Added an explicit Codex `model_reasoning_effort = "high"` default so debugger runs with a stable deep-investigation posture instead of inheriting the caller's reasoning setting.

## [1.0.1] - 2026-03-27

### Changed

- Expanded the Codex definition to mention explorer usage explicitly and align its investigation guidance with the declared `explorer` dependency and the Claude Code surface.

## [1.0.0] - 2026-03-26

### Added

- Initial release: systematic debugging agent with hypothesis-driven investigation.
- Claude Code definition with Read, Glob, Grep, Bash, Edit, Write tools and Agent(explorer) for context.
- Codex definition with workspace-write sandbox mode.
- Six-phase debugging process: reproduce → hypothesize → investigate → isolate → fix → confirm.
- Common debugging patterns: test failures, runtime errors, CI-only failures, performance issues.
- Investigation log template for structured debugging records.
- Explorer agent reference for code path tracing during investigation.
- Clarify skill integration for ambiguous bug reports.
