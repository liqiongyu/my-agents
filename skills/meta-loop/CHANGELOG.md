# Changelog

All notable changes to this skill will be documented in this file.
This project adheres to [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-06-17

### Added
- Mode A: a 10-dimension evaluation rubric for judging any produce → check → fix → re-check loop — setpoint/definition-of-done, checker independence + judge debiasing, bounded iteration, severity-graded gating, divergence/regression escalation, cross-run memory, separation from declaring "done", trigger reliability, cost ceiling, and observability — with the four systematically-missed blind spots (dimensions 2, 6, 8, 9) called out for hardest scrutiny.
- Mode B: a 9-step build guide for designing a new loop from scratch, plus a canonical control skeleton + output schema that pin down the control-flow points prose leaves ambiguous (last-round-fix-is-final, regression vs stuck escalation, fail-open handoff).
- `references/rubric.md` — full per-dimension criteria (asks / good-looks-like / failure-if-missing / basis) and a worked example scoring a typical agent self-review loop.
- `references/building-a-loop.md` — the 9 steps in detail, the mechanical contract, the methodology basis, and the open design questions worth deciding deliberately.
- Grounding in public methodology only (project-agnostic): TDD, Self-Refine, Reflexion, Constitutional AI, LLM-as-judge (Zheng et al.; Panickssery et al.), process supervision (Lightman et al.), Anthropic's evaluator-optimizer pattern, panel-of-LLM-judges, and Goodhart's law.
