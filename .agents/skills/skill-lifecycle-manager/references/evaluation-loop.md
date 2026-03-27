# Evaluation Loop

Use this reference when the lifecycle route includes `Evaluate` or `Optimize Trigger`. The goal is to borrow the strongest ideas from Anthropic's `skill-creator` without turning this skill into a giant evaluator framework.

For command examples below, set `SLM_DIR` to the active copy of this skill:

- Canonical repo copy: `SLM_DIR=skills/skill-lifecycle-manager`
- Codex projection: `SLM_DIR=.agents/skills/skill-lifecycle-manager`
- Claude Code projection: `SLM_DIR=.claude/skills/skill-lifecycle-manager`

If you want to reuse the canonical eval fixtures, also set `SLM_EVAL_FILE` to a local/canonical path such as `skills/skill-lifecycle-manager/eval/eval-cases.json`. Projected surfaces intentionally exclude `eval/`, so projected copies need an external fixture path or inline `--eval` prompts.

## Core Principles

1. Test the skill on realistic user requests, not toy prompts.
2. Compare against a baseline only when the comparison will answer a real question.
3. Separate body quality from trigger quality.
4. Keep iteration artifacts grouped by pass so improvements stay reviewable.
5. Match the eval mix to the chosen invocation posture.

## Recommended Flow

### 1. Define the question

Be explicit about what you are trying to learn:

- What invocation posture should this skill have: `manual-first`, `hybrid`, or `auto-first`?
- Is the skill useful at all?
- Is the new version better than the old one?
- Is the description triggering correctly?
- Is the skill overfitting to one example?

### 2. Choose prompt types

Use a small but representative set:

- `should-help`: a normal task the skill should improve
- `should-stretch`: a harder but still in-scope task
- `should-not-trigger`: adjacent work the skill should avoid
- `near-miss`: a borderline request that tests boundary clarity

Adjust the mix based on posture:

- `manual-first`: bias heavily toward `should-not-trigger` and `near-miss`
- `hybrid`: keep a balanced mix
- `auto-first`: bias toward broader in-scope variety while still keeping negative controls

### 3. Seed the workspace

Use the helper script to create a clean iteration scaffold:

```bash
uv run python "$SLM_DIR/scripts/seed_eval_workspace.py" \
  skill-lifecycle-manager \
  --eval "draft-new-skill|Turn this workflow into a new repo skill|Creates a valid skill package with clear routing" \
  --eval "audit-library|Audit our skills for duplicates and stale metadata|Produces prioritized findings with concrete next steps"
```

This creates:

```text
workspaces/<skill-name>/iteration-<N>/
  manifest.json
  evals/
    <eval-id>/
      with-skill/run-template.json
      baseline/run-template.json
```

Use the `baseline` slot only when the comparison matters. The direct CLI runner now supports `--stage baseline` and, for project-local evals, temporarily hides the active surface projection while that stage runs so the baseline artifact is not just another labeled `with-skill` pass.

You can also seed directly from a structured eval suite:

```bash
uv run python "$SLM_DIR/scripts/seed_eval_workspace.py" \
  skill-lifecycle-manager \
  --eval-file "$SLM_EVAL_FILE"
```

If you want to keep adding more surface runs to the latest iteration instead of creating a fresh one, pass `--reuse-latest` to the seeder or let the direct CLI runner reuse the newest iteration automatically.

For direct surface validation, run the prompts through the installed CLIs instead of building a separate API harness:

```bash
uv run python "$SLM_DIR/scripts/run_surface_eval.py" \
  codex \
  skill-lifecycle-manager \
  --eval-file "$SLM_EVAL_FILE" \
  --case eval-3 \
  --workdir .
```

The direct CLI runner reuses the latest iteration for the skill by default. Add `--new-iteration` when you want a clean pass after editing the skill.

When you need the baseline artifact beside the `with-skill` artifact, run:

```bash
uv run python "$SLM_DIR/scripts/run_surface_eval.py" \
  codex \
  skill-lifecycle-manager \
  --eval-file "$SLM_EVAL_FILE" \
  --case eval-3 \
  --stage baseline \
  --workdir .
```

After you have one or more surface runs, render a lightweight browser review artifact:

```bash
uv run python "$SLM_DIR/scripts/render_review_panel.py" \
  workspaces/skill-lifecycle-manager/iteration-1
```

That creates `review/index.html` plus a blank `review-template.json` alongside it so you can inspect outputs in a browser, score assertions, take notes, and export a portable review file.

Validate the suite before seeding when you are editing the fixture itself:

```bash
uv run python "$SLM_DIR/scripts/validate_eval_suite.py" \
  "$SLM_EVAL_FILE"
```

### 4. Run with-skill and baseline passes

For each prompt:

- capture the prompt you actually used
- save the response or relevant artifact path
- summarize what succeeded
- summarize what failed

For direct CLI baseline runs, record whether the runner actually disabled a project-local projection or had to fall back to a pass-through baseline because no project-local copy existed. The baseline metadata is written into `result.json`.

Quantitative scoring is optional. Use it only when objective checks exist.

For `skill-lifecycle-manager` itself, prefer the cross-platform suite in `eval/` so the prompts also test projection behavior and target-surface reasoning.
When you specifically want to validate the new invocation-posture model without doing a full edit pass, prefer `eval/trigger-posture-cases.json`.
In that lighter suite, score overlap-check recommendations and bounded `hybrid` versus `auto-first` disagreements as reasoning questions, not automatic failures, when the case notes explicitly allow that flexibility.

### 5. Review by failure mode

Classify failures before editing:

- trigger failure
- missing step or weak routing
- reference missing or too hard to discover
- script gap
- evaluation artifact gap

Edit the smallest thing that explains the failure.

### 6. Separate trigger optimization

When the main body is acceptable but routing is weak:

- leave the body mostly unchanged
- refine the frontmatter description
- rerun `should-trigger`, `should-not-trigger`, and `near-miss` prompts

Do not mix a broad rewrite with a trigger-only experiment unless you have no better option.
Do not optimize for recall blindly; optimize for the chosen invocation posture.

## Exit Criteria

An evaluation pass is good enough to close when:

- the key prompts are materially better than before, or
- the remaining failures are understood and explicitly documented, or
- the user only asked for an initial draft and you have named the next pass clearly
