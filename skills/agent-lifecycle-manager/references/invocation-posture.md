# Invocation Posture

Choose an agent's invocation posture before writing or tuning its descriptions. This is a design decision, not an afterthought.

## Why It Matters

The same agent can feel excellent or noisy depending on how often it is selected.

- A `manual-first` agent with a broad description steals work from the main session or from neighboring agents.
- An `auto-first` agent with an overly narrow description never appears when it should.
- A `hybrid` agent needs an explicit compromise instead of accidental drift.

If you skip this decision, description tuning usually drifts toward higher recall even when the product intent calls for restraint.

## The Three Postures

| Posture | Use when | Description style | Eval bias |
| --- | --- | --- | --- |
| `manual-first` | The agent is meta, heavy, governance-oriented, risky, or usually invoked explicitly | Short, precise, strong negative boundary | Overweight `should-not-trigger` and adjacent-task prompts |
| `hybrid` | Explicit invocation is common, but a few high-confidence automatic selections help | Concise with modest in-scope coverage | Balance positive and negative prompts |
| `auto-first` | The agent is narrow, cheap to route, and broadly helpful when selected automatically | Broader in-scope coverage, still with boundaries | Overweight in-scope variety and near-miss prompts |

## Default

If the user has not specified a preference, default to `manual-first`.

This is especially true for:

- meta-skills about agents
- governance or audit-oriented agent work
- install or publish workflows
- wide-write or high-authority agents

## Description Heuristics

### `manual-first`

Aim for:

- one compact summary sentence
- explicit mention that the request is already about agents
- a clear negative boundary

Avoid:

- long synonym lists
- trying to catch every possible user phrasing
- vague "helps with agent stuff" wording

### `hybrid`

Aim for:

- one clear summary sentence
- slightly broader scope language than `manual-first`
- enough specificity that the routing still feels intentional

### `auto-first`

Aim for:

- wider in-scope coverage
- a few representative tasks
- near-miss awareness

Avoid:

- dropping negative boundaries entirely
- turning the description into keyword soup

## Example

`agent-lifecycle-manager` itself should be `manual-first`.

Why:

- it is a heavy meta-skill
- it can create a lot of churn if routed accidentally
- users usually already know they want explicit agent work
- false positives are more damaging than misses
