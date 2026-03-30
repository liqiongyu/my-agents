# Changelog

## [0.1.1] - 2026-03-30

### Changed

- Updated the Codex definition to use `gpt-5.4` with `high` reasoning effort as the default.
- Updated the Claude Code definition to use `opus` as the default model.

## [0.1.0]

- Initial splitter agent for Issue Agent OS.
- Decomposes large issues into 2-5 concrete sub-issues with dependency links.
- Creates sub-issues on GitHub with `agent:queued` labels.
- Claude Code and Codex platform definitions.
