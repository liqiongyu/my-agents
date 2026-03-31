# Codebase Signals

What to scan when analyzing a project for agent architecture decisions.

## Scan Order

1. Root-level manifests and config files (Glob for package.json, pyproject.toml, go.mod, etc.)
2. Top-level directory listing (ls)
3. Existing AI configurations (Glob for CLAUDE.md, AGENTS.md, .claude/, .codex/)
4. CI and test setup (Glob for .github/workflows/, test configs)
5. Deep directory patterns only if project type is ambiguous (Grep for imports/framework usage)

## Package Manifests → Tech Stack

| File | Stack |
| --- | --- |
| `package.json` | Node.js — check dependencies for React, Vue, Next.js, Express, Fastify, etc. |
| `pyproject.toml` / `requirements.txt` / `setup.py` | Python — check for Django, FastAPI, Flask, pandas, torch, etc. |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `pom.xml` / `build.gradle` / `build.gradle.kts` | Java/JVM |
| `Gemfile` | Ruby |
| `composer.json` | PHP |
| `Package.swift` | Swift |

## Directory Structure → Project Type

| Pattern | Indicates |
| --- | --- |
| `src/components/`, `src/pages/`, `app/`, `public/` | Frontend |
| `src/api/`, `src/routes/`, `src/services/`, `src/controllers/` | Backend |
| `packages/`, `apps/`, workspace config (nx/turbo/pnpm) | Monorepo |
| `notebooks/`, `data/`, `models/`, `experiments/` | Data/ML |
| `src/lib/`, single entry point, no app directory | Library |
| Both frontend and backend directories | Fullstack |

## Existing AI Configuration

| File/Directory | What it tells you |
| --- | --- |
| `CLAUDE.md` | Claude Code is configured — read it to understand current state |
| `.claude/agents/` | Claude Code subagents already installed |
| `.claude/settings.json` | MCP servers, permissions, model preferences |
| `AGENTS.md` | Codex is configured |
| `.codex/agents/` or `.agents/` | Codex subagents already installed |
| `.cursor/` | Cursor is in use |
| `.github/copilot-instructions.md` | GitHub Copilot is configured |
| `.aider*` | Aider is in use |

## Maturity Signals → Project Phase

| Signal | Phase |
| --- | --- |
| No CI, few tests, early commit history, no release tags | **Early** |
| Active CI, growing test suite, feature branches, PR workflow | **Active** |
| Stable CI, high coverage, release workflow, changelogs, many contributors | **Mature** |

## Secondary Signals

- **Monorepo tooling**: `nx.json`, `turbo.json`, `pnpm-workspace.yaml`, `lerna.json`
- **Test frameworks**: jest/vitest config, pytest.ini/conftest.py, go test patterns
- **Database**: prisma/, drizzle/, migrations/, sqlalchemy models
- **API patterns**: openapi.yaml, graphql schema, tRPC routers
- **Infrastructure**: Dockerfile, docker-compose.yml, terraform/, k8s manifests
- **Documentation site**: docusaurus.config.js, vitepress config, mkdocs.yml
