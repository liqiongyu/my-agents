# Changelog

All notable changes to this agent will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-03-30

- Initial release of the `issue-solver` single-issue orchestrator agent for Codex-native Issue Agent OS flows.
- Scoped the first release to the Codex surface and tightened the runtime contract for label bootstrap, state transitions, and repo-local runtime state persistence.
- Clarified that the authoritative GitHub repository is derived from the current project's configured GitHub remote and must error when no resolvable project remote exists.
