---
name: hook-development
description: REQUIRED for Claude Code or Codex CLI hook queries — has accurate cross-platform reference. Triggers on PreToolUse, PostToolUse, Stop, SessionStart hooks, .claude/settings.json or .codex/hooks.json config, prompt vs command hook types, hooks not firing, exit codes, stdin JSON, matchers, path blocking, or dual-platform hook setups. Skip for React hooks, webhooks, GitHub Actions.
---

# Cross-Platform Hook Development

## Overview

Hooks are event-driven automation that execute when an AI coding agent takes specific actions — before a tool runs, after a file edit, when the agent tries to stop, or when a session starts. They enforce policies, validate operations, inject context, and integrate external tools.

Both Claude Code and Codex CLI support hooks with the same core model: a **hook script receives JSON on stdin, does its work, and communicates back via exit code and stdout/stderr**. The differences are in configuration format, supported events, and some advanced capabilities.

This skill teaches you to design hooks that work on both platforms, and to handle the gaps where they diverge.

## Platform Detection

Before writing hooks, identify which platform(s) the project uses:

| Signal | Platform |
|--------|----------|
| `.claude/settings.json` exists with `"hooks"` key | Claude Code |
| `.codex/hooks.json` exists | Codex |
| `.codex/config.toml` has `[[hooks]]` blocks | Codex |
| Both `.claude/` and `.codex/` directories exist | Dual-platform project |

For dual-platform projects, write hook **scripts** once and reference them from both config files. The configs differ but the scripts can be shared.

## Hook Types

### Command Hooks (Both Platforms)

Execute a shell command. The workhorse hook type — deterministic, fast, works everywhere:

```json
{
  "type": "command",
  "command": "bash path/to/validate.sh",
  "timeout": 60
}
```

Use for: input validation, path safety checks, file size limits, external tool integration, linting, anything with clear yes/no logic.

### Prompt-Based Hooks (Claude Code Only)

Use an LLM to make context-aware decisions with natural language reasoning:

```json
{
  "type": "prompt",
  "prompt": "Evaluate if this bash command is safe: $TOOL_INPUT. Check for destructive operations, privilege escalation, and network access. Return 'approve' or 'deny'.",
  "timeout": 30
}
```

Prompt hooks catch edge cases that regex can't — they understand intent, not just patterns. But they cost tokens and add latency.

**Codex does not support prompt hooks.** It parses the `"type": "prompt"` field but silently skips execution. For dual-platform projects, always provide a command hook equivalent. See "Prompt Hook Degradation" below.

## Hook Events

Not every event exists on both platforms. Design around the intersection, then add platform-specific hooks where valuable.

| Event | Claude Code | Codex | Primary Use |
|-------|:-----------:|:-----:|-------------|
| **PreToolUse** | Yes | Yes | Validate/block/modify tool calls before execution |
| **PostToolUse** | Yes | Yes | React to results, provide feedback, log |
| **Stop** | Yes | Yes | Verify task completeness before agent stops |
| **UserPromptSubmit** | Yes | Yes | Add context, validate, or block user prompts |
| **SessionStart** | Yes | Yes | Load project context, set environment |
| **SubagentStop** | Yes | No | Validate subagent task completion |
| **SessionEnd** | Yes | No | Cleanup, logging, state preservation |
| **PreCompact** | Yes | No | Preserve critical info before context compaction |
| **Notification** | Yes | No | React to user notifications |
| **PermissionRequest** | No | Yes | Intercept permission approval requests |

**Safe cross-platform set:** PreToolUse, PostToolUse, Stop, UserPromptSubmit, SessionStart — these five work on both.

## Configuration Formats

### Claude Code — `.claude/settings.json`

Hooks live inside a top-level `"hooks"` key:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash tools/validate-bash.sh"
          }
        ]
      }
    ]
  }
}
```

### Codex — `.codex/hooks.json`

Same structure, but the file is hooks-only (no other settings mixed in). Codex also supports a `statusMessage` field:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash tools/validate-bash.sh",
            "statusMessage": "Checking bash command safety"
          }
        ]
      }
    ]
  }
}
```

### Codex Alternative — `.codex/config.toml`

Codex also accepts hooks inline in TOML format. Less common but useful for simple setups.

