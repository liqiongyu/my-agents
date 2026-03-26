# Changelog

All notable changes to this skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
