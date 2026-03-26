# Changelog

All notable changes to the **reviewer** agent will be documented in this file.

## [1.1.0] - 2026-03-26

### Added

- Review Checklists section (general, security-sensitive, performance-sensitive).
- Using the Explorer Agent section with specific spawn guidance.
- OWASP top 10 and N+1 query patterns in assessment dimensions.
- Expanded Codex developer_instructions to match Claude Code depth.

### Changed

- Enhanced constraints with consolidation guidance for repeated findings.

## [1.0.0] - 2026-03-25

### Added

- Initial release: structured code review agent with severity-graded findings.
- Claude Code definition with Read, Glob, Grep, Bash tools and Agent(explorer) for context gathering.
- Codex definition with read-only sandbox mode.
- Four severity levels: Critical, Warning, Suggestion, Praise.
- Review dimensions: Correctness, Security, Performance, Maintainability.
- Review and clarify skill integrations.
- Explorer agent reference for deep codebase investigation during reviews.