### Dual-Platform Template

For projects using both, point both configs at the **same scripts**:

```
project/
  .claude/settings.json    # Claude Code hooks config
  .codex/hooks.json        # Codex hooks config
  tools/hooks/             # Shared hook scripts (both configs reference these)
    validate-bash.sh
    validate-write.sh
    load-context.sh
```

## Matchers

Matchers filter which tools trigger a hook. Both platforms use regex against tool names.

```json
"matcher": "Bash"              // Exact tool name
"matcher": "Write|Edit"        // Multiple tools (OR)
"matcher": "mcp__.*__delete.*" // Regex for MCP delete operations
"matcher": "*"                 // Wildcard — all tools
```

Matchers are **case-sensitive**. Common tool names: `Bash`, `Read`, `Write`, `Edit`, `Agent`.

For MCP tools, the naming pattern is `mcp__<server>__<tool>`:
```json
"matcher": "mcp__.*"                    // All MCP tools
"matcher": "mcp__plugin_asana_.*"       // Specific MCP server
```

**Codex note:** For SessionStart, matcher filters by start source (`startup`, `resume`, `clear`). For UserPromptSubmit and Stop, matchers are ignored.

## Hook Input/Output

### Input (stdin JSON)

All hooks receive a JSON object on stdin. Common fields:

```json
{
  "session_id": "abc123",
  "cwd": "/path/to/project",
  "hook_event_name": "PreToolUse"
}
```

**Event-specific fields:**

| Event | Additional Fields |
|-------|-------------------|
| PreToolUse | `tool_name`, `tool_input` |
| PostToolUse | `tool_name`, `tool_input`, `tool_result` / `tool_output` |
| UserPromptSubmit | `user_prompt` |
| Stop | `reason` |
| SessionStart | `start_source` (Codex only) |

**Platform input differences:**
- Claude Code delivers input via `$CLAUDE_TOOL_INPUT` env var **and** stdin
- Codex delivers input via stdin only (use `input=$(cat)` in scripts)
- For cross-platform scripts, always read from stdin — it works on both

### Output

**Exit codes** (both platforms):
- `0` — Success, stdout shown in transcript
- `2` — Blocking error, stderr fed back to agent

**JSON output** (optional, for richer control):
```json
{
  "continue": true,
  "systemMessage": "Message injected into agent context",
  "suppressOutput": false
}
```

**PreToolUse special output** (Claude Code):
```json
{
  "hookSpecificOutput": {
    "permissionDecision": "allow|deny|ask",
    "updatedInput": {"field": "modified_value"}
  }
}
```

**Stop/SubagentStop decision output** (Claude Code):
```json
{
  "decision": "approve|block",
  "reason": "Explanation"
}
```

**Codex output field support varies by event** — see `references/codex.md` for the full matrix.

## Environment Variables

| Variable | Claude Code | Codex | Purpose |
|----------|:-----------:|:-----:|---------|
| `$CLAUDE_PROJECT_DIR` | Yes | No | Project root |
| `$CLAUDE_PLUGIN_ROOT` | Yes | Yes (compat alias) | Plugin directory |
| `$CLAUDE_ENV_FILE` | Yes | No | SessionStart: persist env vars here |
| `$PLUGIN_ROOT` | No | Yes | Plugin directory (native) |
| `$PLUGIN_DATA` | No | Yes | Writable plugin data directory |

**Cross-platform script pattern:**
```bash
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
```

## Common Patterns (Quick Reference)

These patterns work on **both platforms** using command hooks:

| Pattern | Event | What It Does |
|---------|-------|--------------|
| **Path Safety** | PreToolUse (Write/Edit) | Block writes to system paths, .env, credentials |
| **Dangerous Command** | PreToolUse (Bash) | Block rm -rf, sudo, dd, mkfs |
| **Test Enforcement** | Stop | Block stop if code changed but no tests ran |
| **Context Loading** | SessionStart | Detect project type, set env vars |
| **Code Quality** | PostToolUse (Write/Edit) | Run linter after file edits |
| **Completion Check** | Stop | Verify build succeeded and questions answered |

For complete implementations of each pattern with dual-platform configs, see `references/patterns.md`.

## Security Best Practices

