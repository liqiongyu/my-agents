# OpenAI / Anthropic / Codex / Claude Code 最佳实践研究报告

> 研究日期：2026-03-29 | 模式：Standard | 来源：15 个官方或第一方来源
> 范围：Skill、MCP、Agent / Multi-Agent 编排、Harness Engineering

## 执行摘要

- Skill 应该被当作可复用的任务能力包，而不是宽泛 persona。OpenAI、Anthropic 和 Agent Skills 标准都把 skill 定义为 instructions、scripts、resources 的组合；`description` 必须同时说明“做什么”和“何时触发”。[4][5][12][13]
- MCP 的价值不只是“多接工具”，而是把外部能力纳入明确的协议生命周期、审批边界和信任模型。MCP 规范要求初始化、能力协商、运行、关闭四个阶段；OpenAI 明确建议优先使用官方 server、默认审批准入、限制 `allowed_tools`、并记录外发数据。[2][14][15]
- Multi-agent 不是默认架构。OpenAI 建议先从单 agent 开始，再按 manager pattern 或 handoff 扩展；Anthropic 明确指出多代理更适合高并行、超上下文、重工具任务，而大多数 coding 任务真正可并行的部分比研究少。[1][6][8]
- 所谓 Harness Engineering，按官方材料更接近“围绕模型设计运行时”的整体工程 discipline，而不是 prompt 微调技巧。这包括 context retrieval、memory、tool contracts、permissions、evals、artifacts、resume 和 governance。[1][2][3][6][7][10][11][14]
- 对本仓库最直接的启发是：把 `research/` 作为证据层，把 `docs/architecture/official-agent-best-practices.md` 作为规则层；未来凡是设计 Skill、MCP、Agent、多代理或运行时 harness，都应先引用这两层文档，而不是只靠会话内解释。

## 1. 研究方法与边界

- 本次研究只采用官方或第一方来源：OpenAI 官方文档与官方仓库、Anthropic 官方文档与工程文章、MCP 官方规范、Agent Skills 官方站点与官方技能仓库。
- 重点不是收集“社区玩法大全”，而是提炼能落地、能校验、能转化为仓库约束的稳定原则。
- 文中若使用“推断”字样，表示这是基于多份官方材料综合归纳得到的工程结论，而不是某一家厂商的原句或单一定义。

## 2. Skill 最佳实践

### 2.1 官方共识

- OpenAI 官方 `skills` 仓库把 Agent Skills 定义为“folders of instructions, scripts, and resources”，并明确这是 Codex 用来打包可重复使用能力的方式。[5]
- Anthropic 官方 `skills` 仓库同样把 skill 定义为 instructions、scripts、resources 的文件夹，并强调 skill 会在需要时被动态加载以改善专业任务表现。[12]
- Anthropic 的 README 给出的最小 skill 模板只强制两个 frontmatter 字段：`name` 和 `description`；其中 `description` 既要描述做什么，也要描述什么时候使用。[12]
- OpenAI 的 Codex Skills 页面强调两点很关键：一是“Prefer instructions over scripts unless you need deterministic behavior or external tooling”，二是要测试 prompt 与 skill description 的匹配度，确认触发行为是否正确。[4]
- Agent Skills 官方文档补充了脚本层面的可移植性建议：脚本应尽量自包含，能单命令运行；Python 场景建议用 PEP 723 / `uv run` 这类可声明依赖的方式，并在需要时锁定依赖实现可复现。[13]

### 2.2 可落地结论

- 一个 skill 应只负责一类可复用工作流，不要把“会很多事的专家人格”塞进单个 skill。
- `description` 是路由入口，不只是展示文案。它必须清楚说明：
  - 这个 skill 解决什么问题。
  - 在什么条件下应该激活。
  - 不应该用来做什么。
- 默认优先写 instructions；只有在以下场景才加脚本：
  - 需要确定性输出。
  - 需要外部依赖或专门工具。
  - 需要把复杂流程压成单一命令接口。
- 细节应该渐进展开：核心判断与工作流放在 `SKILL.md`，长说明放 `references/`，可执行逻辑放 `scripts/`。这和本仓库现有 skill 包结构天然一致。
- Skill 必须自包含。运行时不要依赖其他包的私有脚本路径；这与仓库当前“优先本地复制，不依赖私有跨包运行时”的规则一致。

### 2.3 对本仓库的直接要求

- 以后写新 skill，至少要显式回答四个问题：
  - 触发条件是什么。
  - 验证成功的证据是什么。
  - 何时停止或升级。
  - 是否真的需要脚本，而不是仅靠 instructions。
- Skill 的 `description`、`requirements`、`capabilities` 应一起服务路由，不应各写各的。

## 3. MCP 最佳实践

### 3.1 官方共识

