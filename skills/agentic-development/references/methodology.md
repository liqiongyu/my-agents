# Methodology

Use this reference when the user needs the core method rather than a quick
yes/no answer.

## Core Thesis

Real agentic systems are not "prompts with tools." They are socio-technical
systems with:

- an autonomy boundary
- action contracts
- state and memory boundaries
- recovery behavior
- evaluation loops
- operational controls

Treat them accordingly.

## Minimal Viable Agency Ladder

Always start here before you recommend a framework or a multi-agent topology.

| Level | Use when | Typical shape | Escalate when |
| --- | --- | --- | --- |
| `L0: deterministic software` | Rules are stable and testable | functions, scripts, services | tool choice or reasoning becomes dynamic |
| `L1: workflow` | Steps are known but routing may vary | pipelines, routers, state machines | one owner must reason across multiple tools and recover locally |
| `L2: single agent` | One coherent operator can plan, act, and repair | tool-using assistant | specialist delegation or explicit review loops become essential |
| `L3: orchestrator-worker` | There are distinct subproblems or specialist roles | coordinator + workers | quality or safety needs an explicit scorer/repair loop |
| `L4: evaluator-optimizer` | Generate-score-repair is the main reliability lever | planner + evaluator + retry | multiple specialists plus persistent collaboration are justified |
| `L5: multi-agent team` | Different agents own durable roles or domains | teams, swarms, supervised specialists | never by default; only with clear contracts |

Default bias:

- if `L0` or `L1` is sufficient, do not sell `L2+`
- if `L2` is sufficient, do not sell `L3+`

## Seven Design Questions

Before approving an architecture, answer these questions:

1. What job is the system actually doing?
2. What uncertainty makes deterministic software insufficient?
3. What actions can the system take and how risky are they?
4. What state must survive across steps, sessions, or restarts?
5. Where does human approval belong?
6. How will success, failure, and drift be measured?
7. What would force us to simplify, escalate, or roll back?

## Operating Laws

### 1. Prefer minimal viable agency

Do not use more autonomy, more roles, or more reasoning depth than the job
requires.

### 2. Separate system form from framework choice

Decide the pattern before the SDK. First decide whether the job is a workflow,
single-agent loop, or multi-agent system. Only then select tools and
frameworks.

### 3. Make contracts explicit

Define tool inputs, tool outputs, artifact schemas, memory boundaries, and
handoff expectations explicitly. Do not rely on implicit prompt conventions for
critical behaviors.

### 4. Treat state as a design surface

Separate:

- working context inside the current run
- task artifacts that are shared across steps
- long-term memory or knowledge stores
- operational telemetry and traces

### 5. Put humans at irreversible boundaries

The higher the cost of a wrong action, the closer a human should be to the
decision point.

### 6. Make evals and tracing part of the architecture

Capability evals, safety checks, regression tracking, trace review, and cost
budgets are not "later polish." They are required to govern autonomy.

### 7. Evolve by proving value

Move from simple to sophisticated only when the simpler version fails for clear
reasons. Evolution beats speculative complexity.

## Artifact Pack

The default durable output from this skill should contain:

1. a suitability verdict
2. a chosen agency level
3. an orchestration pattern
4. a framework/protocol recommendation
5. a tool contract summary
6. a state and memory plan
7. an eval and operations plan
8. the next specialist route

When the output is too vague, overlong, or missing one of these sections, use
`references/example-artifact-pack.md` as the compact target shape.

## Escalation Rules

Escalate to stronger system design when:

- tool choice is dynamic and cannot be hardcoded
- the task spans multiple uncertain subproblems
- specialist roles materially reduce error rate or latency
- recovery behavior requires explicit planner/evaluator loops
- the agent must operate across sessions or durable state

Refuse escalation when:

- the proposal uses "agents" to mask vague requirements
- there is no measurable success criterion
- humans are absent from high-risk actions
- the proposed topology has more roles than clear contracts

## Relationship To Nearby Skills

- `future-aware-architecture` owns broader architecture and stack decisions.
- `prompt-engineering` owns prompt/system-prompt quality.
- `implementation-planning` owns the build plan after direction is chosen.
- `deep-research` owns current-source investigation when the facts are unstable.

This skill owns the agentic-system method and routes into those workflows when
the design reaches their boundary.
