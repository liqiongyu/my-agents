# Changelog

All notable changes to the **explorer** agent will be documented in this file.

## [1.1.0] - 2026-03-26

### Added

- Common Exploration Tasks section (architecture mapping, dependency tracing, pattern discovery, test coverage).
- Reporting to Callers section with guidelines for structured output to planner/reviewer.
- Unexpected Discoveries section in output format.
- Expanded Codex developer_instructions to match Claude Code depth.

### Changed

- Expanded Search Strategy with parallelization guidance.
- Added caller-awareness as core behavior principle.
- Enhanced constraints with guidance on handling large result sets.

## [1.0.0] - 2026-03-25

### Added

- Initial release: read-only codebase exploration agent.
- Claude Code definition with Glob, Grep, Read, Bash(readonly) tools.
- Codex definition with read-only sandbox mode.
- Structured output format (Finding / Evidence / Context).
- Clarify skill integration for ambiguous requests.
