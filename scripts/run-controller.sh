#!/usr/bin/env bash
# Issue Agent OS — Controller launcher
# Usage:
#   ./scripts/run-controller.sh <owner/repo> [max_workers]
#
# Supports both Claude Code and Codex:
#   Claude Code: claude --agent controller "Process the issue queue for owner/repo"
#   Codex:       ./scripts/run-controller.sh owner/repo 1

set -euo pipefail

REPO="${1:?Usage: $0 <owner/repo> [max_workers]}"
MAX_WORKERS="${2:-6}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Detect platform
if command -v claude &>/dev/null && [[ "${USE_PLATFORM:-auto}" != "codex" ]]; then
  # Claude Code — use --agent flag
  echo "Starting Issue Agent OS controller via Claude Code..."
  echo "  repo: $REPO"
  echo "  max_workers: $MAX_WORKERS"
  exec claude --agent controller "Process the issue queue for $REPO, max_workers=$MAX_WORKERS"

elif command -v codex &>/dev/null; then
  # Codex — inject controller instructions into prompt
  INSTRUCTIONS=$(sed -n '/^developer_instructions = """/,/^"""/{ /^developer_instructions = """/d; /^"""/d; p; }' \
    "$ROOT_DIR/agents/controller/codex.toml")

  PROMPT="$INSTRUCTIONS

---

Process the issue queue for $REPO, max_workers=$MAX_WORKERS.

Spawn triager, coder, reviewer, splitter, planner, debugger as subagents when needed. These are defined in .codex/agents/ and Codex will match them by name."

  echo "Starting Issue Agent OS controller via Codex..."
  echo "  repo: $REPO"
  echo "  max_workers: $MAX_WORKERS"
  exec codex exec "$PROMPT"

else
  echo "Error: neither 'claude' nor 'codex' found in PATH."
  echo "Install Claude Code or Codex CLI first."
  exit 1
fi