- MCP 官方规范把连接过程定义为明确 lifecycle：Initialization、Operation、Shutdown；初始化阶段还要求 capability negotiation 和 protocol version agreement。[14]
- MCP 官方 resources 文档强调 resources 是 application-controlled primitive；如果希望模型主动决定何时调用，就应该暴露 tools 这种 model-controlled primitive，而不是把一切都做成 resources。[15]
- OpenAI 的 MCP and Connectors 文档给出了非常直接的工程建议：
  - 在会话或 workflow 中保留 `mcp_list_tools` 结果，以减少每轮重复拉取工具列表的延迟。[2]
  - 使用 `allowed_tools` 缩小暴露给模型的工具集合，避免大工具面导致成本和延迟上升。[2]
  - 默认审批每一次 MCP tool call，并认真审查要共享给 MCP server 的数据；信任建立后再考虑跳过审批。[2]
  - 优先连接服务提供方自己托管的官方 MCP server，而不是第三方代理 server。[2]
  - 记录发送给 MCP server 的数据，并定期审查；同时把 prompt injection、工具行为漂移和第三方数据策略当作真实风险。[2]
- Claude Code 的 MCP 文档则把工程面补得更完整：MCP 支持 local / project / user 等安装 scope，支持 `.mcp.json` 中的环境变量展开、allowlist / denylist、managed MCP configuration，以及插件自带 MCP server。[9]

### 3.2 可落地结论

- MCP 设计的最小单元不是“加一个 server”，而是“定义一个受控外部能力面”。
- 每个 MCP server 在纳入仓库前都应记录六项最小契约：
  - 归属方是谁。
  - 认证方式是什么。
  - 会暴露哪些工具。
  - 默认 approval 策略是什么。
  - 会外发哪些数据。
  - 风险和撤销方式是什么。
- 大工具面必须做缩口：
  - 先做 allowlist。
  - 再考虑 defer loading 或 tool search。
  - 不要把几十上百个工具无差别暴露给模型。
- 对 shared/project scope 的 MCP 配置，要优先考虑组织可治理性，而不是个人方便性。

### 3.3 对本仓库的直接要求

- 未来仓库里如果新增 MCP 参考文档、脚手架或安装流，应该把以下字段视为一等设计对象：
  - scope
  - owner
  - auth
  - allowed tools
  - approval
  - network / domain policy
  - logging / audit
- 对远端 MCP server，默认应先走“官方优先 + 审批默认开启 + allowlist 收口”的保守路径。

## 4. Agent 与 Multi-Agent 编排最佳实践

### 4.1 官方共识

- OpenAI 在《A practical guide to building AI agents》中把 orchestration 视为 agent 系统的一类工具能力，并给出 manager pattern 与 handoff / graph 式建模思路；同一份指南强调，组件应保持 flexible、composable，并由结构清晰的 prompts 驱动。[1]
- Anthropic 在《How we built our multi-agent research system》中给出了更强的约束条件：
  - Multi-agent 最适合高并行、超上下文、工具繁多的任务。[6]
  - 许多 coding 任务并不适合多代理，因为真正可并行的部分没有研究任务那么多，实时协调和委派也还不稳定。[6]
  - 更可靠的模式是 orchestrator-worker：lead agent 制定策略，subagents 用独立 context 并行探索，再把结果回传或落成 artifacts。[6]
  - 长任务中要把 plan、阶段总结和关键结果写入外部 memory 或文件，避免上下文溢出导致状态丢失。[6]
- Claude Code 的 sub-agents 文档也把这套思路产品化了：
  - 适合“Run parallel research”这类真正可并行的任务。[8]
  - 对需要持续并行或超 context 的任务，更适合 agent teams，让每个 worker 保持独立上下文。[8]
  - 自定义 subagent 时，要写详细 description，并且只授予必要工具权限。[8]

### 4.2 可落地结论

- 默认从单个强通才 agent 开始。只有在以下条件之一成立时，才值得引入多代理：
  - 任务天然可以并行切分。
  - 单上下文无法稳定承载全部信息。
  - 某些步骤需要显著不同的工具预算或判断契约。
- 一旦进入多代理，必须显式定义：
  - 谁是 coordinator。
  - 每个 worker 的输入边界是什么。
  - 每个 worker 输出什么 artifact，而不是只输出聊天摘要。
  - 哪些结果需要 coordinator 复核后才能继续。
- 对 coding 工作尤其要克制。多代理应该解决“隔离、并行、专门工具”问题，而不是制造更多 coordination overhead。

### 4.3 对本仓库的直接要求

- 未来仓库中的 agent / pack / design 文档，默认应采用“generalist-first，specialist-on-demand”的表述。
- 新 agent 的 contract 中，tool budget 和 output contract 必须比“角色名”更重要。
- 如果一个方案无法清楚回答“为什么不是单 agent”，就不应该默认上多代理。

## 5. Harness Engineering 最佳实践