These apply to command hooks on both platforms:

**Always validate input:**
```bash
#!/bin/bash
set -euo pipefail
input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name')

if [[ ! "$tool_name" =~ ^[a-zA-Z0-9_]+$ ]]; then
  echo '{"decision": "deny", "reason": "Invalid tool name"}' >&2
  exit 2
fi
```

**Check for path traversal:**
```bash
file_path=$(echo "$input" | jq -r '.tool_input.file_path')
if [[ "$file_path" == *".."* ]]; then
  echo '{"decision": "deny", "reason": "Path traversal detected"}' >&2
  exit 2
fi
```

**Quote all variables** — unquoted variables are injection vectors:
```bash
echo "$file_path"       # GOOD
echo $file_path         # BAD — word splitting + globbing
```

**Set timeouts** — prevent hooks from blocking the agent indefinitely. Default: 60s for command hooks, 30s for prompt hooks.

## Prompt Hook Degradation Strategy

When a project uses both platforms and you want prompt hook intelligence on Claude Code with a command hook fallback on Codex:

**Claude Code** — use the prompt hook for nuanced reasoning:
```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "prompt",
      "prompt": "Analyze command for destructive ops, privilege escalation, network access without consent. Return 'approve' or 'deny'."
    }
  ]
}
```

**Codex** — use a command hook with equivalent deterministic logic:
```json
{
  "matcher": "Bash",
  "hooks": [
    {
      "type": "command",
      "command": "bash tools/hooks/validate-bash.sh",
      "statusMessage": "Checking command safety"
    }
  ]
}
```

The command hook won't catch as many edge cases as the prompt hook, but it covers the common dangerous patterns. This is an acceptable tradeoff — prompt hooks are a bonus, not a requirement.

## Debugging

### Claude Code

```bash
claude --debug    # Verbose hook execution logs
```

Use `/hooks` in-session to review loaded hooks. Changes to hooks require session restart.

### Codex

Check `.codex/hooks.json` syntax:
```bash
jq . .codex/hooks.json    # Validates JSON
```

Codex logs hook execution to its standard output. Invalid JSON causes load failure at startup.

### Testing Hook Scripts Directly

Test any hook script by piping sample JSON:
```bash
echo '{"tool_name": "Bash", "tool_input": {"command": "rm -rf /"}}' | \
  bash tools/hooks/validate-bash.sh
echo "Exit code: $?"
```

### Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Hook never fires | Wrong matcher (case-sensitive) | Check exact tool name |
| Hook fires but no effect | Script exits 0 with no output | Use exit 2 + stderr for blocking |
| "Invalid JSON" at startup | Syntax error in config | Run `jq .` on the config file |
| Changes not taking effect | Hooks load at session start | Restart the session |
| Codex prompt hook silently skipped | Codex doesn't execute prompt hooks | Use command hook instead |

## Dual-Platform Workflow

When maintaining hooks for both platforms in one project:

1. **Write scripts first** — put reusable logic in `tools/hooks/` or similar
2. **Scripts read stdin** — use `input=$(cat)` so they work on both platforms
3. **Derive project root portably** — `git rev-parse --show-toplevel` works everywhere
4. **Generate both configs** — or maintain them manually with the same script references
5. **Test on both** — run script directly with piped JSON, then test in each runtime

## Implementation Workflow

To add hooks to a project:

1. Identify which events you need (start with the cross-platform five)
2. Choose hook type: command for deterministic checks, prompt for reasoning (Claude Code only)
3. Write hook scripts in a shared location
4. Add configuration for your platform(s)
5. Test scripts directly with piped JSON
6. Test in runtime (`claude --debug` or Codex startup)
7. Document hooks in project README or AGENTS.md

## Additional Resources

For detailed platform-specific reference and extended patterns, consult:

- **`references/claude-code.md`** — Complete Claude Code hook reference: all 9 events, prompt hook API, plugin hooks.json format, env vars
- **`references/codex.md`** — Complete Codex hook reference: all 6 events, config.toml format, output field support matrix, limitations
- **`references/patterns.md`** — 10+ proven cross-platform patterns with dual-config examples
- **`references/advanced.md`** — Advanced: multi-stage validation, cross-event state, caching, external integrations, rate limiting, testing
