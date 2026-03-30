## Codex Notes

- Keep repository-wide instructions in the root `AGENTS.md`. If a subtree ever needs narrower guidance, add another scoped `AGENTS.md` inside that subtree instead of bloating the root file.
- Treat the root `AGENTS.md` as generated output from `instructions/root/shared.md` and `instructions/root/codex.md`; do not hand-edit it.
- Codex project-scope runtime installs live under `.agents/skills/` for skills and `.codex/agents/` for agents. Update canonical packages and reinstall rather than editing projected runtime copies.
- For issue/runtime architecture in this repo, treat Codex-native agent lifecycle primitives as first-class building blocks. Prefer `spawn_agent`, `send_input`, `wait_agent`, `resume_agent`, and `close_agent` over custom JavaScript orchestration unless a thin deterministic adapter is genuinely unavoidable.
