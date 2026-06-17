# Meta-Loop — Evaluation Rubric (Mode A)

Score each dimension **pass / partial / gap**. Dimensions **2, 6, 8, 9** are the four blind spots most often missed — scrutinize them hardest. Each dimension below: **Asks · Good looks like · Failure if missing · Basis.**

> Methodology numbers below are point estimates from each cited paper's specific setup — treat them as qualitative ("on the order of"), not hard facts.

## 1. Setpoint / definition-of-done
- **Asks:** Is there a crisp external stop target (a severity floor, not "until clean")? Is the check the loop points at a faithful, decomposed proxy for intent rather than one holistic judgment?
- **Good looks like:** Two things are pinned — (a) a gating threshold in a shared severity vocabulary (e.g. "no blocking findings at or above level X"), and (b) a per-artifact oracle authored *before or independent of* the artifact: an executable test for code, a decomposed rubric for text. Passing is treated as necessary-but-not-sufficient.
- **Failure if missing:** "Until clean" never terminates (a reviewer can always raise one more nit); a single holistic score gets gamed by verbosity/format. The loop optimizes to a weak oracle (Goodhart) and converges on a passing-but-low-quality artifact.
- **Basis:** TDD authors the failing test (the oracle) before the code (Beck, "write new code only once you have a failing test"); tests-as-spec are inherently incomplete and overfit-prone, so passing is necessary-not-sufficient (test-adequacy / mutation-testing literature). G-Eval shows decomposed per-criterion rubrics beat holistic scores.

## 2. Checker independence + judge debiasing  *(blind spot)*
- **Asks:** Is the checker decoupled from the maker, and are the known LLM-judge biases (self-preference, position, verbosity) actively controlled?
- **Good looks like:** Split into two testable sub-criteria. **(A) Context independence** [binary]: the reviewer runs in fresh/isolated context with an adversarial prompt ("assume there is a problem, find it") and does **not** continue the maker's reasoning chain. **(B) Bias hardening** [graded, required only above a stated stakes threshold]: judge against an *independently-generated* reference where ground truth exists; run pairwise comparisons in both orders (demote order-inconsistency to a tie); neutralize length; for high-stakes calls use a different model family or a small panel. The design names residual same-model rubber-stamp risk and audits catch-rate to detect it.
- **Failure if missing:** A same-model maker+judge inflates "pass" (self-preference on the order of +10–25% in reported setups; self-recognition and self-preference are linked and grow as the judge gets stronger). The loop converges while quality stagnates (a single model often cannot see its own reasoning errors). Pairwise verdicts flip on order alone a large fraction of the time. The loop becomes reviewer theater.
- **Basis:** Zheng et al. 2023 (MT-Bench: self-enhancement, position ~65% consistency, verbosity bias; reference-guided judging cuts mis-rate ~70%→15%); Panickssery et al. 2024 (self-recognition → self-preference); Huang et al. 2023 ("LLMs Cannot Self-Correct Reasoning Yet"); Chain-of-Verification (independent verification questions); panel-of-LLM-judges (cheaper, less intra-model bias).

