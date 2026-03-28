---
name: skill-lifecycle-manager
description: >
  Manage the lifecycle of agent skills: discover patterns, create or update a
  skill, validate it, evaluate it, project or install it, or audit a skill
  library. Use only when the request is explicitly about skills or skill
  libraries, not for general code tasks or agent management.
---

# Skill Lifecycle Manager

Manage skill work as a lifecycle, not as isolated one-off edits. This skill is a thin router: it figures out which lifecycle stage matters now, runs only those stages, and hands off deep specialist work to the right sub-skill or helper instead of re-embedding every workflow inline.

The default design bias is:
- Use **OpenAI-style structure discipline** for authoring, packaging boundaries, and progressive disclosure
- Use **Anthropic-style evaluation discipline** for realistic test prompts, baseline comparisons when warranted, and separate trigger optimization
- Use **repo-local conventions** for `skill.json`, `CHANGELOG.md`, categories, generated catalogs, and validation commands

## Outputs

Depending on the requested stage, produce one or more of:

- An invocation posture decision for the target skill: `manual-first`, `hybrid`, or `auto-first`, with rationale
- A new or updated skill folder with `SKILL.md`, `skill.json`, `CHANGELOG.md`, and any required references/scripts/assets
- A fusion brief or source inventory explaining what to borrow from existing skills
- A validation report with concrete failures and fixes
- An evaluation plan or iteration workspace path under `workspaces/<skill-name>/`
- A seeded evaluation workspace with `with-skill` and optional `baseline` slots
- A structured eval suite under `eval/` when the skill is important enough to justify durable tests
- A lightweight browser review artifact for a seeded iteration when a human needs to inspect and score eval outputs
- One or more platform projections for Codex and Claude Code
- A trigger optimization proposal with before/after descriptions
- An install/publish checklist for the target platform
- An audit report covering duplicates, drift, missing metadata, context waste, and script risk

## When Not To Use

Do not use this skill when:

- The task is unrelated to skills and is really about general research, planning, or implementation
- The user only wants to install a known skill and does not need lifecycle guidance; use the platform installer directly
- The workflow is still too vague to identify what a skill should do; clarify intent first, then come back

## Router First

Do not force all seven lifecycle stages every time. Identify the current request, then run only the relevant stages in order. If the user asks for "audit this skill", do not start by scaffolding a new one.

However, do **not** treat every "make a skill from this workflow" request as a direct authoring task. Some new-skill requests are broad enough that they must begin with Discover before any package drafting starts.

Run this **Discover-first gate** before choosing `Create / Update` for a new skill:

- the target skill is meant to be general-purpose, project-generic, domain-agnostic, or broadly reusable
- the request explicitly asks for research, comparison, best practices, existing skills, or fusion
- overlap with existing local or ecosystem skills is plausible and would materially affect the design
- the design is likely to borrow from external patterns rather than only local source material

If any of those are true, start with `Discover`. Do not draft `SKILL.md`, `skill.json`, `CHANGELOG.md`, references, or eval files yet.

Use this routing table first:

| Stage | Primary question | Default move | Deeper helper |
| --- | --- | --- | --- |
| **Discover** | Do we need external patterns, official references, or upstream comparisons before writing? | Build a focused source inventory | `skill-researcher` (binding workflow when delegated) |
| **Create / Update** | Are we authoring a new skill or materially revising an existing one? | Write or revise the skill package | `skill-creator` patterns |
| **Validate** | Does the skill meet structural, metadata, and repo requirements? | Run local validation before broader eval | `scripts/quick_validate.py` |
| **Evaluate** | Does the skill actually help on realistic tasks? | Run qualitative or mixed eval loop | Anthropic-style eval workflow |
| **Optimize Trigger** | Is the skill under-triggering or over-triggering? | Optimize frontmatter description separately | Trigger eval prompts |
| **Install / Publish** | Does the user want the skill distributed or activated somewhere? | Generate and validate the right platform projection, then install or publish | `scripts/project_skill.py` |
| **Audit / Governance** | Is the problem about library health, drift, duplicates, or stale skill hygiene? | Scan inventory and classify issues | `scripts/audit_skill_inventory.py` |

