---
name: meta-loop
description: >-
  Judge whether any iterative loop is well-designed — a verification loop,
  review loop, maker/checker loop, evaluator-optimizer, or agent
  self-improvement loop — or design a new one from scratch. Provides a
  10-dimension quality rubric (Mode A) and a 9-step build guide (Mode B)
  grounded in TDD, Reflexion, LLM-as-judge, process-supervision, and
  agentic-workflow research. Use when asked "is this loop good enough",
  "review/critique this loop", "design a loop to catch X", "what should a
  verification loop cover", or whenever you are designing, modifying, or
  evaluating the mechanics of a produce → check → fix → re-check cycle —
  even if the word "loop" is never said. Do NOT use for executing an existing
  concrete loop (run that loop itself), one-shot scripts, or plain Q&A.
invocation_posture: manual-first
---

# Meta-Loop

A **loop** here is any bounded *produce → independent check → fix → re-check* cycle: a verification loop, review loop, maker/checker pair, evaluator-optimizer, or agent self-refinement loop. This skill does two things, and is grounded in established methodology (TDD, Self-Refine, Reflexion, Constitutional AI, LLM-as-judge research, process supervision, agentic workflow patterns — see `references/`):

- **Mode A — evaluate** any loop against a 10-dimension quality rubric.
- **Mode B — build** a new loop in 9 steps.

## The four blind spots (read this first)

Even strong agents, asked cold to evaluate or design a loop, **systematically miss the same four dimensions**. In baseline testing for this skill, two independent agents each enumerated ~30 design dimensions yet omitted all four below — and produced mutually inconsistent lists, because without a shared rubric each invents its own ad-hoc checklist. These four are why the skill exists:

- **Trigger reliability** — they assume the loop "gets called," and never ask whether it gets *silently skipped at the moment it matters*. A perfectly-designed loop that never fires is worth zero. **This is the #1 blind spot.**
- **Cross-run memory + a kill criterion** — they log a single run at most; they never ask whether the loop still *earns its cost over time* (if it stops catching anything, retire it), and rarely carry lessons across runs (Reflexion-style).
- **Cost as a skip incentive** — they order checks "cheapest first" but set no per-run cost ceiling, and never connect *too expensive → quietly switched off → trigger defeated*.
- **Same-model self-preference** — they treat "dispatched a sub-agent" as independence, ignoring that a **same-model** maker+judge carries self-preference bias; no order/length debiasing.

## When To Use
- Judging whether a loop (already built or proposed) is good enough, or what it is missing.
- Designing a new loop (verification / review / maker-checker / iterative refinement).
- Auditing or comparing loop designs.

## When Not To Use
- Tasks with no "check-and-fix iteration" structure; one-shot scripts; plain Q&A.
- Executing an existing concrete loop — run that loop itself. This is the *meta* layer.

## Mode A — evaluate a loop (10-dimension rubric)

Score each **pass / partial / gap**. **Dimensions 2, 6, 8, 9 are the four blind spots — scrutinize them hardest.** Full criteria (what-good-looks-like / failure-if-missing / basis) and a worked example are in [references/rubric.md](references/rubric.md).

