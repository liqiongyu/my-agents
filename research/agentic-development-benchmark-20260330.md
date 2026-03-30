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

## Matrix Update (Post-Commit)

After commit `f69e664`, I ran a cleaner small matrix with shared settings where
possible:

- Surface: Codex
- Reasoning effort: `low`
- Quality cases: `iteration-2`
- Trigger near-miss case: `iteration-3`

### Result Matrix

| Case | With Skill | Baseline | Readout |
| --- | --- | --- | --- |
| `quality-minimal-agency` | exit 0, 50s | exit 0, 30s | Both made the right call. The skill version was more explicit about minimal viable agency, deterministic guardrails, and typed state boundaries. |
| `quality-framework-choice` | exit 0, 135s | exit 0, 153s | Both chose LangGraph. The delta was modest; the skill version gave a clearer ranked tradeoff framing, but this prompt is already well served by direct docs-grounded reasoning. |
| `nm-ai-features-to-app` | exit 0, 18s | exit 0, 30s | Routing remained unstable. The skill run answered "do not route yet; clarify first," while baseline routed directly into agentic-development. This is a real gray-zone trigger case, not a clean win. |

Raw local artifacts:

- `workspaces/agentic-development/iteration-2/evals/quality-minimal-agency/with-skill/codex/`
- `workspaces/agentic-development/iteration-2/evals/quality-minimal-agency/baseline/codex/`
- `workspaces/agentic-development/iteration-2/evals/quality-framework-choice/with-skill/codex/`
- `workspaces/agentic-development/iteration-2/evals/quality-framework-choice/baseline/codex/`
- `workspaces/agentic-development/iteration-3/evals/nm-ai-features-to-app/with-skill/codex/`
- `workspaces/agentic-development/iteration-3/evals/nm-ai-features-to-app/baseline/codex/`

### Additional Observation

I also explored `quality-route-to-planning` in `iteration-2`. Both runs routed
toward `implementation-planning`, which is directionally correct, but the case
is not ideal as a clean benchmark because the downstream planning skill
dominated the output shape and created planning-doc side effects in the working
tree. I am treating it as exploratory evidence rather than a headline benchmark
row.

### Revised Takeaway

The skill now has stronger evidence on three fronts:

- It does improve minimal-agency framing on a representative architecture case.
- It does not yet produce a dramatic advantage on framework-comparison prompts
  that are already answerable by direct documentation review.
- Its near-miss trigger posture is still genuinely ambiguous on broad
  "add AI features" requests, which makes that case a good candidate for future
  trigger tightening.
