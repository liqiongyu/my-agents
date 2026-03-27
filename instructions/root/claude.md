## Claude Code Notes
- `CLAUDE.md` is intentionally a thin projection of the shared rules plus Claude-specific caveats. If a rule should apply to both Claude Code and Codex, put it in `instructions/root/shared.md`.
- Eval workspaces go in `workspaces/<skill-name>/` (sibling to `skills/`), not inside the skill package.
- Knowledge-domain skills such as `prompt-engineering` or debugging methodology may have low auto-trigger rates in Claude; explicit `/skill-name` invocation can work better.
- `skill-creator` description optimization (`run_loop.py`) requires `ANTHROPIC_API_KEY`; it calls the Anthropic SDK directly, not `claude -p`.
- When overlapping skills are installed, prune older or superseded entries to keep the Claude skill list clear.
- For Python work in this repo, prefer `uv run`, `uv pip`, and other `uv` commands instead of bare `python`, `python3`, or `pip`.
