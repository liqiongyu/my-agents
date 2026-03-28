# README Craftsman Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reconcile the combined audits for `readme-craftsman` by fixing the real correctness issues first, tightening evaluation coverage, and only then slimming runtime context where the reduction is clearly worth the added indirection.

**Architecture:** Treat this as a targeted rehabilitation of an already-healthy skill rather than a rewrite. Keep `readme-craftsman` `manual-first`, preserve its artifact-specific workflow in the canonical `SKILL.md`, and make small, high-signal changes in v1.1.4: fix projection metadata drift, fix the malformed Markdown example, trim low-value runtime prose, and expand trigger-boundary coverage. Defer larger body-to-reference extraction and qualitative output benchmarking until after the correctness and trigger changes land cleanly.

**Tech Stack:** Markdown, JSON, Python `uv` scripts, projection tooling under `skills/skill-lifecycle-manager/`

---

### Task 1: Fix projection metadata consistency and add regression coverage

**Files:**
- Modify: `skills/skill-lifecycle-manager/scripts/project_skill.py`
- Modify: `skills/skill-lifecycle-manager/scripts/validate_projection.py`
- Modify: `skills/skill-lifecycle-manager/tests/test_skill_audit_and_validate.py`
- Refresh: `.agents/skills/readme-craftsman/skill.json`
- Refresh: `.agents/skills/readme-craftsman/SKILL.md`
- Refresh: `.agents/skills/readme-craftsman/references/*`
- Refresh: `.claude/skills/readme-craftsman/SKILL.md`
- Refresh: `.claude/skills/readme-craftsman/references/*`

**Step 1: Write a failing regression test for projected entrypoints**

Add coverage that reproduces the current bug: when a canonical skill excludes `CHANGELOG.md` from projection, the projected Codex `skill.json` must not still advertise `entrypoints.changelog = "CHANGELOG.md"`.

**Step 2: Run the targeted projection test**

Run:

```bash
uv run python -m pytest skills/skill-lifecycle-manager/tests/test_skill_audit_and_validate.py -q
```

Expected:
- the new projection-entrypoint assertion fails before the implementation change

**Step 3: Update projection behavior or validation**

Implement one consistent rule and keep it documented in code comments:

- preferred: when projecting `skill.json`, drop entrypoints that point at files excluded from the target surface
- acceptable fallback: fail validation if a projected `skill.json` references a file that does not exist on that surface

Do not solve this by re-including `CHANGELOG.md` in every Codex projection unless that becomes a deliberate repository-wide policy.

**Step 4: Re-run the targeted test and the packaged unit tests**

Run:

```bash
uv run python -m pytest skills/skill-lifecycle-manager/tests/test_skill_audit_and_validate.py -q
uv run python skills/skill-lifecycle-manager/scripts/run_unit_tests.py
```

Expected:
- the new regression test passes
- packaged unit tests pass

**Step 5: Re-project `readme-craftsman` and validate the result**

Run:

```bash
uv run python skills/skill-lifecycle-manager/scripts/project_skill.py skills/readme-craftsman --platform all
uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/readme-craftsman --platform all
```

Expected:
- the Codex projection no longer contains a dangling changelog entrypoint
- projection validation reports `OK [codex]` and `OK [claude-code]`

**Step 6: Commit**

```bash
git add skills/skill-lifecycle-manager/scripts/project_skill.py skills/skill-lifecycle-manager/scripts/validate_projection.py skills/skill-lifecycle-manager/tests/test_skill_audit_and_validate.py .agents/skills/readme-craftsman .claude/skills/readme-craftsman
git commit -m "fix(skills): harden projected skill metadata"
```

### Task 2: Fix low-risk correctness issues in `readme-craftsman`

**Files:**
- Modify: `skills/readme-craftsman/SKILL.md`
- Modify: `skills/readme-craftsman/CHANGELOG.md`

**Step 1: Fix the malformed nested fenced code block**

Repair the Installation example so the outer fence does not break when showing an inner shell snippet. Use four backticks for the outer Markdown example or an equivalent valid Markdown pattern.

**Step 2: Remove or shorten low-value runtime prose**

Trim content that adds little operational value during execution:

- remove the `Compatibility` caveat line, or compress it into a shorter note only if it clarifies a real runtime constraint
- remove or relocate the `GitHub Markdown Features` table if it is not carrying unique workflow guidance

**Step 3: Keep the core workflow stable**

Do not move the entire Section Matrix and Section Writing Guide out of `SKILL.md` in this patch by default. First land the low-risk trims above, then reassess whether the remaining body size is still causing real context pressure.

**Step 4: Run fast validation**

Run:

```bash
uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/readme-craftsman
```

Expected:
- validation returns `OK`

**Step 5: Update the changelog**

Add a new `1.1.4` entry describing:

- the Markdown example fix
- the runtime-body cleanup
- any projection metadata consistency changes that affect the projected surfaces

**Step 6: Commit**

```bash
git add skills/readme-craftsman/SKILL.md skills/readme-craftsman/CHANGELOG.md
git commit -m "fix(skills): clean up readme-craftsman runtime guidance"
```

### Task 3: Expand trigger-boundary coverage with near-miss and overlap cases

**Files:**
- Modify: `skills/readme-craftsman/eval/trigger-cases.json`
- Modify: `skills/readme-craftsman/CHANGELOG.md`

**Step 1: Add near-miss prompts**

Add at least two `manual-first` near-miss cases that are adjacent to README work but should not over-trigger:

- `help me improve the project documentation`
- `add a description to the repo`

Each case should explain why the boundary is ambiguous and what a correct response should do next.

