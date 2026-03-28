# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2026-03-28

### Changed
- Tightened the frontmatter trigger and package description to reinforce a `manual-first` posture and distinguish deep research from ordinary browse-and-answer work.
- Clarified that `Quick` mode is still a multi-source research pass, not a catch-all for simple factual lookups.
- Added effort guardrails and conservative parallelism guidance so the workflow has clearer stop and escalation conditions.

### Added
- Explicit `When Not To Use` guidance in `SKILL.md` so negative boundaries are visible to both readers and validators.

### Fixed
- Eval scoring metadata now uses the preferred strategy fields instead of legacy max-score keys.

## [0.4.0] - 2026-03-27

### Changed
- **Invocation posture**: explicitly `manual-first`; frontmatter description shortened and proactive-activation clause removed to prevent over-triggering on content generation tasks.
- **Frontmatter description**: rewritten to be boundary-heavy with explicit negative cases (quick factual questions, coding tasks, uninstructed pre-generation research).

### Added
- `projection.json`: excludes `eval/` and `CHANGELOG.md` from runtime projections.

### Fixed
- Eval iteration outputs (`output_*.md`) moved from `skills/deep-research/eval/` to `workspaces/deep-research/iteration-1/` per repo convention.

## [0.3.0] - 2026-03-17

### Added
- **Tool compatibility table**: explicit Action → Tool mapping covering `tavily_search`, `browse`, `read_url`, etc. (from previous skill version).
- **No-web-access fallback**: guidance to inform user and note unverified claims when web tools unavailable.
- **"When to read full pages"**: 4 explicit conditions for deciding when to fetch full source content vs. relying on snippets.
- **Worked example**: now demonstrates iterative dimension discovery (2 new sub-questions emerge from initial search results).

### Changed
- **Quality gate**: replaced checkbox-only format with 6 comprehension questions ("What are the key facts?", "What do experts say?", etc.) plus structural checks. Questions drive deeper thinking than checkboxes.

### Context
- Merged best practices from previous skill at `~/.claude/skills/deep-research/` — tool mapping, graceful degradation, quality questions, dimension discovery example.

## [0.2.0] - 2026-03-17

### Changed
- Source counts and sub-question counts are now **minimums, not caps** — encourages broader exploration.
- Phase 1 (Plan): initial sub-questions are a starting point; new dimensions discovered during search should be added.
- Phase 2 (Search): added **iterative expansion** step to explore adjacent/emerging dimensions beyond original sub-questions.
- Phase 4 (Synthesize): report templates are now guidelines, not rigid structures. Added **practical decision aids** guidance.

### Added
- Practical decision aid templates in `references/report-templates.md`: quantitative scoring matrix, scenario-based recommendation table, architecture diagrams, SWOT table.
- Two new common mistakes: treating source targets as caps; omitting decision aids for comparison/selection topics.
- Phase 3 (Read): explicit guidance to read more sources when available.

### Fixed
- Eval 1 showed baseline outperformed skill in source count (20 vs 14) and practical output elements (decision matrix, architecture diagram). These changes address both gaps.

## [0.1.0] - 2026-03-17
- Initial release: unified deep research skill combining best practices from 7 community skills.
- 5-phase research pipeline (Plan → Search → Read → Synthesize → Deliver).
- 3 depth modes (Quick / Standard / Deep).
- Tool-agnostic design: works with WebSearch/WebFetch, firecrawl, exa, or CLI tools.
- Anti-hallucination protocol with mandatory inline citations.
- Parallel sub-agent support for broad topics.
- Temporal awareness for current-event searches.
- Research frameworks (PESTEL, 5W1H, Argument Mapping) in references.
- Auto-continuation for reports exceeding output limits.
