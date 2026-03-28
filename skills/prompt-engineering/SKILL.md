---
name: prompt-engineering
description: >
  Manual-first workflow skill for redesigning, debugging, hardening, or
  productionizing LLM prompts and system prompts. Use when the user needs
  end-to-end prompt work such as stabilizing behavior, migrating across
  models, or preparing a prompt for production. Do not use for quick
  technique lookup or for general LLM-powered coding tasks.
invocation_posture: manual-first
version: 0.2.1
---

# Prompt Engineering

Use this skill when prompt work needs an actual workflow: define success, draft
or repair the prompt, test it on real inputs, and harden it for the target
model and operating environment.

This skill is intentionally workflow-first. It is for prompt jobs with real
tradeoffs, failure modes, or rollout concerns. It is not meant to be a general
prompt encyclopedia.

**Invocation posture:** `manual-first`. This skill is broad and relatively
heavy, so false positives are more harmful than occasional misses.

## When Not To Use

- Quick technique lookup such as "what is chain-of-thought?" or "show me a
  few-shot template"
- Explaining an existing prompt line by line without redesigning or validating
  it
- General coding, product, or research work that only happens to involve an LLM
  somewhere in the stack
- Tiny one-off prompt tweaks where no real evaluation, migration, or hardening
  decision is needed

## When To Activate

- Drafting a new prompt or system prompt from requirements
- Debugging a prompt that is inconsistent, verbose, unsafe, or hard to steer
- Migrating prompt behavior between Claude, GPT, Gemini, or open-source models
- Hardening an agent prompt against injection, tool misuse, or output drift
- Turning an ad hoc prompt into a reusable template, chain, or production asset
- Setting up a realistic evaluation plan for prompt quality, format adherence,
  latency, or cost

## Outputs

Depending on the request, produce one or more of:

- a revised prompt or system prompt
- a failure-mode diagnosis with targeted fixes
- a cross-model migration checklist
- a prompt evaluation plan with representative test cases
- a production hardening checklist for output control, safety, and monitoring

## Reference Files

Keep the main workflow lean. Read deeper references only when the task needs
them.

| Reference | When to read |
| --- | --- |
| `references/advanced-reasoning.md` | You need structured reasoning patterns such as CoT, ToT, ReAct, self-consistency, or self-refine |
| `references/cross-model-guide.md` | You are migrating prompts across Claude, GPT, Gemini, or open-source models |
| `references/production-patterns.md` | You need versioning, evaluation, caching, rollout, monitoring, or prompt-chain design |
| `references/security-patterns.md` | You are handling untrusted input, tool use, prompt injection, or output validation |

## Core Workflow

### Workflow 1: Scope The Prompt Job

Before rewriting anything, pin down:

1. The task and the exact output shape
2. What "good" looks like with 3-5 representative examples
3. The constraints: model, context budget, latency, cost, determinism, safety
4. The current failure modes: wrong format, wrong content, instability, unsafe
   behavior, or cross-model drift

Always collect at least:

- one happy-path input
- one edge case
- one adversarial or malformed case

If you cannot explain what success means, do not jump into fancy prompting
techniques yet.

### Workflow 2: Draft Or Repair With Minimum Necessary Complexity

Start with the smallest change that could plausibly fix the problem, then
escalate only if the evidence says you need more structure.

| Level | Default move | Use when |
| --- | --- | --- |
| `L1` | Clear direct instruction | First pass for almost every task |
| `L2` | Add explicit constraints and output format | The model drifts on brevity, style, or schema |
| `L3` | Add examples | The model still misclassifies, misformats, or misses edge cases |
| `L4` | Add reasoning scaffold | The task needs multi-step analysis or error checking |
| `L5` | Split into a chain or reusable template | Intermediate validation or multi-stage processing matters |

Use this structure by default:

```text
[Role or system context]
[Task instructions]
[Examples, if needed]
[Input data]
[Output format]
```

Keep model-specific features explicit and removable. Do not bury XML tags,
prefilling tricks, or vendor-specific schema APIs inside a supposedly
model-agnostic prompt.

### Workflow 3: Evaluate On Real Work

Treat prompt changes like code changes:

1. Record a baseline on representative inputs
2. Change one variable at a time when possible
3. Re-run the same cases on the revised prompt
4. Compare:
   - task accuracy or usefulness
   - format compliance
   - consistency across repeated runs
   - latency and token cost
5. Keep notes on what changed, why, and what improved

If the task involves model migration, re-test on the target model directly. Do
not assume prompt portability just because two models are both strong.

### Workflow 4: Productionize And Harden

When the prompt is headed toward repeated or user-facing use:

- version the prompt and template variables
- prefer API-level structure enforcement when the platform supports it
- isolate untrusted input from instructions
- restate critical boundaries when injection risk exists
- validate outputs before downstream actions depend on them
- define rollback or fallback behavior for high-impact uses
- monitor drift, edge cases, and cost regressions over time

## Technique Selection Guide

Use the lightest tool that matches the problem.

| Need | Default move | Read next |
| --- | --- | --- |
| Reliable structured output | Show the exact format first; use schema enforcement when available | `references/production-patterns.md`, `references/cross-model-guide.md` |
| Stronger analytical reasoning | Prefer model-native reasoning first; add a structured scaffold only if needed | `references/advanced-reasoning.md` |
| Cross-model migration | Remove vendor-specific tricks, normalize delimiters, then re-test on the target model | `references/cross-model-guide.md` |
| Injection resistance | Isolate data, repeat critical constraints, and validate outputs | `references/security-patterns.md` |
| Multi-step pipeline | Split into a chain only when intermediate validation adds value | `references/production-patterns.md` |

## Validate And Evaluate

This canonical package ships a lightweight eval suite under `eval/` for
realistic prompt-work scenarios.

When updating the canonical skill in this repo, validate the package and eval
fixture before projecting:

```bash
uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/prompt-engineering
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/prompt-engineering/eval/eval-cases.json
```

For behavioral review, run the cases in `eval/eval-cases.json` as realistic
tasks and check whether the response:

- defines success before rewriting
- proposes the smallest effective prompt change
- calibrates advice to the target model or runtime
- includes a concrete validation plan
- treats safety and output control explicitly when risk is present

## Projection And Install Notes

Treat `skills/prompt-engineering/` as the canonical package. Generate runtime
surfaces from it rather than hand-editing copies:

```bash
uv run python skills/skill-lifecycle-manager/scripts/project_skill.py skills/prompt-engineering --platform all
uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/prompt-engineering --platform all
```

`projection.json` excludes author-only evaluation artifacts from runtime
projections so Codex and Claude Code only receive the execution-relevant
package.

## Best Practices

1. Start with the smallest prompt change that could fix the failure.
2. Measure on representative inputs before and after edits.
3. Keep model-specific tricks explicit and easy to remove.
4. Prefer API-level structure enforcement over prompt-only formatting when the
   platform supports it.
5. Treat prompts as versioned artifacts, not disposable chat snippets.

## Common Pitfalls

| Pitfall | Why it hurts | Fix |
| --- | --- | --- |
| Jumping to exotic techniques too early | Complexity hides the real failure mode | Define success and start at the lowest effective level |
| Shipping without negative cases | Edge failures appear only in production | Test happy-path, edge, and adversarial inputs |
| Assuming prompt portability | Vendor behaviors diverge in subtle ways | Re-test on the target model and remove model-specific tricks |
| Mixing trusted instructions with untrusted data | Injection risk rises sharply | Delimit, isolate, and restate boundaries |
| Changing many variables at once | You cannot tell what improved | Run one targeted fix at a time where practical |
