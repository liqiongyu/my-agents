# Deep Research Skill — Evaluation Suite

## Overview

This directory contains a structured evaluation suite for the `deep-research` skill. The suite tests whether the skill produces reports that meet its documented quality standards across diverse scenarios: language handling, research frameworks, temporal awareness, and citation integrity.

## Test Cases

| ID | Language | Domain | Expected Framework | Key Test Focus |
|----|----------|--------|--------------------|----------------|
| eval-1 | Chinese | Technology comparison (Rust vs Go) | Argument Mapping | Balanced multi-perspective comparison, Chinese output |
| eval-2 | English | Current events (Nuclear fusion 2026) | 5W1H | Temporal awareness, matches SKILL.md worked example |
| eval-3 | Chinese | Market analysis (NEV in SE Asia) | PESTEL | Macro-environment coverage, strategic recommendations |

## Assertions (9 per case)

Each case is evaluated against the same 9 assertions:

1. **language_correct** — Report language matches the request language
2. **inline_citations** — Uses numbered `[N]` inline citations (>= 10 distinct markers)
3. **executive_summary** — Contains a labeled executive summary section
4. **credibility_tiers** — Source list includes credibility tier annotations (Tier 1-5)
5. **consensus_debate** — Has both "areas of consensus" and "areas of debate" sections
6. **coverage_breadth** — Covers >= 3 distinct angles or perspectives
7. **real_data** — Contains >= 5 specific real-world data points (names, numbers, dates)
8. **sources_minimum** — Bibliography has >= 8 unique sources with URLs
9. **no_hallucinated_urls** — All cited URLs appear in tool call logs (none fabricated)

## How to Run

### Prerequisites

- The `deep-research` skill must be installed (via `npm run install-skill -- deep-research`)
- Network access must be available (the skill requires web search and fetch tools)
- Tool call logging must be enabled so that `no_hallucinated_urls` can be verified

### Manual Execution

Run each eval case by providing the prompt to an agent session with the skill loaded:

```bash
# Example: run eval-1 with Claude Code
# Start a session with the skill available, then paste the prompt from eval-cases.json

claude --skill deep-research
```

Alternatively, paste the prompt directly:

```
# eval-1
对比分析 Rust 和 Go 在后端开发中的优劣势，包括性能、开发效率、生态系统成熟度、以及大厂采用情况。请给出选型建议。

# eval-2
Research the current state of nuclear fusion energy in 2026. What are the latest breakthroughs, which companies are closest to commercialization, and what's the realistic timeline?

# eval-3
调研中国新能源汽车出海东南亚的市场机会，分析政策环境、竞争格局、消费者偏好、以及主要挑战。请给出进入策略建议。
```

### Evaluation Procedure

For each case:

1. **Capture output**: Save the full report output and, if possible, the tool call log (search queries executed, URLs fetched).
2. **Score each assertion**: Review the output against the 9 assertion definitions in `eval-cases.json`. Score each as pass (1), partial (0.5), or fail (0).
3. **Record results**: Note the score and any specific failures or observations.

### Scoring

- Each assertion: pass = 1, partial = 0.5, fail = 0
- Max per case: 9 points
- Max total: 27 points
- A case passes if it scores >= 75% (6.75+ points)
- The suite passes if all 3 cases pass individually

### Special Evaluation Notes

- **no_hallucinated_urls**: This assertion requires access to the tool call log. Compare every URL in the report's source list against the URLs that appear in WebSearch results and WebFetch calls. Any URL not present in the logs is a fabrication.
- **temporal_checks (eval-2)**: Verify that search queries in the tool call log include "2025" or "2026" as temporal qualifiers, not only older years. The report should reference recent events, not present outdated information as current.
- **pestel_coverage (eval-3)**: Verify that the report addresses at least 4 of the 6 PESTEL factors (Political, Economic, Social, Technological, Environmental, Legal) with substantive analysis for each.

## File Structure

```
eval/
  eval-cases.json   # Machine-readable eval definitions, assertions, and scoring
  README.md         # This file — human-readable instructions
```
