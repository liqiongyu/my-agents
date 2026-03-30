# Changelog

## [0.1.0]

- Initial controller agent for Issue Agent OS.
- Thin concurrent dispatcher: pulls queue, fans out triage, dispatches workers.
- Supports max 6 parallel workers with slot-based concurrency.
- Claude Code and Codex platform definitions.