**Step 2: Add one overlap-sensitive case**

Add one case that makes sure explicit README review language still routes cleanly to `readme-craftsman` rather than a broader documentation or generic review workflow.

Example starting point:

- `review this README and tell me whether it still matches the repository`

**Step 3: Validate the eval suite**

Run:

```bash
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/readme-craftsman/eval/trigger-cases.json
```

Expected:
- validation returns `OK`

**Step 4: Update the changelog**

Record the new near-miss and overlap coverage in the `1.1.4` entry.

**Step 5: Commit**

```bash
git add skills/readme-craftsman/eval/trigger-cases.json skills/readme-craftsman/CHANGELOG.md
git commit -m "test(skills): expand readme-craftsman trigger coverage"
```

### Task 4: Decide whether to do deeper body slimming in a follow-up patch

**Files:**
- Modify: `skills/readme-craftsman/SKILL.md`
- Create: `skills/readme-craftsman/references/section-guide.md` (only if needed)
- Modify: `skills/readme-craftsman/CHANGELOG.md`

**Step 1: Reassess the post-fix body**

After Tasks 2 and 3, re-read the canonical `SKILL.md` and answer:

- is the body still hard to navigate?
- is the weight coming from genuinely reusable runtime guidance or from generic reference material?

**Step 2: Extract only if the benefit is clear**

If the body is still too heavy, move only the most generic material first:

- Section Writing Guide
- large static section matrices

Keep in the core file:

- the mode detector
- project-type classifier
- create / update / review flow
- negative boundary and invocation posture

**Step 3: Validate after any extraction**

Run:

```bash
uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/readme-craftsman
uv run python skills/skill-lifecycle-manager/scripts/project_skill.py skills/readme-craftsman --platform all
uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/readme-craftsman --platform all
```

Expected:
- canonical validation passes
- projected copies remain clean and in sync

**Step 4: Commit**

```bash
git add skills/readme-craftsman/SKILL.md skills/readme-craftsman/references skills/readme-craftsman/CHANGELOG.md .agents/skills/readme-craftsman .claude/skills/readme-craftsman
git commit -m "refactor(skills): slim readme-craftsman core guidance"
```

### Task 5: Add lightweight qualitative quality-eval scaffolding in a later patch

**Files:**
- Create: `skills/readme-craftsman/eval/quality-cases.json`
- Create: `skills/readme-craftsman/eval/README.md`
- Modify: `skills/readme-craftsman/CHANGELOG.md`

**Step 1: Define 3-4 representative archetypes**

Create qualitative cases for:

- OSS library
- docs or knowledge base
- dataset or research repo
- community or awesome-list repo

Each case should define:

- the repo archetype
- the requested README task
- success criteria derived from the existing Review-mode Quality Checklist

**Step 2: Keep the quality suite lightweight**

Do not try to force brittle numeric scoring into subjective README quality. Prefer:

- explicit success criteria
- manual reviewer notes
- a small rubric tied to the skill's own checklist

**Step 3: Document how to run the quality pass**

Add `eval/README.md` with:

- when to use the quality suite
- what counts as a pass
- what should be reviewed manually

**Step 4: Commit**

```bash
git add skills/readme-craftsman/eval/quality-cases.json skills/readme-craftsman/eval/README.md skills/readme-craftsman/CHANGELOG.md
git commit -m "test(skills): add qualitative readme-craftsman eval scaffolding"
```

### Task 6: Final validation, version bump, and repo-wide checks

**Files:**
- Modify: `skills/readme-craftsman/skill.json`
- Modify: `skills/readme-craftsman/CHANGELOG.md`
- Refresh: `.agents/skills/readme-craftsman/*`
- Refresh: `.claude/skills/readme-craftsman/*`

**Step 1: Bump the released version**

Set `skills/readme-craftsman/skill.json` to `1.1.4` once Tasks 1-3 are complete. If Task 4 or Task 5 is deferred, do not roll them into this patch version.

**Step 2: Re-project the skill**

Run:

```bash
uv run python skills/skill-lifecycle-manager/scripts/project_skill.py skills/readme-craftsman --platform all
```

Expected:
- Codex and Claude projections refresh from the canonical package

**Step 3: Run targeted validation**

Run:

```bash
uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/readme-craftsman
uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/readme-craftsman/eval/trigger-cases.json
uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/readme-craftsman --platform all
```

Expected:
- all targeted checks return `OK`

**Step 4: Run repository-level checks**

Run:

```bash
npm run build
npm test
```

Expected:
- generated metadata is refreshed if needed
- repository validation passes

**Step 5: Commit**

```bash
git add skills/readme-craftsman/skill.json skills/readme-craftsman/CHANGELOG.md skills/readme-craftsman/SKILL.md skills/readme-craftsman/eval .agents/skills/readme-craftsman .claude/skills/readme-craftsman
git commit -m "feat(skills): tighten readme-craftsman quality and projections"
```

---

## Release Scope Recommendation

**Ship in v1.1.4**
- Task 1: projection metadata consistency
- Task 2: Markdown fix and low-value runtime cleanup
- Task 3: near-miss and overlap trigger coverage
- Task 6: version bump and final validation

**Defer to follow-up patch unless the body still feels noisy**
- Task 4: deeper `SKILL.md` slimming
- Task 5: qualitative quality-eval scaffolding

## Non-Goals For v1.1.4

- turning `readme-craftsman` into a broader documentation skill
- changing the invocation posture away from `manual-first`
- rewriting the whole skill around a new template system
- adding fragile numeric scoring for README output quality
