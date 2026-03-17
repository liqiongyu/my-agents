# Quality Standards Reference

Detailed protocols for ensuring research accuracy, source credibility, and output quality.

## Anti-Hallucination Protocol

### Core Rules

1. **Immediate citation**: every factual claim must be followed by a `[N]` citation in the same sentence. No exceptions.
2. **No fabrication**: never invent sources, URLs, authors, statistics, or study names. If unsure, omit the claim.
3. **Insufficient data**: when adequate information cannot be found, state "insufficient data found" or "no reliable sources identified" explicitly. Do not fill gaps with general knowledge presented as researched fact.
4. **Synthesis labeling**: clearly label analysis, inference, and opinions as such. Use phrases like "Based on the evidence above..." or "Analysis:" to distinguish from cited facts.
5. **URL verification**: only include URLs that were actually visited and returned content. Never guess or construct URLs.

### Citation Format

Inline: `According to [Source Name], metric X increased by Y% [1].`

Bibliography entry:
```
[1] Author/Organization. "Title." Publication, Date. URL — [credibility tier]
```

### Anti-Fatigue Checks

Before finalizing any section, verify:
- [ ] Each major section contains at least 2–3 substantive paragraphs (not just bullet lists)
- [ ] Prose-to-bullet ratio is at least 60:40 (narrative-driven, not list-heavy)
- [ ] No placeholder text ("TODO", "TBD", "more research needed here")
- [ ] Evidence density: each paragraph contains at least one cited data point or finding
- [ ] Citation density: no gap of more than 3 sentences without a citation in factual sections
- [ ] Final sections are as detailed as opening sections (no "running out of steam" pattern)

## Source Credibility Hierarchy

Rate sources on a 5-tier scale:

| Tier | Source Type | Credibility | Usage Notes |
|------|-----------|-------------|-------------|
| **1 (Highest)** | Peer-reviewed journals, systematic reviews | Very High | Primary evidence. Cite directly with DOI when available. |
| **2** | Official reports (government, WHO, World Bank), industry standards bodies | High | Authoritative data. Note publication date. |
| **3** | Reputable news outlets (Reuters, AP, major newspapers), established industry analysts (Gartner, McKinsey) | Medium-High | Fact-checked reporting. Cross-reference with Tier 1–2 when possible. |
| **4** | Expert commentary (recognized practitioners, academics), established technical blogs | Medium | Qualified opinions. Label as expert perspective, not established fact. |
| **5** | General websites, forums, social media, unverified blogs | Low | Use only for context, trends, or sentiment. Always flag as unverified. Require independent corroboration. |

### Credibility Scoring in Practice

For the bibliography, annotate each source:
```
[1] World Health Organization. "Global Health Report 2025." WHO, 2025. https://... — Tier 2, Official report
[2] Smith, J. "Analysis of market trends." TechCrunch, 2026. https://... — Tier 3, Industry news
[3] Reddit user discussion thread on r/technology — Tier 5, Unverified community source
```

### Minimum Credibility Requirements

| Mode | Minimum Tier 1–2 Sources | Minimum Tier 1–3 Sources |
|------|--------------------------|--------------------------|
| Quick | 1 | 3 |
| Standard | 3 | 7 |
| Deep | 5 | 15 |

## Cross-Referencing Protocol

### Major Claims (require 2+ sources)

A "major claim" is any assertion that:
- Includes a specific statistic, percentage, or data point
- Describes a cause-effect relationship
- States a trend or prediction
- Could influence a decision if taken at face value

For each major claim:
1. Identify at least 2 independent sources confirming the claim
2. Note if sources agree precisely or approximately
3. If sources disagree, present both findings with citations
4. Flag any claim supported by only a single source

### Handling Contradictions

When sources contradict each other:
1. Present both positions with citations
2. Note the credibility tier of each source
3. Identify possible reasons for disagreement (methodology, date, scope)
4. State which position has stronger evidentiary support, if determinable
5. Do not arbitrarily pick one — let the reader decide

## Quality Gates by Mode

### Quick Mode Checklist
- [ ] At least 5 unique sources consulted
- [ ] At least 1 Tier 1–2 source
- [ ] All factual claims have inline citations
- [ ] Executive summary present
- [ ] No placeholder text

### Standard Mode Checklist
- [ ] At least 10 unique sources consulted
- [ ] At least 3 Tier 1–2 sources
- [ ] All major claims cross-referenced (2+ sources)
- [ ] Areas of consensus and debate identified
- [ ] Limitations and gaps section present
- [ ] Each thematic section has 2+ substantive paragraphs
- [ ] Complete bibliography with credibility annotations

### Deep Mode Checklist
- [ ] At least 20 unique sources consulted
- [ ] At least 5 Tier 1–2 sources
- [ ] All major claims cross-referenced (2+ sources)
- [ ] Single-source claims flagged as unverified
- [ ] Comprehensive areas of consensus and debate
- [ ] Detailed limitations, gaps, and further research section
- [ ] Each thematic section has 3–5 substantive paragraphs with evidence
- [ ] Methodology appendix describing search strategy and tools used
- [ ] Complete bibliography with credibility annotations (every citation accounted for)
- [ ] Anti-fatigue checks passed for all sections

## Report Review Process

Before delivering the final report:

1. **Citation audit**: verify every `[N]` in the text has a matching entry in the bibliography, and every bibliography entry is cited in the text
2. **Claim audit**: scan for assertive statements without citations — either cite or label as analysis
3. **Completeness audit**: check all planned sections are present and substantive
4. **Balance audit**: verify both supporting and contrarian viewpoints are represented
5. **Recency audit**: check that the most recent available data is used (not outdated figures when newer ones exist)
