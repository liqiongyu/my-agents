# 仓库指南

## 指令来源

根目录的 `AGENTS.md` 和 `CLAUDE.md` 是生成产物。请编辑 `instructions/root/shared.md` 及对应平台片段（`instructions/root/codex.md` 或 `instructions/root/claude.md`），不要直接修改生成文件。修改后运行 `npm run sync-instructions`。仓库的版本化 `pre-commit` 钩子会自动同步并暂存生成文件，`npm test` 和 CI 在文件不一致时会失败。

## 参考

- `instructions/root/reference/structure.md` — 项目布局、包约定、目录职责。创建或重组包时查阅。
- `instructions/root/reference/commands.md` — 构建、测试、lint、安装和脚手架命令。需要运行或记录命令时查阅。

## 编码风格与命名约定

与周围文件的现有风格保持一致。`scripts/` 中的 JavaScript 使用 CommonJS、2 空格缩进、分号和双引号。Python 辅助脚本使用 4 空格缩进，应保持确定性且对 CLI 友好。包目录使用 kebab-case，`skill.json`、`agent.json` 和 `pack.json` 中的 `name` 字段与文件夹名称保持一致。优先使用 ASCII Markdown。不要手动编辑生成的目录、`dist/catalog.json` 或生成的根指令文件。

## 质量与验证规则

- 分类必须来自 `categories.json`；在包元数据中使用新分类前，先在该文件中添加。
- 技能文档、代理平台文档和 Pack README 必须有实质内容，不得为占位符。
- 当 `skill.json`、`agent.json` 或 `pack.json` 中的版本号发生变化时，需要在包的 `CHANGELOG.md` 中添加对应的 `## [x.y.z]` 条目。
- 遵循语义化版本：MAJOR 用于破坏性变更，MINOR 用于新功能，PATCH 用于修复。
- 在修改规范包、元数据、生成产物或贡献者指南后开 PR 之前，运行 `npm run sync-instructions`、`npm run build` 和 `npm test`。
- 版本化 `pre-commit` 钩子保持本地提交快速：它同步根指令、格式化暂存文件、尽可能自动修复暂存的 JavaScript，并重新暂存结果。
- 验证检查包括 schema 合规性、目录约定、changelog/版本对齐、分类白名单、pack 和项目清单引用完整性、生成的目录新鲜度、生成的指令新鲜度，以及参与共享验证路径的 Python 打包单元测试。

## GitHub 与贡献工作流

使用约定式提交，如 `feat(skills): add skill lifecycle manager workflow` 或 `chore(catalog): refresh generated metadata`。保持 PR 聚焦，说明变更是否影响规范包、生成产物、安装流程或仅限本地行为，并链接相关 issue 或研究笔记。GitHub Actions 通过 `.github/workflows/validate.yml` 在每次 push 和 PR 时运行 `npm test`。标记 `v*` 会触发 `.github/workflows/release.yml`，从每个技能、代理和 pack 的 changelog 中汇总 GitHub Release 说明。

## 常见陷阱

- `dist/catalog.json` 包含一个易变的 `generatedAt` 时间戳；新鲜度检查比较的是持久化目录字段，而非该时间戳。
- `schemas/` 下的 Schema `$id` 值指向 GitHub raw URL；如果仓库被重命名或转移，需要更新它们。
- 保持根级指南简洁，将包特定的操作细节推入相关的 `SKILL.md`、`claude-code.md`、`codex.toml`、pack `README.md` 或 changelog。

## 可观测的完成

完成工作后，默认使用以下规范格式包含 `Execution Summary`：

`Execution Summary: agents=<...>; skills=<...>; tools=<...>; verification=<...>; limits=<...>`

- 保持轻量和事实性。不要暴露隐藏的推理或思维链。
- `agents`、`skills`、`tools` 和 `verification` 必须始终存在。未使用时填写 `none`。
- 如果没有有意义的限制或阻碍，`limits` 可以省略。
- 对于简单任务，默认的单行格式即可。
- 如果摘要过长，按相同顺序在不同行使用相同的键名。
