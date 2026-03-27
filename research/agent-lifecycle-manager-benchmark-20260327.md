# Agent Lifecycle Manager Benchmark Note

Date: 2026-03-27

## Purpose

This note records one concrete with-skill versus baseline benchmark for `agent-lifecycle-manager` after the Discover handoff and metadata hardening work. The raw runtime artifacts live under the local `workspaces/` tree, which is ignored by Git, so this note preserves the main result in version control.

## Benchmark Shape

- Skill: `agent-lifecycle-manager`
- Skill version: `0.2.4`
- Surface: Codex
- Eval case: `eval-3` — "Audit an agent library for overlap and overreach"
- Reasoning effort: `low`
- Timeout budget: 180 seconds per run

Raw local artifacts:

- `workspaces/agent-lifecycle-manager/iteration-4/evals/eval-3/with-skill/codex/`
- `workspaces/agent-lifecycle-manager/iteration-4/evals/eval-3/baseline/codex/`
- `workspaces/agent-lifecycle-manager/iteration-4/benchmark.md`
- `workspaces/agent-lifecycle-manager/iteration-4/benchmark.json`

## Result Summary

| Metric | With Skill | Baseline | Delta |
| --- | --- | --- | --- |
| Exit code | 0 | 0 | 0 |
| Duration | 65s | 82s | -17s |

## Qualitative Comparison

- Both runs returned useful audit findings, so the baseline is already competent for this prompt.
- The `with-skill` run stayed closer to the intended lifecycle-manager behavior:
  - findings were framed as lifecycle audit output
  - Codex versus Claude drift was described in contract terms instead of only as surface differences
  - the next step was explicitly named as `Create / Update`
- The baseline run still found real issues, especially around research-agent overlap and tool budgets, but it read more like a generic review than a lifecycle-governed audit.

## Additional Note

An exploratory `eval-5` run was attempted first to stress the new Discover handoff behavior directly. At the default reasoning posture, that prompt exceeded the 180-second benchmark budget because it pushed the surface into a heavier external-research pattern. For fast repeatable comparisons, `eval-3` is currently the better smoke benchmark, while `eval-5` should be treated as a slower research-focused benchmark.

## 0.3.0 Update (2026-03-27)

Version 0.3.0 added `quick_validate_agent.py` and `audit_agent_inventory.py` to the shared harness, tightened SKILL.md, and expanded the eval suite with eval-6 and eval-7. These changes are structural (new tooling and content), not behavioral (routing logic unchanged), so the 0.2.4 eval-3 benchmark above remains a valid baseline for core routing quality.

**Pending**: eval-6 ("Validate a single agent for cross-surface contract alignment") and eval-7 ("Run a full agent inventory audit and prioritize remediation") need their first surface-eval runs to verify that the skill correctly drives the new automated scripts. These are the recommended first benchmarks for 0.3.0 behavioral evidence.
