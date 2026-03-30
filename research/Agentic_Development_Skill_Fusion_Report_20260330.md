# Agentic Development Skill Fusion Report

Research date: 2026-03-30
Mode: Deep Discover -> Collect -> Analyze -> Synthesize
Status: Research handoff complete and authoring complete
Target: a cross-platform, method-heavy skill for building real agentic systems

## Executive Summary

The strongest direction is not a generic "AI agents" encyclopedia and not a
prompt-only "best practices" sheet. It should be a `manual-first` orchestration
skill for agentic system engineering.

The current landscape splits into four useful but incomplete camps:

- principle-only skills with good heuristics but weak system architecture
- skill operating systems with strong workflow sequencing but platform-specific
  assumptions
- official framework and methodology docs with strong primitives but weak
  cross-framework decision logic
- framework repos that solve runtime concerns but do not teach when simpler
  non-agentic designs are better

So the new skill should fuse the best parts of each camp while adding one
important missing layer: a minimal-viable-agency gate that prevents needless
multi-agent complexity.

## Local Repository Implication

This repository already contains adjacent specialists:

- [agent-lifecycle-manager](/Users/liqiongyu/projects/pri/my-agents/skills/agent-lifecycle-manager/SKILL.md)
- [future-aware-architecture](/Users/liqiongyu/projects/pri/my-agents/skills/future-aware-architecture/SKILL.md)
- [prompt-engineering](/Users/liqiongyu/projects/pri/my-agents/skills/prompt-engineering/SKILL.md)
- [implementation-planning](/Users/liqiongyu/projects/pri/my-agents/skills/implementation-planning/SKILL.md)
- [deep-research](/Users/liqiongyu/projects/pri/my-agents/skills/deep-research/SKILL.md)
- [review](/Users/liqiongyu/projects/pri/my-agents/skills/review/SKILL.md)

So the new skill should not replace them. It should sit above them as the
agent-system method and route into them honestly.

## Recommended Direction

Recommended posture: `manual-first`

Recommended concept:

- a real agentic development workflow
- primary job: decide whether and how to build an agentic system
- secondary job: shape the architecture, framework choice, eval plan, and
  operational controls
- explicit non-goal: do not turn prompt tuning or ordinary implementation
  planning into a giant "agent architecture" exercise

## Source Inventory

### Skill and workflow anchors

1. supercent `agentic-development-principles`
   Source: <https://skills.sh/supercent-io/skills-template/agentic-development-principles>
   Value: small-step decomposition, context freshness, abstraction selection,
   automation ladder, plan-vs-execute framing

2. affaan `agentic-engineering`
   Source: <https://skills.sh/affaan-m/everything-claude-code/agentic-engineering>
   Value: eval-first loop, 15-minute work units, model routing, review focus,
   cost discipline

3. alinaqi `agentic-development`
   Source: <https://skills.sh/alinaqi/claude-bootstrap/agentic-development>
   Value: framework-by-language guidance, layered project structure,
   Explore-Plan-Execute-Verify workflow

4. anthropics/skills
   Source: <https://github.com/anthropics/skills>
   Value: official skill packaging, lean `SKILL.md` structure, progressive
   disclosure

5. openai/skills
   Source: <https://github.com/openai/skills>
   Value: official Codex skill packaging and runtime surface

6. obra/superpowers
   Source: <https://github.com/obra/superpowers>
   Value: strongest example of skills becoming a development operating system

### Official methodology and platform anchors

1. Anthropic: Building effective agents
   Source: <https://www.anthropic.com/engineering/building-effective-agents>
   Value: workflow vs agent distinction, orchestrator-worker, evaluator-optimizer

2. Anthropic: Building agents with the Claude Agent SDK
   Source: <https://claude.com/blog/building-agents-with-the-claude-agent-sdk>
   Value: gather context -> act -> verify loop

3. Anthropic: How we built our multi-agent research system
   Source: <https://www.anthropic.com/engineering/built-multi-agent-research-system>
   Value: production multi-agent architecture and artifact handoffs

4. Anthropic: Demystifying evals for AI agents
   Source: <https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents>
   Value: transcript review, grader thinking, pass^k framing

5. OpenAI: New tools for building agents
   Source: <https://openai.com/index/new-tools-for-building-agents/>
   Value: Responses API, Agents SDK, tracing

6. OpenAI Agent Builder guide
   Source: <https://developers.openai.com/api/docs/guides/agent-builder>
   Value: node-based workflow composition, trace graders, publish/deploy story

7. OpenAI: A practical guide to building agents
   Source: <https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/>
   Value: single-agent vs manager pattern, operational pragmatism

8. MCP intro
   Source: <https://modelcontextprotocol.io/docs/getting-started/intro>
   Value: portability layer for tools and external systems

### Framework and project anchors

1. OpenAI Agents SDK
   Source: <https://github.com/openai/openai-agents-python>

2. LangGraph
   Source: <https://github.com/langchain-ai/langgraph>

3. AutoGen
   Source: <https://github.com/microsoft/autogen>

