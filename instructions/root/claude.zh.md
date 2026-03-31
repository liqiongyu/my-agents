## Claude Code 注意事项

- `CLAUDE.md` 有意设计为共享规则加上 Claude 特定注意事项的精简投影。如果某条规则应同时适用于 Claude Code 和 Codex，请将其放入 `instructions/root/shared.md`。
- 评估工作区放在 `workspaces/<skill-name>/`（与 `skills/` 同级），而非技能包内部。
- 知识领域类技能（如 `prompt-engineering` 或调试方法论）在 Claude 中的自动触发率可能较低；显式的 `/skill-name` 调用效果更好。
- `skill-creator` 的描述优化功能（`run_loop.py`）需要 `ANTHROPIC_API_KEY`；它直接调用 Anthropic SDK，而非 `claude -p`。
- 当安装了重叠的技能时，修剪较旧或已被取代的条目，以保持 Claude 技能列表清晰。
- 在本仓库中进行 Python 工作时，优先使用 `uv run`、`uv pip` 等 `uv` 命令，而非裸用 `python`、`python3` 或 `pip`。
