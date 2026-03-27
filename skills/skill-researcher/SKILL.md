---
name: skill-researcher
description: >
  Search skills.sh, GitHub, awesome lists, and marketplaces to find community skills on a topic,
  stop for candidate confirmation, then analyze patterns and produce a structured fusion report as
  a research handoff for downstream skill creation. Use before creating or improving a skill when
  you want to see what already exists — "find skills for X", "survey the ecosystem", "find similar
  skills", "what's out there". Do NOT use for installing skills or general research.
version: 0.2.0
---

# Skill Researcher

Research the agent skills ecosystem to find, collect, and analyze community skills on a given topic. The output is a **Fusion Report** — a structured analysis of what exists, what patterns emerge, and how to combine the best elements into a new skill.

This skill handles the **research phase** of skill creation. By default, it stops at the research handoff: produce the Fusion Report, keep that artifact separate from the target skill package, and let a downstream creation workflow consume it later.

## When to Activate

- User wants to create a new skill and needs to survey what already exists
- User asks to "find skills for X", "research community skills", "what's out there for Y"
- User wants to compare existing community skills on a topic
- Before any skill creation workflow that should build on community knowledge
- User wants to fuse or combine the best from multiple existing skills

## When Not To Use

Do not use this skill when:

- User already has specific skill URLs/content and just wants to write — use skill-creator directly
- User wants to search for a skill to install (not to analyze for fusion) — use `npx skills find` or the platform-native installer/search flow
- General research not related to skills — use deep-research

---

## Hard Gates

These gates are mandatory whether this skill is used directly or delegated by another meta-skill.
This skill is frequently invoked as a delegated workflow by `skill-lifecycle-manager`; when delegated, the same hard gates still apply and the caller does not override them.

1. **Depth mode is a gate.** If the user has not specified Quick, Standard, or Deep, stop and ask before broad discovery begins.
2. **Candidate confirmation is a gate.** After Phase 2 produces the candidate list, stop and wait for explicit user confirmation before any Collect, Analyze, or Synthesize work.
3. **Research handoff is the default end state.** Deliver a separate Fusion Report or research artifact. Do not automatically write the target skill package or stash detailed research notes inside it unless the user explicitly asks for that shortcut after reviewing the candidate set.

---

## Tool Discovery

Map the actions in this skill to whatever tools the current environment provides:

| Action | Tool options (use whichever is available) |
|--------|------------------------------------------|
| **Search the web** | `WebSearch`, `web_search`, `tavily_search`, browser search |
| **Read a web page** | `WebFetch`, `web_fetch`, `firecrawl_scrape`, `browse`, `read_url` |
| **Run CLI commands** | `Bash`, `shell`, `terminal` |
| **Search GitHub** | `gh` CLI via shell, or GitHub MCP tools |

If the environment lacks web access, inform the user and suggest they provide skill URLs or content manually.

---

## Depth Modes

| Mode | Target Candidates | Analysis Depth | Use When |
|------|-------------------|----------------|----------|
| **Quick** | 5–7 skills | Key patterns + comparison table | Narrow topic, time-sensitive, or the user already knows the landscape |
| **Standard** | 8–15 skills | Full pattern analysis + taxonomy extraction + fusion strategy | Most skill creation projects |
| **Deep** | 15–25+ skills | Exhaustive survey + detailed per-skill teardown + cross-domain adaptation analysis | Novel domain, high-stakes skill, or comprehensive landscape analysis |

**Do not assume a mode.** If the user hasn't specified Quick, Standard, or Deep, ask them which mode they want before proceeding. Briefly explain the trade-off: more candidates = richer fusion material but longer research time. Let the user decide. This is a required gate, not an optional courtesy.

---

## Phase 1: Scope

Understand what the user wants to research before searching.

1. **Identify the topic**: What skill domain? (e.g., "code review", "prompt engineering", "brainstorming")
2. **Clarify intent**: Are they creating a new skill, improving an existing one, or just surveying the landscape?
3. **Confirm depth mode**: If the user hasn't specified Quick/Standard/Deep, ask which they prefer.
4. **Check existing work**: If working in a skill repository, check if a skill on this topic already exists locally.

**Cross-platform search is always the default.** Every search covers Claude Code skills, Codex skills, Gemini skills, Cursor rules, Copilot instructions, and other platforms. There is no "single-platform" mode — the value of this skill is precisely that it casts a wide net. If a source is platform-specific (e.g., a Cursor rule), include it in the analysis and note what adaptation is needed.

Once topic, intent, and depth are confirmed, announce the search plan: "I'll search for community skills related to [topic] across [N sources]. Target: [mode] mode, [N] candidates." If depth mode is still unresolved, stop here and ask; do not start discovery yet.

---

## Phase 2: Discover

Search across multiple source tiers systematically. The goal is to cast a wide net and compile a candidate list.

### Tier 1 — CLI and API Search (highest signal, start here)