4. Google ADK
   Source: <https://github.com/google/adk-python>

5. Pydantic AI
   Source: <https://github.com/pydantic/pydantic-ai>

6. CrewAI
   Source: <https://github.com/crewAIInc/crewAI>

7. OpenHands
   Source: <https://github.com/OpenHands/OpenHands>

8. deer-flow
   Source: <https://github.com/bytedance/deer-flow>

## Pattern Analysis

### Pattern 1: Plan before action

This appears in nearly every high-signal source. The strongest variants do not
just say "plan first"; they define the plan as an executable contract with
verification hooks.

What to preserve:

- do not jump into execution
- define success and failure conditions up front
- keep plans small enough to verify

### Pattern 2: Context is an operational resource

supercent and Anthropic are especially strong here. Good systems actively
manage context, hand off compact artifacts, and avoid stuffing all state into
one giant conversation.

What to preserve:

- context freshness
- explicit handoff artifacts
- separation of working context, memory, and telemetry

### Pattern 3: Workflow is not the same as agent

Anthropic and OpenAI both emphasize this, even when using different surface
language.

What to preserve:

- an explicit minimal-viable-agency gate
- a bias toward workflows or deterministic software when they are enough

### Pattern 4: Evaluation must be designed, not sprinkled on top

affaan, Anthropic's eval article, ADK, OpenAI Agent Builder, and Pydantic AI
all reinforce this from different angles.

What to preserve:

- baseline vs revised comparison when it matters
- capability + regression + safety + cost views
- transcript and trace review

### Pattern 5: Agent systems need explicit control surfaces

The best framework docs treat handoffs, tools, approvals, sessions, memory,
durability, and tracing as real primitives rather than prompt folklore.

What to preserve:

- explicit tool contracts
- approval checkpoints
- durable or resumable state where needed
- observability and rollback triggers

## Unique Innovations Worth Preserving

| Innovation | Source | Why it matters |
| --- | --- | --- |
| context freshness plus HANDOFF discipline | supercent | keeps long sessions from decaying into noise |
| 15-minute independently verifiable work units | affaan | makes agent execution measurable and containable |
| framework-by-language plus project structure | alinaqi | bridges theory to actual engineering layout |
| workflow vs agent distinction | Anthropic / OpenAI | prevents gratuitous autonomy |
| handoffs, guardrails, sessions, tracing | OpenAI Agents SDK | clean primitive set for serious runtime design |
| durable execution and interrupts | LangGraph / Pydantic AI | critical for long-running or human-gated systems |
| built-in eval and tool confirmation | Google ADK | integrates evaluation and approval into the build loop |
| crews plus flows separation | CrewAI | useful distinction between autonomy and control |
| production coding-agent runtime pragmatics | OpenHands / deer-flow | concrete reference projects beyond toy demos |

## Anti-Patterns To Avoid

- turning every automation problem into multi-agent
- choosing a framework before defining the operating contract
- hiding tool risk inside prompt text instead of contracts and approvals
- treating memory as an untyped dump of chat history
- skipping evals because tracing exists
- writing a skill that duplicates neighboring repo skills instead of routing
- platform-locking the core method so it only makes sense in one agent surface

## Recommended Fusion Strategy

### Core Architecture

The new skill should use this seven-part backbone:

1. decide whether the problem deserves agency
2. frame the operating contract
3. design the system in layers
4. choose the orchestration pattern
5. choose the framework/protocol
6. define evals, guardrails, and operations
7. route to the next specialist workflow

### Must-Include Elements

- minimal viable agency ladder
- system layers: tools, state, orchestration, eval/ops
- framework selection matrix instead of a universal winner
- explicit human approval and risk-band thinking
- durable artifact pack
- honest routing to nearby local skills

### Differentiation Opportunities

The ecosystem has many good fragments, but it lacks one package that cleanly
combines:

- principle layer
- architecture layer
- framework selection layer
- eval/ops layer
- local workflow routing

That is where this skill can be better than existing examples.

## Authoring Outcome

This research pass produced the canonical skill package:

- [skills/agentic-development/SKILL.md](/Users/liqiongyu/projects/pri/my-agents/skills/agentic-development/SKILL.md)
- [skills/agentic-development/skill.json](/Users/liqiongyu/projects/pri/my-agents/skills/agentic-development/skill.json)
- [skills/agentic-development/references/methodology.md](/Users/liqiongyu/projects/pri/my-agents/skills/agentic-development/references/methodology.md)
- [skills/agentic-development/references/system-patterns.md](/Users/liqiongyu/projects/pri/my-agents/skills/agentic-development/references/system-patterns.md)
- [skills/agentic-development/references/framework-selection.md](/Users/liqiongyu/projects/pri/my-agents/skills/agentic-development/references/framework-selection.md)
- [skills/agentic-development/references/evaluation-and-operations.md](/Users/liqiongyu/projects/pri/my-agents/skills/agentic-development/references/evaluation-and-operations.md)

## Next Step

Project the canonical package to runtime surfaces, validate structure and eval
fixtures, refresh generated catalogs, and run repository validation.