Read [lifecycle-modes.md](references/lifecycle-modes.md) for the detailed stage checklist and escalation rules. Read [platform-surfaces.md](references/platform-surfaces.md) when deciding what is core vs platform-specific. Read [projection-model.md](references/projection-model.md) when projecting to Codex or Claude Code. Read [evaluation-loop.md](references/evaluation-loop.md) when running a serious evaluation pass. Read [audit-rubric.md](references/audit-rubric.md) when producing a formal audit.
Read [invocation-posture.md](references/invocation-posture.md) before writing or optimizing a description so the trigger strategy matches how the skill is supposed to be invoked.

## Operating Rules

1. **Description is the trigger.** Treat frontmatter `description` as production behavior, not marketing copy.
2. **Keep the body lean.** Put heavy detail in references or scripts; keep `SKILL.md` actionable and navigable.
3. **Separate body quality from trigger quality.** Improve instructions and trigger wording in separate passes when possible.
4. **Prefer realistic eval prompts.** Evaluate against concrete user requests, not synthetic toy prompts.
5. **Broad new skills are research-first.** If the target skill is general-purpose, overlap-prone, or explicitly asks for comparison or fusion, route to `Discover` before any authoring.
6. **Do not duplicate deep research inline.** If discovery becomes ecosystem research, delegate to `skill-researcher`.
7. **Delegated checkpoints are binding.** If a lifecycle stage delegates to a specialist skill, inherit that skill's required pauses, confirmations, and deliverables before resuming downstream stages.
8. **Do not merge create and install by default.** A well-authored skill and a correctly installed skill are different lifecycle concerns.
9. **Audit for library health, not only single-skill correctness.** A skill can be individually valid but still harmful in the aggregate because it duplicates another skill, wastes context, or has stale metadata.
10. **Decide invocation posture before tuning the trigger.** First choose whether the skill should be `manual-first`, `hybrid`, or `auto-first`; then write the description to match that posture.
11. **Keep installable packages self-contained.** A skill may reference another skill conceptually, but it must not depend on another skill package's private script paths. If no formal shared-runtime distribution exists, duplicate the required runtime tooling locally instead of shipping a hidden cross-package dependency.

## Command Path Model

When copying the shell commands below, treat `SLM_DIR` as the active skill directory:

- Canonical repo copy: `SLM_DIR=skills/skill-lifecycle-manager`
- Codex projection: `SLM_DIR=.agents/skills/skill-lifecycle-manager`
- Claude Code projection: `SLM_DIR=.claude/skills/skill-lifecycle-manager`

Examples that use reusable eval fixtures also need an `SLM_EVAL_FILE` path. In the canonical repo, that can be something like `skills/skill-lifecycle-manager/eval/eval-cases.json`. Projected runtime surfaces intentionally do **not** ship `eval/`, so projected-surface users should point `--eval-file` at a canonical/local copy of the fixture or use inline `--eval` prompts instead.
If you are self-validating this skill package itself, also set `SLM_CANONICAL_DIR=skills/skill-lifecycle-manager`. That self-validation path is canonical-only: projected runtime copies intentionally exclude `tests/`, and Claude Code projections also exclude `skill.json` plus `CHANGELOG.md`.

## Workflow

This workflow uses **9 phases** around **7 routed lifecycle stages**. Phase 1 scopes and routes the work, Phases 2-8 correspond to the routed stages in the table above, and Phase 9 closes the loop.

### Phase 1: Scope And Route

Start by classifying the request:

- **Single-stage**: one explicit lifecycle stage, such as "draft a skill", "validate this skill", or "audit our skills"
- **Multi-stage**: a bounded chain such as "research and draft" or "update, validate, then optimize trigger"
- **End-to-end**: create or rehabilitate a skill from discovery through validation and next-step packaging

Then identify the artifact:

- **New skill idea**
- **Existing local skill**
- **Published or installed skill**
- **Whole skill inventory**

Before authoring or trigger work, decide the target skill's **invocation posture**:

- **`manual-first`**: the skill should usually be called explicitly; optimize for low false positives
- **`hybrid`**: explicit invocation is still welcome, but a few high-confidence automatic triggers are desirable
- **`auto-first`**: the skill is narrow, low-cost to trigger, and is expected to activate frequently without an explicit call

If the user has not said otherwise, default to `manual-first`. Meta-skills, audit/governance skills, and risky workflow skills should usually stay there.

