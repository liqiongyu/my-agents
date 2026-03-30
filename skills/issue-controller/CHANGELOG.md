# Changelog

## [0.1.0]

- Initial issue-controller skill for Issue Agent OS.
- Thin concurrent dispatcher loop: pull queue → triage → dispatch → review loop → merge → repeat.
- Supports max 6 parallel workers with slot-based concurrency.
- Migrated from agent package to skill — runs at depth 0 in main session, avoiding sub-agent nesting limits.
