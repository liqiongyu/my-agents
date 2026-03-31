# Changelog

All notable changes to this agent will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-03-31

### Changed

- Rewrote instructions from 308-line procedural playbook to concise workflow-and-delegation spec (~50 lines).
- Removed all specific CLI commands — trust the model and worker agents to know their tools.
- Removed JavaScript runtime helper dependencies (`scripts/lib/issue-driven-os-*.js`).
- Removed aspirational Codex primitives (`spawn_agent`/`wait_agent`/`close_agent`).
- Removed lease management, run records, artifact persistence, and runtime event tracking.
- Removed complex GitHub label state machine.

### Added

- Worker agents wired in workspace `config.toml`: triager, coder, planner, reviewer, debugger, splitter.
- Clear delegation table mapping triage verdicts to worker agents.

## [0.1.0] - 2026-03-30

- Initial release of the `issue-solver` single-issue orchestrator agent.
