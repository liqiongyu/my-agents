---
name: agentic-development
description: >
  Manual-first workflow for designing, building, evaluating, and upgrading
  real agentic systems. Use when the job involves tool-using agents, agent
  orchestration, agent runtimes or platforms, multi-agent systems, framework
  selection, evals, or guardrails; do not use for prompt-only work or ordinary
  implementation planning.
invocation_posture: manual-first
version: 0.1.2
---

# Agentic Development

Build real agentic systems with engineering discipline instead of treating
"agent" as a prompt that happens to call tools.

This skill helps decide whether a problem should use agency at all, choose the
smallest useful level of agency, shape the system architecture, select an
appropriate framework, define evaluation and safety gates, and hand off
honestly to deeper specialist workflows.

**Invocation posture:** `manual-first`. This is a heavy, cross-cutting system
design workflow. False positives are expensive.

## When To Activate

- The user is designing or upgrading a tool-using agent, agent workflow,
  multi-agent system, agent platform, or agent runtime.
- The user needs a method for tool design, memory/state design, orchestration,
  human approvals, tracing, evals, or operational guardrails.
- The user needs a framework or protocol choice across options such as OpenAI
  Agents SDK, LangGraph, ADK, Pydantic AI, AutoGen, CrewAI, or MCP.
- The user wants a repeatable engineering workflow for agent systems rather
  than ad hoc architecture advice.

## When Not To Use

Do not use this skill when:

- The task is prompt-only or system-prompt-only work. Use `prompt-engineering`.
- The task is general architecture or technology selection without a real
  agentic component. Use `future-aware-architecture`.
- The task mainly needs latest facts or citation-backed vendor comparison
  without an agent-system workflow. Use `deep-research`.
- The direction is already chosen and the job is a phased implementation or
  rollout plan. Use `implementation-planning`.
- The task is mainly about day-to-day agentic coding execution habits such as
  eval-first implementation loops, task slicing, model-tier routing, or
  session discipline rather than designing an agentic system. Use a narrower
  execution-focused workflow that already fits the active environment.
- The user wants a review of an existing diff, design doc, or implementation.
  Use `review`.
- A deterministic script, rule engine, or ordinary software workflow is enough
  and no agentic loop is warranted.

## Outputs

Depending on the request, produce one or more of:

- an agentic suitability verdict
- a minimal viable agency recommendation
- a system architecture brief
- a framework selection matrix
- a tool, memory, and orchestration design
- an evaluation and operations plan
- a route to the next specialist workflow

## Reference Files

Keep the main skill lean. Read the deeper references only when they materially
help the current decision.

| Reference | When to read |
| --- | --- |
| `references/methodology.md` | You need the core method, agency ladder, decision questions, and artifact pack |
| `references/system-patterns.md` | You need orchestration patterns, architecture layers, tool rules, memory design, or reference projects |
| `references/framework-selection.md` | You need a concrete framework/protocol choice or scenario-based stack guidance |
| `references/evaluation-and-operations.md` | You need eval design, rollout gates, observability, incident triggers, or readiness criteria |
| `references/example-artifact-pack.md` | You need a concrete example of the durable output shape this skill should produce |

## Core Workflow

### Workflow 1: Decide Whether The Problem Deserves Agency

Start with the lightest viable shape:

- deterministic software or script
- workflow with explicit routing and no open-ended reasoning
- tool-using single agent
- multi-agent system

Default rule:

- prefer the smallest useful level of agency
- escalate only when dynamic tool choice, long-horizon decomposition,
  specialist delegation, or recovery from uncertainty actually requires it

If a simpler deterministic or workflow-first solution is better, say so
explicitly instead of forcing an agentic design.

### Workflow 2: Frame The Operating Contract

Before choosing frameworks or patterns, pin down:

1. the job to be done
2. the environment the agent acts inside
3. the tools or actuators it can use
4. the autonomy boundary
5. the human approval points
6. the failure cost, latency budget, and cost budget
7. the observability and audit requirements

Without this contract, framework selection is noise.

### Workflow 3: Design The System In Layers

Design the agentic system as explicit layers, not one monolithic prompt:

1. task intake and interfaces
2. control loop and reasoning policy
3. tools and action contracts
4. state and memory
5. orchestration and handoffs
6. evaluation, tracing, and operational controls

For each layer, define:

- what it owns
- what contract it exposes
- what can fail
- how failure is detected
- who can intervene

### Workflow 4: Choose The Orchestration Pattern

Use the smallest pattern that matches the work:

