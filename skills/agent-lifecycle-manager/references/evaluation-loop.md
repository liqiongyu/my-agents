# Evaluation Loop

Use this reference when the lifecycle route includes `Evaluate` or `Optimize Invocation`. The goal is to test whether the target agent actually helps on realistic work, not merely whether its files pass validation.

This skill reuses the eval harness shipped with `skill-lifecycle-manager`. For the command examples below, set:

- `SLM_DIR=skills/skill-lifecycle-manager`
- `ALM_EVAL_FILE=skills/agent-lifecycle-manager/eval/eval-cases.json`

## Core Principles

1. Test the agent on realistic requests, not toy prompts.
2. Compare against a baseline only when the comparison answers a real question.
3. Separate contract quality from trigger quality.
4. Keep evidence durable in the active change's `evidence.md` or another explicit artifact.
5. Match the prompt mix to the chosen invocation posture.
6. Protect the worktree when the evaluated surface can edit files or request approvals.

## Prompt Types

Use a small but representative set:

- `should-handle`: a normal request the agent should own
- `should-stretch`: a harder but still in-scope request
- `should-not-handle`: adjacent work the agent should avoid
- `near-miss`: a borderline request that tests boundary clarity

Adjust the mix based on posture:

- `manual-first`: overweight `should-not-handle` and `near-miss`
- `hybrid`: balanced mix
- `auto-first`: overweight in-scope variety while keeping negative controls

## What To Judge

For each run, look beyond basic correctness:

- Did the agent route the right lifecycle stage?
- Did it choose a sensible archetype, tool budget, and dependency graph?
- Did it keep `agent.json`, `claude-code.md`, and `codex.toml` aligned in intent?
- Did Codex runtime defaults such as `sandbox_mode`, `model_reasoning_effort`, and `web_search` reinforce the intended contract?
- Did it avoid unnecessary lifecycle stages?
- If this is a revision, is the new version materially better?

## Suggested Flow

1. Define the question:
   - Is the new agent useful at all?
   - Is the revised version better than before?
   - Is the trigger boundary too broad or too narrow?
2. Draft 3-5 realistic prompts.
3. Seed a reusable workspace when the pass should leave reviewable artifacts:

```bash
uv run python "$SLM_DIR/scripts/seed_eval_workspace.py" \
  agent-lifecycle-manager \
  --eval-file "$ALM_EVAL_FILE"
```

This creates:

```text
workspaces/agent-lifecycle-manager/iteration-<N>/
  manifest.json
  evals/
    <eval-id>/
      with-skill/run-template.json
      baseline/run-template.json
```

4. Run the prompts in an environment where the agent or authored package is available. For direct surface evaluation, prefer the installed CLIs over a custom API harness:

```bash
uv run python "$SLM_DIR/scripts/run_surface_eval.py" \
  codex \
  agent-lifecycle-manager \
  --eval-file "$ALM_EVAL_FILE" \
  --case eval-3 \
  --workdir .
```

When the comparison matters, run the matching baseline beside it:

```bash
uv run python "$SLM_DIR/scripts/run_surface_eval.py" \
  codex \
  agent-lifecycle-manager \
  --eval-file "$ALM_EVAL_FILE" \
  --case eval-3 \
  --stage baseline \
  --workdir .
```

Before and after runs on write-capable or approval-seeking surfaces, capture the worktree state:

```bash
git status --short
```

If the run makes an unintended edit, revert it before scoring the benchmark and record the incident in `evidence.md`. Prefer a disposable worktree or branch when the surface is likely to write.

5. Capture:
   - the prompt
   - the response or artifact
   - what succeeded
   - what failed
6. Classify failures:
   - trigger failure
   - contract design failure
   - surface alignment failure
   - runtime-control design failure
   - dependency-graph failure
   - validation or install gap
7. Edit the smallest thing that explains the failure.

## What The Harness Records

The current runner records:

- `response.md`
- `stdout.log`
- `stderr.log`
- `result.json` with start time, finish time, exit code, baseline mode, and file paths

That is enough for qualitative comparison plus a lightweight speed proxy from timestamps. The runner does not currently emit token counts, and it does not itself prevent file edits made by the evaluated surface. If a surface exposes token data elsewhere, capture that separately instead of inventing fake metrics.

## Benchmark Pattern For This Skill

For `agent-lifecycle-manager` itself, a good first benchmark pair is:

- `eval-3` for library audit quality
- `eval-4` for Codex runtime-default standardization

Compare `with-skill` versus `baseline` on:

- route selection quality
- whether the response preserves one agent contract across `agent.json`, `claude-code.md`, and `codex.toml`
- whether the response notices runtime-control drift when relevant
- duration from `startedAt` to `finishedAt`
- response usefulness and next-step clarity

After one or more runs, render the review panel:

```bash
uv run python "$SLM_DIR/scripts/render_review_panel.py" \
  workspaces/agent-lifecycle-manager/iteration-1
```

## Trigger-Only Passes

When the main body is acceptable but routing is weak:

- leave the body mostly unchanged
- refine the short descriptions
- rerun `should-trigger`, `should-not-trigger`, and `near-miss` prompts

Do not optimize for recall blindly. Optimize for the chosen posture.
