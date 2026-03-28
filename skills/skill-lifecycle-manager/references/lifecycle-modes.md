# Lifecycle Modes

Use this reference when the request spans multiple lifecycle stages, when you need to decide how deep to go, or when you need a stage-by-stage checklist without bloating the main `SKILL.md`.

## Two Axes

Skill lifecycle work has two separate axes:

1. **Lifecycle stage** — what kind of work is being done
2. **Execution depth** — how much rigor the current request needs

Do not confuse them. A request can be:

- **Discover + Quick**
- **Evaluate + Deep**
- **Audit + Standard**
- **Create/Update + Validate + Standard**

There is also one prerequisite design decision for authoring and trigger work:

3. **Invocation posture** — whether the target skill should be `manual-first`, `hybrid`, or `auto-first`

This is not a lifecycle stage and not an execution depth. It is a design constraint that should be settled before Create/Update or Optimize Trigger work begins. Read [invocation-posture.md](invocation-posture.md) when that decision is in play.

## Lifecycle Stage Checklist

| Stage | Run it when | Primary output | Common stop condition |
| --- | --- | --- | --- |
| Discover | Need comparison, official references, upstream patterns, or a research-first gate before broad new-skill authoring | source inventory / fusion notes / delegated research handoff | depth mode unresolved, candidate confirmation is pending, or bounded discovery is complete and no unresolved checkpoint still blocks authoring |
| Create / Update | Need a new skill or a substantial revision | updated skill package | package exists and reflects current intent |
| Validate | Need structural confidence before wider testing | pass/fail report | structure and metadata errors resolved |
| Evaluate | Need behavioral confidence | iteration artifacts / review notes | the skill is good enough or failure mode is understood |
| Optimize Trigger | Need better activation boundaries | revised description + trigger notes | description boundary is materially improved |
| Install / Publish | Need the skill activated or distributed | installed or packaged artifact | target surface is updated or a concrete blocker is documented |
| Audit / Governance | Need inventory health analysis | audit report | priority issues are ranked and actionable |

## Invocation Posture Gate

Before `Create / Update` or `Optimize Trigger`, answer this:

- Should the target skill mostly be called explicitly?
- Should it support a mix of explicit use and a few high-confidence automatic triggers?
- Should it be optimized for broad automatic activation?

Default answer:

- `manual-first`

Use `hybrid` or `auto-first` only when there is a clear reason to trade some precision for more automatic help.

## Execution Depth

### Quick

Use when:

- the request is narrow and low-risk
- only one stage is in play
- the user wants a fast directional answer

Behavior:

- do one pass only
- prefer inline notes over long artifacts
- skip baseline comparisons unless the user explicitly asks
- keep the output terse

### Standard

Use when:

- the request affects a real skill package
- the user wants a usable draft, not just advice
- two or more lifecycle stages are involved

Behavior:

- create or update the artifact when authoring is already in bounds
- validate it
- leave clear next steps if evaluation or installation is deferred
- use references and scripts where they pay for themselves

`Standard` does **not** override Discover-first routing. For a broad new skill, a Standard pass can still stop inside `Discover` if depth choice, candidate confirmation, or a research handoff is still outstanding.

### Deep

Use when:

- the skill is important, high-leverage, or high-risk
- the user explicitly wants thoroughness
- there is uncertainty about whether the new version is actually better

Behavior:

- compare against official references first
- use realistic eval prompts and, when appropriate, baselines
- split body quality, trigger quality, and install/publish concerns into separate passes
- produce a clear audit trail of what changed and why

## Stage Ordering

Use the smallest valid sequence:

