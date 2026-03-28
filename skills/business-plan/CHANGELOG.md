# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-03-28

### Changed
- Tightened the trigger posture from an effectively auto-first description to a conservative hybrid boundary.
- Added explicit `When Not To Use` guidance and adjacent-skill handoffs for `brainstorming`, `deep-research`, `pptx`, `docx`, and `xlsx`.
- Reframed platform guidance to keep the canonical core platform-neutral instead of naming surface-specific question APIs.
- Added explicit freshness and sourcing rules for time-sensitive market, funding, regulatory, and valuation claims.

### Added
- `projection.json` so runtime projections can exclude author-only eval files and the changelog.
- `eval/README.md` documenting the full-workflow and trigger-posture eval fixtures.
- `eval/trigger-posture-cases.json` to test hybrid routing boundaries and adjacent-skill handoffs.
- A stronger universal quality checklist covering sourced dates and caveated legal / regulatory guidance.

## [1.0.1] - 2026-03-26

### Changed
- Promoted maturity from beta to stable.

## [1.0.0] - 2026-03-18

### Added
- Complete rewrite merging four community business plan skills into a unified, comprehensive skill.
- **Workflow routing**: auto-detects intent and routes to the appropriate workflow (Business Plan, Financial Analysis, Market Analysis, Pitch Deck, Strategic Review, Valuation).
- **Interactive guidance**: adaptive question-driven process that gathers context before generating output, inspired by brainstorming skill patterns.
- **Stage adaptation**: detects business stage (Idea → Pre-revenue → Early Revenue → Growth → Mature) and adjusts depth, frameworks, and output accordingly.
- **Scale flexibility**: works for solopreneurs, startups, SMEs, and enterprises.
- **Modern frameworks**: Lean Canvas, Value Proposition Canvas, Blue Ocean Strategy tools alongside traditional BMC, SWOT, and Porter's Five Forces.
- **Rich financial modeling**: DCF, comparables, venture method, sensitivity analysis, industry benchmarks, red flag detection.
- **Practical wisdom**: honesty rules for projections, common mistakes to avoid, plan maintenance guidance.
- **Multiple output formats**: full business plan document, pitch deck outline, executive one-pager, or canvas view from the same analysis.
- **Platform compatibility**: works across Claude Code, Codex, Gemini, and Claude.ai.
- Reference files for each workflow: `business-plan-workflow.md`, `financial-analysis.md`, `market-analysis.md`, `pitch-deck.md`, `strategic-review.md`, `valuation.md`, `frameworks.md`.
- **China fundraising guide** (`cn-fundraising.md`): BP format differences, VIE/红筹 corporate structure, valuation language (PS/PE, 对赌协议), 赛道叙事 framework, AI regulatory compliance (生成式AI管理办法, 算法备案, PIPL), government resources (高新技术企业, 专精特新, 产业园补贴), exit paths (科创板/创业板/港股/美股), dual-market fundraising guidance.
- **AI/Agent industry guide** (`ai-agent-industry.md`): Inference cost structure and unit economics, AI-specific moat framework (data flywheel, workflow integration, domain expertise, distribution, compound intelligence), platform risk analysis and mitigation, layer-based competitive mapping, value-based and wedge-and-expand market sizing, global AI regulatory landscape, comprehensive investor questions checklist, AI financial modeling patterns, positioning strategy frameworks.
