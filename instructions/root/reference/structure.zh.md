# 项目结构与模块组织

本仓库是一个用于可复用技能（skills）、代理（agents）和可安装包（packs）的 monorepo。请编辑 `skills/<name>/`、`agents/<name>/` 和 `packs/<name>/` 中的规范源文件，而非 `.agents/`、`.claude/` 或 `.codex/` 中的运行时投影副本。

- 技能包应包含 `skill.json`、`SKILL.md` 和 `CHANGELOG.md`；`eval/`、`references/`、`scripts/`、`projection.json` 和 `tests/` 为可选项。
- 代理包应包含 `agent.json`、至少一个平台定义文件（如 `claude-code.md` 或 `codex.toml`）和 `CHANGELOG.md`。
- Pack 包应包含 `pack.json`、`README.md` 和 `CHANGELOG.md`。
- 共享 schema 放在 `schemas/`；创作工具放在 `scripts/`；生成的目录放在 `docs/catalog/` 和 `dist/catalog.json`；较长的研究笔记放在 `research/`。
- 将可安装的技能和代理视为自包含的包。一个技能或代理可以在概念上引用另一个包，但不得依赖其他技能或代理包的私有脚本路径。如果没有正式的共享运行时分发机制，优先选择本地复制而非跨包运行时依赖。
- 仅限本地使用的外部参考仓库应放在 `workspaces/references/` 下。如果 `.my-agents/reference-repos.json` 存在，将其视为这些引用的发现索引，但不要提交该清单或克隆的仓库。
