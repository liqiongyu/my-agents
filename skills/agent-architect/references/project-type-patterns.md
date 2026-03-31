# Project Type Agent Patterns

Agent architecture recommendations by project type, phase, and scale.

## Universal Roles

Relevant across project types but must still pass the creation gate. Only include when context isolation or behavioral specialization justifies a dedicated agent.

| Role | Purpose | Create when |
| --- | --- | --- |
| Explorer | Fast read-only codebase mapping | Monorepos or large codebases where exploration output is voluminous |
| Reviewer | Code review (correctness, style, safety) | Projects with regular PRs and code changes |
| Planner | Read-only analysis, implementation plans | Complex features needing planning context isolation |
| Security Reviewer | Security-focused analysis | Projects with auth, user input, or external API surfaces |

## Frontend Projects (React, Vue, Next.js, etc.)

**Typical agents:**

- Component reviewer — accessibility, performance, composition patterns
- E2E test runner — isolates verbose Playwright/Cypress output from main context
- Build error resolver — bundler-specific diagnostics (Webpack/Vite/Turbopack)

**Skills to recommend:** UI/UX review, accessibility audit, design system compliance

**MCP candidates:** Browser automation, Storybook, design tool integration

## Backend Projects (API, microservices)

**Typical agents:**

- API reviewer — contract validation, REST/GraphQL schema compliance
- Database reviewer — query optimization, migration safety
- Security specialist — auth flows, injection patterns, secrets scanning

**Skills to recommend:** API design review, database migration safety, security audit

**MCP candidates:** Database access, API testing, log aggregation

## Fullstack Projects

Combine frontend + backend sets with these adjustments:

- Split reviewers by domain (frontend reviewer, backend reviewer) to keep context focused
- One integrated planner that understands both sides
- Shared security reviewer covering both surfaces

**Recommended ceiling:** 5-7 agents. Beyond that, coordination overhead exceeds benefit.

## Data / ML Projects

**Typical agents:**

- Data pipeline specialist — ETL quality, schema validation
- Notebook reviewer — reproducibility, documentation quality
- Experiment reviewer — methodology, metrics, leakage detection

**Skills to recommend:** Data quality checks, experiment tracking, model documentation

**MCP candidates:** Database access, notebook execution, experiment tracking (MLflow/W&B)

## Monorepos

**Architecture pattern:** Hierarchical instruction routing.

- Root CLAUDE.md / AGENTS.md: navigation and repo-wide conventions
- Package-level CLAUDE.md: domain-specific guidance per workspace
- Agents can be scoped to domains when domain context is distinct enough

**Key decision:** One set of agents with domain-aware instructions vs. domain-specific agent sets. Prefer the former unless domains have fundamentally different review criteria.

**Reference:** Datadog uses hierarchical AGENTS.md as a router — root-level navigation pointing to domain-specific nested docs.

## Libraries / Open Source

**Typical agents:**

- PR reviewer — public API surface, breaking changes, backwards compatibility
- Documentation reviewer — README, API docs, examples
- Release reviewer — changelog, version bumps, migration guides

**Skills to recommend:** Changelog automation, README maintenance, API compatibility check

## Phase-Appropriate Sizing

| Phase | Agent count | Focus |
| --- | --- | --- |
| **Early** | 1-2 | Planner, explorer — help scaffold and plan |
| **Active** | 3-5 | Reviewer, security, domain-specific — quality and velocity |
| **Mature** | 3-7 | Reviewer, security, refactor, docs, release — stability and maintenance |

Start minimal. Add agents only when evaluation shows the existing set struggling.

## Composition Patterns

| Pattern | When | Example |
| --- | --- | --- |
| **Parallel** | Independent, non-overlapping work | Security reviewer + code reviewer on same PR |
| **Sequential** | Dependent phases | Plan → implement → review |
| **Router** | Domain-specific routing | Monorepo dispatcher to frontend/backend/infra agents |
| **Writer/Reviewer** | Quality via fresh context | Implement agent → review agent (separate context windows) |
| **Tiered model** | Cost optimization | Opus lead, Sonnet workers, Haiku explorers |
| **Worktree isolation** | Parallel file modification | Multiple agents editing different parts of the codebase |
