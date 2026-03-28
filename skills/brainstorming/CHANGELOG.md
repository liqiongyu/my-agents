# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.3] - 2026-03-28

### Changed
- Replaced the repo-local handoff to `writing-plans` with a narrower handoff to `implementation-planning` only for complexity-justified deep technical planning, leaving smaller follow-up work on the normal planning/execution path.

## [0.2.2] - 2026-03-28

### Changed
- **Invocation posture**: tightened from a cautious hybrid toward explicit `manual-first` use. The frontmatter now says this skill is for intentional brainstorming, comparison, and direction-setting before planning or implementation.
- **Negative boundary**: added a dedicated `When Not To Use` section that routes clarification-only work to `clarify`, reviews to `review`, and post-decision execution planning to `writing-plans` or direct execution.
- **Platform neutrality**: replaced the tool-name table with platform-neutral question-handling guidance so the canonical core does not depend on a single surface exposing a specific input tool.
- **Evaluation guidance**: added a lightweight trigger-evaluation section so future posture changes can be checked against should-trigger, should-not-trigger, and adjacent handoff prompts.

## [0.2.1] - 2026-03-28

### Fixed
- **Trigger posture**: changed from auto-first to hybrid — description now requires explicit exploration signals ('let's brainstorm', 'help me decide between X and Y') and adds a negative case for clear implementation requests. Removes "proactively when about to commit" language that caused excessive false positives.
- **Description length**: reduced from ~130 words to ~70 words; removed keyword-dump patterns.

### Added
- **`projection.json`**: excludes `CHANGELOG.md` from runtime surface projections, following repo projection model.

## [0.2.0] - 2026-03-18

### Changed
- **Domain-agnostic**: trigger description, context scan, constraints, and convergence guidance now adapt to any domain (business, product, strategy, not just engineering).
- **Thinking moves expanded**: from 3 (Invert, Analogize, Stress-test) to 5 — added Pre-mortem (empirically validated debiasing) and Second-order effects. Now applied at Standard (1-2) and Deep (all 5), not just Deep.
- **Framing challenge**: added guidance to ground problems with back-of-envelope calculations.
- **"Thinking partner" principle strengthened**: explicit instruction to challenge the user's framing boldly, not just extract information.
- **"YAGNI" generalized**: replaced engineering-specific term with domain-agnostic "solve the confirmed problem" principle.
- **Type 1/Type 2 decisions**: integrated Bezos's reversibility framework into bias-toward-action principle.
- **Exit criteria**: now explicitly verified in conversation for Deep scope (previously implicit).

### Added
- **Domain-adaptive framework suggestions**: Phase 2.4 detects the domain and suggests 1-2 relevant frameworks from the reference file.
- **`references/thinking-frameworks.md`**: curated toolkit of 12 frameworks organized by domain (Product, Strategy, Decision-Making, Universal). Includes First Principles, JTBD, PR/FAQ, Porter's Five Forces, Wardley Mapping, Type 1/Type 2, Pre-mortem protocol, Scenario Planning, MECE, Hypothesis-Led, DFV check, Friction Logs.
- **Domain Selection Guide**: table mapping problem types to recommended frameworks.
- **Temporal lens**: thinking move for checking decisions against multiple time horizons (1 month / 1 year / 5 years).

### Removed
- Engineering-only language: "codebases", "architecture", "YAGNI" as standalone terms.
- "Design for isolation" replaced with domain-agnostic "Design for clarity".

## [0.1.0] - 2026-03-18

### Added
- Initial release: brainstorming skill combining best practices from 5 community skills.
- Scope-adaptive process (Quick / Standard / Deep) — ceremony scales to task complexity.
- 5-phase flow: Orient → Understand → Explore → Converge → Capture.
- Hard Gate preventing premature implementation.
- Understanding Lock with explicit confirmation before design (Standard/Deep).
- Non-functional requirements handling with assumption marking.
- Three Thinking Moves for Deep scope: Invert, Analogize, Stress-test.
- Decision Brief (Standard) and Design Decision Record (Deep) output formats.
- Platform compatibility: Claude Code, Codex, Gemini, Claude.ai.
- User language detection for all output.
- Exit criteria checklist ensuring completeness before handoff.
