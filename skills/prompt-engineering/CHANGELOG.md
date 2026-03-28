# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.1] - 2026-03-28

### Changed
- Reframed the canonical skill as a manual-first workflow skill with clearer boundaries against quick technique lookup and general LLM-adjacent tasks.
- Removed platform-specific invocation wording from the shared core so the canonical package stays portable across Codex and Claude Code.
- Slimmed `SKILL.md` by replacing the long inline technique cookbook with a workflow-first structure plus a compact technique selection guide that points readers to the deeper references.
- Added explicit validation, evaluation, and projection guidance to the canonical skill package.
- Tightened `skill.json` description and tags so package metadata matches the manual-first workflow posture.

### Added
- Added `projection.json` so runtime projections can exclude author-only artifacts.
- Added a lightweight eval suite under `eval/` for realistic prompt-work scenarios.

## [0.2.0] - 2026-03-27

### Changed
- Rewrote frontmatter `description` from keyword-dump (~230 words) to manual-first posture (~40 words) with an explicit negative boundary against quick technique-lookup requests.
- Declared invocation posture as `manual-first` in the skill body.
- Added `## When Not to Use` section to prevent overreach into technique-lookup and general coding requests.
- Fixed incorrect "Gemini 3" reference in `references/cross-model-guide.md` → "Gemini 2.x+".

## [0.1.0] - 2026-03-25

### Added
- Initial release: comprehensive prompt engineering skill fusing best practices from 7 community skills and deep research.
- **Core workflow**: 3 workflows — Create new prompt, Optimize existing prompt, Design agent system prompt.
- **Progressive Disclosure framework**: 5-level escalation from simple instructions to full scaffolding.
- **Freedom-level calibration**: High/Medium/Low freedom framework for agent system prompts.
- **Context Engineering principles**: Token budgeting, position optimization, progressive disclosure, history compression.
- **Quality Gates**: Quantified checklist for production readiness.
- **Reference: Advanced Reasoning** (`references/advanced-reasoning.md`): CoT variants, Tree of Thought, ReAct, Self-Consistency, Self-Refine/Reflexion, Meta-Prompting with decision flow.
- **Reference: Cross-Model Guide** (`references/cross-model-guide.md`): Claude/GPT/Gemini/open-source specific practices, migration checklist, model-agnostic writing tips.
- **Reference: Production Patterns** (`references/production-patterns.md`): Versioning, A/B testing, LLM-as-judge evaluation, token optimization, prompt caching, chains/pipelines, monitoring.
- **Reference: Security Patterns** (`references/security-patterns.md`): Layered defense architecture, injection detection, sandwich defense, output validation, OWASP LLM Top 10 coverage.
- Tool-agnostic design: works with Claude Code, Codex, Cursor, API integrations, or chat interfaces.
