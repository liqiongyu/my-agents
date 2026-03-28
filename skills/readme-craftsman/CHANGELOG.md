# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.4] - 2026-03-28

### Added

- Added `references/section-guide.md` so the large section matrices, Markdown examples, and formatting reminders can stay available without bloating the main runtime workflow
- Added a dedicated eval guide in `eval/README.md`
- Added `eval/quality-cases.json` with lightweight qualitative review cases for OSS library, docs, dataset, and community README work
- Expanded `eval/trigger-cases.json` with near-miss and overlap-sensitive review prompts so the `manual-first` trigger boundary is exercised more realistically

### Changed

- Slimmed the main `SKILL.md` by moving the Section Matrix and Section Writing Guide into the new section guide reference while keeping the create/update/review workflow in the core file
- Removed low-value runtime prose from the main skill body so the projected surfaces stay focused on actionable README guidance

### Fixed

- Repaired the nested Markdown fence in the installation example by moving the example into the new section guide with a valid outer fence
- Aligned the Codex projection metadata with the projected file set so excluded entrypoints like `CHANGELOG.md` no longer survive in projected `skill.json`

## [1.1.3] - 2026-03-28

### Added

- Added `eval/trigger-cases.json` with lightweight trigger-boundary cases covering explicit README requests and adjacent non-README documentation tasks

### Changed

- Repositioned the skill as `manual-first` by tightening the frontmatter and `skill.json` descriptions around explicit README work only
- Added a dedicated `When Not To Use` section plus a stronger Step 1 negative boundary for non-README documentation requests
- Expanded create-mode interview prompts to cover documentation sites, blogs/content collections, and community/resource hubs
- Updated `projection.json` to keep the new author-only `eval/` fixtures out of runtime projections
- Compressed the four runtime template reference files from long example-heavy drafts into compact section-order guides so the projected skill carries less context while preserving project-type coverage

### Fixed

- Reconciled the main README exclusion guidance with the template references so brief navigational links to `LICENSE`, `CONTRIBUTING.md`, and similar files are allowed without duplicating full policy text
- Reworded community template guidance so contribution rules stay link-first instead of asking the README to duplicate the full guideline file
- Renamed the dataset template's inline change history section to `Dataset Version Notes` so it does not conflict with repositories that already have a dedicated changelog

## [1.1.2] - 2026-03-27

### Added

- `projection.json` to exclude `CHANGELOG.md` from runtime surface projections

### Fixed

- SKILL.md frontmatter description rewritten to `hybrid` invocation posture (was `auto-first`); removed "even if they don't explicitly say README" language and long synonym list
- `skill.json` description was stale (v1.0 wording, missing 6 non-code project types added in v1.1.0); kept comprehensive for catalog discovery
- `.agents/` projection had stale `skill.json` (v1.1.1) and an unnecessary `CHANGELOG.md`; both corrected
- Interview step (Step 4) was software-project-centric; added type-specific questions for datasets, academic repos, and tutorials
- Community project type in Step 3 now distinguishes three sub-types (Awesome List, Organization Profile, Resource Hub) with signals for choosing between them
- "Always Required" in Section Matrix clarified: "Getting Started" may be omitted or adapted for community repos like awesome lists
- Update mode "show a diff" guidance expanded with concrete before/after vs. change-summary options
- Step 1 now explicitly handles placeholder README edge case (treat as Create mode, not Update)

## [1.1.1] - 2026-03-26

### Changed
- Promoted maturity from beta to stable.

## [1.1.0] - 2026-03-25

### Added

- Six new project types: Documentation/Knowledge Base, Tutorial/Course, Blog/Content, Dataset, Academic Research, Community/Organization
- Non-code analysis signals for detecting doc sites, datasets, academic repos, tutorials, blogs, and community repos
- Second Section Matrix table for Content, Research & Community project types
- Three new reference template files: templates-content.md, templates-research.md, templates-community.md
- Non-code change mapping in Update Mode (new chapters, data files, curated entries, paper revisions)
- Examples for awesome list and dataset README generation

### Changed

- Quality Checklist items made universal (no longer assume code-only projects)
- Analysis step now detects both code and non-code project signals
- Project type classification now organized into 4 categories with per-category reference file pointers

## [1.0.0] - 2026-03-25

### Added

- Three task modes: Create, Update, and Review
- Deep codebase analysis pipeline (metadata extraction, directory structure, tech stack detection)
- Seven project type classifications with adaptive section selection (OSS Library, Web Service, CLI Tool, Personal, Internal, Monorepo, Config)
- Section matrix mapping sections to project types
- Quality principles: cognitive funneling, show-don't-claim, copy-pasteable commands
- Anti-pattern detection checklist
- Modern GitHub Markdown guidance: Mermaid diagrams, admonitions, collapsible sections, dark/light mode images
- Update mode with change detection, section mapping, and style preservation
- Review mode with reality-check audit and prioritized findings
- Badge reference guide
- Project-type-specific README templates in references/templates.md
- Cross-agent compatibility (Claude Code, Codex, and similar agents)
