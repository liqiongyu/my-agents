# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.4] - 2026-03-29

### Added
- Added `eval/smoke-cases.json`, a lightweight regression suite that sits between trigger-posture checks and the heavier full-method cases.
- Expanded the eval README with validation and quick-start commands for the new smoke suite, plus guidance on when to run trigger-only vs smoke vs full-method evaluation.

## [0.2.3] - 2026-03-29

### Added
- Added a lightweight Quick output template/checklist so low-depth architecture answers still preserve a minimum decision contract.
- Connected Phase 5 evidence detours to the `Specialist Evidence Summary` template when a research or specialist-skill branch is non-trivial.

### Changed
- Synced the eval fixture versions to the package version and updated eval README commands to use `uv run python` for consistency with repo Python workflow conventions.

## [0.2.2] - 2026-03-29

### Fixed
- Tightened context-grounding guidance so the skill only uses active repository or project details when the user is clearly asking about that system, instead of overfitting generic architecture prompts to incidental local context.

### Changed
- Updated the package description and methodology guidance to make assumptions explicit when the prompt is generic or hypothetical.

## [0.2.1] - 2026-03-29

### Added
- Added a structured eval suite under `eval/eval-cases.json` covering full-method architecture cases plus boundary redirects to research, review, and implementation planning.
- Added `eval/trigger-posture-cases.json` to test the skill's `manual-first` routing, adjacent-workflow boundaries, and first-step behavior.
- Added `eval/README.md` with validation, seeding, and suggested usage for the new evaluation fixtures.

## [0.2.0] - 2026-03-29

### Changed
- Reworked the skill from a mostly workflow-shaped architecture guide into a stronger architecture methodology that is explicitly problem-first, uncertainty-aware, and decision-governed.
- Expanded the main workflow to cover decision classification, criteria and guardrails, social-technical system mapping, uncertainty handling, and review triggers.
- Strengthened the references and output templates so architecture decisions now capture current alternatives, uncertainty maps, governance notes, and pilot/spike appendices when needed.

### Added
- Problem-first framing guidance so the skill separates user/team pain from preferred tools or architecture styles.
- Decision-shape guidance for clear/complicated/complex problems and one-way-door versus two-way-door choices.
- Social-technical fit checks covering dependency hotspots, ownership, decision rights, and team operability.
- Explicit cost, opportunity-cost, and uncertainty handling guidance, including pre-mortems, worse-first dips, and stop/continue/revisit triggers.

## [0.1.0] - 2026-03-29

### Added
- Initial release of `future-aware-architecture` as a `manual-first`, technology-agnostic architecture workflow.
- Core workflow covering framing, option generation, specialist evidence gathering, trade-off evaluation, decision capture, and downstream handoff.
- Reference guides for the reusable methodology and durable output templates.
