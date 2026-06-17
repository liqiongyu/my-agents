# Meta-Loop — Build Guide (Mode B)

Nine steps to design a new loop from scratch, plus the methodology it rests on and the open design questions worth deciding deliberately. Each step maps to a rubric dimension in [rubric.md](rubric.md).

## The 9 steps

1. **Name the one core artifact and its oracle, before anything else.** Write one sentence: "after this loop runs, the user can really do X with this artifact." Then pick the artifact type and identify its **oracle** — the check that decides whether X holds. **Two branches:** (a) **code** → an executable/ground-truth oracle (tests pass, it compiles, a tool returns success); write the failing test *first* (TDD). (b) **text** (a doc, plan, spec) → a decomposed rubric (e.g. an existing review checklist) whose criteria are fixed *before* the artifact is judged; passing it is necessary-not-sufficient and weaker than an executable oracle. The oracle must exist before or independent of the artifact. Don't refuse to build a loop just because no *executable* oracle exists — a fixed rubric is a valid, weaker oracle; the evaluator-optimizer precondition is only that clear evaluation criteria exist *and* feedback demonstrably improves the output.

2. **Choose the maker/checker structure and enforce independence.** Default to a separated evaluator-optimizer (maker generates, an independent checker critiques) over maker-as-its-own-judge — a single model often can't see its own errors. Run the checker in fresh/isolated context with an adversarial prompt ("assume there is a problem, find it") and the ready-made rubric; do **not** let it continue the maker's reasoning chain. Where ground truth exists, judge against an *independently-generated* reference. For high-stakes/hard-to-judge artifacts escalate independence to a different model family or a small panel rather than spinning up expensive debate. Bake in bias controls now: order-swap pairwise judgments (demote inconsistency to a tie), neutralize length, reuse a tracked reviewer rather than inventing a new role each time.

3. **Set the setpoint and severity gating.** Define done as a **severity floor**, not "until clean" (which is unbounded). Bind the severity vocabulary to an existing shared scale instead of inventing one. Decide which band blocks and which is a non-blocking carry-list. Require the checker to emit per-finding, step-level grades (process > outcome supervision), and force a per-finding disposition — reproduce→fix / evidence-backed false-positive rejection / can't-tell→default-blocking — with **no silent drops**.

4. **Set iteration bounds and divergence/regression escalation.** Pick a small hard round ceiling (3 is a defensible default; gains are non-monotonic past a few rounds). The exact control flow — last round's fix is final, cap-reached escalates (never ships), and how stuck-vs-regression are handled — is pinned in the skeleton in *The mechanical contract* below; the judgment this step leaves to you is choosing the **signature**. Give each blocking finding a signature (objective for code = the failing test/lint id; heuristic for text = the repeated rubric dimension). Escalate a *stuck* finding (signature repeats an **unresolved** prior one) and a *regression* (signature repeats a **resolved** one — the A→B→A case a plain still-failing check misses); both escalate **without voiding the round's other fixes**, and neither, by itself, halts the loop.

5. **Choose the trigger and make it reliable.** Treat trigger reliability as first-class — a loop that doesn't run is worthless, and prose-only "remember to run X" pointers are skipped surprisingly often. Anchor the trigger to a **detectable hard action** at the completion milestone (e.g. a pre-commit or pre-PR hook) that re-fires the reflex and forces a conscious acknowledgement. Name honestly which milestones have *no* hookable hard action (a prose "done" summary; post-push verbal completion), cover them with prose, and plan a skip-rate audit to catch silent skips and ack-degeneration.

6. **Decide memory: in-run vs cross-run.** In-run: persist prior-round unresolved signatures (for no-progress) and a closing memo with evidence-backed rejections — working memory only. Cross-run: an append-only catch-rate log (findings the cheaper layer missed, rounds, cost) as a **kill criterion** (if catch-rate ≈ 0 over enough runs, cut or narrow the loop). Where feasible, ratchet recurring findings into durable checks. Decide *explicitly* whether you also want Reflexion-style cross-artifact learning (lessons from one run conditioning the next) — most loops don't; record that as a deliberate choice, not an oversight.

7. **Set the authority ceiling.** Name the autonomy rung explicitly. Default to *quality-only*: the loop raises draft quality, never declares done, never merges, always hands off to a human/CI; it fails open (a weaker draft) rather than failing through (shipping an error as "done"). Make completion a **separate, co-equal** gate from "loop passed." Defer higher rungs (loop opens a PR; auto-merge for sufficiently machine-checked classes) to an explicit future decision with their own controls.

8. **Set the cost ceiling and verification cadence.** Keep each round cheaper than the closing gate: per round run only targeted checks (reproduce the failure, affected unit tests, minimal lint/typecheck); reserve the full heavy matrix for the close. Log per-round cost **and set an explicit per-run budget cap / circuit breaker** — logging alone doesn't stop a loop from getting skipped for being slow. Justify every added round or critic against a cheaper alternative (a single strong critic or best-of-N often beats debate at equal budget). A loop too expensive to run every time will be skipped — defeating step 5.

