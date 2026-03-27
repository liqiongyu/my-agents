# Invocation Posture

Choose a skill's invocation posture before you write or optimize its description. This is a design decision, not an afterthought.

## Why It Matters

The same skill can be excellent or terrible depending on how often it triggers.

- A `manual-first` skill with a broad description becomes noisy and intrusive.
- An `auto-first` skill with an overly narrow description never helps when it should.
- A `hybrid` skill needs an explicit compromise instead of drifting into one extreme accidentally.

If you skip this decision, trigger optimization will often default toward higher recall even when the product intent actually calls for restraint.

## The Three Postures

| Posture | Use when | Description style | Eval bias |
| --- | --- | --- | --- |
| `manual-first` | The skill is heavy, risky, meta, governance-oriented, or usually requested explicitly | Short, precise, strong negative boundary | Overweight `should-not-trigger` and adjacent tasks |
| `hybrid` | Explicit invocation is normal, but a few high-confidence automatic triggers are useful | Concise with a modest amount of in-scope coverage | Balance positive and negative prompts |
| `auto-first` | The skill is narrow, cheap to trigger, and broadly helpful when invoked implicitly | Broader in-scope coverage, still with boundaries | Overweight in-scope variety and near-miss prompts |

## Default

If the user has not specified a preference, default to `manual-first`.

This is especially true for:

- meta-skills
- audit and governance skills
- install or publish workflows
- skills that touch many files or can create a lot of churn when triggered unnecessarily

## Boundary Cases

Not every skill cleanly lands on one posture without judgment.

- A very narrow, low-risk utility skill may still sit on the boundary between `hybrid` and `auto-first`. `auto-first` is the stronger fit when implicit activation is clearly desired and the blast radius is tiny. A conservative `hybrid` answer can still be reasonable if the surface wants automatic triggering to stay limited to unmistakable cases.
- If the request overlaps a skill that already exists, posture is only part of the answer. A good lifecycle response may first recommend checking for duplicate intent, then updating or retuning the existing skill instead of minting another one.

Treat these as reasoning-sensitive cases, not pure taxonomy failures.

## Description Heuristics

### `manual-first`

Aim for:

- one compact summary sentence
- explicit mention that the request should already be about skills
- a clear negative boundary

Avoid:

- long verb lists
- broad synonym coverage
- trying to catch every possible phrasing

### `hybrid`

Aim for:

- one clear summary sentence
- a little broader scope language than `manual-first`
- enough specificity that the trigger still feels intentional

Avoid:

- vague platform language
- adding so many examples that the skill starts reading like a search index

### `auto-first`

Aim for:

- wider in-scope coverage
- a few representative behaviors
- near-miss awareness

Avoid:

- removing negative boundaries entirely
- treating the description like a bag of keywords

## Eval Design By Posture

### `manual-first`

Recommended prompt mix:

- 1-2 explicit should-trigger prompts
- 3-5 should-not-trigger prompts from adjacent domains
- 1-2 near-miss prompts

Primary question:

- Does the skill stay quiet unless the user is clearly asking for skill work?

### `hybrid`

Recommended prompt mix:

- 2-3 should-trigger prompts
- 2-3 should-not-trigger prompts
- 2 near-miss prompts

Primary question:

- Does the skill help in obvious in-scope cases without bleeding too far into neighboring tasks?

### `auto-first`

Recommended prompt mix:

- 4-6 in-scope prompts with phrasing variety
- 2-3 near-miss prompts
- 1-2 should-not-trigger prompts

Primary question:

- Does the skill reliably activate across natural in-scope phrasing without becoming noisy?

## Example

`skill-lifecycle-manager` itself should be `manual-first`.

Why:

- it is a heavy meta-skill
- it can route into large workflows
- users usually already know they want skill work
- false positives are more damaging than missing a vague adjacent request

That means its description should optimize for precision, not maximum recall.

When validating this decision in practice, use `eval/trigger-posture-cases.json`. That suite includes explicit skill requests that should route, adjacent non-skill requests that should not, and a few cases where the target skill posture itself should be classified as `manual-first`, `hybrid`, or `auto-first`. It also includes a small number of boundary cases where overlap checks or a conservative `hybrid` answer are acceptable if the reasoning is explicit.