- `workflow`: stable sequence or deterministic routing
- `single-agent`: one agent chooses tools and recovers locally
- `orchestrator-worker`: a coordinator delegates to specialist workers
- `evaluator-optimizer`: generate, score, repair, and retry
- `team`: multiple specialist agents with explicit interfaces and oversight

Read `references/system-patterns.md` when the boundary between these patterns
is unclear.

### Workflow 5: Choose The Framework Stack

Keep concepts separate from platform choice:

- pattern first
- framework second
- protocol third

For example:

- MCP is a connectivity protocol, not an orchestration strategy
- LangGraph is strong for stateful, long-running graphs
- OpenAI Agents SDK is strong for handoffs, guardrails, sessions, and tracing
- Pydantic AI is strong for typed contracts and Python-native agent engineering
- ADK is strong when you want code-first agents plus built-in evaluation and
  tool confirmation

Do not crown a universal winner. Choose against the operating contract.

### Workflow 6: Define Evals, Guardrails, And Operations Before Scaling

Treat evaluation and control as part of the architecture:

- capability evals
- regression evals
- safety and misuse cases
- tool correctness checks
- state recovery checks
- cost and latency budgets
- trace review and transcript review
- rollout and rollback triggers

No "fully autonomous" claim is credible without evaluation, observability, and
an explicit containment strategy.

### Workflow 7: Route The Next Specialist Step Honestly

This skill is an orchestrator, not the final owner of every downstream job.
Route outward when appropriate:

- `prompt-engineering` for prompt and system-prompt design
- `future-aware-architecture` for broader architecture and technology strategy
- `deep-research` for fast-moving vendor or framework evidence
- `implementation-planning` when the direction is chosen and the system needs a
  build plan
- `review` for design or code review
- `acceptance-verification` after execution when evidence needs a formal verdict
- `agent-lifecycle-manager` when the user is really managing agent packages or
  orchestration agents rather than building an agentic product/system

### Workflow 8: Capture The Artifact Pack

Before finishing, make sure the output includes the smallest durable set that
the next step can trust:

- suitability verdict: why this should or should not be an agent
- chosen agency level and orchestration pattern
- framework/protocol recommendation with rationale
- tool and risk-band design
- memory and state plan
- evaluation and operations plan
- next-step route

Read `references/example-artifact-pack.md` when the output is drifting or you
need a concrete target shape.

## Minimal Agency Heuristic

Use this quick selector before endorsing a design:

| Situation | Default answer |
| --- | --- |
| Stable steps, stable rules, low ambiguity | deterministic code or workflow |
| Dynamic tool choice, but one coherent task owner | single agent |
| Distinct specialist roles, parallel subproblems, or explicit review/repair loops | orchestrator-worker or evaluator-optimizer |
| Many peers with unclear responsibilities | stop and simplify before approving a team design |

## Contributor Note

Canonical maintainers should validate the package structure, eval fixtures, and
projections before release using the repository's normal validation flow.
Runtime users do not need any repo-local maintenance commands to use this
skill.

## Best Practices

1. Start by proving that agency is needed.
2. Prefer explicit contracts for tools, artifacts, and state.
3. Treat evaluation, tracing, and approval boundaries as first-class design.
4. Keep framework choice subordinate to system requirements.
5. Evolve from workflow to single-agent to multi-agent only when the simpler
   design stops being enough.

## Common Pitfalls

| Pitfall | Why it hurts | Fix |
| --- | --- | --- |
| Calling everything an agent | Complexity rises faster than value | Use the minimal viable agency ladder |
| Picking a framework before defining the operating contract | Tool bias replaces system design | Frame the job, failure cost, and autonomy boundary first |
| Treating tools as informal prompt text | Hidden action risk and brittle behavior | Use typed schemas, risk bands, and approval rules |
| Ignoring state and memory boundaries | Drift, replay bugs, and bad recovery | Separate short-term context, artifacts, persistent memory, and telemetry |
| Shipping without evals and traces | Failures surface only in production | Define evals, budgets, and observability before rollout |
| Using many agents to hide unclear ownership | Coordination tax and failure ambiguity | Simplify roles or collapse to a smaller pattern |

## Example Prompts

- Design the architecture and framework choice for a customer-support agent
  that uses tools and human approval for risky actions.
- Decide whether this product should use a workflow, a single agent, or a
  multi-agent system, then explain why.
- We are choosing between LangGraph, OpenAI Agents SDK, and Pydantic AI for a
  Python agent platform. Use a real decision workflow, not framework fandom.
- Turn this rough agent idea into a system blueprint with tools, memory,
  evals, and rollout gates.