```bash
# skills.sh — the ecosystem's primary package manager
npx skills find "<topic>"
npx skills find "<synonym-1>"
npx skills find "<synonym-2>"

# GitHub code search — find actual SKILL.md files
gh search code "filename:SKILL.md <topic>" --limit 20
gh search code "path:.claude/skills <topic>" --limit 20
gh search code "path:.claude/commands <topic>" --limit 20

# GitHub topic search — find skill repositories
gh search repos "topic:claude-skills <topic>" --sort stars --limit 10
gh search repos "topic:agent-skills <topic>" --sort stars --limit 10
```

Use 2–3 keyword variations for the topic (e.g., for "code review": also search "review", "PR review", "code-review").

### Tier 2 — Web Search (broader coverage)

```
WebSearch: "site:github.com SKILL.md <topic>"
WebSearch: "<topic> skill claude code"
WebSearch: "<topic> agent skill SKILL.md"
WebSearch: "site:cursor.directory <topic>"  (cross-platform rules)
```

### Tier 3 — Known Collections (browse for what search missed)

Check these curated sources for relevant skills:

| Source | How to Check |
|--------|-------------|
| **awesome-claude-code** | `WebFetch https://github.com/hesreallyhim/awesome-claude-code` and search for topic |
| **awesome-agent-skills** | `WebFetch https://github.com/VoltAgent/awesome-agent-skills` |
| **anthropics/skills** (official) | `WebFetch https://github.com/anthropics/skills` |
| **openai/skills** (Codex official) | `WebFetch https://github.com/openai/skills` |
| **alirezarezvani/claude-skills** | `WebFetch https://github.com/alirezarezvani/claude-skills` |
| **rohitg00/awesome-claude-code-toolkit** | `WebFetch https://github.com/rohitg00/awesome-claude-code-toolkit` |

If `npx skills` is unavailable in the environment, skip those commands and compensate with broader Tier 2 web search plus Tier 3 collection browsing. If `gh` is unavailable, fall back to GitHub MCP tools or direct web fetches.

For **Standard** mode and above, also check:
- cursor.directory for adaptable Cursor rules
- instructa/ai-prompts for cross-platform prompts

For **Deep** mode, additionally check:
- SkillsMP (skillsmp.com) for breadth
- Slash command collections (qdhenry/Claude-Command-Suite, wshobson/commands)
- SkillHub (skillhub.club), claude-plugins.dev for further candidates

### Parallel Execution

For Standard and Deep modes, parallelize the search across tiers to save time:

```
Agent/Task 1: Tier 1 — CLI searches (npx skills find, gh search)
Agent/Task 2: Tier 2 — Web searches (WebSearch queries)
Agent/Task 3: Tier 3 — Browse known collections
Main session: Merge and deduplicate results
```

### Candidate List

After all search tiers, compile a deduplicated candidate list:

```
| # | Name | Source | URL | Stars/Installs | Notes |
|---|------|--------|-----|----------------|-------|
| 1 | ... | GitHub | ... | ... | ... |
```

Present the candidate list to the user. Ask: "I found [N] candidates. Should I proceed to collect and analyze all of them, or do you want to add/remove any?"

**Wait for user confirmation before Phase 3.** This is a required hard gate, not an FYI checkpoint. The user may know about sources you missed, want to exclude low-quality candidates, or want to narrow the sample before deeper analysis starts.

---

## Phase 3: Collect

Run this phase only after the candidate list has been explicitly confirmed.

Fetch the actual skill content for each confirmed candidate. Read the real prompts, not just metadata.

For each candidate:

1. **Locate the skill file**: Find the SKILL.md, command markdown, or .cursorrules file
2. **Fetch full content**: Use WebFetch or gh CLI to read the complete file
   ```bash
   # For GitHub repos — read raw content
   WebFetch https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path-to-SKILL.md>
   # Or via gh CLI
   gh api repos/<owner>/<repo>/contents/<path> --jq '.content' | base64 -d
   ```
3. **Capture metadata**: Version, author, install count, stars, last updated
4. **Note the structure**: Does it have references/? scripts/? What's the file layout?

If a skill is very large (>500 lines), note its structure and key sections rather than capturing everything verbatim — focus on the unique or well-designed parts.

If any candidate turns out to be irrelevant (same name but different purpose), drop it and note why.

### Parallel Collection

For Standard/Deep mode, parallelize fetching across candidates to save time. Each collector agent fetches 3–5 skills and returns the content.

---

## Phase 4: Analyze

Systematically analyze and compare all collected skills. This is the core intellectual work.

### 4a. Per-Skill Assessment

For each collected skill, evaluate:

| Dimension | What to Look For |
|-----------|-----------------|
| **Scope** | What does it cover? What does it explicitly exclude? |
| **Trigger design** | How does it decide when to activate? Pushy or conservative? |
| **Workflow** | What phases/steps does it define? Linear or branching? |
| **Output format** | What does it produce? Templates, structured data, free text? |
| **Unique techniques** | What does this skill do that others don't? Novel patterns? |
| **Quality signals** | Well-structured? Good examples? Progressive disclosure? |
| **Weaknesses** | What's missing, vague, or poorly designed? |
| **Platform assumptions** | Claude Code only? Cross-platform? Tool-dependent? |

