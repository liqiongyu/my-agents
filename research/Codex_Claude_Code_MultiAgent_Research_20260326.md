# Codex / Claude Code 子代理与多代理生态研究报告

> 研究日期：2026-03-26 | 模式：Standard | 来源数：40+

---

## 摘要

Claude Code 和 Codex CLI 的子代理（subagent）/ 多代理（multi-agent）生态在 2025-2026 年间爆发式增长。GitHub 上已出现数十个高星项目，从 **官方内置功能**（Claude Code Agent Teams、Codex subagents）到 **社区编排框架**（Ruflo、Gas Town、Overstory）和 **即装即用的代理集合**（VoltAgent 127+ 代理、wshobson 112 代理），形成了完整的生态链。核心协作模式包括：编排器-工人模式、git worktree 隔离、共享任务列表 + DAG 依赖、消息传递、跨工具委托、分层模型选择。以下按类别详细分析。

---

## 目录

1. [官方内置多代理能力](#1-官方内置多代理能力)
2. [大型代理集合（即装即用）](#2-大型代理集合即装即用)
3. [多代理编排框架](#3-多代理编排框架)
4. [配置工具包与模板](#4-配置工具包与模板)
5. [可视化与监控](#5-可视化与监控)
6. [Awesome 列表与资源索引](#6-awesome-列表与资源索引)
7. [核心协作模式总结](#7-核心协作模式总结)
8. [决策矩阵：如何选择](#8-决策矩阵如何选择)
9. [来源列表](#9-来源列表)

---

## 1. 官方内置多代理能力

### 1.1 Claude Code Subagents（内置）

- **文档**: https://code.claude.com/docs/en/sub-agents
- **机制**: 每个子代理运行在独立上下文窗口，有自定义系统提示、特定工具访问权限和独立许可。
- **内置代理**: `Explore`（Haiku, 只读快速搜索）、`Plan`（研究规划）、`General-purpose`（全工具）
- **关键能力**:
  - 顺序链式调用（研究 → 实现 → 审查）
  - 并行研究（多个独立调查同时进行）
  - 后台执行（Ctrl+B）
  - Git worktree 隔离（`isolation: worktree`）
  - 跨会话持久记忆
- **配置**: `.claude/agents/` (项目级) 或 `~/.claude/agents/` (用户级) 的 Markdown + YAML frontmatter 文件

### 1.2 Claude Code Agent Teams（实验性）

- **文档**: https://code.claude.com/docs/en/agent-teams
- **启用**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` 环境变量
- **机制**: 协调多个完整 Claude Code 会话。一个会话为 team lead，队友为独立实例。
- **关键能力**:
  - 共享任务列表 + 依赖管理
  - 直接代理间消息传递（定向或广播）
  - 文件锁定任务认领防止竞争
  - 空闲自动通知 team lead
- **适用场景**: 并行代码审查（安全/性能/覆盖率）、竞争假设调试、跨层协调（前端/后端/测试）

### 1.3 Codex CLI Subagents（内置）

- **仓库**: https://github.com/openai/codex
- **内置代理**: `default`（通用）、`worker`（执行导向）、`explorer`（只读探索）
- **配置格式**: `~/.codex/agents/` 下的 TOML 文件 + `AGENTS.md`
- **编排设置**: `[agents] max_threads = 6`, `max_depth = 1`, `features.multi_agent = true`
- **官方技能库**: https://github.com/openai/skills (15,300+ stars)

---

## 2. 大型代理集合（即装即用）

### 2.1 affaan-m/everything-claude-code ⭐ 108,000+

- **URL**: https://github.com/affaan-m/everything-claude-code
- **规模**: 28 专用子代理 + 125+ 工作流技能
- **代理**: planner, architect, chief-of-staff, code-reviewer, security-reviewer, tdd-guide, e2e-runner, harness-optimizer, Go/Python/TS/Rust/Java/C++ reviewers, docs-lookup, loop-operator 等
- **特色**: Token 优化、记忆持久化、持续学习、instinct-based 技能演化、AgentShield 安全审计器
- **兼容**: 同时提供 Claude Code 和 Codex 配置（含 `.codex/` 目录）

### 2.2 wshobson/agents ⭐ 32,300

- **URL**: https://github.com/wshobson/agents
- **规模**: 72 个插件 = 112 专用代理 + 146 技能 + 79 开发工具 + 16 多代理工作流编排器
- **四层模型策略**:
  - Tier 1（Opus 4.6）: 42 关键代理（架构/安全/审查）
  - Tier 2（继承/灵活）: 42 复杂任务代理
  - Tier 3（Sonnet 4.6）: 51 支持代理（文档/测试/调试）
  - Tier 4（Haiku）: 18 运维代理（部署/SEO）
- **编排器**: 全栈功能开发（backend → DB → frontend → test → security → deploy）、安全加固（并行 SAST + 依赖分析 + 代码审查）
- **特色**: 渐进式加载（~1000 tokens/plugin），按需激活

### 2.3 VoltAgent/awesome-claude-code-subagents ⭐ 15,200

- **URL**: https://github.com/VoltAgent/awesome-claude-code-subagents
- **规模**: 127+ 子代理，10 个类别
- **类别**: 核心开发(10)、语言专家(25+)、基础设施(15)、质量与安全(14)、数据与AI(13)、开发者体验(13)、垂直领域(12)、业务与产品(10)、元编排(12)、研究与分析(7)
- **元编排代理**: multi-agent-coordinator、agent-organizer、workflow-orchestrator、knowledge-synthesizer、context-manager
- **安装**: 插件包方式 `claude plugin install voltagent-lang`

### 2.4 VoltAgent/awesome-codex-subagents ⭐ 2,700

- **URL**: https://github.com/VoltAgent/awesome-codex-subagents
- **规模**: 136 专用 Codex 子代理（TOML 格式）
- **同 Claude Code 版本对应，但配置为 TOML 格式，支持模型路由（gpt-5.4 vs gpt-5.3-codex-spark）**

### 2.5 VoltAgent/awesome-agent-skills ⭐ 12,800

- **URL**: https://github.com/VoltAgent/awesome-agent-skills
- **规模**: 1,030+ 跨平台代理技能
- **贡献者**: Anthropic、OpenAI、Supabase、Stripe、Vercel、Cloudflare、HashiCorp、Google、Microsoft 等

### 2.6 alirezarezvani/claude-skills ⭐ 7,000

- **URL**: https://github.com/alirezarezvani/claude-skills
- **规模**: 205 生产就绪技能/代理，兼容 11 个 AI 编码平台
- **兼容平台**: Claude Code、Codex、Gemini CLI、Cursor、Aider、Windsurf 等
- **特色**: 单一转换脚本适配所有平台

### 2.7 jeremylongshore/claude-code-plugins-plus-skills ⭐ 未知

- **URL**: https://github.com/jeremylongshore/claude-code-plugins-plus-skills
- **规模**: 340 插件 + 1,367 代理技能 + CCPI 包管理器

### 2.8 contains-studio/agents ⭐ 12,400

- **URL**: https://github.com/contains-studio/agents
- **规模**: 40+ 代理，8 个部门（工程、设计、营销、产品、项目管理、工作室运营、测试、奖励）
- **特色**: 基于 6 天冲刺哲学，部分代理主动触发（代码变更后自动触发 test-writer）

### 2.9 vijaythecoder/awesome-claude-agents ⭐ 4,100

- **URL**: https://github.com/vijaythecoder/awesome-claude-agents
- **规模**: 24 个代理 = 3 编排器 + 13 框架专家 + 4 通用专家 + 4 核心团队
- **特色**: 自动配置（Team Configurator 检测技术栈 → 发现可用代理 → 选择专家 → 创建任务映射）

---

## 3. 多代理编排框架

### 3.1 ruvnet/ruflo ⭐ 26,300

- **URL**: https://github.com/ruvnet/ruflo
- **定位**: 企业级多代理群体编排平台（前身 "Claude Flow"）
- **规模**: 100+ 专用代理，8 种工人类型
- **架构**: 七层（用户 → 入口 → 路由 → 群体协调 → 代理执行 → 资源 → 向量智能）
- **关键技术**:
  - Q-Learning 路由器（89% 准确率）+ MoE（8 专家、130+ 技能）
  - 四种拓扑（层级/网格/环/星）
  - 三种共识模型（多数/加权/拜占庭）
  - WASM 加速器（简单编辑跳过 LLM，352x 加速）
  - 跨 Claude/GPT/Gemini/本地模型自动故障转移

### 3.2 steveyegge/gastown（Gas Town）

- **URL**: https://github.com/steveyegge/gastown
- **作者**: Steve Yegge
- **定位**: 多 AI 编码代理的工作区管理器
- **核心概念**:
  - **Mayor**: 协调器 Claude 实例
  - **Rigs**: 项目容器
  - **Polecats**: 工人代理（持久身份但临时会话）
  - **Convoys**: 工作跟踪包
  - **Molecules**: 工作流模板（TOML）
- **三级看门狗**: Witness/Deacon/Dogs 监控卡住的代理
- **兼容**: Claude Code、GitHub Copilot CLI、Codex CLI、Gemini、自定义运行时

### 3.3 jayminwest/overstory

- **URL**: https://github.com/jayminwest/overstory
- **定位**: 将单一编码会话转变为协调多代理团队的 CLI 工具
- **代理角色**: Coordinator、Scout、Builder、Reviewer、Merger、Monitor
- **关键技术**:
  - SQLite 邮件系统 + 类型化协议消息
  - Git worktree 隔离
  - FIFO 合并队列
  - 三级健康监控（机械守护进程、AI 分诊、监控代理）
  - 四级冲突解决
- **兼容运行时**: Claude Code、Sapling、Pi、Copilot、Cursor、Codex、Gemini CLI、Aider、Goose、Amp、OpenCode（11+）

### 3.4 Dicklesworthstone/claude_code_agent_farm ⭐ 751

- **URL**: https://github.com/Dicklesworthstone/claude_code_agent_farm
- **定位**: 20+ Claude Code 代理并行运行框架，tmux 监控 + 锁协调
- **关键技术**:
  - Python 脚本创建 tmux 会话，并行面板启动代理
  - 中央工作注册表 + 单文件锁 + 过期检测（2 小时超时）
  - 支持 34 种技术栈
  - 崩溃自动重启

### 3.5 SethGammon/Citadel ⭐ 328

- **URL**: https://github.com/SethGammon/Citadel
- **定位**: 四层路由 + 战役持久化 + 并行 worktree + 熔断器
- **四层路由**:
  - Tier 1 Skill: 离散任务
  - Tier 2 Marshal: 单会话链式
  - Tier 3 Archon: 多会话自纠正
  - Tier 4 Fleet: 2-3 并行代理在隔离 worktree
- **特色**: `/do [task]` 触发路由器自动选择最便宜层级，~500-token discovery briefs 在波次间传递，3 次失败熔断

### 3.6 bobmatnyc/claude-mpm

- **URL**: https://github.com/bobmatnyc/claude-mpm
- **定位**: 多代理项目管理器，47+ 代理 + 56+ 技能
- **关键技术**:
  - 双运行时（CLI 子进程 vs SDK 编程式）
  - 70%/85%/95% token 阈值自动暂停
  - ETag 代理缓存（95%+ 带宽节省）
  - MPM Commander 自主多项目协调

### 3.7 awslabs/cli-agent-orchestrator ⭐ 344

- **URL**: https://github.com/awslabs/cli-agent-orchestrator
- **作者**: AWS Labs
- **定位**: 轻量级 tmux 终端多 AI 代理会话编排
- **编排模式**: Handoff（同步）、Assign（异步）、Send Message（直接代理间通信）
- **兼容**: Kiro CLI、Claude Code、Codex CLI、Gemini CLI、Kimi CLI、Copilot CLI、Q CLI

### 3.8 GreenSheep01201/claw-empire ⭐ 864

- **URL**: https://github.com/GreenSheep01201/claw-empire
- **定位**: 本地优先 AI 代理办公室模拟器（你是 CEO，AI 代理是员工）
- **部门**: 规划、开发、设计、QA/QC、DevSecOps、运维
- **特色**: 600+ 技能库、实时 WebSocket 同步、会议系统 + AI 会议纪要、XP/排名游戏化
- **兼容**: Claude Code、Codex CLI、Gemini CLI、OpenCode、Kimi Code、Copilot、Antigravity

### 3.9 catlog22/Claude-Code-Workflow

- **URL**: https://github.com/catlog22/Claude-Code-Workflow
- **定位**: JSON 驱动的多代理开发框架 + 语义 CLI 路由
- **特色**: 语义路由（描述意图，框架路由到正确工具）、Team Architecture v2（事件驱动 beat 模型）

### 3.10 cexll/myclaude ⭐ 2,500

- **URL**: https://github.com/cexll/myclaude
- **定位**: 多后端执行系统（Codex/Claude/Gemini/OpenCode）
- **工作流**:
  - `/do`: 5 阶段功能开发（PM → Executor → Tester → Reviewer → Vault）
  - `/omo`: 多代理智能 bug 路由
  - `/bmad-pilot`: 6 代理企业工作流
  - `/sparv`: Specify → Plan → Act → Review → Vault

---

## 4. 配置工具包与模板

### 4.1 trailofbits/claude-code-config ⭐ 1,700

- **URL**: https://github.com/trailofbits/claude-code-config
- **作者**: Trail of Bits（安全公司）
- **定位**: 安全加固的默认配置 + hook 模式 + 代理工作流模板
- **特色**: PreToolUse/PostToolUse/Stop hooks 强制执行、沙箱隔离、凭证权限拒绝规则

### 4.2 shakacode/claude-code-commands-skills-agents

- **URL**: https://github.com/shakacode/claude-code-commands-skills-agents
- **定位**: Claude Code + Codex CLI 互操作工具包
- **特色**:
  - `AGENTS.md` 作为两个工具共同读取的通用指令文件
  - `/self-review` 和 `/file-by-file-review` 使用并行子代理
  - Spec-first 开发（一个工具写规格，另一个实现）
  - Claude 构建，Codex 审计的交叉验证流程

### 4.3 carlrannaberg/claudekit

- **URL**: https://github.com/carlrannaberg/claudekit
- **定位**: 安全护栏 + 工作流自动化 + 专用子代理
- **特色**: 6 个并行代码审查代理（架构/安全/性能/测试/质量/文档）、检查点系统、`/create-subagent` 自定义代理生成

### 4.4 SuperClaude-Org/SuperClaude_Framework

- **URL**: https://github.com/SuperClaude-Org/SuperClaude_Framework
- **定位**: 元编程配置框架
- **规模**: 30 斜杠命令 + 20 专用代理 + 7 行为模式 + 8 MCP 服务器集成
- **特色**: 自适应研究规划（3 种策略）、质量评分 + 置信度阈值、30-50% 上下文节省

### 4.5 shanraisshan/claude-code-best-practice ⭐ 22,000

- **URL**: https://github.com/shanraisshan/claude-code-best-practice
- **定位**: 全面的 Claude Code 开发最佳实践指南
- **关键建议**:
  - 三种原语：Subagents（自治隔离上下文）、Commands（知识注入）、Skills（自动发现、上下文分叉）
  - 推荐工作流：Command → Agent → Skill
  - Git worktrees 实现代理隔离
  - CLAUDE.md 控制在 200 行以内

---

## 5. 可视化与监控

### 5.1 disler/claude-code-hooks-multi-agent-observability ⭐ 1,300

- **URL**: https://github.com/disler/claude-code-hooks-multi-agent-observability
- **定位**: 多代理工作流的实时监控仪表板
- **追踪事件**: PreToolUse、PostToolUse、PostToolUseFailure、PermissionRequest、Notification、UserPromptSubmit、Stop、SubagentStart、SubagentStop、PreCompact、SessionStart、SessionEnd（12 种）
- **架构**: Claude Agents → Hook Scripts → HTTP POST → Bun Server → SQLite → WebSocket → Vue Client

### 5.2 patoles/agent-flow ⭐ 301

- **URL**: https://github.com/patoles/agent-flow
- **定位**: VS Code 扩展，将 Claude Code 代理编排可视化为交互式节点图
- **特色**: 自动检测活跃会话、JSONL 日志回放、时间线面板、文件关注热图

---

## 6. Awesome 列表与资源索引

| Stars | 仓库 | 描述 |
|-------|------|------|
| 32,400 | [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | Claude Code 终极资源列表（技能/hook/插件/编排器） |
| 12,800 | [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) | 1,030+ 跨平台代理技能 |
| 3,400 | [heilcheng/awesome-agent-skills](https://github.com/heilcheng/awesome-agent-skills) | 技能/工具/教程精选 |
| 299 | [rahulvrane/awesome-claude-agents](https://github.com/rahulvrane/awesome-claude-agents) | 代理目录 + 编排模式文档 |
| 145 | [sorrycc/awesome-code-agents](https://github.com/sorrycc/awesome-code-agents) | 39+ AI 编码代理精选 |
| 44 | [Ischca/awesome-agents-md](https://github.com/Ischca/awesome-agents-md) | AGENTS.md 模板与真实案例 |

---

## 7. 核心协作模式总结

基于所有研究来源，以下是被广泛验证的六大核心多代理协作模式：

### 模式 1：编排器-工人（Orchestrator-Worker）
**使用者**: Agent Teams、Gas Town、Ruflo、Overstory、ccswarm
- Lead 代理分解任务 → 分发给专用 worker → 收集结果
- 最成熟、最广泛采用的模式

### 模式 2：Git Worktree 隔离
**使用者**: Gas Town、Overstory、ccswarm、Claude Code `isolation: worktree`、Citadel
- 每个并行代理获得独立 worktree，防止文件冲突
- 多代理并行编码的前提条件

### 模式 3：共享任务列表 + DAG 依赖
**使用者**: Agent Teams、Swarm patterns
- 代理从任务池认领工作，依赖自动解锁
- 适合有明确依赖关系的复杂项目

### 模式 4：消息传递
**使用者**: Agent Teams（文件邮箱）、Overstory（SQLite）、Claude MPM（事件总线）
- 代理间直接通信，无需全部通过 lead 中转
- 适合需要协作决策的场景

### 模式 5：跨工具委托
**使用者**: ShakaCode、myclaude、Claude-Code-Workflow
- Claude Code 做规划/验证 + Codex/Gemini 做执行/审查
- 利用不同工具的优势互补

### 模式 6：分层模型选择
**使用者**: wshobson/agents、官方文档
- Opus 做战略决策 → Sonnet 做复杂推理 → Haiku 做快速探索
- 成本优化：关键路径用强模型，常规任务用快模型

---

## 8. 决策矩阵：如何选择

### 按需求场景选择

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| **快速上手，装几个有用的代理** | VoltAgent/awesome-claude-code-subagents | 127+ 即装即用，插件市场安装 |
| **全面的代理 + 技能生态** | affaan-m/everything-claude-code | 最大规模(108k⭐)，双平台支持 |
| **精细化的分层模型策略** | wshobson/agents | 四层模型 + 72 插件 + 16 编排器 |
| **企业级群体编排** | ruvnet/ruflo | Q-Learning 路由、共识模型、WASM 加速 |
| **多工具协调（Claude+Codex+Gemini）** | cexll/myclaude 或 awslabs/cli-agent-orchestrator | 多后端执行、模块化工作流 |
| **安全加固** | trailofbits/claude-code-config | Hook 强制执行、沙箱隔离 |
| **Claude Code + Codex 互操作** | shakacode/claude-code-commands-skills-agents | AGENTS.md 通用指令 + 交叉验证 |
| **多代理可观测性** | disler/claude-code-hooks-multi-agent-observability | 12 种生命周期事件实时追踪 |
| **学习最佳实践** | shanraisshan/claude-code-best-practice | 22k⭐，最全面的实践指南 |
| **游戏化团队模拟** | GreenSheep01201/claw-empire | AI 办公室模拟器，XP 系统 |

### 按复杂度递增的采用路径（双平台并行）

```
Level 1: 内置子代理
├── Claude Code: 内置 Explore/Plan/General-purpose
│   └── 自定义 .claude/agents/*.md (Markdown + YAML frontmatter)
└── Codex CLI: 内置 default/worker/explorer
    └── 自定义 .codex/agents/*.toml (TOML 格式)
    └── AGENTS.md 作为两平台共享的仓库级指令

Level 2: 社区代理集合
├── Claude Code: VoltAgent/awesome-claude-code-subagents (127+ Markdown 代理)
├── Codex CLI:   VoltAgent/awesome-codex-subagents (136 TOML 代理)
├── 跨平台:      alirezarezvani/claude-skills (205 代理, 11 平台自动转换)
│                wshobson/agents (112 代理 + 四层模型策略)
└── 按需激活，渐进式加载

Level 3: 多代理编排
├── Claude Code: Agent Teams（实验性, CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS）
├── Codex CLI:   [agents] max_threads=6, features.multi_agent=true
├── 跨平台框架:  Citadel (四层路由) / myclaude (多后端)
└── 共享模式:    shakacode 工具包 (AGENTS.md 双平台通用指令)

Level 4: 跨工具协调
├── Claude Code 规划/验证 + Codex CLI 执行/审查（互补模式）
├── awslabs/cli-agent-orchestrator (tmux 管理 7 种 CLI 代理会话)
└── cexll/myclaude (Claude/Codex/Gemini/OpenCode 多后端路由)

Level 5: 企业级群体
├── Ruflo (Q-Learning 路由, 跨 Claude/GPT/Gemini/本地模型)
├── Gas Town (多运行时: Claude Code/Codex/Copilot/Gemini)
├── Overstory (11+ 运行时适配器)
└── 自定义拓扑、共识模型、故障转移
```

---

## 9. 来源列表

### 高价值仓库（按 Stars 排序）

| Stars | 仓库 | 类型 |
|-------|------|------|
| 108k+ | affaan-m/everything-claude-code | 代理集合 |
| 32,400 | hesreallyhim/awesome-claude-code | 资源索引 |
| 32,300 | wshobson/agents | 代理集合 + 编排 |
| 26,300 | ruvnet/ruflo | 编排框架 |
| 22,000 | shanraisshan/claude-code-best-practice | 最佳实践 |
| 15,300 | openai/skills | Codex 官方技能 |
| 15,200 | VoltAgent/awesome-claude-code-subagents | 代理集合 |
| 12,800 | VoltAgent/awesome-agent-skills | 跨平台技能 |
| 12,400 | contains-studio/agents | 部门化代理 |
| 7,000 | alirezarezvani/claude-skills | 跨平台代理 |
| 4,100 | vijaythecoder/awesome-claude-agents | 自配置代理团队 |
| 2,700 | VoltAgent/awesome-codex-subagents | Codex 代理 |
| 2,500 | cexll/myclaude | 多后端编排 |
| 1,700 | trailofbits/claude-code-config | 安全配置 |
| 1,500 | lst97/claude-code-sub-agents | 33 自动委托代理 |
| 1,300 | disler/claude-code-hooks-multi-agent-observability | 监控 |
| 864 | GreenSheep01201/claw-empire | AI 办公室 |
| 816 | baryhuang/claude-code-by-agents | @mention 编排 |
| 751 | Dicklesworthstone/claude_code_agent_farm | tmux 并行 |
| 565 | zhsama/claude-sub-agent | Spec 工作流 |
| 344 | awslabs/cli-agent-orchestrator | AWS tmux 编排 |
| 328 | SethGammon/Citadel | 四层路由编排 |
| 301 | patoles/agent-flow | 可视化 |

### 参考文章

| 来源 | 链接 | 核心洞察 |
|------|------|---------|
| Code With Seb | claude-code-sub-agents-multi-agent-systems-guide | 多代理在复杂研究任务上比单代理高 90.2%，但 token 消耗 ~15x |
| Claude Fast | sub-agent-best-practices | 并行仅在代理触及不同文件时有效；调用失败是主要失败模式 |
| Paddo.dev | claude-code-hidden-swarm | TeammateTool 在公开前被发现，13 种操作 |
| Anthropic Blog | common-workflow-patterns | 官方模式：提示链、路由、并行化、编排器-工人、评估器-优化器 |
| GitHub Blog | pick-your-agent | Agent HQ 统一运行 Claude + Codex |
| Swarm Gist (Kieran Klaassen) | gist/kieranklaassen/4f2aba89 | 6 种群体编排模式 + TeammateTool 13 种操作 |

---

*报告由 Deep Research 技能生成，共分析 40+ 来源。*
