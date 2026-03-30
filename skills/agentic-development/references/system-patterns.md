# System Patterns

Use this reference when the user needs concrete architecture shapes,
orchestration options, or design patterns for tools, memory, and control.

## Pattern Selector

| Pattern | Best fit | Strength | Main risk |
| --- | --- | --- | --- |
| `workflow` | Stable sequence, deterministic routing, low ambiguity | easiest to test and reason about | people overcomplicate it into an agent |
| `tool-using single agent` | One operator can choose tools and recover locally | simple autonomy with coherent ownership | hidden state and tool misuse |
| `orchestrator-worker` | Coordinator delegates to specialists | clear decomposition and parallelism | unclear handoff contracts |
| `evaluator-optimizer` | Quality depends on score-repair loops | stronger reliability without huge teams | retry loops without measurable gain |
| `team` | Durable specialist roles with explicit ownership | modular specialization | coordination tax, duplicated context, blame ambiguity |

## Architecture Layers

Design agentic systems as layers with distinct ownership.

| Layer | What it owns | Questions to answer |
| --- | --- | --- |
| task intake | requests, goals, policies, user context | what is the job, who asked, what constraints apply |
| control loop | plan/act/retry policy | how does the agent decide the next move and when does it stop |
| tools and actions | callable actions and risk levels | what can the agent do, what must be confirmed, what is idempotent |
| state and memory | working context, artifacts, persistent knowledge | what survives a step, a run, a session, or a restart |
| orchestration | routing, delegation, handoffs | who owns what, how is work split, how are results merged |
| eval and ops | traces, graders, budgets, rollout controls | how do we know it works, drifts, or becomes unsafe |

## Tool Design Rules

### Typed contracts first

Tools should expose explicit schemas for inputs and outputs. If the agent can
mutate files, spend money, call external systems, or trigger user-visible
actions, define the contract before the prompt.

### Risk bands

Classify tools into:

- `low`: inspection or reversible reads
- `medium`: bounded writes or state changes
- `high`: destructive actions, external side effects, security-sensitive work

High-risk tools should usually require confirmation or a precondition gate.

### Idempotency and replay

If a run can retry or resume, understand what happens when a tool is called
twice. Agentic systems that cannot tolerate replay are fragile in production.

## Memory And State Taxonomy

| State class | Purpose | Good examples | Bad smell |
| --- | --- | --- | --- |
| working context | immediate reasoning substrate | current plan, step outputs | dumping whole history forever |
| task artifact | explicit shared state between steps | JSON task record, report draft, patch artifact | hiding shared state only in chat history |
| long-term memory | durable knowledge across sessions | user preferences, entity memory, knowledge graph | using it as a trash pile for every message |
| telemetry | operational evidence | traces, tool logs, cost metrics, eval results | treating logs as memory or vice versa |

## Human Oversight Placement

Human-in-the-loop works best at explicit boundaries:

- before high-risk tool execution
- before cross-system or external side effects
- when confidence is low but the action cost is high
- when the system wants to publish, merge, deploy, or send

Avoid using humans as vague "fallbacks." Put them at named checkpoints.

## Reference Projects Worth Reading

These are useful as project references, not as universal blueprints:

- Anthropic's multi-agent research system for a lead-researcher plus
  subagent model
- OpenHands for coding-agent runtime, sandboxing, and task-loop pragmatics
- deer-flow for long-horizon superagent harness patterns
- LangGraph examples for durable state and human interrupts
- OpenAI Agents SDK examples for handoffs, guardrails, and sessions

Borrow patterns, not branding.

## Pattern Anti-Patterns

### Many agents with no contracts

More roles do not mean more structure. If two agents read the same context,
call the same tools, and produce overlapping outputs, you probably have one
badly specified role split into two.

### Memory as a junk drawer

If every message and tool result gets dumped into "memory," recovery and drift
get worse. Memory must have typed purpose.

### Tool permission by vibes

Do not rely on "be careful" prompt language. Use schemas, confirmation rules,
and risk bands.

### Evaluator as decoration

An evaluator only helps if it has explicit criteria, a bounded scope, and a
decision effect. Otherwise it is just another agent producing prose.