9. **Decide how the loop verifies itself (observability + dogfood).** Specify the closing record and the cross-run log line — the exact fields are in *The mechanical contract* below. **Dogfood:** the first artifact the loop reviews should be the loop's own design. Decide what you intentionally will **not** machine-check (e.g. "did the loop actually run" is often unreliable to machine-check — replace it with catch-rate auditing + human adjudication) and record that as a conscious limit. Wire in the kill criterion from day one, with an honesty rule: a pre-committed minimum sample size and a catch-rate floor before any keep/cut/narrow decision, and code-class evidence merged into the denominator so the metric isn't computed on a biased subsample.

## The mechanical contract — skeleton + output schema

The 9 steps carry the *judgment*; the control-flow and the output are where two competent designers reading the same prose drift apart (e.g. "is the last round's fix re-checked?", "does a regression halt the loop?"). Pin them with one canonical shape. Treat the block as a **judgment scaffold, not runnable code** — fill in `BLOCKING_BAND`, `sig()`, and the per-artifact checks.

```
# OUTSIDE the loop body — the parts most often missed; none is a step inside a round:
#   trigger          : a detectable hard action fires this loop      — dim 8; never fires ⇒ everything below scores 0
#   cost-governor    : a per-run budget cap, set ONCE before round 1 — dim 9; too-expensive ⇒ skipped ⇒ trigger defeated
#   completion-gate  : a SEPARATE human/CI gate AFTER the loop       — dim 7; "loop passed" ≠ "done"; fail-open

loop(artifact, oracle, max_rounds = 3):            # judgment scaffold — NOT runnable code
    resolved   = {}     # sigs confirmed fixed (attempted, then absent from a later check) → regression set (cumulative)
    unresolved = {}     # sigs attempted but still appearing                               → stuck set (cumulative)
    attempted  = {}     # sigs fixed in the PREVIOUS round, awaiting this round's check to confirm
    fixed_any  = false
    for round in 1..max_rounds:
        if over_budget(): break                                       # cost-governor aborts — dim 9
        findings = check(artifact, fresh_ctx, adversarial, rubric)    # the ONLY verification; independence is a QUALITY of check() — dim 2
        blocking = [f in findings if f.severity in BLOCKING_BAND]     # only the blocking band iterates — dim 4
        resolved   = resolved + (attempted - sig(blocking))           # attempted last round, now absent ⇒ confirmed fixed — dim 6
        unresolved = unresolved + (attempted - resolved)              # attempted last round, still present ⇒ stuck candidate
        if blocking is empty:
            return PASS(record)      # converged on a clean check that just verified the prior round's fix — dim 1
        for f in blocking:           # escalate, but NEVER void the round's other fixes; neither kind halts the loop — dim 5
            if   sig(f) in resolved:   escalate(REGRESSION, f)   # reappeared after a confirmed fix (A→B→A)
            elif sig(f) in unresolved: escalate(STUCK, f)        # attempted in a prior round, still open
        fixable = [f in blocking if not escalated(f)]
        if fixable is non-empty: fix(fixable); fixed_any = true   # this round's fix is FINAL — no fresh review round runs after it — dim 3
        attempted = sig(fixable)                                  # to be confirmed (or not) by the NEXT round's check
    # fell out of the loop ⇒ cap reached or budget abort, NOT converged:
    if fixed_any: confirm(last_fix_repros)   # the last fix had no next-round check ⇒ targeted re-run of its own repros; anything it raises travels in residual
    escalate_to_human(residual)   # status = HALTED(escalated) if open stuck/regression OR the last fix's confirm failed; else HALTED(cap|budget); NEVER ship-anyway, NEVER auto-PASS — dim 7
```

**The two points prose leaves ambiguous, pinned here:** (1) every fix is re-verified by the *next* round's full check, so a `PASS` always rests on a clean check — but the *last* fix before a cap has no next round, so the close runs only a targeted confirmation of that fix's own repros and the run still hands off (**a cap never auto-`PASS`es**). (2) a regression escalates *and continues* exactly like a stuck finding — different detection set, same control: it never voids the round's other fixes and never, by itself, halts the loop.

### Output schema

