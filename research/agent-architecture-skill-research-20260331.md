# Agent Architecture Skill Research: Existing Tools & Design Patterns

> Research date: 2026-03-31 | Depth: Standard | Sources: 25+ sources
> Scope: Existing similar tools, multi-agent patterns by project type, project-aware generation, naming

## Executive Summary

No existing tool performs end-to-end "project-aware agent architecture planning" — analyzing a codebase and generating tailored, platform-specific agent definitions. The closest tools address pieces: Agent OS discovers codebase standards but doesn't generate agents; Potpie AI builds code knowledge graphs but targets its own runtime; alirezarezvani's agent-designer provides frameworks but isn't project-aware. This is a genuine gap. Recommended name: **`agent-architect`**.

---

## 1. Existing Similar Tools

**No tool performs the full pipeline** of (1) analyzing a codebase, (2) recommending an agent architecture, and (3) generating platform-specific agent files.

**Closest matches:**

- **Agent OS** (BuilderMethods) — Discovers patterns/conventions from a codebase via `/discover-standards`, indexes them, injects into agent contexts. Does NOT generate agent definitions. [Source: https://github.com/buildermethods/agent-os]

- **Potpie AI** — Builds Neo4j knowledge graph of codebase (files, classes, functions, relationships), generates agent configs. Targets its own runtime, not Claude Code/Codex. [Source: https://potpie.ai/blog/open-source-custom-ai-agents]

- **alirezarezvani/claude-skills `agent-designer`** — Frameworks for multi-agent architecture (10 areas). Purely advisory — doesn't read codebases or generate platform files. [Source: https://github.com/alirezarezvani/claude-skills/blob/main/engineering/agent-designer/SKILL.md]

- **alirezarezvani/claude-skills `agent-workflow-designer`** — Scaffolds multi-agent workflow patterns (Sequential, Parallel, Router, Orchestrator). Also purely advisory. [Source: https://github.com/alirezarezvani/claude-skills]

**Community agent collections (catalogs, not generators):**

- **VoltAgent/awesome-codex-subagents** — 136+ Codex subagents, includes `agent-installer` but no agent that recommends which agents a project needs. [Source: https://github.com/VoltAgent/awesome-codex-subagents]
- **VoltAgent/awesome-claude-code-subagents** — Parallel Claude Code collection. Orchestration agents, none project-aware. [Source: https://github.com/VoltAgent/awesome-claude-code-subagents]
- **affaan-m/everything-claude-code** — 13 subagents + 50+ skills. The `architect` is a software architect, not an agent architect. [Source: https://github.com/affaan-m/everything-claude-code]

**This repo's existing related skills:**

- **`agent-lifecycle-manager`** — Manages individual agent lifecycle. Has Creation Gate but operates one agent at a time, doesn't analyze projects.
- **`agentic-development`** — Manual-first workflow for multi-agent systems. Broader scope but not project-aware.

**Conclusion:** The "analyze my project and generate tailored agents" use case is a genuine gap.

---

## 2. Multi-Agent Patterns by Project Type

**Universal roles across all project types:**

| Role | Purpose | Seen in |
|------|---------|---------|
| Planner | Read-only analysis, implementation plans | ECC, Codex, Copilot |
| Reviewer | Code review (safety/correctness/style) | ECC, VoltAgent, Copilot |
| Explorer | Fast read-only codebase mapping | This repo, Codex built-in, Claude Code built-in |
| Security Reviewer | Security-focused analysis | ECC, VoltAgent, Copilot |

**Project-type-specific agents:**

**Frontend (React, Vue, etc.):**
- Component reviewer (accessibility, performance, composition)
- E2E test runner (Playwright/Cypress)
- UI fixer (browser debugging, visual issues)
- Build error resolver (bundler-specific: Webpack/Vite/Turbopack)

**Backend (API, microservices):**
- API reviewer (contract validation, REST/GraphQL)
- Database reviewer (query optimization, migration safety)
- Security specialist (auth, injection, secrets)
- Language-specific reviewer (Go, Python, Java, Rust)

**Fullstack:**
- Split frontend/backend reviewers with separate tool access
- Copilot article recommends 7 agents for .NET/React/Azure: Requirements Engineer, Platform Architect, Security Specialist, Backend Specialist, Frontend Specialist, Documentation Steward, Test Specialist [Source: https://benjamin-abt.com/blog/2026/03/17/github-copilot-custom-agents-team/]

**Data/ML:**
- Data pipeline specialist, ML experiment reviewer, Notebook reviewer, Infrastructure specialist

**Monorepo impact:**
- Datadog uses hierarchical AGENTS.md as router: root-level navigation → domain-specific nested docs [Source: https://dev.to/datadog-frontend-dev/steering-ai-agents-in-monorepos-with-agentsmd-13g0]
- Nx exposes workspace structure via project graph [Source: https://nx.dev/blog/nx-ai-agent-skills]

---

## 3. Project-Aware Generation Approaches

**Codebase analysis signals:**
- `package.json` / `requirements.txt` / `go.mod` / `Cargo.toml` → tech stack
- Directory structure (`src/`, `components/`, `services/`, `packages/`) → project type
- Existing configs (`.claude/agents/`, `.codex/agents/`, `AGENTS.md`) → current state
- Test framework, CI config, monorepo tooling → maturity

**Context injection patterns:**
- Agent OS: `/inject-standards` into conversations, plans, skills
- Codebase Context Spec: `.context/index.md` with structured metadata
- Copilot: `guidelines.md` as "contract between humans and agents"

**Project phase dimension (no existing tool addresses this):**
- Early development: Planner, Architect, Scaffold generator
- Active development: Reviewer, TDD guide, Build error resolver, Security reviewer
- Mature/maintenance: Refactor cleaner, Dependency auditor, Doc updater

---

## 4. Skill-Creator Patterns to Borrow

| Pattern | In skill-creator | For agent-architect |
|---------|------------------|---------------------|
| Mode Detection | Create vs Validate | Analyze vs Design vs Generate vs Audit |
| Wizard-Style | Identity, Tools, Complexity | Project type, Tech stack, Agent needs, Platforms |
| Plan-Validate-Execute | Generate → test → iterate | Generate agents → validate → iterate |
| Eval Loop | Test with realistic prompts | Test generated agents on project scenarios |
| Description Optimization | Tighten trigger accuracy | Tighten agent description routing |

---

## 5. Naming Research

| Name | Pros | Cons |
|------|------|------|
| **`agent-architect`** | Clear, memorable, 15 chars, pairs with `agent-lifecycle-manager` | Could confuse with software architecture agent |
| `agent-planner` | Matches planner convention | Too close to generic planner |
| `agent-forge` | Memorable | Unclear what it does |
| `subagent-planner` | Explicit | "Subagent" is platform-specific term |
| `agent-designer` | Clear intent | Name collision with alirezarezvani skill |

**Recommendation: `agent-architect`** — the architect *designs the set*, the lifecycle manager *implements individuals*.

---

## 6. Recommendations

1. Build as `agent-architect` in `skills/agent-architect/`
2. Workflow: Search-Analyze-Report (scan) → Wizard (refine) → Plan-Validate-Execute (generate)
3. Use shell-based exploration (Glob, Grep, Read) — no external deps
4. Ship with project-type templates in `references/`
5. Dual-platform output from day one (Claude Code `.md` + Codex `.toml`)
6. Include project-phase dimension (early/active/mature)
7. Categories: `["workflow", "design", "productivity"]`

---

## Sources

1. [Anthropic: Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
2. [OpenAI: Codex Subagents](https://developers.openai.com/codex/subagents)
3. [GitHub Copilot Custom Agents for Full-Stack Teams](https://benjamin-abt.com/blog/2026/03/17/github-copilot-custom-agents-team/)
4. [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
5. [VoltAgent/awesome-codex-subagents](https://github.com/VoltAgent/awesome-codex-subagents)
6. [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
7. [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills)
8. [Agent OS by BuilderMethods](https://github.com/buildermethods/agent-os)
9. [Potpie AI](https://potpie.ai/blog/open-source-custom-ai-agents)
10. [Codebase Context Spec](https://github.com/Agentic-Insights/codebase-context-spec)
11. [Datadog: Steering AI Agents in Monorepos](https://dev.to/datadog-frontend-dev/steering-ai-agents-in-monorepos-with-agentsmd-13g0)
12. [Nx AI Agent Skills](https://nx.dev/blog/nx-ai-agent-skills)
13. [Google Multi-Agent Design Patterns](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/)
14. [wirelessr/codebase-analyzer-agent](https://github.com/wirelessr/codebase-analyzer-agent)
15. [Monorepo vs Polyrepo AI Rules](https://www.augmentcode.com/learn/monorepo-vs-polyrepo-ai-s-new-rules-for-repo-architecture)
16. [business-science/ai-data-science-team](https://github.com/business-science/ai-data-science-team)
17. [OpenAI Agents SDK: Multi-Agent Orchestration](https://openai.github.io/openai-agents-python/multi_agent/)
18. [Microsoft Copilot Studio: Orchestrator and Subagent Patterns](https://learn.microsoft.com/en-us/microsoft-copilot-studio/guidance/architecture/multi-agent-orchestrator-sub-agent)
