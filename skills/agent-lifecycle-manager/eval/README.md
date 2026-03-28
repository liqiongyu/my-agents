# Agent Lifecycle Manager — Eval Suite

## Overview

This directory contains the canonical evaluation fixture for `agent-lifecycle-manager`. It is designed to answer two different questions:

- does the skill route agent-lifecycle work correctly?
- does the skill materially improve outcomes compared with a `baseline` run when that comparison matters?

This README is for the canonical authoring package. For the commands below, set:

- `ALM_CANONICAL_DIR=skills/agent-lifecycle-manager`
- `ALM_EVAL_FILE=skills/agent-lifecycle-manager/eval/eval-cases.json`

Projected runtime copies intentionally exclude `eval/`, and Claude Code projections also exclude `skill.json` and `CHANGELOG.md`. If you intentionally run a projected copy's helper script, keep the script path separate and still point `--eval-file` at a canonical/local fixture.

The package boundary is intentional: this skill owns both the agent-specific cases and the local scripts it documents, so it remains self-contained after install.

## Fast Start

Seed a workspace:

```bash
uv run python "$ALM_CANONICAL_DIR/scripts/seed_eval_workspace.py" \
  agent-lifecycle-manager \
  --eval-file "$ALM_EVAL_FILE"
```

Run a `with-skill` pass on Codex:

```bash
uv run python "$ALM_CANONICAL_DIR/scripts/run_surface_eval.py" \
  codex \
  agent-lifecycle-manager \
  --eval-file "$ALM_EVAL_FILE" \
  --case eval-3 \
  --workdir .
```

Run the matching baseline:

```bash
uv run python "$ALM_CANONICAL_DIR/scripts/run_surface_eval.py" \
  codex \
  agent-lifecycle-manager \
  --eval-file "$ALM_EVAL_FILE" \
  --case eval-3 \
  --stage baseline \
  --workdir .
```

Render the review panel:

```bash
uv run python "$ALM_CANONICAL_DIR/scripts/render_review_panel.py" \
  workspaces/agent-lifecycle-manager/iteration-1
```

Before and after runs on a surface that can edit files or stop for approvals, inspect the worktree:

```bash
git status --short
```

If a benchmark run makes an unintended repo edit, revert it before scoring the run and note the incident in the active change evidence. Prefer a disposable worktree when that surface is likely to write.

## Recommended Benchmark Cases

- `eval-3`: best first benchmark for library audit and governance quality
- `eval-4`: best first benchmark for Codex runtime-default reasoning
- `eval-5`: best targeted check for delegated Discover research handoff quality
- `eval-6`: best targeted check for automated agent validation tooling usage
- `eval-7`: best targeted check for automated audit script integration

These two cases are the clearest places to compare `with-skill` against `baseline` because they test the exact behaviors this skill is meant to impose:

- route only the needed lifecycle stages
- preserve one contract across `agent.json`, `claude-code.md`, and `codex.toml`
- notice runtime-control drift when it matters
- end with a clear next step

`eval-5` is the best spot to check the newer Discover behavior:

- delegate to the right helper instead of improvising broad research inline
- keep the research handoff separate from authoring
- avoid drafting package files before the contract is grounded

## Failure Pattern Coverage

Use this as a quick map between the workflow risks in `SKILL.md` and the assertions or cases that guard them:

- Surface drift across `agent.json`, `claude-code.md`, and `codex.toml`: `surface_alignment_explicit` in `eval-1`, `eval-3`, and `eval-4`
- Choosing archetypes, tools, or sub-agents by vibes: `stage_routing_correct`, `runtime_controls_explicit`, and `research_handoff_explicit`, especially in `eval-1`, `eval-4`, and `eval-5`
- Letting Codex runtime defaults drift by inheritance: `runtime_controls_explicit` in `eval-1`, `eval-3`, and `eval-4`
- Merging trigger tuning and body edits into one rewrite: `trigger_work_separated` in `eval-2`
- Installing or publishing before structural validity: `validation_executed` across the authoring and audit cases
- Auditing only for broken files while missing overlap or overreach: `eval-3`
- Letting the meta-skill absorb ordinary non-agent work: `stage_routing_correct` across the suite, with strongest pressure from the Discover and trigger-tightening cases
- Relying on manual inspection instead of automated tooling: `automated_tooling_used` in `eval-6` and `eval-7`

## What To Compare

Use `result.json`, `response.md`, and the review notes to compare:

- exit code
- route quality
- finding quality
- next-step clarity
- duration from `startedAt` to `finishedAt`

The current runner does not emit token counts, and it does not sandbox away repo edits performed by the evaluated surface. If you need token-level cost data, capture it from the underlying surface separately.
