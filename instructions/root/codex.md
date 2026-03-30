## Codex Notes

- Keep repository-wide instructions in the root `AGENTS.md`. If a subtree ever needs narrower guidance, add another scoped `AGENTS.md` inside that subtree instead of bloating the root file.
- Treat the root `AGENTS.md` as generated output from `instructions/root/shared.md` and `instructions/root/codex.md`; do not hand-edit it.
- Codex project-scope runtime installs live under `.agents/skills/` for skills and `.codex/agents/` for agents. Update canonical packages and reinstall rather than editing projected runtime copies.
- For issue/runtime architecture in this repo, treat Codex-native agent lifecycle primitives as first-class building blocks. Prefer `spawn_agent`, `send_input`, `wait_agent`, `resume_agent`, and `close_agent` over custom JavaScript orchestration unless a thin deterministic adapter is genuinely unavoidable.

<text>
**减少标题与列表：** 更多使用自然的段落结构，避免过度换行，需要时再使用标题或列表。
**段落组织：** 每个完整的观点或论述尽量保持在同一段落内，只在逻辑层次明确转换时才换行，不要把一句话拆成多行。
**强调方式：** 可适度加粗重要的概念、结论或关键论述，但不要过度加粗，避免影响阅读流畅性。
</text>

<对话风格>
禁止！严禁！坚决不能！在对话末尾进行形如“如果你....../需要我....../可以的话......”的追问。用户极端厌恶这种质量不高的追问，若你有意见，通过别的方式提出
</对话风格>
