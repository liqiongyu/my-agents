# Platform Output Conventions

Templates and conventions for generating agent architecture artifacts.

## Agent Package: Claude Code

### agent.json (shared metadata)

```json
{
  "schemaVersion": 1,
  "name": "<kebab-case-name>",
  "displayName": "<Human Name>",
  "description": "<1-2 sentence trigger description including what-it-does AND when-to-use>",
  "version": "0.1.0",
  "maturity": "experimental",
  "categories": ["<from categories.json>"],
  "authors": [{"name": "<author>"}]
}
```

### claude-code.md (behavioral contract)

5-8 lines covering:

- **Role boundary**: read-only? write? what scope?
- **Output contract**: what to return, in what shape
- **Safety rails**: what to never do

Example:

```markdown
Review pull requests for correctness, security regressions, and missing test coverage.

Return a structured report: critical findings first, then warnings, then suggestions.
Each finding includes the file path, line range, severity, and a concrete fix direction.

Do not approve PRs automatically. Do not modify code — report only.
```

Do not teach the model things it already knows. If a reviewer agent's instructions need to explain how to read code, the instructions are too long.

## Agent Package: Codex

### codex.toml

```toml
[agent]
name = "<kebab-case-name>"
model = "o3"
model_reasoning_effort = "medium"
sandbox_mode = "full-auto"

[agent.instructions]
developer_instructions = "<1-2 sentence behavioral contract>"
```

### Model selection guidance

| Task type | Recommended model | Reasoning effort |
| --- | --- | --- |
| Code review, analysis | o3 | medium |
| Code generation, implementation | gpt-5.4 | high |
| Exploration, search | o4-mini | low |
| Documentation, formatting | gpt-5.4 | medium |

### Sandbox mode

- `full-auto`: code execution allowed (default for most agents)
- `standard`: no code execution (for review-only agents)

## CLAUDE.md Template

Target: under 200 lines. Absolute max: 500 lines.

```markdown
# Project Name

## Quick Start
<essential build/test/run commands — what someone needs in the first 5 minutes>

## Architecture
<one paragraph: what the project does, how it's structured, key entry points>

## Conventions
<coding style, naming patterns, file organization — only what the model would get wrong>

## Testing
<how to run tests, what frameworks, coverage expectations>

## Common Gotchas
<things that are surprising, non-obvious, or have caused repeated mistakes>
```

### What goes in CLAUDE.md vs elsewhere

| Content | Where |
| --- | --- |
| Project conventions the model would violate without guidance | CLAUDE.md |
| Build/test/lint commands | CLAUDE.md |
| Reusable workflow (review, deploy, audit) | Skill |
| Domain-specific agent behavior | Agent instructions |
| API reference, schema docs | Reference files via progressive disclosure |

## AGENTS.md Template

Target: under 32 KiB (Codex hard limit; truncated silently beyond this).

```markdown
# Project Name

## Overview
<brief project context>

## Conventions
<coding style, naming, patterns>

## Commands
<build, test, lint, deploy>

## Architecture
<directory structure, key modules, entry points>

## Agent Guidelines
<how agents should approach this project — scope, safety, output expectations>
```

Content should mirror CLAUDE.md semantics, adapted for Codex discovery (root-down concatenation).

## MCP Server Configuration

Recommend entries for `.claude/settings.json`:

```json
{
  "mcpServers": {
    "<server-name>": {
      "command": "<command>",
      "args": ["<args>"],
      "env": {}
    }
  }
}
```

### Common recommendations by tech stack

| Stack signal | MCP server | Purpose |
| --- | --- | --- |
| PostgreSQL/MySQL/SQLite | Database MCP | Query, schema inspection |
| GitHub workflow | GitHub MCP | Issues, PRs, actions |
| Documentation-heavy | Context7 | Library docs lookup |
| Web research needed | Web search MCP | External information |
| Browser testing | Puppeteer/Playwright MCP | Browser automation |

Only recommend MCP servers the project will actually use. Unused servers waste startup time and context.