## 3. Bounded iteration + defined exit
- **Asks:** Is there a hard round ceiling, and on exhaustion a non-silent exit (escalate / hand off), never "ship anyway"?
- **Good looks like:** A small fixed ceiling (e.g. max 3 rounds; the last round's fix is the final action, no extra round), chosen because gains are non-monotonic and over-revision trades quality elsewhere. On exhaustion the loop stops and escalates the fixed-result-plus-residual to a human; it never silently declares success.
- **Failure if missing:** Unbounded refinement burns budget past the quality peak, compounds errors over long autonomous chains, or spins forever because the checker keeps finding nits. Cost balloons and the loop gets switched off.
- **Basis:** Self-Refine caps iterations and warns gains are non-monotonic; Constitutional AI shows an over-revision trade-off (more revision helps one axis, costs another); Anthropic ("Building Effective Agents") warns of compounding errors and multiplicative cost in long loops.

## 4. Severity-graded gating
- **Asks:** Does the checker emit per-finding, step-level, severity-graded findings (not one coarse pass/fail), and does only a defined blocking band drive iteration while the rest is carried non-blocking?
- **Good looks like:** Findings are graded in a vocabulary shared with downstream gates; only the blocking band iterates; the rest travels with the artifact as a non-blocking list. Each blocking finding gets a maker disposition (reproduce→fix / evidence-backed false-positive rejection / can't-tell→default-blocking) with no silent drops. Critique targets intermediate steps/sub-claims, not just the final artifact.
- **Failure if missing:** A binary end-of-artifact verdict hides *where* it failed and forces all-or-nothing rework; ungraded findings either over-block (every nit halts) or under-block (real defects wave through); silent drops re-introduce defects.
- **Basis:** Lightman et al. 2023 — process (step-level) supervision beats outcome supervision (e.g. ~78% on MATH); G-Eval's per-criterion form-filling; the distinct skip/inconclusive verdict in bisection-style search.

## 5. Divergence / regression escalation
- **Asks:** Can the loop tell it is stuck on the same unfixable defect (vs. progressing), *and* catch a previously-fixed finding re-appearing (regression / whack-a-mole), without voiding the round's other fixes?
- **Good looks like:** From round 2 on, each blocking finding carries a signature; if it matches an *unresolved* prior-round signature (fixed but still hit), escalate that stuck item while the round's other fixes stand. **Additionally track the union of prior *resolved* signatures**, and flag/escalate when a current finding matches one (a regression a plain repeat-detector misses, since round N fixing A and re-breaking B looks like progress). Signatures are objective where possible (same failing test/lint id), heuristic for text.
- **Failure if missing:** The loop silently spends its whole budget on one defect it cannot fix (local-minimum trap), or oscillates A→B→A under the radar, looking busy while converging on nothing.
- **Basis:** Reflexion's local-minimum warning; bisection's explicit untestable/skip verdict to keep a search from corrupting; the compounding-error/regression warnings in long agent loops.

## 6. Cross-run memory  *(blind spot)*
- **Asks:** Does the loop persist what it learns — both in-run working memory and cross-run organizational learning (catch-rate / kill data) — rather than starting cold every time?
- **Good looks like:** Two distinct memories. (a) **In-run** — prior-round unresolved signatures + a closing memo with evidence-backed rejections, used for no-progress detection within the run. (b) **Cross-run** — an append-only catch-rate log (findings the cheaper machine layer missed, rounds, token cost) feeding a **kill criterion** (if catch-rate ≈ 0 over enough runs, cut or narrow the loop). Where feasible, ratchet recurring findings into durable checks so resolved issues become permanent invariants.
- **Failure if missing:** Each run repeats the same class of error, and no one can tell whether the loop earns its cost (catch-rate ≈ 0 ⇒ pure overhead). Lessons evaporate; previously-fixed issues silently regress because no durable guard was added.
- **Basis:** Reflexion persists reflections as a bounded episodic memory (capacity-limited, not a sliding window) reused across attempts; regression tests as permanent guards (the ratchet pattern). Note: catch-rate logging is *organizational* accountability, not in-loop cross-artifact memory — record which one you mean.

## 7. Separation from declaring "done" (ceiling)
- **Asks:** Is the loop's authority ceiling explicit — does it only raise draft quality and hand off, or is it (deliberately, with controls) allowed to declare done / merge?
- **Good looks like:** The autonomy ceiling is named (e.g. *quality-only*: raises draft quality, never declares done, never merges, always hands to a human/CI; higher rungs deferred to explicit future decisions). "Loop passed" is never treated as "work complete"; completion is a separate, co-equal gate. The loop **fails open** (degrades to a slightly-weaker draft) rather than **failing through** (letting an error ship as "done").
- **Failure if missing:** A loop that self-certifies "done" or self-merges removes the human/CI accountability check; a passing internal loop gets mistaken for completion and ships unverified work (autonomy overreach).
- **Basis:** Anthropic's autonomy/cost trade-off and "take ground truth from the environment at each step"; the fail-open-not-fail-through posture for safety-relevant gates.

## 8. Trigger reliability  *(blind spot — #1)*
- **Asks:** Is the loop actually invoked at the completion milestone *every time* — and is trigger reliability treated as a measured, first-class axis rather than assumed from a prose pointer?
- **Good looks like:** The trigger is anchored to a **detectable hard action** at the milestone (e.g. a pre-commit or pre-PR hook) that re-fires the reflex and forces a conscious acknowledgement, because prose-only pointers demonstrably fail. Skip-rate is audited over real sessions; milestones with no hookable hard action are named honestly and covered with prose; the ack path is monitored so it doesn't degrade into a reflexive bypass.
- **Failure if missing:** The loop exists but is silently skipped at the moment it matters. A prose "remember to run X before finishing" pointer can be skipped even while it is technically in front of the agent, because the agent's skill-check reflex anchors on the incoming user message while the completion milestone is dozens of tool-calls away — so trigger reliability has to be *measured* (skip-rate audited), not assumed from the pointer's presence. A perfectly-designed loop that does not run is zero value.
- **Basis:** A design-time reliability argument rather than a sourced metric — a prose pointer can be in front of the agent yet skipped, because the skill-check reflex anchors on "received a message," not "about to finish." Hence the structural fix (a hard-action hook + an explicit acknowledgement token) and an *audited* skip-rate rather than an assumed one; some milestones (a prose "done" summary, post-push verbal completion) have no hookable action, so per-project skip-rate stays an open empirical question.

## 9. Cost / latency ceiling  *(blind spot)*
- **Asks:** Is each round cheap enough to run *every* time (lighter than the closing gate), and is added agent/round cost justified against a cheaper alternative?
- **Good looks like:** Per-round verification is targeted (reproduce the failure, the affected unit tests, minimal lint/typecheck), with the full heavy matrix reserved for the close. Each added round or critic is justified against a cheaper single-pass or best-of-N alternative; debate/large panels are reserved for high-stakes, hard-to-judge cases. **A per-run token/cost ceiling and circuit breaker are set — not merely logged.**
- **Failure if missing:** A loop that re-runs the full heavy gate every round (or spins up many debating agents) becomes too slow/expensive and gets habitually skipped — **defeating dimension 8**. At equal budget, debate often loses to cheaper self-correction.
- **Basis:** CI's "keep the build fast" rule; Anthropic's cost axiom (latency/$ per round); Self-Consistency / best-of-N as cheaper alternatives; budget-matched studies where multi-agent debate underperforms cheaper self-correction (Wang et al. EMNLP 2024).

## 10. Observability / auditability
- **Asks:** Does each run leave a reproducible, inspectable record — what the reviewer found, what was fixed, what was rejected (with evidence), what was escalated — so a human can adjudicate and the loop's value can be measured over time?
- **Good looks like:** A structured closing memo per run (core output, blocking fixes, evidence-backed rejected false-positives, escalations, non-blocking list, residual risk, rounds/convergence) handed to the human, plus an append-only log capturing catch-rate and cost. Findings/verdicts are auditable (rubric-grounded critiques, not opaque scores); residual/unverified parts are surfaced prominently to pin human attention on the judgment layer.
- **Failure if missing:** Without a record you cannot tell whether the loop caught anything, cannot adjudicate rejected findings, and cannot decide to kill/keep it; over-trust sets in and humans stop scrutinizing. Bare-score critiques cannot be challenged.
- **Basis:** Process-supervision's auditable step labels; G-Eval's auditable per-criterion reasoning; Constitutional AI's principle-grounded (auditable) critiques.

---

## Worked example: scoring a typical agent self-review loop

A common pattern, scored here to show how to apply the rubric. **The loop under review:** *Before an agent declares a code change done, it dispatches a reviewer sub-agent (same model, fresh context, adversarial prompt, a per-artifact checklist) that emits severity-graded findings; the agent fixes the blocking ones; from round 2 it escalates a finding whose signature repeats an unresolved prior one; max 3 rounds; it writes a closing memo and appends a catch-rate line to a log; it never merges. The reviewer runs on the **same model** as the maker, with no order/length debiasing. It logs token cost per run but has **no budget cap**. It is invoked by a line in the project's agent-instructions file telling the agent to "run a self-review before finishing."*

| # | Dimension | Verdict | Why |
|---|---|---|---|
| 1 | Setpoint | pass (with caveat) | Stops at a severity floor, not "until clean" — good. Caveat: the per-artifact checklist is the oracle but its quality isn't guaranteed by the loop; for code it can lean on an executable oracle (tests), which is stronger. |
| 2 | Checker independence + debiasing | **partial** | Strong context-independence (fresh context + adversarial prompt). But **same-model** maker+judge with no order/length debiasing and no cross-model/panel — self-preference unmitigated. Sub-criterion A passes, B fails. |
| 3 | Bounded iteration | pass | Hard 3-round cap; exhaustion hands to a human; no silent ship. |
| 4 | Severity gating | pass | Per-finding grades; only the blocking band iterates; explicit dispositions. |
| 5 | Divergence / regression | **partial** | Repeat-unresolved-signature escalation exists. But **no resolved-signature tracking** → an A→B→A regression isn't flagged. Half the dimension missing. |
| 6 | Cross-run memory | **partial** | Has in-run memory + a catch-rate log, but the log isn't wired to a kill criterion and there's no cross-artifact (Reflexion-style) learning or ratcheting into permanent checks. |
| 7 | Ceiling | pass | Never merges, never self-declares done — explicit quality-only ceiling. |
| 8 | Trigger reliability | **gap** | Invocation is a prose pointer in an instructions file, anchored to a fuzzy "before finishing" moment, with no hard-action hook, no ack, no skip-rate audit. Silently skippable → the worst dimension. |
| 9 | Cost ceiling | **gap** | Logs cost but caps nothing. Combined with dim 8, this is the dangerous pairing: an uncapped, possibly-expensive loop with a soft trigger trains the agent that skipping is cheap. |
| 10 | Observability | pass | Structured memo + append-only catch-rate log; rubric-grounded findings. |

**Most important gaps:** fix the **trigger** (dim 8) and add a **cost cap** (dim 9) first — they gate everything; then add **judge debiasing** (dim 2) for high-stakes artifacts; then close the **regression + kill-criterion** loop (dims 5, 6). The internals (bounded, ceiling, audit trail) are already solid — the loop's weaknesses are at its outer edges and at the judge.