| Situation | Sequence |
| --- | --- |
| New broad / reusable / overlap-prone skill | Discover -> candidate confirmation or fusion handoff -> Create/Update -> Validate |
| New narrow / local skill with a clear pattern already in hand | Create/Update -> Validate |
| Existing skill needs improvement | Create/Update -> Validate -> Evaluate |
| Trigger complaints only | Optimize Trigger -> Validate |
| Distribution request after draft exists | Validate -> Project/Install/Publish |
| Whole library drift review | Audit/Governance -> targeted Discover or Create/Update |
| Full rehabilitation of a weak skill | Discover -> Create/Update -> Validate -> Evaluate -> Optimize Trigger |
| Cross-platform release | Create/Update -> Validate -> Project/Install/Publish |

If `Discover` delegates to a specialist skill, do not move to `Create/Update` until that specialist skill's required checkpoints and handoff semantics have been satisfied.

## Discover-First Gate For New Skills

Before routing a **new** skill request straight to `Create/Update`, check for these signals:

- the target skill is broad, general-purpose, project-generic, domain-agnostic, or intended for wide reuse
- the user asks for comparison, best practices, external examples, or fusion
- local and ecosystem overlap risk is high enough that the design could change after research
- repo-local examples alone are not a sufficient design basis

If any are true, start with `Discover`.

If broad discovery is required and the user did not choose `Quick`, `Standard`, or `Deep`, stop and resolve the depth choice before searching.

Do not draft the target skill package while the request is still blocked on:

- unresolved discovery depth
- candidate inventory confirmation
- the separate research handoff or Fusion Report

## Discover And `skill-researcher`

`Discover` is the lifecycle stage. `skill-researcher` is the specialist workflow for deep external comparison.

Use `skill-researcher` when:

- you need ecosystem-wide comparison
- you need to inspect official/community sources in depth
- you need a fusion report before writing

Once you invoke `skill-researcher`, treat it as a binding workflow, not background inspiration:

- inherit its depth-mode gate when the user has not chosen Quick, Standard, or Deep yet
- inherit its candidate-confirmation gate before any collect/analyze/synthesize work begins
- do not resume `Create/Update` until the candidate set is confirmed and the research handoff is complete
- treat the resulting Fusion Report as a separate input to later authoring, not as silent permission to start drafting immediately

Do not invoke `skill-researcher` when:

- the user only wants a quick local update
- you already have the relevant source materials in hand
- the request is purely structural validation or local install/publish

## Evaluate And Anthropic Patterns

The evaluation stage should follow these ideas from Anthropic's skill-creator:

- realistic prompts instead of toy prompts
- optional baseline runs when comparison matters
- separate qualitative review from quantitative assertions
- iteration directories instead of one-off loose files
- distinct trigger optimization after behavior quality is established

Suggested workspace structure:

```text
workspaces/<skill-name>/
  iteration-1/
    evals/
      <eval-id>/
        with-skill/
        baseline/
  iteration-2/
    evals/
      <eval-id>/
        with-skill/
      baseline/
```

Use the scaffold helper when you want a repeatable starting point:

```bash
SLM_DIR=skills/skill-lifecycle-manager

uv run python "$SLM_DIR/scripts/seed_eval_workspace.py" \
  <skill-name> \
  --eval "label|prompt|success criteria"
```

## Projection And Platform Surfaces

Use projections when the same canonical skill should reach more than one platform surface.

- Read [platform-surfaces.md](platform-surfaces.md) to separate shared core from platform-only behavior.
- Read [projection-model.md](projection-model.md) for projection targets and commands.
- Keep installable packages self-contained: a skill may reference another skill conceptually, but it should not depend on another package's private script paths unless the distribution unit explicitly ships that shared runtime with it.
- Validate projections before claiming a skill is truly cross-platform.

## Exit Criteria

Before ending a lifecycle pass, confirm these questions:

- Did I run only the stages the user actually needed?
- Is the current artifact valid enough for the next stage?
- If Discover delegated to a specialist workflow, did I stop at its required checkpoint instead of jumping ahead?
- If the package will be installed elsewhere, does it stay self-contained after install instead of depending on another package's private script paths?
- Did I explicitly call out what is not yet proven?
- If work remains, is the next lifecycle step obvious?
