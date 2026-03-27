# My Agents

语言：简体中文 | [English](README.md)

[![Validate](https://github.com/liqiongyu/my-agents/actions/workflows/validate.yml/badge.svg)](https://github.com/liqiongyu/my-agents/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

这是一个用于编写、校验和发布可复用 Agent Skills 与子代理定义的 monorepo，面向 Claude Code、Codex 以及类似的 AI 编程代理工作流。

仓库把 `skills/` 和 `agents/` 作为唯一的源码入口，再基于这些源文件生成目录索引、执行结构校验，并把内容投影到不同运行时需要的安装位置。

> [!NOTE]
> 日常维护请直接修改 `skills/` 和 `agents/` 下的源码包。生成索引和项目级运行时副本都应视为派生产物。
> 根目录 `AGENTS.md` 保留为仓库贡献说明，因此生成索引不再写回根目录。

## 快速开始

前置要求：Node.js 18 或更高版本。

```bash
npm install
npm run new -- my-skill
npm run new -- --agent my-agent
npm run build
npm test
```

## 浏览目录索引

- [docs/catalog/skills.md](docs/catalog/skills.md) 是自动生成的技能索引，适合人工浏览。
- [docs/catalog/agents.md](docs/catalog/agents.md) 是自动生成的代理索引，适合人工浏览。
- `dist/catalog.json` 是供脚本和工具消费的机器可读索引。

如果想快速理解当前仓库的主线方向，可以先从生成索引中的 `skill-lifecycle-manager`、`skill-researcher` 和 `agent-lifecycle-manager` 看起。它们分别代表生命周期路由、研究交接，以及跨运行时投影这一批核心能力。

## 元数据约定

- [schemas/skill.schema.json](schemas/skill.schema.json)、[schemas/agent.schema.json](schemas/agent.schema.json) 和 [schemas/catalog.schema.json](schemas/catalog.schema.json) 定义了机器可读的元数据契约。
- [docs/metadata/skill-metadata-policy.md](docs/metadata/skill-metadata-policy.md) 说明了如何一致地使用 `requirements`、`capabilities` 和 `maturity` 等字段。
- [AGENTS.md](AGENTS.md) 与 [CONTRIBUTING.md](CONTRIBUTING.md) 仍然是贡献者视角下的仓库工作流、发布卫生和本地约定说明。

## 仓库结构

| 路径 | 用途 |
| --- | --- |
| `docs/catalog/` | 自动生成的技能与代理目录索引 |
| `docs/metadata/` | 仓库级元数据策略与编写约定 |
| `skills/<name>/` | Skills 的标准源码包，包含 `skill.json`、`SKILL.md`、`CHANGELOG.md` |
| `agents/<name>/` | Agents 的标准源码包，包含 `agent.json`、`claude-code.md`、`codex.toml`、`CHANGELOG.md` |
| `scripts/` | 脚手架、安装、目录构建与校验脚本 |
| `schemas/` | Skill、Agent、Catalog 元数据对应的 JSON Schema |
| `research/` | 调研笔记、资料整理和较长的背景文档 |
| `workspaces/<skill-name>/` | Skill 开发时的评估沙箱与临时工作区 |
| `.claude/` 和 `.agents/` | 本地执行项目级安装时产生的运行时投影目录 |

## 常用工作流

### 创建一个 skill

```bash
npm run new -- my-skill
npm run build
npm test
```

这会生成 `skills/my-skill/`，其中包含 `skill.json`、`SKILL.md` 和 `CHANGELOG.md`。

### 创建一个 agent

```bash
npm run new -- --agent my-agent
npm run build
npm test
```

这会生成 `agents/my-agent/`，其中包含 `agent.json`、`claude-code.md`、`codex.toml` 和 `CHANGELOG.md`。

### 安装到运行时目录

```bash
npm run install-skill -- clarify
npm run install-skill -- clarify --platform codex --scope project
npm run install-agent -- explorer
npm run install-agent -- explorer --platform codex --scope project
```

安装脚本还支持 `--all`、`--platform claude|codex|all`、`--scope user|project`，以及对应的 `npm run uninstall-skill` / `npm run uninstall-agent` 卸载命令。

如果某个 skill 需要排除仅供作者使用的文件，可以通过 `projection.json` 控制运行时投影内容，同时保留仓库中的完整源码包。

## 安装目标

| 包类型 | Claude Code 目标路径 | Codex 目标路径 |
| --- | --- | --- |
| Skill | `~/.claude/skills/<name>/` 或 `.claude/skills/<name>/` | `~/.agents/skills/<name>/` 或 `.agents/skills/<name>/` |
| Agent | `~/.claude/agents/<name>.md` 或 `.claude/agents/<name>.md` | `~/.codex/agents/<name>.toml` 或 `.codex/agents/<name>.toml` |

## 生成文件

- `npm run build` 会重新生成 `dist/catalog.json`、`docs/catalog/skills.md` 和 `docs/catalog/agents.md`。
- 这些索引文件不建议手动编辑，应该回到对应的源码包中修改。
- `docs/metadata/` 下的策略文档不是生成文件；仓库约定变化时应直接修改这些文档。

## 校验与发布

- `npm test` 实际执行的是 `npm run validate`。
- 校验内容包括 schema、目录约定、CHANGELOG 与版本号一致性、生成索引是否最新，以及文档最小质量要求。
- 如果调整了元数据语义或仓库策略，应该先更新标准源码包与相关策略文档，再执行 `npm run build` 和 `npm test`。
- GitHub Actions 会在每次 push 和 pull request 时运行 `.github/workflows/validate.yml`。
- 打上 `v*` 标签后会触发 `.github/workflows/release.yml`，从各个 skill 和 agent 的 changelog 中汇总 GitHub Release 说明。

## 贡献

贡献规范和发布注意事项见 [CONTRIBUTING.md](CONTRIBUTING.md)。

如果需要新增分类，请先更新 [categories.json](categories.json)，再在 `skill.json` 或 `agent.json` 中引用。

## License

[MIT](LICENSE) - Qiongyu Li
