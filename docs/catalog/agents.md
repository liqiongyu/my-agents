# Agents Catalog

> This file is generated. Run `npm run build`.

| Name | Version | Maturity | Archetype | Platforms | Categories | Description |
| --- | --- | --- | --- | --- | --- | --- |
| [coder](../../agents/coder/claude-code.md) | 0.1.1 | experimental | implementer | claude-code, codex | coding | Issue Agent OS coding worker. Implements features, fixes, refactors, and docs changes in an isolated worktree based on a triager-written brief. |
| [debugger](../../agents/debugger/claude-code.md) | 1.0.3 | experimental | debugger | claude-code, codex | debugging, coding | Systematic debugging agent that diagnoses bugs, test failures, and unexpected behavior through hypothesis-driven investigation. |
| [docs-researcher](../../agents/docs-researcher/claude-code.md) | 1.0.0 | experimental | explorer | claude-code, codex | documentation, research | Documentation-backed research agent for verifying APIs, SDKs, frameworks, and libraries against official sources. |
| [explorer](../../agents/explorer/claude-code.md) | 1.2.0 | experimental | explorer | claude-code, codex | coding, productivity | Use when a task needs fast read-only codebase mapping, evidence gathering, impact analysis, or file and symbol discovery before implementation or review. |
| [implementer](../../agents/implementer/claude-code.md) | 1.0.3 | experimental | implementer | claude-code, codex | coding, refactoring | Code implementation agent that writes, modifies, and refactors code based on plans, specs, or direct instructions. |
| [issue-solver](../../agents/issue-solver/codex.toml) | 0.2.1 | experimental | custom | codex | workflow, coding | Solves a single GitHub issue end-to-end by orchestrating specialist agents through triage, implementation, review, and merge. |
| [planner](../../agents/planner/claude-code.md) | 1.2.1 | experimental | planner | claude-code, codex | design, coding, productivity | Architecture and implementation planning agent that designs step-by-step plans with trade-off analysis and escalates to implementation-planning for complex technical execution plans. |
| [researcher](../../agents/researcher/claude-code.md) | 1.1.2 | experimental | explorer | claude-code, codex | research, productivity | Web research agent for deep investigation, multi-source verification, and structured report generation. |
| [reviewer](../../agents/reviewer/claude-code.md) | 1.1.3 | experimental | reviewer | claude-code, codex | review, coding | Code review agent that performs structured, severity-graded reviews on PRs, diffs, and code changes. |
| [splitter](../../agents/splitter/claude-code.md) | 0.1.1 | experimental | custom | claude-code, codex | workflow | Issue Agent OS decomposition worker. Breaks large or vague issues into 2-5 concrete, right-sized sub-issues with dependency links. |
| [triager](../../agents/triager/claude-code.md) | 0.1.1 | experimental | custom | claude-code, codex | workflow | Issue triage agent that reads an issue, assesses actionability, decides routing (execute/split/plan/investigate/defer/reject/escalate), and writes an execution brief for workers. |