```
closing_record:
  status        : PASS | HALTED(escalated) | HALTED(cap) | HALTED(budget) | DEGRADED(loop-crashed → human)
                  #   HALTED(escalated) = exited with open STUCK/REGRESSION items → a human is needed NOW;
                  #   keep distinct from HALTED(cap) = ran out of rounds while still converging — dim 5/10
  core_output   : what the artifact now lets the user do
  rounds        : n run / which condition stopped it
  blocking_fixed: [ {signature, severity, repro_ref, round_found, round_fixed} ]
  rejected      : [ {signature, evidence} ]        # evidence-backed false positives — evidence mandatory
  escalated     : [ {signature, kind: STUCK|REGRESSION|CANT_TELL, rounds_seen} ]
  cant_tell     : blocking-by-default — neither repro nor rejection; surfaced for human judgment
  non_blocking  : [ carry-list ]                   # never iterated
  residual_risk : what the loop did NOT / could not check — stated up front
  cost          : {spent, cap, breaker_tripped}
  handoff       : to-human | to-ci                 # never "merged"/"done" — the ceiling, encoded in the data
  invariant     : status = PASS ⇒ escalated == [] AND cant_tell == []

log_line (append-only, one row per run — including skips):
  ts | run_id | artifact_ref | trigger(ran | skipped+reason) | status | rounds |
  blocking P0/P1/P2 | n_escalated(stuck+regression) | caught_beyond_machine | cost | breaker_tripped | ack_present
  # caught_beyond_machine = blocking findings the cheaper machine layer MISSED → the kill-criterion numerator.
  # kill criterion: over a pre-committed min sample (ALL runs in the denominator, no biased subset),
  #   caught_beyond_machine ≈ 0 ⇒ narrow, then cut.
```

## Methodology basis

The rubric and steps rest on (numbers are each paper's setup-specific point estimates — treat as qualitative):

- **TDD / tests-as-spec** — Kent Beck, *TDD By Example* (write the failing test first); tests are inherently incomplete and overfit-prone (test-adequacy / mutation-testing literature, not a single author), so passing is necessary-not-sufficient.
- **LLM iterative refinement** — Self-Refine (Madaan et al. 2023); Reflexion (Shinn et al. 2023, reflection as bounded episodic memory across attempts); Constitutional AI critique-revise (Bai et al. 2022); Self-Consistency (Wang et al. 2022); Chain-of-Verification (Dhuliawala et al. 2023); limits of single-model self-correction of reasoning (Huang et al. 2023, "LLMs Cannot Self-Correct Reasoning Yet").
- **Process vs outcome supervision** — "Let's Verify Step by Step" (Lightman et al. 2023): step-level supervision beats outcome-only.
- **LLM-as-judge / evaluation** — Zheng et al. 2023 (MT-Bench: position/verbosity/self-enhancement biases; reference-guided judging); Panickssery et al. 2024 (self-recognition → self-preference); G-Eval (decomposed, auditable scoring); panel-of-LLM-judges.
- **Agentic patterns** — Anthropic, *Building Effective Agents* (2024): the evaluator-optimizer pattern, "take ground truth from the environment at each step," the compounding-error and cost axioms; multi-agent debate (Du et al. 2023) and the budget-matched critique that often favors cheaper self-correction (Wang et al. EMNLP 2024).
- **Failure modes** — Goodhart's law (optimizing the proxy instead of the goal); CI's "keep the build fast."

## Open design questions

Decide these deliberately when building a new loop; they have no one right answer.

1. **Is same-model "fresh context + adversarial prompt" enough independence**, or does self-recognition→self-preference (which grows as the judge improves) eventually force a different model family or a panel for high-stakes artifacts? A catch-rate audit is the only empirical check that the reviewer isn't quietly degrading into a rubber stamp.
2. **Should the loop carry Reflexion-style cross-run learning** (lessons from one artifact conditioning the next), or is per-run working memory + an organizational catch-rate log the right ceiling? Can text artifacts be "ratcheted" into durable checks without ossifying into Goodhart targets?
3. **How is text-class no-progress detected reliably?** Code uses objective failing-test/lint signatures; text uses the heuristic "same rubric dimension repeats," which can miss a reworded-but-identical defect. Is there a robust text signature, or must text loops accept weaker divergence detection and lean on the round ceiling + human escalation?
4. **What triggers milestones with no hookable hard action** (a prose "done" summary, post-push verbal completion)? Options range from accepting fail-open coverage to inventing a synthetic hard action to gate on — each trades reliability against friction and the "advisory disguised as required" anti-pattern.
5. **Where is the principled stopping point on the autonomy ladder?** For which artifact classes does an executable/ground-truth oracle become strong enough to let the loop climb a rung (open a PR; auto-merge), and what evidence threshold (catch-rate, false-pass rate) licenses it?
6. **How do you keep the acknowledgement from becoming the new failure mode?** A bypass token can degrade into a reflexive prefix. Is skip-rate auditing + naming the rationalization enough, or does a soft-reminder loop inherently decay toward auto-bypass — implying the only durable fix is a harder gate (which punishes forgetting more than malice)?
7. **What is the kill threshold?** "Cut the loop if catch-rate ≈ 0" needs a pre-committed minimum sample size and a catch-rate floor before a keep/cut/narrow decision is statistically honest rather than anecdotal — and code-class evidence must be merged into the denominator so the metric isn't computed on a text-biased subsample.
