# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Clarified that validation and eval guidance in `SKILL.md` is for maintainers of the canonical package, not a runtime requirement for projected installs on other repositories.
- Expanded metadata description scope so `skill.json` matches the broader review surface documented in `SKILL.md`.

### Added
- Expanded eval coverage to check two new protocol contracts:
  - clear findings should not be softened into open questions
  - review should happen before repair, even when a follow-up fix may be appropriate

## [0.5.0] - 2026-03-28

### Changed
- **Positioned the skill for agent review of artifacts**: reframed the core description and opening summary around agent-performed, artifact-scoped review rather than reviewer coaching or general feedback conversations.
- **Tightened trigger boundaries**: removed `audit` and broad quality-language from the primary trigger path, added an explicit `## When Not To Activate` section, and made explicit invocation guidance platform-neutral.
- **Strengthened finding protocol**: P0/P1/P2 findings now require issue, consequence, evidence, and fix direction; clear bugs should no longer be softened into open-ended questions.
- **Reduced low-value review noise**: added explicit non-findings guidance for formatter noise, import ordering, lint-only issues, and style-only feedback without real consequence.
- **Made Phase 4 explicitly review-first**: findings must be presented before edits; fixes happen only after the user asks for them or chooses a next-step option.
- **Reworked tone for agent review**: shifted from conversation-oriented reviewer guidance toward direct, evidence-based, severity-calibrated output with brief, selective praise.

### Added
- **Validation and evaluation guidance** in `SKILL.md`, including concrete `quick_validate.py`, `validate_projection.py`, and `validate_eval_suite.py` commands.
- **Structured eval assets** under `eval/`:
  - `eval/trigger-posture-cases.json` for trigger-boundary and mode-selection checks
  - `eval/eval-cases.json` for realistic end-to-end review quality checks
- **`projection.json`** so author-only roots like `eval/` stay out of runtime projections.

## [0.4.2] - 2026-03-27

### Changed
- **Invocation posture declared as `hybrid`**: added `invocation_posture: hybrid` to SKILL.md frontmatter; documented posture and negative cases in "When to Activate".
- **Description tightened**: removed vague auto-trigger phrases ("what do you think?", "look over this", "anything wrong here?", standalone "audit") that caused false positives on design discussions. High-confidence explicit triggers retained.
- **Verdict logic clarified**: removed ambiguous "minor P1s" wording. Now: ✅ = no P0/P1; ⚠️ = no P0, exactly 1 acknowledged P1 with a clear fix; 🔴 = any P0, 2+ P1s, or any unaddressed P1.
- **`gh` added to tool requirements**: Phase 1a uses `gh pr diff`; it was missing from `skill.json`.
- **`filesystemWrite` corrected to `true`**: Phase 4 applies code and doc fixes directly; `false` was misleading.

## [0.4.1] - 2026-03-25

### Fixed
- **Severity table**: merged duplicate P2 rows into one to avoid ambiguity.
- **Dimensions column**: clarified that listed dimensions are highlights — the reference file contains the full checklist to apply.
- **Quick mode missing Open Questions**: added optional `❓` question line to Quick mode template.

### Changed
- **Review mode selection**: added risk-based override — high-risk content types (auth, payment, DB schema, public API) upgrade to Standard even with ≤3 files.
- **Phase 4 Act**: differentiated action menus by content type — code gets direct fixes, docs get rewrites, design docs/PRDs get suggestions (author decides).
- **Phase 1b project conventions**: made agent-agnostic — instructs to check what's already in context before reading files, lists convention files from multiple agents (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `copilot-instructions.md`).

## [0.4.0] - 2026-03-25

### Added
- **Behavioral change analysis**: Dedicated section guiding the reviewer to check for state model changes, error handling shifts, default value changes, timing/ordering changes, API contract breaks, and scope narrowing. Addresses the finding that skill-guided reviews can over-focus on code patterns and miss behavioral differences in refactoring PRs.
- **Removal inventory** (Deep mode): Checklist for large refactoring PRs to verify clean removal of deleted types/functions — no orphaned imports, stale configs, or dead test helpers.
- **"Look beyond code patterns" principle** in Phase 2: Explicit reminder to check whether new code behaves identically to old code, not just whether it follows coding standards.
- Deep mode output template now includes "Behavioral Changes" and "Removal Inventory" sections.

### Context
- Driven by four-way comparison on openai/codex PR #15424 (8874-line refactoring diff). Baseline (no skill) outperformed all skill-guided reviews on behavioral/architectural findings. This version addresses that gap.

## [0.3.0] - 2026-03-25

### Added
- **Open Questions section**: Reviews now surface things the reviewer can't determine from the diff alone — design intent, implementation details outside the diff, missing context about contracts or consumers. Inspired by code-review-excellence skill's "Questions" pattern.
- **Severity calibration guidance**: Explicit instruction to avoid under-rating maintainability issues as P3 when they have real consequences (e.g., duplicated logic that will silently diverge).

### Changed
- P2 severity description expanded: now explicitly includes DRY violations (>2 copies) and inconsistent conventions that confuse consumers.
- P3 description tightened: only for style preferences with no real consequence.
- Standard mode output template now includes a "Questions" section between "What Looks Good" and "Quick Wins".

## [0.2.0] - 2026-03-25

### Changed
- **Restructured SKILL.md**: moved detailed checklists to `references/` directory. SKILL.md now focuses on process, judgment framework, and output templates (~180 lines vs ~350 before).
- **Differentiated output by mode**: Quick mode uses inline format (no template overhead), Standard uses structured template, Deep adds impact analysis and summary table.
- **Content type priority system**: numbered priority resolves overlaps (e.g., `*.tsx` in `__tests__/` → Tests, not Frontend).

### Added
- **Project context awareness** (Phase 1b): reads `CLAUDE.md`, linter configs, PR templates before reviewing to respect team conventions.
- **Cross-cutting concerns**: code-doc consistency check, missing companion detection (new endpoint with no tests, etc.).
- `references/code-checklist.md`: detailed checks for Code, Frontend, Database, Infrastructure, and Tests.
- `references/content-checklist.md`: detailed checks for Documentation, API Specs, Design Docs/PRDs, and Configuration.

## [0.1.0] - 2026-03-25

### Added
- Initial release: unified review skill synthesized from 12 community code review skills.
- Renamed from `code-review` to `review` to reflect expanded scope beyond code.
- Auto-detection of content types: Code, Tests, Documentation, Database, Infrastructure, Configuration, API Spec, Design Doc, Frontend.
- Dimension-based analysis that adapts to detected content types:
  - Code: Security, Performance, Correctness, Design, Maintainability, Testing.
  - Documentation: Accuracy, Completeness, Clarity, Consistency.
  - API Spec: Backwards compatibility, Naming, Versioning.
  - Database: Migration safety, Indexes, Rollback.
  - Infrastructure/Config: Secrets, Resource limits, Idempotency.
  - Design Doc: Feasibility, Completeness, Trade-offs, Acceptance criteria.
- 4-phase review pipeline (Scope → Analyze → Synthesize → Act).
- 3 review modes (Quick / Standard / Deep) with automatic depth selection.
- P0–P3 severity grading with merge-gate semantics adapted for all content types.
- Mixed PR support: findings grouped by content type.
- Impact analysis for changed exports, APIs, and database schemas (Deep mode).
- Quick Wins section for high-impact/low-effort fixes.
- Interactive post-review action menu.
- Compatible with Claude Code, Codex, and other AI coding agents.