### 5.1 这里的定义是推断

“Harness Engineering”不是我在本次材料里找到的单一官方标准名词。下面这组结论是基于 OpenAI 的 agents / MCP / eval 文档、Anthropic 的 context engineering / multi-agent / Claude Code 文档，以及 MCP 规范综合归纳得到的工程定义。[1][2][3][6][7][8][10][11][14]

### 5.2 推断后的核心定义

- Harness Engineering 是围绕模型构建稳定运行时，而不是只改 prompt。
- 它至少包括七个面：
  - context
  - memory
  - tool contracts
  - permissions
  - artifacts
  - evaluation
  - resume / governance

### 5.3 来自官方材料的支撑点

- Anthropic 的 context engineering 文章明确推荐“just in time” context：只保存轻量引用，例如 file paths、queries、links，在运行时用工具动态取数，而不是把所有相关信息预先塞进上下文。[7]
- 同一篇文章还指出，文件层级、命名约定、时间戳这类元数据本身就是 agent 可用的行为信号。[7]
- Anthropic 的多代理文章强调把 plan、阶段总结和中间产物写入外部 memory / filesystem，以减少 game of telephone 和 context overflow。[6]
- Claude Code memory 文档说明，项目记忆与规则应该模块化组织，例如 `CLAUDE.md`、`.claude/rules/`，并可按路径加载，以减少上下文噪音。[10]
- Claude Code settings 文档强调，路径、域名、sandbox 和 managed settings 都应该被当作治理边界，而不是临时设置项。[11]
- OpenAI 的 agent evals 文档把可复现实验和 workflow-level error detection 当作 agent 质量控制的基础设施，而不是上线后的补充项。[3]

### 5.4 对本仓库的直接要求

- 以后讨论“agent 效果不好”时，默认先检查 harness，而不是先怪模型：
  - 指令是否过载。
  - 上下文是否混乱。
  - 工具面是否过宽。
  - 权限是否模糊。
  - 证据是否没有落成 artifact。
  - 是否缺少 eval 与 trace。
- 仓库里的设计文档应优先描述运行时与约束，而不是只描述 agent persona。

## 6. 对本仓库的落地建议

### 6.1 文档分层

- `research/`：保存长版、带来源的研究报告。
- `docs/architecture/official-agent-best-practices.md`：保存面向本仓库的稳定规则和默认决策。
- 后续任一涉及 Skill、MCP、Agent、多代理或 harness 的新设计文档，都应先链接这两层，再写自己的变体。

### 6.2 默认设计原则

- Skill：一事一 skill，路由描述优先，脚本按需引入，自包含优先。
- MCP：官方 server 优先，approval 默认保守，allowlist 默认开启，shared scope 先想治理。
- Agent：单 agent 优先，多代理按并行度和上下文容量证明必要性。
- Harness：把 context、memory、permissions、artifacts、evals 视为系统设计的一部分。

### 6.3 推荐的评审问题

- 这个能力应该是 skill、agent、pack，还是普通文档而已？
- 是否真的需要脚本、MCP、或多代理，还是 instructions 足够？
- tool budget 是否最小化？
- 关键状态是否写入文件或 artifact，而不是只留在聊天历史里？
- 有没有最小可重复验证路径？

## 7. 来源列表

1. OpenAI, *A practical guide to building AI agents*  
   https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/
2. OpenAI API Docs, *MCP and Connectors*  
   https://developers.openai.com/api/docs/guides/tools-connectors-mcp
3. OpenAI API Docs, *Agent evals*  
   https://developers.openai.com/api/docs/guides/agent-evals
4. OpenAI Developers, *Agent Skills - Codex*  
   https://developers.openai.com/codex/skills
5. OpenAI, *openai/skills README*  
   https://github.com/openai/skills
6. Anthropic Engineering, *How we built our multi-agent research system*  
   https://www.anthropic.com/engineering/multi-agent-research-system
7. Anthropic Engineering, *Effective context engineering for AI agents*  
   https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
8. Claude Code Docs, *Create custom subagents*  
   https://docs.anthropic.com/en/docs/claude-code/sub-agents
9. Claude Code Docs, *Connect Claude Code to tools via MCP*  
   https://docs.anthropic.com/en/docs/claude-code/mcp
10. Claude Code Docs, *How Claude remembers your project*  
    https://docs.anthropic.com/en/docs/claude-code/memory
11. Claude Code Docs, *Claude Code settings*  
    https://docs.anthropic.com/en/docs/claude-code/settings
12. Anthropic, *anthropics/skills README*  
    https://github.com/anthropics/skills
13. Agent Skills, *Using scripts in skills*  
    https://agentskills.io/skill-creation/using-scripts
14. Model Context Protocol, *Lifecycle*  
    https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
15. Model Context Protocol, *Resources*  
    https://modelcontextprotocol.io/legacy/concepts/resources
