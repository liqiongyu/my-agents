# Search Playbook

Use this reference for the detailed discovery and collection workflow.

## Tool Mapping

Map the actions in this skill to the tools available in the current environment.

| Action | Tool options |
| --- | --- |
| Search the web | `WebSearch`, `web_search`, `tavily_search`, browser search |
| Read a web page | `WebFetch`, `web_fetch`, `firecrawl_scrape`, `browse`, `read_url` |
| Run CLI commands | `Bash`, `shell`, `terminal` |
| Search GitHub | `gh` CLI or GitHub MCP tools |

If the environment lacks web access, say so and ask the user for URLs or local
source material.

## Depth Modes

| Mode | Target candidates | Analysis depth | Use when |
| --- | --- | --- | --- |
| Quick | 5-7 skills | key patterns plus concise comparison | narrow topic, limited time, or user already knows the landscape |
| Standard | 8-15 skills | full pattern analysis plus fusion strategy | default for most skill projects |
| Deep | 15-25+ skills | broad survey plus detailed teardown and adaptation analysis | novel or high-stakes domains |

Do not assume a mode for broad discovery. If Quick, Standard, or Deep was not
specified, stop and ask before launching an open-ended ecosystem search.

If the user already supplied a bounded source set and explicitly wants a narrow
comparison, keep the work constrained to that scope instead of forcing a depth
mode choice first.

## Search Tiers

### Tier 1: CLI and API Search

Start with the highest-signal sources you can query directly.

```bash
npx skills find "<topic>"
npx skills find "<synonym-1>"
npx skills find "<synonym-2>"

gh search code "filename:SKILL.md <topic>" --limit 20
gh search code "path:.claude/skills <topic>" --limit 20
gh search repos "topic:claude-skills <topic>" --sort stars --limit 10
gh search repos "topic:agent-skills <topic>" --sort stars --limit 10
```

Use 2-3 keyword variations for the topic.

### Tier 2: Web Search

Use broader search when CLI coverage is incomplete.

```text
site:github.com SKILL.md <topic>
<topic> skill claude code
<topic> agent skill SKILL.md
site:cursor.directory <topic>
```

### Tier 3: Known Collections

Browse curated collections for what search may have missed.

- `https://github.com/hesreallyhim/awesome-claude-code`
- `https://github.com/VoltAgent/awesome-agent-skills`
- `https://github.com/anthropics/skills`
- `https://github.com/openai/skills`
- `https://github.com/alirezarezvani/claude-skills`
- `https://github.com/rohitg00/awesome-claude-code-toolkit`

For Standard mode and above, also consider cross-platform prompt/rule
collections. For Deep mode, expand into broader marketplaces only if the added
breadth is likely to surface genuinely different approaches.

## Parallelism

For Standard and Deep modes, parallelize by tier or by candidate batch when the
environment supports it. Keep one session responsible for deduplication and
sample quality.

## Candidate List Format

Present a concrete, deduplicated list before any deep analysis:

```text
| # | Name | Source | URL | Signals | Notes |
|---|------|--------|-----|---------|-------|
| 1 | ...  | GitHub | ... | ...     | ...   |
```

Ask the user whether to proceed, add candidates, remove candidates, or narrow
the set. Stop there until they answer.

## Collection Guidance

After approval:

1. fetch the actual skill file or equivalent prompt content
2. capture metadata such as stars, version, author, and recency when useful
3. note the file layout and any supporting references or scripts
4. summarize very large files instead of copying them wholesale
5. drop irrelevant lookalikes and say why
