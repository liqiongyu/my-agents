# Agents Catalog

> This file is generated. Run `npm run build`.

| Name | Version | Maturity | Archetype | Platforms | Categories | Description |
| --- | --- | --- | --- | --- | --- | --- |
| [debugger](agents/debugger/claude-code.md) | 1.0.0 | experimental | debugger | claude-code, codex | debugging, coding | Systematic debugging agent that diagnoses bugs, test failures, and unexpected behavior through hypothesis-driven investigation. |
| [docs-researcher](agents/docs-researcher/claude-code.md) | 1.0.0 | experimental | explorer | claude-code, codex | documentation, research | Documentation-backed research agent for verifying APIs, SDKs, frameworks, and libraries against official sources. |
| [explorer](agents/explorer/claude-code.md) | 1.1.0 | experimental | explorer | claude-code, codex | coding, productivity | Read-only codebase exploration agent for fast search, structure analysis, and evidence gathering. |
| [implementer](agents/implementer/claude-code.md) | 1.0.0 | experimental | implementer | claude-code, codex | coding, refactoring | Code implementation agent that writes, modifies, and refactors code based on plans, specs, or direct instructions. |
| [planner](agents/planner/claude-code.md) | 1.1.0 | experimental | planner | claude-code, codex | design, coding, productivity | Architecture and implementation planning agent that designs step-by-step plans with trade-off analysis. |
| [researcher](agents/researcher/claude-code.md) | 1.1.0 | experimental | explorer | claude-code, codex | research, productivity | Web research agent for deep investigation, multi-source verification, and structured report generation. |
| [reviewer](agents/reviewer/claude-code.md) | 1.1.0 | experimental | reviewer | claude-code, codex | review, coding | Code review agent that performs structured, severity-graded reviews on PRs, diffs, and code changes. |

<!-- rctl:block:start routing -->
## rctl routing

- Treat `rctl/control-plane/control-plane.yaml` as the machine-readable entrypoint.
- Plans, status, evidence, and rollback notes live under `rctl/changes/`.
- Command/skill mappings live under `rctl/registry/`.
- Durable docs and policies live under `rctl/docs/` and `rctl/control-plane/`.
- Codex-native skills live under `.agents/skills/`.
- Claude Code uses `CLAUDE.md`, `.claude/skills/`, and `.claude/commands/`.
- Keep root guidance short; detailed operating truth belongs under `rctl/`.

- For non-trivial work, create or update an active change under `rctl/changes/active/<change-id>/` before broad edits.
<!-- rctl:block:end routing -->
