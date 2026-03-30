# My Agents

语言：简体中文 | [English](README.md)

[![Validate](https://github.com/liqiongyu/my-agents/actions/workflows/validate.yml/badge.svg)](https://github.com/liqiongyu/my-agents/actions/workflows/validate.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

这是一个用于编写、校验和发布可复用 skills、agents 和 installable packs 的 monorepo，面向 Claude Code、Codex 以及类似的 AI 编程代理工作流。内置 **Issue Agent OS** —— 一个轻量控制器，将 GitHub Issues 转化为全自动的 分诊 → 执行 → 审查 → 合并 流水线，完全由子代理驱动。

仓库把 `skills/`、`agents/` 和 `packs/` 作为唯一的源码入口，再基于这些源文件生成目录索引、执行结构校验，并把内容投影到不同运行时需要的安装位置。`runtime/` 下的轻量服务负责 Issue Agent OS 的队列与租约管理。

> [!NOTE]
> 日常维护请直接修改 `skills/`、`agents/`、`packs/` 和 `instructions/root/` 下的源码。生成索引、根目录说明文件和项目级运行时副本都应视为派生产物。
> 根目录 `AGENTS.md` 与 `CLAUDE.md` 是生成文件，不要直接手改。

## 快速开始

前置要求：

- Node.js 18 或更高版本
- `uv`，用于 `npm test` 中执行的 Python 校验与测试辅助脚本

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

如果想快速理解当前仓库的主线方向，可以先看 `issue-controller`（自动化 issue 队列循环）以及 agents 索引中的工作代理（`triager`、`coder`、`reviewer`、`splitter`、`debugger`）。包创作工作流方面，可以参考 skills 索引中的 `skill-lifecycle-manager` 和 `agent-lifecycle-manager`。

## Issue Agent OS

Issue Agent OS 以 GitHub Issues 作为优先级队列，通过一个轻量控制器 skill 编排子代理完成全流程。控制器本身不读取 issue 内容，所有判断都由它派发的子代理完成。

```
GitHub Issues（优先级队列）
        │
        ▼
   Controller        ← skills/issue-controller
  （轻量调度器）
        │
   ┌────┼────┐
   ▼    ▼    ▼
 Triager Triager ...  ← agents/triager（并行扇出）
   │    │    │
   ▼    ▼    ▼
 Coder Splitter Debugger ...  ← agents/coder, splitter, debugger, planner
   │         │
   ▼         ▼
 Reviewer  子 issue → 重新入队
   │
   ▼
 合并 PR
```

**核心组件：**

| 组件       | 位置                       | 职责                                             |
| ---------- | -------------------------- | ------------------------------------------------ |
| Controller | `skills/issue-controller/` | 轻量调度循环 —— 拉取队列、扇出分诊、派发工作代理 |
| Triager    | `agents/triager/`          | 读取 issue，评估可操作性，返回路由裁决           |
| Coder      | `agents/coder/`            | 在隔离 worktree 中根据分诊简报实现变更           |
| Reviewer   | `agents/reviewer/`         | 按严重性分级的结构化代码审查                     |
| Splitter   | `agents/splitter/`         | 将大型或模糊 issue 拆分为 2–5 个具体子 issue     |
| Debugger   | `agents/debugger/`         | 假设驱动的 bug 诊断与修复                        |
| Planner    | `agents/planner/`          | 架构与实现规划                                   |
| 队列服务   | `runtime/services/`        | 优先级排序、依赖解析、就绪 issue 筛选            |
| 租约服务   | `runtime/services/`        | 支持并发工作代理的分布式租约管理                 |
| 状态存储   | `scripts/lib/`             | 租约、运行记录、产物与事件日志持久化             |

完整设计文档见 [docs/architecture/issue-agent-os-architecture.md](docs/architecture/issue-agent-os-architecture.md)。

## 元数据约定

- [schemas/skill.schema.json](schemas/skill.schema.json)、[schemas/agent.schema.json](schemas/agent.schema.json)、[schemas/pack.schema.json](schemas/pack.schema.json)、[schemas/project-manifest.schema.json](schemas/project-manifest.schema.json) 和 [schemas/catalog.schema.json](schemas/catalog.schema.json) 定义了机器可读的元数据契约。
- [docs/metadata/skill-metadata-policy.md](docs/metadata/skill-metadata-policy.md) 说明了如何一致地使用 `requirements`、`capabilities` 和 `maturity` 等字段。
- 可安装的 skill 和 agent 在安装后应保持自包含。不要依赖其他包的私有运行时脚本路径；如果还没有正式的共享运行时分发机制，优先使用包内副本。
- 在 `agent.json` 中，`agents` 表示 canonical 的跨平台 agent 依赖图；如果某个平台的运行时投影需要更扁平的直接子 agent 面，请使用 `platformDependencies["claude-code"].agents`，而不是把 canonical 图改扁。
- [docs/metadata/pack-metadata-policy.md](docs/metadata/pack-metadata-policy.md) 说明了 pack 的成员编排方式以及 `packType`、`persona` 等字段约定。
- [docs/metadata/project-manifest-policy.md](docs/metadata/project-manifest-policy.md) 说明了如何使用 `my-agents.project.json` 做项目级引导。
- [docs/cli/README.md](docs/cli/README.md) 是面向操作方的命令参考索引。
- [docs/architecture/tooling-layout.md](docs/architecture/tooling-layout.md) 说明了随着命令面增长，工具脚本和文档应如何组织。
- [docs/architecture/official-agent-best-practices.md](docs/architecture/official-agent-best-practices.md) 把 OpenAI、Anthropic、MCP 与 Agent Skills 的官方最佳实践压缩成仓库默认设计规则。
- [research/OpenAI_Anthropic_Codex_Claude_Code_Best_Practices_20260329.md](research/OpenAI_Anthropic_Codex_Claude_Code_Best_Practices_20260329.md) 保存这些规则背后的长版研究与来源依据。
- [docs/architecture/issue-agent-os-architecture.md](docs/architecture/issue-agent-os-architecture.md) 记录了 Issue Agent OS 的设计：轻量控制器、GitHub-issues-as-queue、子代理派发与租约管理。
- [instructions/root/shared.md](instructions/root/shared.md) 是 Codex 与 Claude Code 共享规则的唯一来源。
- [AGENTS.md](AGENTS.md)、[CLAUDE.md](CLAUDE.md) 与 [CONTRIBUTING.md](CONTRIBUTING.md) 负责对贡献者说明工作流、发布卫生和本地约定。

## 仓库结构

| 路径                       | 用途                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `docs/architecture/`       | 面向维护者的说明文档，解释工具边界、投影流程和仓库架构                                 |
| `docs/catalog/`            | 自动生成的技能、代理与 pack 目录索引                                                   |
| `docs/cli/`                | 面向操作方的命令参考，覆盖 runtime、sync 与维护工作流                                  |
| `docs/metadata/`           | 仓库级元数据策略与编写约定                                                             |
| `skills/<name>/`           | Skills 的标准源码包，包含 `skill.json`、`SKILL.md`、`CHANGELOG.md`                     |
| `agents/<name>/`           | Agents 的标准源码包，包含 `agent.json`、`claude-code.md`、`codex.toml`、`CHANGELOG.md` |
| `packs/<name>/`            | Pack 的标准源码包，包含 `pack.json`、`README.md`、`CHANGELOG.md`                       |
| `my-agents.project.json`   | 可选的项目引导清单，供 `npx my-agents project sync` 使用                               |
| `instructions/root/`       | 用来生成根目录 `AGENTS.md` 与 `CLAUDE.md` 的标准源文件                                 |
| `scripts/`                 | 脚手架、安装、目录构建与校验脚本                                                       |
| `schemas/`                 | Skill、Agent、Catalog 元数据对应的 JSON Schema                                         |
| `runtime/`                 | Issue Agent OS 的轻量运行时服务（队列、租约）                                          |
| `research/`                | 调研笔记、资料整理和较长的背景文档                                                     |
| `workspaces/<skill-name>/` | Skill 开发时的评估沙箱与临时工作区                                                     |
| `.my-agents/`              | 本地忽略的状态目录，例如 project sync state 与可选的 `reference-repos.json` 清单       |
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

### Runtime 与同步命令

```bash
npx my-agents --help
npx my-agents add https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering
npx my-agents install skill clarify
npx my-agents project sync --prune
npm run sync-instructions
npx my-agents references sync
```

根 README 只保留最高频的入口命令。运行时相关的规范主接口现在是 `npx my-agents ...`；`npm run ...` 仍然保留，作为仓库内的兼容别名。需要查看完整 CLI 能力时，可以先运行 `npx my-agents --help`；其中会列出 `install`、`uninstall`、`project sync`、`references`、`--platform`、`--scope`、`--manifest`、`--all` 和 `--prune` 等常用参数。完整的命令参考、示例和行为说明集中放在 [docs/cli/runtime-and-sync-commands.md](docs/cli/runtime-and-sync-commands.md)。
除非显式传入 `--scope user` 或进一步收窄 `--platform`，安装与卸载流程默认都会作用在 project scope 的全部受支持平台上。

如果你要从零开始写项目清单，可以先参考 [docs/examples/my-agents.project.example.json](docs/examples/my-agents.project.example.json)。

项目清单现在可以同时包含本地包名和外部官方 GitHub 资产。`add <url>` 会把 URL 解析成结构化 manifest entry，并锁定到不可变的 commit SHA，这样 `project sync` 仍然可以稳定复现。

### Issue Agent OS

Issue Agent OS 由 `issue-controller` skill 驱动，不是一个 CLI 子命令。通过交互方式调用：

```bash
# Claude Code —— 调用 controller skill
/issue-controller owner/repo

# Codex —— controller skill 从 prompt 激活
codex --prompt "Process the issue queue for owner/repo"
```

独立的队列检查 CLI 可用于查询：

```bash
node scripts/lib/issue-driven-os-queue.js next --repo owner/repo --limit 6
```

完整架构见 [docs/architecture/issue-agent-os-architecture.md](docs/architecture/issue-agent-os-architecture.md)，控制器 skill 参考见 [skills/issue-controller/SKILL.md](skills/issue-controller/SKILL.md)。

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
- 工具层的结构说明见 [docs/architecture/tooling-layout.md](docs/architecture/tooling-layout.md)。

## 校验与发布

- `npm test` 实际执行的是 `npm run validate`。
- 校验内容包括 ESLint、Prettier、schema、目录约定、CHANGELOG 与版本号一致性、pack 与项目清单引用完整性、生成索引是否最新、根目录说明文件是否已同步、文档最小质量要求，以及通过 `uv` 执行的打包 Python 单元测试。
- 如果调整了元数据语义或仓库策略，应该先更新标准源码包、相关策略文档或 `instructions/root/`，再执行 `npm run build`、`npm run sync-instructions` 和 `npm test`。
- GitHub Actions 会在每次 push 和 pull request 时运行 `.github/workflows/validate.yml`。
- Dependabot 会通过 `.github/dependabot.yml` 定期更新 npm 与 GitHub Actions 依赖。
- 打上 `v*` 标签后会触发 `.github/workflows/release.yml`，当前会从各个 skill 和 agent 的 changelog 中汇总 GitHub Release 说明。

## 贡献

贡献规范和发布注意事项见 [CONTRIBUTING.md](CONTRIBUTING.md)。

如果需要新增分类，请先更新 [categories.json](categories.json)，再在 `skill.json`、`agent.json` 或 `pack.json` 中引用。

## License

[MIT](LICENSE) - Qiongyu Li