Before entering `Create / Update` for a **new** skill, apply the Discover-first gate from `Router First` instead of re-deriving it here:

- If the gate fires and the user did not specify `Quick`, `Standard`, or `Deep`, stop and resolve the depth choice before searching.
- If the request already includes bounded sources, keep Discover intentionally narrow instead of widening it.
- If delegated Discover still owes candidate confirmation or a research handoff, stay in `Discover` until that checkpoint is satisfied.

Before proceeding, summarize the chosen route in one or two sentences so the user can correct course early.

### Phase 2: Discover

Use Discover when the domain is unfamiliar, the user wants comparison, or you suspect an official/community pattern should be reused rather than reinvented.

If the Discover-first gate in `Router First` fired, Discover is mandatory for this pass. Treat that gate as the authoritative rule instead of restating it here. When the gate is active, do not "just draft a first version" and plan to research later, and do not treat a nearby local skill as permission to skip broader overlap or source checks.

Default behavior:

1. Prefer **official sources first**: OpenAI and Anthropic are the strongest structural references.
2. If the task needs broader ecosystem comparison, invoke `skill-researcher` as a delegated workflow rather than recreating a full landscape survey manually.
3. Once delegated, inherit the specialist skill's checkpoints and deliverables. For `skill-researcher`, that means:
   - stop and resolve the depth-mode choice first if the user has not already specified Quick, Standard, or Deep
   - stop after candidate inventory and show the candidate set to the user for confirmation
   - do not continue into Collect, Analyze, Synthesize, or `Create / Update` until that confirmation gate has been satisfied
4. If Discover stays local, capture a short source inventory:
   - Which official skills are primary anchors
   - Which supplemental sources are worth borrowing from
   - Which patterns should be rejected
5. If delegated research completes, keep the result as a separate fusion brief or research handoff artifact before authoring begins.
6. Convert confirmed research into writing inputs:
   - required lifecycle stages
   - trigger language cues
   - reusable files/scripts to include
   - evaluation expectations

Until the delegated Discover workflow has completed its required handoff, the following are out of bounds:

- drafting the target skill package
- creating target-skill references, scripts, or eval fixtures
- claiming `Create / Update` is already underway
- running validation on target-skill files that should not exist yet

**Discover is similar to `skill-researcher`, but not identical.** `skill-researcher` is the deep external research specialist. This skill decides **when** that research is necessary and how it reconnects to the rest of the lifecycle. Once Discover delegates, the specialist workflow governs the pause points and outputs.

### Phase 3: Create Or Update

Precondition: if the request triggered the Discover-first gate, do not enter this phase until the research handoff is complete and any required candidate confirmation has happened.

When authoring or revising the skill, use OpenAI's structure discipline as the baseline:

1. Capture 2-4 realistic examples first.
2. Decide the target skill's invocation posture before writing the trigger:
   - `manual-first`
   - `hybrid`
   - `auto-first`
3. Write the frontmatter description to match that posture:
   - `manual-first`: short, boundary-heavy, explicit negative cases
   - `hybrid`: concise but broad enough for a few high-confidence implicit triggers
   - `auto-first`: stronger in-scope coverage, but still not a keyword dump
4. Decide whether the skill has a **canonical core** plus target projections:
   - keep the shared workflow in the canonical package
   - keep platform-only behavior out of the core unless the skill is intentionally single-platform
5. Plan reusable contents:
   - `scripts/` for deterministic or repetitive operations
   - `references/` for longer guidance or domain variants
   - `assets/` only if the output really needs them
6. Create or update the repo-compatible package:
   - `SKILL.md`
   - `skill.json`
   - `CHANGELOG.md`
7. Keep the skill router-shaped:
   - stage-based
   - concise
   - explicit about when to delegate
   - explicit about when not to use the skill

If the skill is meant to be installable outside the canonical repo, keep the runtime helpers it needs inside that package or inside an explicitly shipped distribution unit. It may reference another skill conceptually, but it must not assume another skill package's private script path exists on the target surface.

Use `scripts/init_skill.py` when you need a fresh repo-compatible scaffold. Add `--project-to codex,claude-code` when you want initial projections immediately. When updating an existing skill, preserve the name unless the rename is deliberate and accompanied by metadata/catalog updates.

### Phase 4: Validate

Validation comes before broad evaluation.

Run these checks in order:

