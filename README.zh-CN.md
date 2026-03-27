# My Agents

语言：简体中文 | [English](README.md)

[![Validate](https://github.com/liqiongyu/my-agents/actions/workflows/validate.yml/badge.svg)](https://github.com/liqiongyu/my-agents/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

这是一个用于编写、校验和发布可复用 skills、agents 和 installable packs 的 monorepo，面向 Claude Code、Codex 以及类似的 AI 编程代理工作流。

仓库把 `skills/`、`agents/` 和 `packs/` 作为唯一的源码入口，再基于这些源文件生成目录索引、执行结构校验，并把内容投影到不同运行时需要的安装位置。

> [!NOTE]
> 日常维护请直接修改 `skills/`、`agents/`、`packs/` 和 `instructions/root/` 下的源码。生成索引、根目录说明文件和项目级运行时副本都应视为派生产物。
> 根目录 `AGENTS.md` 与 `CLAUDE.md` 是生成文件，不要直接手改。

## 快速开始

前置要求：Node.js 18 或更高版本。

```bash
npm install
npm run new -- my-skill
npm run new -- --agent my-agent
npm run new -- --pack my-pack
npm run lint
npm run build
npm test
```

## 浏览目录索引

- [docs/catalog/skills.md](docs/catalog/skills.md) 是自动生成的技能索引，适合人工浏览。
- [docs/catalog/agents.md](docs/catalog/agents.md) 是自动生成的代理索引，适合人工浏览。
- [docs/catalog/packs.md](docs/catalog/packs.md) 是自动生成的 pack 索引，适合人工浏览。
- `dist/catalog.json` 是供脚本和工具消费的机器可读索引。

如果想快速理解当前仓库的主线方向，可以先从生成索引中的 `skill-lifecycle-manager`、`skill-researcher` 和 `agent-lifecycle-manager` 看起。它们分别代表生命周期路由、研究交接，以及跨运行时投影这一批核心能力。

## 元数据约定

- [schemas/skill.schema.json](schemas/skill.schema.json)、[schemas/agent.schema.json](schemas/agent.schema.json)、[schemas/pack.schema.json](schemas/pack.schema.json)、[schemas/project-manifest.schema.json](schemas/project-manifest.schema.json) 和 [schemas/catalog.schema.json](schemas/catalog.schema.json) 定义了机器可读的元数据契约。
- [docs/metadata/skill-metadata-policy.md](docs/metadata/skill-metadata-policy.md) 说明了如何一致地使用 `requirements`、`capabilities` 和 `maturity` 等字段。
- [docs/metadata/pack-metadata-policy.md](docs/metadata/pack-metadata-policy.md) 说明了 pack 的成员编排方式以及 `packType`、`persona` 等字段约定。
- [docs/metadata/project-manifest-policy.md](docs/metadata/project-manifest-policy.md) 说明了如何使用 `my-agents.project.json` 做项目级引导。
- [instructions/root/shared.md](instructions/root/shared.md) 是 Codex 与 Claude Code 共享规则的唯一来源。
- [AGENTS.md](AGENTS.md)、[CLAUDE.md](CLAUDE.md) 与 [CONTRIBUTING.md](CONTRIBUTING.md) 负责对贡献者说明工作流、发布卫生和本地约定。

## 仓库结构

| 路径                       | 用途                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `docs/catalog/`            | 自动生成的技能、代理与 pack 目录索引                                                   |
| `docs/metadata/`           | 仓库级元数据策略与编写约定                                                             |
| `skills/<name>/`           | Skills 的标准源码包，包含 `skill.json`、`SKILL.md`、`CHANGELOG.md`                     |
| `agents/<name>/`           | Agents 的标准源码包，包含 `agent.json`、`claude-code.md`、`codex.toml`、`CHANGELOG.md` |
| `packs/<name>/`            | Pack 的标准源码包，包含 `pack.json`、`README.md`、`CHANGELOG.md`                       |
| `my-agents.project.json`   | 可选的项目引导清单，供 `npm run sync-project` 使用                                     |
| `instructions/root/`       | 用来生成根目录 `AGENTS.md` 与 `CLAUDE.md` 的标准源文件                                 |
| `scripts/`                 | 脚手架、安装、目录构建与校验脚本                                                       |
| `schemas/`                 | Skill、Agent、Catalog 元数据对应的 JSON Schema                                         |
| `research/`                | 调研笔记、资料整理和较长的背景文档                                                     |
| `workspaces/<skill-name>/` | Skill 开发时的评估沙箱与临时工作区                                                     |
| `.claude/` 和 `.agents/`   | 本地执行项目级安装时产生的运行时投影目录                                               |

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

### 创建一个 pack

```bash
npm run new -- --pack product-manager
npm run build
npm test
```

这会生成 `packs/product-manager/`，其中包含 `pack.json`、`README.md` 和 `CHANGELOG.md`。

### 安装到运行时目录

```bash
npm run install-skill -- clarify
npm run install-skill -- clarify --platform codex --scope project
npm run install-agent -- explorer
npm run install-agent -- explorer --platform codex --scope project
npm run install-pack -- product-manager
npm run install-pack -- product-manager --platform codex --scope project
npm run sync-project -- --manifest docs/examples/my-agents.project.example.json
```

安装脚本还支持 `--all`、`--platform claude|codex|all`、`--scope user|project`、`--manifest <path>`，以及对应的 `npm run uninstall-skill` / `npm run uninstall-agent` / `npm run uninstall-pack` 卸载命令。

如果某个 skill 需要排除仅供作者使用的文件，可以通过 `projection.json` 控制运行时投影内容，同时保留仓库中的完整源码包。

### 同步项目清单

可以在目标仓库根目录创建 `my-agents.project.json`，或从 [docs/examples/my-agents.project.example.json](docs/examples/my-agents.project.example.json) 开始：

```bash
cp docs/examples/my-agents.project.example.json my-agents.project.json
npm run sync-project
npm run sync-project -- --platform codex
```

`sync-project` 总是安装到 project scope。CLI 传入的 `--platform` 会覆盖清单里的默认平台；如果两边都没写，则会同步到两个受支持的平台。

### 同步根目录说明文件

```bash
npm run sync-instructions
npm run sync-instructions -- --check
```

`instructions/root/shared.md` 保存共享规则，`instructions/root/claude.md` 和 `instructions/root/codex.md` 保存平台差异。`npm install` 会为当前 clone 配置版本化的 `.githooks/pre-commit`，提交时自动运行同步并暂存 `AGENTS.md` 与 `CLAUDE.md`。`npm test` 也会在这两个生成文件漂移时失败。

### Lint 与格式化

```bash
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

ESLint 负责仓库里的 JavaScript 工具脚本，Prettier 负责 Markdown、JSON、YAML、TOML 等支持的源码文件。版本化的 `pre-commit` hook 会执行一轮快速的 staged-file 检查：同步根说明文件、格式化已暂存文件、尽可能自动修复已暂存的 JavaScript，再把结果重新暂存。

## 安装目标

| 包类型 | Claude Code 目标路径                                       | Codex 目标路径                                               |
| ------ | ---------------------------------------------------------- | ------------------------------------------------------------ |
| Skill  | `~/.claude/skills/<name>/` 或 `.claude/skills/<name>/`     | `~/.agents/skills/<name>/` 或 `.agents/skills/<name>/`       |
| Agent  | `~/.claude/agents/<name>.md` 或 `.claude/agents/<name>.md` | `~/.codex/agents/<name>.toml` 或 `.codex/agents/<name>.toml` |
| Pack   | 会把它引用的 skills 与 agents 安装到上面的目标路径         | 会把它引用的 skills 与 agents 安装到上面的目标路径           |

## 生成文件

- `npm run build` 会重新生成 `dist/catalog.json`、`docs/catalog/skills.md`、`docs/catalog/agents.md` 和 `docs/catalog/packs.md`。
- `npm run sync-instructions` 会根据 `instructions/root/` 重新生成根目录的 `AGENTS.md` 与 `CLAUDE.md`。
- 这些索引文件不建议手动编辑，应该回到对应的源码包中修改。
- `docs/metadata/` 下的策略文档和 `instructions/root/` 下的说明源文件都不是生成文件；仓库约定变化时应直接修改这些源文件。

## 校验与发布

- `npm test` 实际执行的是 `npm run validate`。
- 校验内容包括 ESLint、Prettier、schema、目录约定、CHANGELOG 与版本号一致性、pack 与项目清单引用完整性、生成索引是否最新、根目录说明文件是否已同步，以及文档最小质量要求。
- 如果调整了元数据语义或仓库策略，应该先更新标准源码包、相关策略文档或 `instructions/root/`，再执行 `npm run build`、`npm run sync-instructions` 和 `npm test`。
- GitHub Actions 会在每次 push 和 pull request 时运行 `.github/workflows/validate.yml`。
- Dependabot 会通过 `.github/dependabot.yml` 定期更新 npm 与 GitHub Actions 依赖。
- 打上 `v*` 标签后会触发 `.github/workflows/release.yml`，从各个 skill、agent 和 pack 的 changelog 中汇总 GitHub Release 说明。

## 贡献

贡献规范和发布注意事项见 [CONTRIBUTING.md](CONTRIBUTING.md)。

如果需要新增分类，请先更新 [categories.json](categories.json)，再在 `skill.json`、`agent.json` 或 `pack.json` 中引用。

## License

[MIT](LICENSE) - Qiongyu Li
