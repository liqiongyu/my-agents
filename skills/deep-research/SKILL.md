---
name: deep-research
description: Use when the user explicitly asks for comprehensive, citation-backed research such as a deep dive, due diligence, market analysis, or a multi-source comparison/report. Do not activate for quick factual lookups, ordinary coding tasks, or routine content generation unless the user first asks for research or source verification.
version: 0.4.1
---

# Deep Research

Conduct comprehensive, citation-backed web research through a systematic multi-phase pipeline. Deliver structured reports with verified sources, cross-referenced findings, and quality-gated output.

## When to Activate

- **Research requests**: "research X", "deep dive into Y", "investigate Z", "what's the current state of X"
- **Comparison/analysis**: "compare X and Y", "X vs Y", "competitive analysis of X"
- **Due diligence**: company research, technology evaluation, market sizing
- **Pre-content research**: before creating presentations, articles, or designs requiring factual data
- **Current events**: "what's happening with X", "latest news on Y"

## When Not To Use

- **Quick factual lookups**: a short answer, one-off fact check, or lightweight browse-and-answer task
- **General coding work**: implementation, debugging, refactoring, or code review where research is not the main deliverable
- **Routine content creation**: drafting slides, articles, or designs unless the user explicitly asks for research or source verification first
- **Narrow latest-status requests**: a brief "what changed" or "what's the latest" answer that does not justify a full research pipeline

## Depth Modes

Select a mode based on the scope and complexity of the request. Announce the selected mode and estimated effort before starting.

| Mode | Min Sub-questions | Min Sources | Report Length | Use When |
|------|-------------------|-------------|---------------|----------|
| **Quick** | 2–3 | 5+ | 500–1,500 words | Scoped research questions or lightweight comparisons that still need multi-source verification |
| **Standard** | 3–5 | 10+ | 2,000–5,000 words | Most research requests, topic overviews |
| **Deep** | 5–8 | 20+ | 5,000–15,000+ words | Comprehensive analysis, due diligence, strategy |

These are **minimums, not caps**. Always collect more sources when available — more evidence produces better synthesis.
Quick mode is still a research pass. If the user only needs a brief factual answer or a single latest-status check, do not activate this skill; handle it with ordinary browsing instead.

Default to **Standard** unless the request is clearly simple or explicitly comprehensive.

## Effort Guardrails

Start with the smallest mode that can satisfy the user's goal.

Stop expanding when:
- the user's core question is already answered well enough to support a decision
- the selected mode's minimums are met and the most recent sources are mostly repetitive
- remaining gaps are low impact and should be called out as limitations instead of chased indefinitely

Escalate to a deeper mode only when:
- the user explicitly asks for exhaustive or durable research output
- the topic is high-stakes, multi-sided, or likely to be misleading without broader coverage
- important contradictions remain unresolved after the current mode's pass

Use parallel workers conservatively:
- **Quick**: usually stay in the main session
- **Standard**: usually 2–3 search workers are enough
- **Deep**: expand only when extra workers materially improve coverage rather than duplicating search effort

## Tool Discovery

Map the generic research actions in this skill to whatever tools the current environment provides:

| Action | Tool options (use whichever is available) |
|--------|------------------------------------------|
| **Search the web** | `WebSearch`, `web_search`, `firecrawl_search`, `web_search_exa`, `tavily_search`, browser search |
| **Read a full page** | `WebFetch`, `web_fetch`, `firecrawl_scrape`, `crawling_exa`, `browse`, `read_url` |

Detection priority: MCP tools (firecrawl, exa) → built-in tools (WebSearch, WebFetch) → CLI fallback (curl, browser automation). When multiple search tools exist, combine them for broader coverage.

If the environment has no web access, inform the user and work with existing knowledge, clearly noting that claims could not be verified against current sources.

## Research Pipeline

### Phase 1: Plan

1. Parse the request to identify the core question, purpose, and context
2. Select the appropriate depth mode
3. Decompose the topic into targeted sub-questions (minimum counts per mode table above)
4. For structured topics, select an applicable research framework from `references/research-frameworks.md` (PESTEL for market/industry, 5W1H for general topics, Argument Mapping for controversial/debate topics)

