# Changelog

All notable changes to the **planner** agent will be documented in this file.

## [1.2.0] - 2026-03-28

### Added

- Added `implementation-planning` as a linked heavy planning skill for complex technical execution plans.
- Added explicit depth-selection guidance so planner keeps small and medium plans inline and escalates only when the heavier protocol is justified.

### Changed

- Updated planner descriptions to distinguish normal planning from deep implementation-planning.

## [1.1.1] - 2026-03-27

### Changed

- Added an explicit Codex `model_reasoning_effort = "high"` default so planner keeps a stable deep-planning posture across caller sessions.

## [1.1.0] - 2026-03-26

### Added

- Sub-agent Orchestration section with when-to-spawn guidance for explorer and researcher.
- Planning Anti-patterns section (vacuum design, over-engineering, hidden uncertainty, monolithic steps).
- Expanded Codex developer_instructions to match Claude Code depth.

### Changed

- Enhanced constraints to reference implementer agent as downstream consumer of plans.

## [1.0.0] - 2026-03-25

### Added

- Initial release: architecture and implementation planning agent.
- Claude Code definition with Read, Glob, Grep, Bash tools and Agent(explorer, researcher) for context gathering.
- Codex definition with read-only sandbox mode.
- Structured plan format: Context, Design Decisions, Execution Steps, Risks, Open Questions.
- Brainstorming and clarify skill integrations.
- Explorer and researcher agent references for codebase and external context.