| # | Dimension | One line: what "good" looks like |
|---|---|---|
| 1 | Setpoint / definition-of-done | Stop target is a **severity floor**, not "until clean" (which never converges); an oracle (executable test for code, decomposed rubric for text) exists *before/independent of* the artifact; passing it is necessary-not-sufficient |
| 2 | Checker independence + judge debiasing | **(A)** fresh context + adversarial prompt + does not continue the maker's reasoning chain [binary]; **(B)** order-swap / length-neutralized / cross-model or panel [graded, high-stakes only] |
| 3 | Bounded iteration + defined exit | Small hard cap; the last round's fix is final; on exhaustion **escalate to a human**, never "ship anyway" |
| 4 | Severity-graded gating | Per-finding, step-level grades; only a blocking band iterates; each finding gets an explicit disposition; no silent drops |
| 5 | Divergence / regression escalation | Escalate a finding whose signature repeats an *unresolved* prior one; **also track resolved signatures**, so a re-appearing (regressed / whack-a-mole) finding is flagged |
| 6 | Cross-run memory | In-run (unresolved signatures + closing memo) **+** cross-run (a catch-rate log feeding a **kill criterion**); ratchet recurring findings into permanent checks where possible |
| 7 | Separation from declaring "done" (ceiling) | Name the authority ceiling (e.g. quality-only: never declares done, never merges); "loop passed" ≠ "work complete"; **fail-open, not fail-through** |
| 8 | Trigger reliability | Anchor the trigger to a **detectable hard action** at the completion milestone (e.g. a pre-commit / pre-PR hook) + a conscious acknowledgement; audit skip-rate; name un-hookable milestones honestly |
| 9 | Cost / latency ceiling | Each round lighter than the closing gate; set an **explicit per-run budget cap / circuit breaker** (not just logging); justify each extra round/critic against a cheaper alternative |
| 10 | Observability / auditability | A structured closing memo + an append-only log; critiques are challengeable, rubric-grounded arguments — not black-box scores; surface residual risk up front |

## Mode B — build a loop (9 steps)

Full detail — including the canonical **control skeleton** (the mechanical spine + output schema that pin down the points prose leaves ambiguous) — plus methodology basis and open design questions, in [references/building-a-loop.md](references/building-a-loop.md).

1. **Name the one core artifact + its oracle, first.** Code → executable oracle; write the failing test first (TDD). Text (doc/plan) → a decomposed rubric authored *before/independent of* the artifact (passing it = necessary-not-sufficient). Don't refuse to build a loop just because there's no *executable* oracle — a fixed rubric is a valid, weaker oracle.
2. **Choose the maker/checker structure and enforce independence.** Default to a separated evaluator-optimizer; run the checker in fresh context with an adversarial prompt; judge against an *independently-generated* reference where ground truth exists; escalate to cross-model / a small panel only for high-stakes cases; bake in order/length debiasing.
3. **Set the setpoint and severity gating.** Done = a severity floor, not "until clean"; bind severities to a shared scale; decide the blocking band vs. the carry-list; force a per-finding disposition with no silent drops.
4. **Set iteration bounds + divergence/regression escalation.** Small hard cap; last round's fix is final; escalate stuck (repeating-unresolved-signature) findings *and* regressions (re-appearing resolved signatures) without voiding the round's other fixes.
5. **Choose the trigger and make it reliable.** Anchor to a hard action at the completion milestone + a conscious ack; name un-hookable milestones and cover them with prose + a skip-rate audit. *A loop that doesn't fire is worthless.*
6. **Decide memory: in-run vs cross-run.** In-run working memory; a cross-run catch-rate log feeding a kill criterion; record explicitly whether you also want Reflexion-style cross-artifact learning (most loops deliberately don't).
7. **Set the authority ceiling.** Default: quality-only — never declares done, never merges, always hands off; completion is a *separate* gate; fail-open, not fail-through.
8. **Set the cost ceiling and cadence.** Per round, run only targeted checks; reserve the heavy matrix for the close; **set a per-run budget cap**; justify extra rounds/critics against cheaper alternatives. Too-expensive loops get skipped — defeating step 5.
9. **Decide how the loop verifies itself.** Define the closing-memo schema + log line; dogfood it on its own design first; record what you deliberately *won't* machine-check; wire in the kill criterion from day one (with a minimum sample size before any keep/cut decision).

## Common mistakes
- Treating "all machine checks green" or "I dispatched a sub-agent" as "independently reviewed" — same-model self-preference remains (blind spot 4 → dimension 2).
- Designing the loop but never ensuring it gets triggered (blind spot 1 → dimension 8) — most common, highest cost.
- Setting the exit as "until clean" — it never converges (dim 1).
- No-progress detection that only catches "still failing," missing A→B→A regression (dim 5).
- Logging cost but capping nothing → the loop becomes too expensive and is quietly switched off (dim 9).

## Non-goals
- Not a substitute for executing any concrete loop — this is the meta layer.
- Not a CI / cron / hook implementation.
- The rubric is judgment scaffolding, not an automated gate: pass / partial / gap is a human call.
