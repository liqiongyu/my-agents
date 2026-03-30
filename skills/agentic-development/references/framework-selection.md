# Framework Selection

Use this reference when a user needs a current framework or protocol decision.
Because this ecosystem changes quickly, treat this file as a stable decision
aid and verify any time-sensitive claims before locking a production choice.

Last verified: 2026-03-30
Refresh guidance: verify again before consequential framework choices and
refresh this reference at least every 60 days if it is being used as a standing
team guide.

Matrix note: this reference is intentionally non-exhaustive. If a consequential
option is missing or recent vendor changes materially affect the decision, route
to `deep-research` for a fresh comparison instead of pretending this file is a
complete market map.

## Selection Rules

1. Choose the pattern before the framework.
2. Treat protocols such as MCP as complements, not replacements for
   orchestration.
3. Prefer the framework that fits the operating contract, not the most popular
   project.
4. A simpler framework plus better evals usually beats a fancier framework plus
   vague control logic.
5. If pricing, vendor capabilities, safety surfaces, or deployment constraints
   materially affect the decision, gather fresh evidence before finalizing the
   recommendation.

## Comparison Matrix

| Option | Best fit | Strongest strengths | Main limits |
| --- | --- | --- | --- |
| OpenAI Agents SDK | OpenAI-centric or provider-flexible assistants needing handoffs, guardrails, sessions, tracing, and HITL | clear primitives for agents, handoffs, guardrails, tracing, MCP integration | less graph-native than LangGraph; design still needs explicit runtime discipline |
| LangGraph | long-running, stateful, branchy workflows with human interrupts | durable execution, memory, interrupts, graph control, LangSmith observability | lower-level and easier to overbuild |
| Google ADK | code-first agents with built-in eval, tool confirmation, and strong Google/Gemini alignment | evaluation support, dev UI, multi-agent hierarchies, tool confirmation, deploy story | best fit is still strongest in Google ecosystem |
| Pydantic AI | Python systems that need typed outputs, dependency injection, capabilities, and durable execution | strong type safety, structured outputs, capabilities, durable execution, evals | less opinionated orchestration control plane than graph-first frameworks |
| AutoGen | experimental or research-heavy multi-agent systems | layered design, agent chat patterns, extensions, benchmarking heritage | more moving parts; ecosystem direction now coexists with Microsoft Agent Framework |
| CrewAI | role-based business process automation and event-driven flows | strong narrative around crews + flows, enterprise control plane, fast onboarding | role-play abstraction can mask unclear contracts or state boundaries |
| MCP | standard tool/data connectivity across agent systems | portable connection model, ecosystem interoperability | not an orchestration framework, not a memory model, not an eval system |

## Scenario Defaults

### Choose OpenAI Agents SDK when

- you want handoffs, guardrails, sessions, tracing, and HITL as first-class
  primitives
- you are comfortable centering the runtime on the OpenAI SDK surface
- the system is agent-loop centric rather than graph-first

### Choose LangGraph when

- state persistence, resume, branching, and human interrupts are central
- you need durable workflows that may run for long periods
- your mental model is graph/state machine first

### Choose Google ADK when

- you want a code-first framework with built-in evaluation affordances
- tool confirmation and hierarchy support matter
- you are already aligned with Gemini or Google deployment surfaces

### Choose Pydantic AI when

- Python is the primary runtime
- typed contracts, validation, and structured outputs are critical
- you want agents and workflows to feel like well-typed application code

### Choose AutoGen when

- you are exploring rich multi-agent interaction patterns
- you value the layered framework and extension model
- you are comfortable managing a more research-oriented surface

### Choose CrewAI when

- the problem maps naturally to named roles and event-driven business flows
- you want a fast path to multi-agent automation with clear operator ergonomics

## Protocol Notes

### MCP

Use MCP when you need portable access to tools or external systems across
frameworks. It complements the runtime by standardizing connectivity. It does
not remove the need to design:

- orchestration
- approval boundaries
- state ownership
- evaluation
- rollback behavior

## Decision Smells

- "We should use multi-agent because the framework supports it."
- "We need MCP, therefore we already have an architecture."
- "We picked the framework with the best marketing site."
- "We can skip evals because the framework includes tracing."
- "We need both LangGraph and CrewAI and AutoGen, but cannot name the boundary
  between them."

When these smells appear, step back to the operating contract and orchestration
pattern.
