# Changelog

## [0.1.1] - 2026-03-30

### Changed

- Updated the Codex definition to use `gpt-5.4` with `high` reasoning effort as the default.
- Updated the Claude Code definition to use `opus` as the default model.

## [0.1.0]

- Initial triager agent for Issue Agent OS.
- Reads issues, assesses actionability, decides routing, writes execution briefs.
- Seven routing decisions: execute, split, plan_then_execute, investigate, defer, reject, escalate.
- Claude Code and Codex platform definitions.
