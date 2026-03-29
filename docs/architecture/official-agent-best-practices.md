# Official Agent Best Practices

## 这份文档的作用

这是一份面向本仓库维护者的短版参考页，用来把 OpenAI、Anthropic、Claude Code、Codex、MCP 和 Agent Skills 的第一方最佳实践，压缩成后续设计默认遵循的规则。

- 长版证据与来源在 `research/OpenAI_Anthropic_Codex_Claude_Code_Best_Practices_20260329.md`
- 本页只保留可执行的默认决策

## 我们的默认决策

### 1. Skill

- 一个 skill 只负责一类可复用 workflow，不承担宽泛 persona。
- `description` 必须同时写清“做什么”和“何时使用”。
- 默认优先写 instructions，不要先上脚本。
- 只有在需要确定性行为、外部依赖或复杂工具链时，才引入 `scripts/`。
- 长说明放 `references/`，可执行逻辑放 `scripts/`，核心路由与工作流放 `SKILL.md`。
- 新 skill 必须包含验证路径、停止条件或升级条件。

### 2. MCP

- 把每个 MCP server 当作一个受控外部能力面，而不是一个“顺手接进来的工具包”。
- 默认优先官方 server，其次才考虑第三方 server。
- 默认从最小 scope 开始：能用 local 就不要先上 project / user。
- 默认先收窄工具面：优先 allowlist，再考虑 defer loading、tool search 或更大的 server 面。
- 设计和文档里必须写清：
  - owner
  - auth
  - approval policy
  - allowed tools
  - data exposure
  - audit / logging
  - network or domain boundary

### 3. Agent 与 Multi-Agent

- 默认先用一个强通才 agent。
- 只有在任务天然可并行、明显超上下文、或需要不同工具预算时，才引入多代理。
- 多代理一旦出现，必须有单一 coordinator 负责最终合成，除非你是刻意设计 handoff graph。
- 每个 worker 都要有显式 contract：
  - 输入边界
  - 输出 artifact
  - 工具权限
  - 完成定义
- 如果一个方案说不清“为什么不是单 agent”，那它大概率不该是多代理。

### 4. Harness Engineering

这里的 Harness Engineering 是从官方材料推断出的仓库工作定义，不是单一厂商术语。

- Harness = context + memory + tools + permissions + artifacts + evals + resume path + governance
- 默认先优化 harness，再怪模型
- 我们优先把计划、证据、总结和 handoff 写成工件，而不是只留在聊天历史
- 我们优先做模块化规则和路径作用域，避免单一超长 instruction 文件
- 我们把 sandbox、domain allowlist、managed settings、approval 等都视为架构的一部分

## 新设计必须回答的问题

1. 这件事应该是 skill、agent、pack、MCP 集成，还是普通文档即可？
2. 是否真的需要脚本、MCP 或多代理，还是 instructions / 单 agent 已经足够？
3. 路由入口是什么，模型如何知道“何时应该使用它”？
4. 工具面是否已经缩到最小？
5. 状态、证据和结果是否会落到文件或 artifact，而不是只存在会话里？
6. 最小可重复验证路径是什么？
7. 如果外部能力失效，回退路径是什么？

## 本仓库里的放置方式

- 长版研究和来源保留在 `research/`
- 稳定规则保留在 `docs/architecture/`
- 具体 package 约束继续放在各自的 `SKILL.md`、`claude-code.md`、`codex.toml`、`README.md` 和 `CHANGELOG.md`
- 如果未来需要更细的 vendor 专题页，优先在 `docs/architecture/` 下补专页，而不是把根说明文件继续做大

## 使用方式

- 做 Skill 设计时，先看本页的 Skill 规则，再回到研究报告核对来源
- 做 MCP 设计时，先看本页的 MCP 规则，再补 trust / scope / audit 细节
- 做 Agent 或 Multi-Agent 设计时，默认先写清“为什么不是单 agent”
- 做运行时、治理、记忆、验证相关设计时，把它们视为 harness，不要只写 prompt
