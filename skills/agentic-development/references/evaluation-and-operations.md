# Evaluation And Operations

Use this reference when the user needs real confidence, not just a clever
design.

## Evals Are Architecture

For agentic systems, evaluation is part of the design itself. If you cannot say
how the system will be measured, you probably do not yet know what you are
building.

## Evaluation Surfaces

| Surface | What it checks | Examples |
| --- | --- | --- |
| capability | does the system solve the task | task completion, answer quality, artifact completeness |
| regression | did the new version get worse | baseline vs revised runs, unchanged contracts |
| safety | does it stay within policy | prompt injection, data leakage, dangerous tool calls |
| tool correctness | are tools called correctly | schema adherence, retries, idempotency, argument quality |
| state recovery | can the system resume or repair | session rewind, replay safety, restart behavior |
| cost and latency | is the system economically viable | token cost, wall-clock time, retries, tool budgets |
| oversight quality | do human checkpoints happen when they should | approval before risky actions, escalation timing |

## Minimum Evidence Pack

Before claiming a system is production-ready, collect:

- representative task cases
- negative and adversarial cases
- trace samples from successful and failed runs
- tool-call logs for risky actions
- cost and latency summaries
- at least one rollback or failure-handling story

## Trace Review

Trace review is not just debugging. It answers:

- where the system lost the plot
- whether it used the right tools
- whether delegation boundaries were clean
- whether retries improved quality or just burned tokens

Review transcripts and traces as first-class evidence.

## Rollout Ladder

Use the smallest rollout stage that the evidence currently supports:

1. local bench and synthetic checks
2. shadow mode with no side effects
3. bounded human-in-the-loop pilot
4. limited production segment
5. wider rollout with rollback ready

Do not skip directly from prototype to broad autonomy.

## Budget And Guardrail Design

Define up front:

- token or cost budget per task class
- retry budget
- max tool iterations
- hard stop conditions
- approval requirements for medium and high-risk actions
- escalation path when confidence is low

## Incident Triggers

These should force review or rollback:

- repeated invalid tool calls
- drift in core task success
- unsafe or unapproved high-risk actions
- unexplained cost blowouts
- state corruption or replay failures
- evaluator disagreement with no clear adjudication rule

## Go/No-Go Questions

Ask these before a stronger rollout:

1. Can we explain the system's failure modes?
2. Do we know which traces are good vs bad and why?
3. Are risky actions explicitly gated?
4. Can we recover from restart, retry, and partial failure?
5. Do we have cost and latency budgets that the design can respect?
6. Do we know what evidence would trigger rollback?

If any answer is no, the system is not ready for more autonomy.