### 4b. Cross-Skill Pattern Analysis

Look across all skills for recurring patterns:

1. **Common phases**: What workflow stages appear in most skills? (e.g., 80% have a "plan → execute → verify" pattern)
2. **Taxonomy extraction**: What categories, types, or classifications do skills define? Merge overlapping taxonomies into a unified one.
3. **Escalation patterns**: How do skills handle complexity? (Quick/Standard/Deep, severity levels, scope tiers)
4. **Output convergence**: What output structures recur? (tables, checklists, structured reports)
5. **Unique innovations**: What does only one skill do, but brilliantly? These are the gems worth preserving.
6. **Anti-patterns**: What mistakes recur? (overly rigid MUSTs, missing edge cases, no examples)

### 4c. Comparison Matrix

Build a systematic comparison:

```
| Dimension | Skill A | Skill B | Skill C | ... | Best Practice |
|-----------|---------|---------|---------|-----|---------------|
| Scope breadth | ... | ... | ... | ... | ... |
| Workflow depth | ... | ... | ... | ... | ... |
| Output quality | ... | ... | ... | ... | ... |
| Unique value | ... | ... | ... | ... | ... |
| Overall rating | ★★★☆☆ | ★★★★☆ | ★★☆☆☆ | ... | — |
```

---

## Phase 5: Synthesize

Produce the **Fusion Report** — the standalone deliverable of this skill.

### Fusion Report Template

```markdown
# Fusion Report: [Topic] Skills

**Date**: YYYY-MM-DD
**Mode**: Quick / Standard / Deep
**Candidates analyzed**: N
**Sources searched**: [list of sources checked]

## Executive Summary
[2-3 sentences: how many skills exist, overall ecosystem maturity, key insight]

## Source Inventory

| # | Name | Source | URL | Stars | Rating | Key Strength |
|---|------|--------|-----|-------|--------|--------------|
| 1 | ... | ... | ... | ... | ★★★★☆ | ... |

## Pattern Analysis

### Common Workflow Patterns
[What most skills do — the baseline your new skill should meet]

### Taxonomy
[Unified classification extracted from all skills — categories, types, severity levels, etc.]

### Escalation Model
[How skills handle varying complexity — modes, tiers, depth levels]

### Output Patterns
[Common output structures and templates]

## Unique Innovations Worth Preserving

| Innovation | From Skill | Why It Matters |
|-----------|-----------|---------------|
| ... | ... | ... |

## Anti-Patterns to Avoid
[Common mistakes observed across skills]

## Recommended Fusion Strategy

### Core Architecture
[Recommended phase structure for the new skill]

### Must-Include Elements
[Non-negotiable features based on ecosystem consensus]

### Differentiation Opportunities
[Where the new skill can improve on the state of the art]

### Draft Outline
[Suggested section structure for the new SKILL.md]

## Attribution
[Full list of sources consulted with URLs, for CHANGELOG traceability]
```

### Quality Gates

Before delivering the fusion report, verify:

- [ ] At least [mode minimum] candidates were analyzed (not just listed)
- [ ] Actual skill content was read (not just metadata/descriptions)
- [ ] Comparison is systematic (matrix, not ad-hoc impressions)
- [ ] Unique innovations are attributed to specific sources
- [ ] Fusion strategy is concrete enough for skill-creator to act on
- [ ] All source URLs are included for traceability

Unless the user explicitly asked to collapse research and creation after reviewing the candidate set, deliver the Fusion Report as a separate artifact or clearly separated section. Do not automatically place the collected research into the target skill package.

---

## Handoff

After delivering the fusion report:

1. Ask the user if they want to adjust the fusion strategy
2. Once confirmed, suggest: "Ready to create the skill. You can use `/skill-creator` with this fusion report as input."
3. If the user explicitly wants to proceed immediately, summarize the key decisions from the fusion report as context for `skill-creator` or `skill-lifecycle-manager`, but do not silently continue into authoring inside this skill

---

## Caveats

- **Quality varies enormously** across community sources. A skill with 1000 stars may be worse than one with 10. Always read the actual content, not just metadata.
- **Cross-platform adaptation needs care.** Cursor rules and Copilot instructions have different conventions than SKILL.md — note what needs translation when including them in the analysis.
- **Recency matters.** The skills ecosystem evolves fast. Check last-updated dates and prefer recently maintained skills.
- **Don't confuse quantity with quality.** Finding 25 candidates is meaningless if 20 are trivial copies of the same template. Focus on substantively different approaches.
- **Attribution is non-negotiable.** The fusion report must trace every idea to its source. This feeds into CHANGELOG entries and respects community authors.
- **GitHub rate limits.** If running many `gh search` commands, you may hit API rate limits. Space out requests or use authenticated tokens.
- **Large skills need summarization.** Some community skills are 1000+ lines. Capture the architecture and unique elements, not every line.
- **Do not collapse research and creation into one pass by default.** Even if the user ultimately wants a new skill, this workflow should stop at the research handoff unless they explicitly choose the shortcut after reviewing the candidate set.
