# Community AI Agent Skills Discovery Sources

**Research Date:** 2026-03-26
**Scope:** Platforms, repositories, directories, and communities for discovering and sharing AI agent skills/prompts for Claude Code, Codex, Gemini CLI, GitHub Copilot, Cursor, Windsurf, OpenCode, and similar tools.

---

## Table of Contents

1. [Package Managers and CLIs](#1-package-managers-and-clis)
2. [Dedicated Skill Marketplaces (Web)](#2-dedicated-skill-marketplaces-web)
3. [Official Vendor Repositories](#3-official-vendor-repositories)
4. [GitHub Awesome Lists and Collections](#4-github-awesome-lists-and-collections)
5. [Cross-Platform Rule/Prompt Directories](#5-cross-platform-ruleprompt-directories)
6. [GitHub Discovery Patterns](#6-github-discovery-patterns)
7. [Community Hubs](#7-community-hubs)
8. [API and Programmatic Access](#8-api-and-programmatic-access)
9. [Open Standard: Agent Skills Specification](#9-open-standard-agent-skills-specification)
10. [Summary Matrix](#10-summary-matrix)

---

## 1. Package Managers and CLIs

### 1.1 skills.sh / Vercel Skills CLI

- **URL:** https://skills.sh
- **GitHub:** https://github.com/vercel-labs/skills
- **Type:** Package manager + browsable directory/leaderboard
- **Content:** Agent skills in SKILL.md format
- **Launched:** January 20, 2026 by Vercel
- **Scale:** 90,000+ total installations tracked; leaderboard of most popular skills
- **Supported Agents:** 20+ including Claude Code, GitHub Copilot, Cursor, Cline, Gemini CLI, VS Code, OpenCode, Windsurf
- **Installation:** `npx skills add <owner/repo>` or `npx skills add <owner/repo> --skill <name>`
- **CLI Commands:**
  - `npx skills find [query]` -- search for skills
  - `npx skills add <package>` -- install a skill
  - `npx skills list` -- list installed skills
  - `npx skills check` -- check for updates
  - `npx skills update` -- update installed skills
  - `npx skills init` -- create a new SKILL.md template
- **Browsing:** Web directory at skills.sh with full-text search, sorting by All Time / Trending (24h) / Hot
- **API/Programmatic:** CLI-based search via `npx skills find`; no documented REST API
- **Quality:** Community-submitted; leaderboard surfacing popular skills
- **Assessment:** The ecosystem's primary package manager and central hub. Best starting point for discovery.

### 1.2 Anthropic Claude Code Plugin System

- **Docs:** https://code.claude.com/docs/en/plugin-marketplaces
- **Type:** Built-in plugin marketplace infrastructure in Claude Code CLI
- **Content:** Plugins that bundle skills, MCP servers, hooks, commands, and subagents
- **How it Works:** Any GitHub repository can serve as a plugin marketplace; Claude Code fetches and installs from them
- **Installation:** `/plugin marketplace add <owner/repo>` then `/plugin install <name>@<marketplace>`
- **Key Marketplaces:**
  - `anthropics/claude-plugins-official` -- Anthropic-managed, high-quality plugins
  - `anthropics/skills` -- Official Anthropic skills
  - `rohitg00/awesome-claude-code-toolkit` -- 135 agents, 35 skills, 42 commands, 150+ plugins
  - `davepoon/buildwithclaude` -- 53 plugins, 121 skills, 117 subagents, 175 commands, 28 hooks
  - `alirezarezvani/claude-skills` -- 192+ skills for 11 coding agents
- **Quality:** Varies by marketplace; official Anthropic marketplace is curated
- **Assessment:** Native integration is powerful. The decentralized marketplace model means many sources to discover.

---

## 2. Dedicated Skill Marketplaces (Web)

### 2.1 SkillsMP (skillsmp.com)

- **URL:** https://skillsmp.com
- **Type:** Aggregator marketplace
- **Content:** Agent skills for Claude Code, Codex CLI, ChatGPT
- **Scale:** 500,000+ skills (aggregated from GitHub)
- **Browsing:** Smart search, category filtering, quality indicators
- **Categories:** https://skillsmp.com/categories -- Debugging, Productivity, System Administration, Automation, IDE, CLI tools, LLM/AI, and more
- **Quality:** Filters repos with <2 stars; scans for basic quality. User should review code before installing
- **Format:** Open SKILL.md standard
- **API/Programmatic:** MCP server available at mcpmarket.com/server/skillsmp; also has a LobeHub skillsmp-downloader
- **Assessment:** Largest aggregator by count. Good for broad discovery but quality varies significantly.

### 2.2 SkillHub (skillhub.club)

- **URL:** https://www.skillhub.club
- **Type:** Marketplace with creation framework
- **Content:** Skills for Claude, Codex, Gemini, OpenCode
- **Scale:** 7,000+ AI-evaluated skills
- **Browsing:** Browse by category, search, copy SKILL.md with one click
- **Installation:** Copy SKILL.md to `~/.claude/skills/`, or use Desktop app for one-click install
- **Quality:** AI-evaluated quality scoring
- **Assessment:** Mid-size marketplace with good tooling for skill creation.

### 2.3 claude-plugins.dev

- **URL:** https://claude-plugins.dev
- **Type:** Auto-indexed community registry with CLI
- **Content:** Agent skills from across GitHub
- **Scale:** 51,625+ skills indexed
- **Browsing:** Search, download tracking, category filtering
- **Supported Agents:** Claude, Cursor, OpenCode, Codex, and more
- **Quality:** Auto-indexed from public GitHub repos; open-source, community-maintained
- **Assessment:** Large auto-indexed directory. Good for breadth of discovery.

### 2.4 ClaudeSkills.info

- **URL:** https://claudeskills.info
- **Type:** Curated marketplace
- **Content:** Claude Code skills and agent skills
- **Scale:** 140+ free, open source skills
- **Browsing:** Browse by category (development, testing, creative design, security, productivity); click card to view GitHub details
- **Quality:** Curated; organizes high-quality skills from various sources
- **Assessment:** Smaller but more curated. Good starting point for hand-picked quality skills.

### 2.5 ClaudeSkillsMarket (claudeskillsmarket.com)

- **URL:** https://www.claudeskillsmarket.com
- **Type:** Marketplace for discovering, sharing, and building skills
- **Content:** Claude AI skills
- **Assessment:** Another community marketplace in the growing ecosystem.

### 2.6 ClaudeSkills.ai

- **URL:** https://claudeskills.ai
- **Type:** Marketplace for Claude AI skills
- **Assessment:** Community marketplace.

### 2.7 TonsOfSkills (tonsofskills.com)

- **URL:** https://tonsofskills.com
- **Type:** Skills hub with one-click downloads
- **Content:** 2,787 searchable skills; 416 plugins with embedded agent skills
- **Browsing:** Fuzzy search and filters; interactive tutorials
- **Features:** Integration packs for Supabase, Vercel, Sentry (24-30 skills each)
- **Quality:** Open source, production-ready; weekly updates
- **Assessment:** Notable for platform-specific integration packs.

### 2.8 LobeHub Skills Marketplace

- **URL:** https://lobehub.com/skills
- **Type:** Marketplace for SKILL.md format skills
- **Content:** Agent skills compatible with Claude Code, Codex CLI, ChatGPT
- **Browsing:** Category filtering, curated collections
- **Features:** Skill collections grouped by theme/intent
- **Assessment:** Part of the broader LobeHub ecosystem; good collection-based discovery.

### 2.9 Awesome-Skills.com

- **URL:** https://awesome-skills.com
- **Type:** Curated directory
- **Content:** 128+ curated skills and plugins for Claude Code
- **Categories:** Tooling, data agents, automation, workflow, AI integration, planning, design, content, UI, research, testing, devops, marketing, documents, security, architecture
- **Assessment:** Small but curated. Updated regularly.

### 2.10 AwesomeSkills.dev

- **URL:** https://www.awesomeskills.dev/en
- **Type:** Curated atlas / directory
- **Content:** Agent skills for Claude Code, Codex, and Cursor
- **Features:** One-line install commands; organized by intent and platform
- **Assessment:** Web frontend for the VoltAgent/awesome-agent-skills repo.

### 2.11 ClaudeMarketplaces.com

- **URL:** https://claudemarketplaces.com
- **Type:** Curated directory of plugins, skills, and MCP servers
- **Content:** Hand-picked extensions with proven adoption (500+ installs)
- **Quality:** Filters by install count, GitHub stars, community votes
- **Features:** Community upvote/downvote system
- **Assessment:** Quality-focused curation. Good for finding battle-tested tools.

### 2.12 SkillsDirectory.com

- **URL:** https://www.skillsdirectory.com
- **Type:** Security-focused skills directory
- **Content:** Verified, security-tested agent skills for Claude AI
- **Quality:** Every skill scanned for malware, prompt injection, credential theft; manually reviewed
- **Features:** Security grades; notes that 36% of skills in the wild have security flaws
- **Assessment:** Unique security focus. Important for enterprise or security-conscious users.

### 2.13 MCP Market (Skills Section)

- **URL:** https://mcpmarket.com/tools/skills
- **Type:** Agent skills directory (part of broader MCP server directory)
- **Content:** Skills for Claude.ai, Claude Code, Codex, ChatGPT
- **Browsing:** Category browsing, daily top skills lists
- **Scale:** 2,000+ pages of skills
- **Assessment:** Very large directory. Also covers MCP servers.

### 2.14 AwesomeClaude.ai

- **URL:** https://awesomeclaude.ai
- **Type:** Visual directory
- **Content:** Claude Code tools, workflows, integrations from awesome lists
- **Assessment:** Visual/enhanced browsing interface for awesome-claude-code collection.

### 2.15 BuildWithClaude.com

- **URL:** https://buildwithclaude.com
- **Type:** Plugin marketplace aggregator
- **GitHub:** https://github.com/davepoon/buildwithclaude
- **Content:** 53 plugins, 121 skills, 117 subagents, 175 commands, 28 hooks
- **Installation:** `/plugin marketplace add davepoon/buildwithclaude`
- **Assessment:** Usable directly as a Claude Code plugin marketplace.

---

## 3. Official Vendor Repositories

### 3.1 Anthropic (anthropics/skills)

- **URL:** https://github.com/anthropics/skills
- **Type:** Official Anthropic skills repository
- **Content:** Reference skills demonstrating creative, technical, and enterprise workflows
- **Scale:** Official curated set (document handling, design, web artifacts, MCP builders, etc.)
- **License:** Apache 2.0 or proprietary
- **Installation:** Register as plugin marketplace via `/plugin marketplace add` in Claude Code
- **Assessment:** The reference implementation. High quality, official.

### 3.2 Anthropic (anthropics/claude-plugins-official)

- **URL:** https://github.com/anthropics/claude-plugins-official
- **Type:** Official Anthropic-managed plugin directory
- **Content:** High-quality Claude Code plugins (including Discord, etc.)
- **Assessment:** Official, curated, high trust.

### 3.3 OpenAI (openai/skills)

- **URL:** https://github.com/openai/skills
- **Type:** Official Codex skills catalog
- **Scale:** ~35 curated skills; 13,000 stars, 726 forks
- **Organization:** Three tiers -- System (bundled), Curated, Experimental
- **Installation:** Use `$skill-installer` inside Codex for curated/experimental skills
- **Assessment:** Official Codex skills. Cross-compatible via SKILL.md standard.

### 3.4 Google (google-gemini/gemini-skills)

- **URL:** https://github.com/google-gemini/gemini-skills
- **Type:** Official Gemini skills repository
- **Content:** Skills for Gemini API, SDK, and agent interactions
- **Assessment:** Official Google skills. Compatible with Gemini CLI and Antigravity.

### 3.5 GitHub (github/awesome-copilot)

- **URL:** https://github.com/github/awesome-copilot
- **Type:** Official GitHub community collection
- **Content:** Skills, custom agents, instructions, and prompts for GitHub Copilot
- **Assessment:** Official GitHub-maintained community collection.

---

## 4. GitHub Awesome Lists and Collections

### 4.1 hesreallyhim/awesome-claude-code (32.7k stars)

- **URL:** https://github.com/hesreallyhim/awesome-claude-code
- **Content:** Skills, hooks, slash-commands, agent orchestrators, applications, plugins, CLAUDE.md files, status lines, alternative clients
- **Categories:** 8 main sections covering the full Claude Code ecosystem
- **Assessment:** The largest and most comprehensive awesome list for Claude Code specifically.

### 4.2 VoltAgent/awesome-agent-skills (12.9k stars)

- **URL:** https://github.com/VoltAgent/awesome-agent-skills
- **Web:** https://www.awesomeskills.dev/en
- **Content:** 1,000+ agent skills from official dev teams and community
- **Organization:** By team/company (Anthropic, Vercel, Cloudflare, Google, Stripe, Netlify, etc.)
- **Supported Agents:** Claude Code, Codex, Antigravity, Gemini CLI, Cursor, Copilot, OpenCode, Windsurf
- **Assessment:** Best cross-platform skills directory. Organized by vendor which is useful for finding official integrations.

### 4.3 travisvn/awesome-claude-skills

- **URL:** https://github.com/travisvn/awesome-claude-skills
- **Content:** Curated list of skills, resources, and tools
- **Assessment:** Well-maintained curated list focused on Claude Skills specifically.

### 4.4 ComposioHQ/awesome-claude-skills

- **URL:** https://github.com/ComposioHQ/awesome-claude-skills
- **Content:** Curated skills and tools for Claude AI workflows
- **Assessment:** From the Composio team; includes their integration skills.

### 4.5 rohitg00/awesome-claude-code-toolkit

- **URL:** https://github.com/rohitg00/awesome-claude-code-toolkit
- **Content:** 135 agents, 35 skills (+400,000 via SkillKit), 42 commands, 150+ plugins, 19 hooks, 15 rules, 7 templates, 8 MCP configs
- **Installation:** Usable as plugin marketplace via `/plugin marketplace add rohitg00/awesome-claude-code-toolkit`
- **Assessment:** Most comprehensive all-in-one toolkit. Both a reference and an installable marketplace.

### 4.6 alirezarezvani/claude-skills

- **URL:** https://github.com/alirezarezvani/claude-skills
- **Content:** 192+ production-ready skills and agent plugins
- **Supported Agents:** Claude Code, Codex, Gemini CLI, Cursor, and 8 more
- **Domains:** Engineering, marketing, product, compliance, C-level advisory
- **Installation:** `/plugin marketplace add alirezarezvani/claude-skills`
- **Assessment:** Large cross-platform collection with unusual breadth into non-engineering domains.

### 4.7 alirezarezvani/claude-code-skill-factory

- **URL:** https://github.com/alirezarezvani/claude-code-skill-factory
- **Content:** Toolkit for building and deploying skills, agents, slash commands, and LLM prompts at scale
- **Assessment:** Meta-tool for skill creation, not a skill collection itself.

### 4.8 jqueryscript/awesome-claude-code

- **URL:** https://github.com/jqueryscript/awesome-claude-code
- **Content:** Tools, IDE integrations, frameworks, and resources for Claude Code
- **Assessment:** Broader focus including IDE and framework integrations.

### 4.9 Slash Command Collections

| Repository | Content |
|---|---|
| [qdhenry/Claude-Command-Suite](https://github.com/qdhenry/Claude-Command-Suite) | 216+ slash commands, 12 skills, 54 agents |
| [wshobson/commands](https://github.com/wshobson/commands) | 57 production-ready commands (15 workflows, 42 tools) |
| [artemgetmann/claude-slash-commands](https://github.com/artemgetmann/claude-slash-commands) | Collection of useful slash commands |
| [hikarubw/claude-commands](https://github.com/hikarubw/claude-commands) | Custom slash commands for Claude Code |
| [hiteshbedre/claude-custom-slash-commands](https://github.com/hiteshbedre/claude-custom-slash-commands) | Custom slash commands |

---

## 5. Cross-Platform Rule/Prompt Directories

These sources contain prompts/rules for other AI tools that can be adapted to SKILL.md format.

### 5.1 Cursor Directory (cursor.directory)

- **URL:** https://cursor.directory
- **GitHub:** https://github.com/kiliczsh/cursor.directory
- **Type:** Community hub for Cursor rules and MCP integrations
- **Scale:** 48,000+ developer community; 250k+ monthly visits; 3.6k GitHub stars
- **Browsing:** By framework, language, or tech stack; full-text search
- **Features:** AI-powered rule generator (input your tech stack, get a tailored .cursorrules file)
- **MCP Integrations:** Dozens of MCP server integrations
- **Quality:** Community-curated
- **Assessment:** Largest Cursor rules directory. Rules can be adapted to SKILL.md format.

### 5.2 dotcursorrules.com

- **URL:** https://dotcursorrules.com
- **Type:** Directory for .cursorrules files
- **Browsing:** By framework/language; submit your own or upvote favorites
- **Assessment:** Another major Cursor rules directory.

### 5.3 cursorrules.org

- **URL:** https://cursorrules.org
- **Type:** Rule creation platform with CLI tools
- **Features:** Visual Rule Builder, validation, GitHub/GitLab deployment
- **Assessment:** More focused on rule creation than browsing.

### 5.4 Cursor Marketplace

- **URL:** https://cursor.com/marketplace
- **Type:** Official Cursor marketplace (launched Feb 2026 with Cursor 2.5)
- **Content:** Plugins bundling MCP servers, skills, subagents, hooks, rules
- **Partners:** Figma, Linear, Stripe, AWS, Cloudflare, Vercel, Databricks, Snowflake, Amplitude, Hex
- **Assessment:** Official Cursor marketplace. New but growing rapidly with major partners.

### 5.5 awesome-cursorrules

- **URL:** https://github.com/PatrickJS/awesome-cursorrules
- **Type:** Curated .cursorrules collection
- **Assessment:** Established awesome list for Cursor rules.

### 5.6 instructa/ai-prompts

- **URL:** https://github.com/instructa/ai-prompts
- **Type:** Cross-platform prompt collection
- **Content:** Curated AI prompts for Cursor Rules, Cline, Windsurf, and GitHub Copilot
- **Features:** Instructions for configuring each platform
- **Assessment:** Best single source for cross-platform prompts that work across tools.

### 5.7 Windsurf Rules

- **GitHub Topic:** https://github.com/topics/windsurf-rules
- **File Paths:** `.windsurf/rules/`, `.windsurfrules`
- **Assessment:** Growing collection of Windsurf-specific rules on GitHub.

### 5.8 GitHub Copilot Instructions

- **File Path:** `.github/copilot-instructions.md`
- **Official Docs:** VS Code support for Agent Skills (VS Code 1.108+)
- **Skill Paths:** `~/.copilot/skills/`, `.github/skills/`, `.claude/skills/` (shared with Claude Code)
- **Assessment:** Copilot now supports the SKILL.md standard natively.

---

## 6. GitHub Discovery Patterns

### 6.1 Key GitHub Topics

| Topic | Repositories |
|---|---|
| [claude-skills](https://github.com/topics/claude-skills) | 1,554 repos |
| [claude-code](https://github.com/topics/claude-code) | Active |
| [claude-code-skills](https://github.com/topics/claude-code-skills) | Active |
| [claude-code-plugins](https://github.com/topics/claude-code-plugins) | Active |
| [agent-skills](https://github.com/topics/agent-skills) | Active |
| [codex-skills](https://github.com/topics/codex-skills) | Active |
| [gemini-skills](https://github.com/topics/gemini-skills) | Active |
| [cursor-skills](https://github.com/topics/cursor-skills) | Active |
| [awesome-claude-code](https://github.com/topics/awesome-claude-code) | Active |
| [anthropic-skills](https://github.com/topics/anthropic-skills) | Active |
| [windsurf-rules](https://github.com/topics/windsurf-rules) | Active |
| [windsurf-ai](https://github.com/topics/windsurf-ai) | Active |

### 6.2 Effective GitHub Search Queries

```
# Find SKILL.md files
path:SKILL.md language:markdown

# Find Claude Code skills directories
path:.claude/skills/ SKILL.md

# Find Codex/cross-platform skills
path:.agents/skills/ SKILL.md

# Find Claude Code commands (legacy format)
path:.claude/commands/ language:markdown

# Find Gemini skills
path:.gemini/skills/ SKILL.md

# Find Copilot skills
path:.github/skills/ SKILL.md

# Find Cursor rules
filename:.cursorrules

# Find Windsurf rules
path:.windsurf/rules/ OR filename:.windsurfrules

# Find Copilot instructions
filename:copilot-instructions.md

# Find skill collections
"awesome" "claude skills" in:name,description

# Find skill repositories by topic
topic:claude-skills stars:>10
topic:agent-skills stars:>10
```

### 6.3 Common File Paths Where Skills Are Stored

| Path | Platform | Notes |
|---|---|---|
| `.claude/skills/<name>/SKILL.md` | Claude Code | Recommended modern format |
| `.claude/commands/<name>.md` | Claude Code | Legacy slash commands |
| `~/.claude/skills/` | Claude Code | User-scoped |
| `.agents/skills/<name>/SKILL.md` | Codex, cross-platform | Cross-platform standard |
| `~/.agents/skills/` | Codex | User-scoped |
| `/etc/codex/skills/` | Codex | Admin-scoped |
| `.gemini/skills/<name>/SKILL.md` | Gemini CLI | Google's implementation |
| `~/.gemini/skills/` | Gemini CLI | User-scoped |
| `.github/skills/<name>/SKILL.md` | GitHub Copilot | Copilot support |
| `~/.copilot/skills/` | GitHub Copilot CLI | User-scoped |
| `.cursor/rules/` | Cursor | Rules directory |
| `.windsurf/rules/` | Windsurf | Rules directory |
| `.github/copilot-instructions.md` | GitHub Copilot | Single-file instructions |

---

## 7. Community Hubs

### 7.1 Reddit

| Community | Members | Focus |
|---|---|---|
| [r/ClaudeAI](https://reddit.com/r/ClaudeAI) | 612k | Claude and Claude Code discussion |
| [r/ClaudeCode](https://reddit.com/r/ClaudeCode) | 96k | Claude Code enthusiasts build/share/solve |

### 7.2 Discord

- **Official Claude Discord:** https://discord.com/invite/6PPFFzqPDZ (75,000+ members)
- Claude Code Channels feature allows controlling Claude Code sessions from Discord

### 7.3 Developer Blogs and Content Hubs

| Platform | Notable Content |
|---|---|
| [DEV.to](https://dev.to) | Frequent Claude Code skills tutorials and "best of" roundups |
| [Medium](https://medium.com) | Active Claude skills community (All About Claude publication, etc.) |
| [Composio Blog](https://composio.dev/content) | Skills guides and top-10 lists |
| [Firecrawl Blog](https://www.firecrawl.dev/blog) | Best Claude Code skills roundups |
| [Analytics Vidhya](https://www.analyticsvidhya.com) | "Top 5 GitHub Repos for Free Claude Code Skills" etc. |

### 7.4 Official Documentation and Learning

| Resource | URL |
|---|---|
| Claude Code Skills Docs | https://code.claude.com/docs/en/skills |
| Claude API Skills Guide | https://platform.claude.com/docs/en/build-with-claude/skills-guide |
| Agent Skills Standard | https://agentskills.io |
| Codex Skills Docs | https://developers.openai.com/codex/skills |
| Gemini CLI Skills Docs | https://geminicli.com/docs/cli/skills/ |
| VS Code Agent Skills | https://code.visualstudio.com/docs/copilot/customization/agent-skills |
| Anthropic Skills Academy | https://anthropic.skilljar.com/introduction-to-agent-skills |

---

## 8. API and Programmatic Access

### 8.1 Anthropic Skills API (/v1/skills)

- **Docs:** https://platform.claude.com/docs/en/api/beta/skills
- **Endpoints:**
  - `POST /v1/skills` -- Create a skill
  - `GET /v1/skills` -- List skills
  - `GET /v1/skills/{skill_id}` -- Get skill details
  - `DELETE /v1/skills/{skill_id}` -- Delete a skill
  - `POST /v1/skills/{skill_id}/versions` -- Create version
  - `GET /v1/skills/{skill_id}/versions` -- List versions
  - `GET /v1/skills/{skill_id}/versions/{version}` -- Get version
  - `DELETE /v1/skills/{skill_id}/versions/{version}` -- Delete version
- **Usage in Messages API:** Skills specified via `container.skills` parameter; up to 8 skills per request
- **Beta Headers Required:** `code-execution-2025-08-25`, `skills-2025-10-02`
- **Scope:** Organization-wide custom skills management
- **Assessment:** Full CRUD API for managing custom skills programmatically. Enterprise-grade.

### 8.2 skills.sh CLI (npx skills)

- **Search:** `npx skills find <query>`
- **Install:** `npx skills add <owner/repo>`
- **NPM Package:** `skills` on npmjs.com
- **API:** No documented REST API; CLI is the programmatic interface
- **Assessment:** Best CLI-based programmatic access for the open ecosystem.

### 8.3 SkillsMP MCP Server

- **URL:** https://mcpmarket.com/server/skillsmp
- **Type:** MCP server for querying SkillsMP programmatically
- **Assessment:** Can integrate SkillsMP search into agent workflows via MCP.

### 8.4 claude-skills-mcp

- **URL:** https://github.com/K-Dense-AI/claude-skills-mcp
- **Type:** MCP server for searching and retrieving Claude Agent Skills using vector search
- **Assessment:** Semantic search over skills via MCP protocol.

### 8.5 GitHub API

- All skill repositories on GitHub can be queried via the GitHub API
- Search for SKILL.md files: `gh api search/code -q '.items[].repository.full_name' --field q='filename:SKILL.md'`
- Search by topic: `gh api search/repositories --field q='topic:claude-skills'`

---

## 9. Open Standard: Agent Skills Specification

### 9.1 agentskills.io

- **URL:** https://agentskills.io
- **Spec:** https://agentskills.io/specification
- **GitHub:** https://github.com/agentskills/agentskills
- **Type:** Open standard specification for SKILL.md format

### 9.2 SKILL.md Format Summary

```
skills/<name>/
  SKILL.md          # Required: YAML frontmatter + markdown instructions
  scripts/          # Optional: executable code (Python, Bash, JS)
  references/       # Optional: additional docs (REFERENCE.md, etc.)
  assets/           # Optional: images, templates, data
```

**Frontmatter fields:**
- `name` (required, max 64 chars)
- `description` (required)
- `license` (optional)
- `compatibility` (optional, 1-500 chars)
- `metadata` (optional, string key-value map)
- `allowed-tools` (optional)

### 9.3 Platform Adoption

The SKILL.md format is now supported by:
- Claude Code (Anthropic)
- Codex CLI (OpenAI)
- Gemini CLI / Antigravity (Google)
- GitHub Copilot (Microsoft/GitHub)
- OpenCode (open source)
- Cursor (partial, via plugins)
- Windsurf (via adaptation)

---

## 10. Summary Matrix

| Source | Type | Scale | Quality | API | Cross-Platform |
|---|---|---|---|---|---|
| **skills.sh** | Package manager + directory | 90k+ installs | Community + leaderboard | CLI only | Yes (20+ agents) |
| **anthropics/skills** | Official repo | Curated set | Official/high | Plugin system | Claude Code |
| **openai/skills** | Official repo | ~35 skills | Official/high | Codex CLI | Codex |
| **google-gemini/gemini-skills** | Official repo | Growing | Official | Gemini CLI | Gemini |
| **github/awesome-copilot** | Official collection | Growing | Official | GitHub API | Copilot |
| **SkillsMP** | Web aggregator | 500k+ skills | Auto-filtered | MCP server | Yes |
| **claude-plugins.dev** | Auto-indexed registry | 51k+ skills | Auto-indexed | CLI | Yes |
| **SkillHub** | Web marketplace | 7k+ skills | AI-evaluated | Web | Yes |
| **MCP Market (skills)** | Web directory | Very large | Mixed | Web | Yes |
| **ClaudeMarketplaces** | Curated directory | Hand-picked | High (500+ installs) | Web | Claude Code |
| **SkillsDirectory** | Security-focused | Curated | Security-verified | Web | Claude |
| **TonsOfSkills** | Skills hub | 2,787 skills | Production-ready | Web | Claude Code |
| **LobeHub Skills** | Marketplace | Large | Mixed | Web | Yes |
| **awesome-claude-code** | GitHub awesome list | 32.7k stars | Curated | GitHub API | Claude Code |
| **awesome-agent-skills** | GitHub awesome list | 12.9k stars, 1000+ skills | Curated by vendor | GitHub API | Yes |
| **cursor.directory** | Web directory | 48k+ devs, 250k visits/mo | Community | Web | Cursor |
| **dotcursorrules.com** | Web directory | Large | Community | Web | Cursor |
| **Cursor Marketplace** | Official marketplace | Growing (launched Feb 2026) | Official partners | TBD | Cursor |
| **instructa/ai-prompts** | GitHub repo | Multi-platform | Curated | GitHub API | Yes |
| **Anthropic API** | REST API | Organization skills | Enterprise | Full REST | Via API |
| **r/ClaudeAI** | Reddit | 612k members | Community | Reddit API | Discussion |
| **r/ClaudeCode** | Reddit | 96k members | Community | Reddit API | Discussion |
| **Claude Discord** | Discord | 75k+ members | Community | Discord API | Discussion |

---

## Key Takeaways

1. **The ecosystem has converged on SKILL.md** as the universal format, adopted by Anthropic, OpenAI, Google, GitHub, and the open-source community via the agentskills.io specification.

2. **skills.sh is the npm of agent skills** -- the primary package manager and directory. Start here for CLI-based discovery and installation.

3. **Quality varies enormously** -- from security-vetted (SkillsDirectory.com) to auto-indexed GitHub scrapes (SkillsMP, claude-plugins.dev). Always review code before installing.

4. **Cross-platform portability is real** -- the same SKILL.md works across Claude Code, Codex, Gemini CLI, Copilot, and OpenCode. Skills written for one tool generally work in others.

5. **GitHub topics are the best discovery mechanism** for finding individual skill repos: `claude-skills` (1,554 repos), `agent-skills`, `codex-skills`, etc.

6. **Cursor rules are a rich adaptation source** -- cursor.directory alone has 48k+ developers sharing framework-specific rules that can be converted to SKILL.md format.

7. **The Anthropic /v1/skills API** provides full programmatic CRUD for managing skills in enterprise contexts.

8. **Official vendor repos** (anthropics/skills, openai/skills, google-gemini/gemini-skills, github/awesome-copilot) are the highest-quality starting points but have limited breadth.
