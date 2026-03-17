# Search Strategies Reference

Detailed guidance for constructing effective search queries during the research pipeline.

## Query Construction Patterns

### Be Specific with Context

```
Bad:  "AI trends"
Good: "enterprise AI adoption trends 2026"

Bad:  "climate change"
Good: "climate change policy impact developing countries 2025-2026"
```

### Include Authoritative Source Hints

```
"[topic] research paper"
"[topic] McKinsey report"
"[topic] Gartner analysis"
"[topic] Nature study"
"[topic] government report"
"[topic] WHO guidelines"
```

### Search for Specific Content Types

| Content Type | Query Modifiers |
|---|---|
| Data & statistics | `"statistics"`, `"data"`, `"numbers"`, `"market size"`, `"survey results"` |
| Case studies | `"case study"`, `"implementation"`, `"success story"`, `"real-world example"` |
| Expert opinions | `"expert analysis"`, `"interview"`, `"commentary"`, `"perspective"` |
| Trends | `"trends [year]"`, `"forecast"`, `"future of"`, `"predictions"` |
| Comparisons | `"vs"`, `"comparison"`, `"alternatives"`, `"versus"`, `"benchmark"` |
| Challenges | `"challenges"`, `"limitations"`, `"criticism"`, `"risks"`, `"downsides"` |

### Keyword Variation Strategy

For each sub-question, generate 2–3 query variations by:

1. **Synonyms**: "artificial intelligence" ↔ "AI" ↔ "machine learning"
2. **Scope shift**: broad → narrow → adjacent ("electric vehicles" → "EV battery technology" → "lithium mining")
3. **Perspective shift**: technical → business → regulatory ("CRISPR gene editing" → "CRISPR market opportunity" → "CRISPR FDA regulation")

## Temporal Search Precision

### Rules

1. Always reference the actual current date from context — never hardcode a past year
2. Match temporal precision to user intent (see table below)
3. Try multiple date phrasings across different queries
4. Combine temporal qualifiers with topic keywords

### Precision Table

| User Intent | Temporal Precision | Example Queries |
|---|---|---|
| "today" / "just now" / "breaking" | Day + Month + Year | `"tech news March 17 2026"`, `"tech news 2026-03-17"`, `"latest tech today March 17"` |
| "this week" | Week range | `"releases week of March 15 2026"`, `"this week technology news March 2026"` |
| "recently" / "latest" / "new" | Month + Year | `"AI breakthroughs March 2026"`, `"recent developments March 2026"` |
| "this year" / "trends" | Year | `"software trends 2026"`, `"market outlook 2026"` |
| "last year" / "past year" | Previous year | `"annual report 2025"`, `"year in review 2025"` |

### Common Temporal Mistakes

```
Bad:  User asks "what's new in AI today" → searching "AI news 2026"
      (year-only query will NOT surface today's news)

Good: User asks "what's new in AI today" → searching "AI news March 17 2026" + "AI latest today"
      (day-level precision surfaces same-day results)
```

## Iterative Refinement

Research is iterative. After each round of searches:

1. **Review**: what has been learned so far?
2. **Identify gaps**: which sub-questions remain unanswered?
3. **Refine queries**: formulate more targeted searches based on terminology discovered in sources
4. **Follow leads**: when sources reference other important studies, reports, or data — search for those directly
5. **Repeat**: continue until the synthesis checklist is satisfied

## Search Tool Usage Patterns

### With firecrawl MCP

```
# Search for sources
firecrawl_search(query: "<keywords>", limit: 8)

# Read full content of a promising source
firecrawl_scrape(url: "<url>")

# Crawl a site for related pages
firecrawl_crawl(url: "<base_url>", limit: 5)
```

### With exa MCP

```
# Basic search
web_search_exa(query: "<keywords>", numResults: 8)

# Time-filtered search (for recency)
web_search_advanced_exa(query: "<keywords>", numResults: 5, startPublishedDate: "2025-01-01")

# Read full content
crawling_exa(url: "<url>", tokensNum: 5000)
```

### With built-in tools

```
# Search
WebSearch(query: "<keywords>")

# Read full content
WebFetch(url: "<url>", prompt: "Extract key findings, data, and quotes about [topic]")
```

### Mixing tools for best coverage

When multiple search tools are available, assign different keyword variations to different tools. For example:
- firecrawl: general keyword queries
- exa: time-filtered and academic-oriented queries
- WebSearch: news and current event queries

This maximizes source diversity and coverage.

## Source Diversity Checklist

Before moving to the Read phase, verify search results cover:

- [ ] At least 2 different search tools used (if available)
- [ ] Multiple keyword variations tried per sub-question
- [ ] Mix of source types: academic, news, official, expert blog
- [ ] Both supporting and contrarian viewpoints represented
- [ ] Recent sources (last 12 months) prioritized where relevant
- [ ] Multiple geographic or industry perspectives (if applicable)