The initial sub-question list is a **starting point, not a ceiling**. New dimensions discovered during search should be added as additional sub-questions. Skip clarifying questions unless the request is genuinely ambiguous. Proceed with reasonable defaults and announce the plan.

### Phase 2: Search

Execute multi-angle searches for each sub-question.

**Core search principles:**
- Use 2–3 keyword variations per sub-question
- Apply temporal qualifiers using the actual current date — consult `references/search-strategies.md` for precise patterns
- Mix general, academic, and news-focused queries
- Seek 6 information types: facts/data, examples, expert opinions, trends, comparisons, challenges/limitations

**Iterative expansion:** After completing initial searches, review findings for emerging dimensions not covered by the original sub-questions (adjacent technologies, emerging trends, cross-domain implications). Add these as new sub-questions and search for them. The goal is to exceed the minimum sub-question count, not just meet it.

**Parallel execution (Standard and Deep modes):**
Launch parallel search agents via the Task or Agent tool only when the added breadth justifies the extra cost and context. Each agent independently searches and collects findings; the main session merges all results.

Pattern for a 5-sub-question Standard research:
```
Agent 1: sub-questions 1–2 (search + collect URLs + extract key data)
Agent 2: sub-questions 3–4 (search + collect URLs + extract key data)
Agent 3: sub-question 5 + cross-cutting themes (search + collect URLs + identify contradictions)
Main session: merge findings → Phase 3 (Read) → Phase 4 (Synthesize)
```

Each agent should return: a list of source URLs with titles, key data points per source, and any conflicting information found. Keep agent outputs factual and raw — save interpretation for the main session's synthesis phase.

### Phase 3: Read

Fetch and read full content for the most promising sources:
- Quick: at least 3–5 sources | Standard: at least 5–10 sources | Deep: at least 10–20 sources
- Prioritize by credibility hierarchy — see `references/quality-standards.md`
- Extract specific data points, statistics, quotes, and evidence
- Follow references: when a source cites important studies or reports, search for those too
- Read more sources when available — quantity feeds quality in synthesis

**When to read a source in full** (not just the snippet):
- The source looks highly relevant and authoritative (Tier 1–3)
- The snippet contains a claim that needs full context to verify
- The source contains data tables, case studies, or expert analysis
- The snippet mentions specific numbers or conclusions that need surrounding methodology

Never rely solely on search snippets — key nuances, caveats, and data live in the full text.

### Phase 4: Synthesize

Apply the anti-hallucination protocol (detailed in `references/quality-standards.md`):
- **Cite immediately**: every factual claim followed by `[N]` citation in the same sentence
- **Cross-reference**: major claims require 2+ independent sources
- **Distinguish**: facts (cited) vs. analysis/inference (labeled as such)
- **Flag**: single-source claims as "unverified from single source"
- **Acknowledge gaps**: state what could not be found rather than filling with general knowledge
- **No fabrication**: if insufficient data, state "insufficient data found" explicitly

Structure the report using templates from `references/report-templates.md` as a **starting point**. Required sections:
- Executive summary (3–5 sentences)
- Thematic sections with inline citations
- Areas of consensus and areas of debate
- Key takeaways / recommendations
- Complete source list with credibility annotations
- Gaps and further research needed

**Practical decision aids** — go beyond narrative analysis by including actionable tools where the topic warrants them:
- **Comparison topics**: quantitative scoring matrices with weighted criteria, side-by-side feature tables
- **Technology/product selection**: decision trees or scenario-based recommendation tables ("if X, choose Y")
- **Architecture topics**: ASCII or text-based architecture diagrams showing component relationships
- **Market/strategy topics**: SWOT tables, opportunity-risk matrices, or entry strategy frameworks

These elements transform a report from "informative" to "actionable". Templates are guidelines — add sections that serve the reader's decision-making needs.

### Phase 5: Deliver

**Output by mode:**
- **Quick**: full report inline in chat
- **Standard**: executive summary + key takeaways inline; full report saved to file if >3,000 words
- **Deep**: executive summary inline; full report saved to `[Topic]_Research_[YYYYMMDD].md`