1. `uv run python "$SLM_DIR/scripts/quick_validate.py" <skill-dir>`
2. If the skill is meant to run on one or more target surfaces, validate the projections too:
   - `uv run python "$SLM_DIR/scripts/validate_projection.py" <skill-dir> --platform all`
3. If the skill includes a structured eval suite, validate that too:
   - `uv run python "$SLM_DIR/scripts/validate_eval_suite.py" <eval-file>`
4. If you changed validation, projection, or eval-runner code in this skill package itself, run the packaged unit tests from the canonical repo copy:
   - `uv run python "$SLM_CANONICAL_DIR/scripts/run_unit_tests.py"`
   - this script uses `uv run --with pytest ...`, so it does not rely on a pre-created virtualenv
   - projected runtime copies intentionally exclude `tests/`, so this self-check is canonical-only
5. Repo-local validation if relevant:
   - `npm run validate`
   - `npm run build` if indexes need refresh
6. Fix structural issues first:
   - missing files
   - name mismatches
   - category drift
   - changelog/version mismatch
   - too-short docs
   - projection drift

`quick_validate.py` prefers a real YAML parser when available so common frontmatter patterns like comments and block scalars work. In minimal environments it falls back to a small flat parser, so unusually complex frontmatter may need the full repo validator or a quick normalization pass before you trust the result.

Do not start nuanced evaluation while the skill still fails basic structure checks.

### Phase 5: Evaluate

Use Anthropic's evaluation discipline here. The core loop is:

1. Create realistic eval prompts for the actual work the skill is supposed to improve.
2. Keep the eval mix aligned with the chosen invocation posture:
   - `manual-first`: overweight `should-not-trigger` and adjacent-task prompts
   - `hybrid`: balance in-scope prompts with negative-boundary prompts
   - `auto-first`: overweight in-scope variation and near-miss prompts while still keeping negative controls
3. Decide whether a baseline is needed:
   - **New skill**: compare with no skill when the difference matters
   - **Existing skill revision**: compare against the prior version when the user cares about whether it got better
4. Seed the workspace when useful:
   - `uv run python "$SLM_DIR/scripts/seed_eval_workspace.py" <skill-name> --eval "label|prompt|success criteria"`
   - or `--eval-file <path-to-eval-cases.json>` for a reusable suite
5. Store artifacts under `workspaces/<skill-name>/iteration-<N>/`
6. Evaluate both:
   - **qualitative outputs**: usefulness, correctness, completeness
   - **quantitative assertions**: only when objective checks really exist
7. Review failures, then revise the skill and rerun
8. When a human reviewer needs a cleaner artifact than raw terminal logs, render the lightweight review panel:
   - `uv run python "$SLM_DIR/scripts/render_review_panel.py" <iteration-dir>`

For direct CLI runs, `run_surface_eval.py --stage baseline` now automates the project-local baseline path by temporarily hiding the active surface projection when it exists. Use that stage only when the comparison is meaningful and you want the baseline artifact to sit next to the corresponding `with-skill` run in the same iteration.
Those direct surface evals require the relevant platform CLI for the surface you are exercising, but that is not a prerequisite for basic structure validation or the packaged Python unit tests.

Use qualitative review by default for ambiguous or creative skills. Use quantitative assertions for transformations, extraction, formatting, deterministic workflows, or code-generation patterns with objective expectations.

When subagents are available, pass them the skill and a realistic task prompt, not your diagnosis. The point is to measure whether the skill generalizes under realistic conditions. Use [evaluation-loop.md](references/evaluation-loop.md) for the suggested Anthropic-style loop.

### Phase 6: Optimize Trigger

Trigger optimization is a separate stage. Do not treat it as a side effect of general editing.

Run this stage when:

- the skill exists but rarely activates when it should
- the skill activates on adjacent tasks it should avoid
- the user specifically asks to improve description quality

Workflow:

1. Confirm the invocation posture again before editing the description.
2. Draft a set of realistic trigger eval prompts:
   - should-trigger
   - should-not-trigger
   - near-miss prompts
3. Review the set before running it if the user wants visibility
4. Improve `description` without simultaneously rewriting the whole body unless necessary
5. Record the before/after description, the chosen posture, and the rationale

The goal is not keyword stuffing. The goal is to make the activation boundary legible to the model for the posture the skill is actually meant to have.

