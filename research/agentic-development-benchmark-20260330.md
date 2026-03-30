# Agentic Development Benchmark Note

Date: 2026-03-30

## Purpose

This note records one concrete with-skill versus baseline benchmark for
`agentic-development` after the first post-launch boundary and reference
hardening pass. The raw runtime artifacts live under the local `workspaces/`
tree, which is ignored by Git, so this note preserves the main result in
version control.

## Benchmark Shape

- Skill: `agentic-development`
- Skill version: `0.1.2`
- Surface: Codex
- Eval case: `quality-minimal-agency` — "Recommend minimal viable agency for a practical assistant"
- Reasoning effort: default Codex exec posture
- Timeout budget: 240 seconds per run

Raw local artifacts:

- `workspaces/agentic-development/iteration-1/evals/quality-minimal-agency/with-skill/codex/`
- `workspaces/agentic-development/iteration-1/evals/quality-minimal-agency/baseline/codex/`

## Result Summary

| Metric | With Skill | Baseline | Delta |
| --- | --- | --- | --- |
| Exit code | 0 | 0 | 0 |
| Duration | 104s | 71s | +33s |

## Qualitative Comparison

- Both runs made the right high-level call: avoid a multi-agent system for this
  support-assistant prompt.
- The baseline answer was already good. It recommended a workflow-first design
  with one primary LLM assistant, named approval gates, and kept risky actions
  outside the model.
- The `with-skill` run stayed closer to the intended `agentic-development`
  contract:
  - it explicitly framed the answer around minimal viable agency rather than
    only system architecture
  - it named the chosen pattern as a `tool-using single agent` wrapped by a
    deterministic workflow
  - it made tool risk bands, typed state boundaries, and early eval targets
    more explicit
  - it spelled out when the design should later escalate toward multi-agent
    patterns
- The main tradeoff in this benchmark is latency: the `with-skill` run took
  longer, but it produced a more explicit agentic operating contract instead of
  a mostly architecture-shaped answer.

## Interpretation

This benchmark supports the claim that the skill adds value primarily through
better boundary discipline and more durable system-design output, not by making
the answer "more agentic" than necessary. In other words, the useful delta is
clearer minimal-agency reasoning plus better artifact shape.

## Pending

This is only one completed benchmark case. The next recommended runtime
comparisons are:

- `quality-framework-choice` to check whether the skill improves operating-contract-first framework reasoning
- one ambiguous trigger case to see whether the new near-miss fixtures improve conservative routing behavior