**Quality gate — verify before delivery by answering ALL of these:**
- What are the key facts and quantitative data points? (must have citations)
- What are 2–3 concrete real-world examples or case studies?
- What do recognized experts or authoritative sources say?
- What are the current trends and likely future directions?
- What are the challenges, risks, or limitations?
- Where do sources agree, and where do they meaningfully disagree?

Also check:
- [ ] Minimum source count met for selected mode
- [ ] No placeholder text, TODOs, or incomplete sections
- [ ] Each thematic section has 2+ substantive paragraphs (not just bullets)

**Auto-continuation (Deep mode):** When a report exceeds output limits, save progress with a continuation marker (sections completed, citations used, next sections planned) and spawn a continuation agent to complete the remaining sections.

## Temporal Awareness

Always check the actual current date from context before forming search queries. Match temporal precision to user intent — use month + day for "today" queries, month for "recently", year for "trends". Never drop to year-only when day-level precision is needed. Consult `references/search-strategies.md` for the full precision table and examples.

## Worked Example

**User request**: "Research the current state of nuclear fusion energy"

**Phase 1 — Plan** (Standard mode, 4 initial sub-questions):
1. What are the leading fusion approaches and latest milestones?
2. Which companies and projects are closest to commercialization?
3. What are the remaining technical and engineering challenges?
4. What is the timeline and investment landscape?

Framework: 5W1H (general technology overview).

**Phase 2 — Search** (3 parallel agents + iterative expansion):
- Agent 1: sub-questions 1–2 → searches "nuclear fusion breakthrough 2026", "fusion energy companies commercial", "NIF ignition results latest"
- Agent 2: sub-questions 3–4 → searches "fusion reactor engineering challenges", "fusion energy investment 2025 2026", "fusion commercialization timeline"
- Agent 3: cross-cutting → searches "fusion vs fission comparison", "fusion energy criticism limitations", "ITER project status 2026"

After merging agent results, **new dimensions discovered**:
- Tritium supply chain constraints (emerged from engineering challenges sources)
- Regulatory frameworks for commercial fusion (emerged from timeline sources)

→ Add these as sub-questions 5–6 and search for them.

**Phase 3 — Read**: fetch full content from top 10+ sources (DOE reports, Nature articles, company press releases, industry analyses).

**Phase 4 — Synthesize**: structure findings into: Executive Summary → Approaches & Milestones → Key Players → Technical Challenges → Investment & Timeline → Consensus → Debate → Sources. Apply citation protocol. Add decision aids if the user needs to evaluate fusion investment.

**Phase 5 — Deliver**: post executive summary + key takeaways inline; save full report to `Nuclear_Fusion_Research_20260317.md`.

## Language Handling

Respond in the same language the user used for the request. When the user writes in Chinese, produce the full report (including section headers, analysis, and takeaways) in Chinese, while keeping source titles and URLs in their original language. Citation format and report structure remain the same regardless of language.

## Common Mistakes to Avoid

- Stopping after 1–2 searches and generating from general knowledge
- Relying on search snippets without reading full sources
- Searching only one angle of a multi-faceted topic
- Ignoring contradicting viewpoints or limitations
- Starting content generation before research is complete
- Making unsourced assertions or fabricating citations
- Hardcoding past years in temporal queries
- Generating a report entirely in English when the user asked in another language
- Treating source count targets as caps rather than minimums — more sources are always better
- Producing only narrative text without practical decision aids (matrices, diagrams, scenario tables) when the topic is a comparison or selection question

## Additional Resources

### Reference Files

For detailed guidance beyond this core workflow:

- **`references/search-strategies.md`** — Query patterns, keyword variations, temporal precision, iterative refinement techniques
- **`references/research-frameworks.md`** — PESTEL analysis, 5W1H framework, argument mapping with examples
- **`references/quality-standards.md`** — Anti-hallucination protocol, source credibility hierarchy (5 tiers), quality gates checklist, anti-fatigue checks
- **`references/report-templates.md`** — Complete output templates for Quick, Standard, and Deep modes with examples

## Compatibility

This skill is designed to work across multiple agent runtimes:
- **Claude Code**: uses WebSearch, WebFetch, Agent/Task tools
- **Codex CLI**: configure firecrawl/exa MCP in `~/.codex/config.toml`
- **Other agents**: adapt tool names to the available search and fetch capabilities