### Phase 7: Project, Install Or Publish

Treat distribution as an adapter step.

First identify the target surface:

- repo-local skill package
- Codex / `.agents/skills/`
- Claude / `.claude/skills/` or marketplace/plugin flow
- external registry or marketplace

Then choose the least surprising path:

1. Generate the target projection from the canonical source:
   - `uv run python "$SLM_DIR/scripts/project_skill.py" <skill-dir> --platform all`
2. Validate the generated projection:
   - `uv run python "$SLM_DIR/scripts/validate_projection.py" <skill-dir> --platform all`
   - use `projection.json` if the canonical source has author-only roots that should not be copied into runtime surfaces
3. For local repo packaging, refresh generated indexes with `npm run build`.
4. For local installation into supported agent surfaces, use the repo installer if appropriate:
   - `npm run install-skill -- <name>`
5. For external install/publish flows, use the platform-native installer or publish mechanism rather than inventing a bespoke path inside this skill.
6. Before calling the package install-ready, confirm the runtime boundary is portable:
   - the package may reference another skill conceptually
   - the package must not require another skill package's private script paths at runtime
   - if shared tooling is truly required, ship it as part of the same package or an explicitly distributed pack instead of assuming the canonical repo layout exists on the target surface

Do not promise publishing unless credentials, marketplace rules, and packaging expectations are actually satisfied.

### Phase 8: Audit / Governance

Audit is for library health, not just one file.

Use it when the user asks:

- "what's stale?"
- "which skills overlap?"
- "are we loading too many skills?"
- "which skills are low quality or risky?"

Run `uv run python "$SLM_DIR/scripts/audit_skill_inventory.py" --root skills --format markdown` for a first pass, then deepen the analysis with [audit-rubric.md](references/audit-rubric.md). The script now automates part of the rubric directly, including trigger quality heuristics, reference hygiene, readiness signals, projection health, and context-cost warnings; human review is still needed for deeper usefulness and wording judgment.

Audit dimensions include:

- duplicate or overlapping intent
- stale versions or mismatched changelogs
- trigger under-specification or overreach
- missing validation/evaluation evidence
- context waste from bloated bodies
- risky or undeclared script behavior
- install/publish readiness gaps
- cross-package private runtime dependencies that break portability after install

### Phase 9: Close The Loop

Before finishing, report:

- which stage(s) were run
- what artifacts changed
- what was validated vs not yet validated
- the next lifecycle stage, if any

If the request ended mid-lifecycle, explicitly say what remains: for example, "draft completed; next step is evaluation" or "audit completed; next step is targeted consolidation".
If the request paused inside Discover because a delegated workflow hit a required checkpoint, say that plainly: for example, "candidate inventory completed; next step is user confirmation before deeper analysis or authoring."

## Failure Patterns To Avoid

- Collapsing all lifecycle stages into one giant pass when the user only asked for one stage
- Duplicating deep discovery inside this skill instead of delegating to `skill-researcher`
- Treating `skill-researcher` as inspiration instead of a binding delegated workflow
- Treating a broad new skill as a direct local-drafting task just because a nearby repo skill seems related
- Treating `description` as documentation instead of activation logic
- Running subjective evaluation with fake numeric precision
- Mixing trigger optimization with body rewrites so heavily that you cannot tell what improved
- Starting `Create / Update` for a broad new skill before resolving the Discover depth gate
- Jumping from a deep research request straight into authoring before the delegated confirmation gate is satisfied
- Baking Codex-only or Claude-only behavior into the canonical core without a good reason
- Treating another skill package's private script path as an acceptable runtime dependency for an installable skill
- Publishing or installing before the skill is structurally valid
- Auditing only for broken files while missing duplicates, drift, or context waste

## Example Prompts

- Research the best official and community patterns for this new skill idea, then draft it.
- We need a project-generic, domain-generic documentation skill. Research outside skills first, give me the candidate inventory, wait for confirmation, then compare and fuse before any drafting.
- Turn this repeated workflow into a new skill, validate it, and tell me the next lifecycle step.
- Update our existing `skill-researcher` skill, then run a proper evaluation loop.
- Tighten the trigger wording for this skill without rewriting the whole body.
- Audit our `skills/` directory for duplicates, stale changelogs, and context bloat.
- Install this repo skill into the right local agent surface after validation passes.
