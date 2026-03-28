# Self-Contained Lifecycle Packages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make lifecycle skills and agents distributable and installable as self-contained packages by eliminating inter-skill script dependencies and tightening package-boundary rules.

**Architecture:** Codify one project-level packaging rule first: installable skills and agents should be self-contained after install, and one skill may reference another skill conceptually but must not depend on another skill's private script paths. Then refactor `agent-lifecycle-manager` to own every script it invokes, remove agent-specific tooling from `skill-lifecycle-manager`, and tighten `skill-lifecycle-manager` itself so it stays skills-only, leaner, and easier to distribute.

**Tech Stack:** Markdown, JSON, Python 3.9+, Node.js 18+, `uv`, repo projection/install scripts.

---

### Task 1: Codify The Package-Boundary Rule

**Files:**
- Modify: `instructions/root/shared.md`
- Modify: `docs/metadata/skill-metadata-policy.md`
- Modify: `docs/architecture/tooling-layout.md`
- Regenerate: `AGENTS.md`
- Regenerate: `CLAUDE.md`

**Step 1: Add the rule to the root instruction source**

Add one explicit shared rule to `instructions/root/shared.md`:
- installable skills and agents should be self-contained after install
- skills may reference other skills conceptually
- skills must not call another skill's private scripts by path
- if two packages need the same runtime helper and there is no formal shared-runtime distribution mechanism, prefer local duplication over cross-package runtime dependency

**Step 2: Add the same rule to maintainer-facing policy docs**

Update `docs/metadata/skill-metadata-policy.md` and `docs/architecture/tooling-layout.md` so contributors see the same packaging rule outside the generated root instructions.

**Step 3: Regenerate the root instruction projections**

Run: `npm run sync-instructions`

Expected: regenerated `AGENTS.md` and `CLAUDE.md` include the new self-contained-package rule.

**Step 4: Verify the instruction projections are current**

Run: `npm run sync-instructions -- --check`

Expected: success exit code with no drift reported.

### Task 2: Inventory Every Cross-Skill Script Dependency

**Files:**
- Modify: `skills/agent-lifecycle-manager/SKILL.md`
- Modify: `skills/agent-lifecycle-manager/eval/README.md`
- Modify: `skills/agent-lifecycle-manager/eval/eval-cases.json`
- Modify: `skills/agent-lifecycle-manager/references/evaluation-loop.md`
- Modify: `skills/agent-lifecycle-manager/CHANGELOG.md`

**Step 1: Enumerate all `SLM_DIR/scripts/...` references in `agent-lifecycle-manager`**

Use the current search results as the source list and make a checklist of every command or narrative dependency that points at `skills/skill-lifecycle-manager/scripts/`.

**Step 2: Rewrite the docs to state the new boundary**

Replace the current "shared harness" language with package-local wording:
- `agent-lifecycle-manager` owns the scripts it documents
- no command in this package should require another skill package's script directory

**Step 3: Update the changelog to record the boundary fix**

Add a new changelog entry explaining that cross-skill script dependencies were removed to align with the distributable-package rule.

### Task 3: Create A Self-Contained Script Set For `agent-lifecycle-manager`

**Files:**
- Create: `skills/agent-lifecycle-manager/scripts/projection_support.py`
- Create: `skills/agent-lifecycle-manager/scripts/project_skill.py`
- Create: `skills/agent-lifecycle-manager/scripts/validate_projection.py`
- Create: `skills/agent-lifecycle-manager/scripts/quick_validate.py`
- Create: `skills/agent-lifecycle-manager/scripts/validate_eval_suite.py`
- Create: `skills/agent-lifecycle-manager/scripts/seed_eval_workspace.py`
- Create: `skills/agent-lifecycle-manager/scripts/run_surface_eval.py`
- Create: `skills/agent-lifecycle-manager/scripts/render_review_panel.py`
- Create: `skills/agent-lifecycle-manager/scripts/run_unit_tests.py`
- Create: `skills/agent-lifecycle-manager/scripts/quick_validate_agent.py`
- Create: `skills/agent-lifecycle-manager/scripts/audit_agent_inventory.py`

**Step 1: Copy the currently used implementations into the agent package**

Start from the current working implementations under `skills/skill-lifecycle-manager/scripts/`, but copy them into `skills/agent-lifecycle-manager/scripts/` so the package becomes self-contained.

**Step 2: Normalize package-local imports**

Adjust imports so every script only imports siblings inside `skills/agent-lifecycle-manager/scripts/`.

**Step 3: Normalize help text and docstrings**

Where a script's help text or docstring mentions `skill-lifecycle-manager`, rewrite it so the package-local version either:
- becomes agent-specific, or
- clearly describes itself as a package-local lifecycle helper for this skill

**Step 4: Keep functionality unchanged in the first pass**

Do not redesign the harness during the move. First make it local and behaviorally equivalent; optimize later.

### Task 4: Add Local Tests For The Agent Package Scripts

**Files:**
- Create: `skills/agent-lifecycle-manager/tests/_loader.py`
- Create: `skills/agent-lifecycle-manager/tests/test_quick_validate_agent.py`
- Create: `skills/agent-lifecycle-manager/tests/test_audit_agent_inventory.py`
- Create: `skills/agent-lifecycle-manager/tests/test_projection_support.py`
- Create: `skills/agent-lifecycle-manager/tests/test_seed_eval_workspace.py`
- Create: `skills/agent-lifecycle-manager/tests/test_run_surface_eval.py`
- Create: `skills/agent-lifecycle-manager/tests/test_run_unit_tests.py`
- Modify: `package.json`

**Step 1: Create the test loader**

Mirror the existing `_loader.py` pattern so the agent package tests import scripts from their own package-local `scripts/` directory.

**Step 2: Port the relevant harness tests**

Copy and adapt the existing harness tests from `skill-lifecycle-manager` so the agent package proves its own local scripts work without relying on the skill package.

**Step 3: Add agent-specific validation coverage**

Make sure there is direct coverage for:
- `quick_validate_agent.py`
- `audit_agent_inventory.py`
- any package-local helper behavior the docs rely on

**Step 4: Wire the tests into repo validation**

Update `package.json` to add an `agent-lifecycle-manager` Python test command and include it in the validation/test path.

### Task 5: Rewrite `agent-lifecycle-manager` To Use Only Local Script Paths

**Files:**
- Modify: `skills/agent-lifecycle-manager/SKILL.md`
- Modify: `skills/agent-lifecycle-manager/eval/README.md`
- Modify: `skills/agent-lifecycle-manager/eval/eval-cases.json`
- Modify: `skills/agent-lifecycle-manager/references/evaluation-loop.md`
- Modify: `skills/agent-lifecycle-manager/projection.json`
- Regenerate: `.agents/skills/agent-lifecycle-manager/**`
- Regenerate: `.claude/skills/agent-lifecycle-manager/**`

**Step 1: Introduce package-local command variables**

Use `ALM_DIR=skills/agent-lifecycle-manager` as the package root and point all documented script commands at `"$ALM_DIR/scripts/..."`.

**Step 2: Remove every `SLM_DIR/scripts/...` command reference**

This includes:
- validate commands
- eval setup commands
- baseline / review panel commands
- audit commands
- narrative text about a shared harness

**Step 3: Recheck the projection policy**

Keep `eval/` out of runtime projections, but make sure any runtime-relevant local scripts remain included.

### Task 6: Remove Agent-Specific Tooling From `skill-lifecycle-manager`

**Files:**
- Delete: `skills/skill-lifecycle-manager/scripts/quick_validate_agent.py`
- Delete: `skills/skill-lifecycle-manager/scripts/audit_agent_inventory.py`
- Modify: `skills/skill-lifecycle-manager/CHANGELOG.md`
- Regenerate: `.agents/skills/skill-lifecycle-manager/**`
- Regenerate: `.claude/skills/skill-lifecycle-manager/**`

**Step 1: Delete the agent-only scripts from the skill package**

Once `agent-lifecycle-manager` owns its local copies and tests, remove the agent-specific scripts from `skill-lifecycle-manager`.

**Step 2: Record the boundary tightening**

Update the `skill-lifecycle-manager` changelog to note that agent-specific tooling was removed so the package stays skills-only and distributable on its own.

**Step 3: Re-project the runtime copies**

Refresh the `.agents` and `.claude` projections after the canonical package changes.

### Task 7: Slim And De-Duplicate `skill-lifecycle-manager`

**Files:**
- Modify: `skills/skill-lifecycle-manager/SKILL.md`
- Modify: `skills/skill-lifecycle-manager/references/lifecycle-modes.md`
- Create: `skills/skill-lifecycle-manager/references/workflow-phases.md` (if needed)
- Modify: `skills/skill-lifecycle-manager/CHANGELOG.md`

**Step 1: Remove repeated Discover-first gate wording**

Keep one authoritative Discover-first rule block and replace the repeated explanations with shorter references.

**Step 2: Move heavy phase detail out of the main SKILL**

If needed, create `references/workflow-phases.md` and move the verbose phase-by-phase procedural detail there.

**Step 3: Keep the main SKILL router-shaped**

The top-level `SKILL.md` should still contain:
- scope and trigger boundary
- route table
- operating rules
- concise phase summaries
- links to references

### Task 8: Expand `skill-lifecycle-manager` Eval Coverage For The New Rule

**Files:**
- Modify: `skills/skill-lifecycle-manager/eval/eval-cases.json`
- Modify: `skills/skill-lifecycle-manager/eval/trigger-posture-cases.json`
- Modify: `skills/skill-lifecycle-manager/eval/README.md`
- Modify: `skills/skill-lifecycle-manager/CHANGELOG.md`

**Step 1: Add a package-boundary regression case**

Add at least one eval case where a lifecycle manager must flag cross-skill script dependency as a portability/design problem rather than accepting it as normal.

**Step 2: Add deeper Audit coverage**

Add at least one audit-focused case covering:
- duplicate intent
- context waste
- stale metadata
- portability / self-containment violations

**Step 3: Add an Install/Publish boundary case**

Add a case that checks whether the skill distinguishes between canonical-repo authoring convenience and installable-package portability.

### Task 9: Refresh Projections, Catalogs, And Validation

**Files:**
- Regenerate: `.agents/skills/skill-lifecycle-manager/**`
- Regenerate: `.claude/skills/skill-lifecycle-manager/**`
- Regenerate: `.agents/skills/agent-lifecycle-manager/**`
- Regenerate: `.claude/skills/agent-lifecycle-manager/**`
- Regenerate: `docs/catalog/**`
- Regenerate: `dist/catalog.json`

**Step 1: Refresh projections**

Run local projection generation/validation for both lifecycle skills after the canonical changes settle.

**Step 2: Refresh generated docs/catalog outputs**

Run the repo build path so the catalog and generated metadata reflect the new package boundaries.

**Step 3: Run the full validation path**

Run:
- `npm run sync-instructions -- --check`
- `npm run build`
- `uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/skill-lifecycle-manager`
- `uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/skill-lifecycle-manager --platform all`
- `uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-lifecycle-manager/eval/eval-cases.json`
- `uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-lifecycle-manager/eval/trigger-posture-cases.json`
- `uv run python skills/skill-lifecycle-manager/scripts/run_unit_tests.py`
- `uv run python skills/agent-lifecycle-manager/scripts/quick_validate.py skills/agent-lifecycle-manager`
- `uv run python skills/agent-lifecycle-manager/scripts/validate_projection.py skills/agent-lifecycle-manager --platform all`
- `uv run python skills/agent-lifecycle-manager/scripts/validate_eval_suite.py skills/agent-lifecycle-manager/eval/eval-cases.json`
- `uv run python skills/agent-lifecycle-manager/scripts/run_unit_tests.py`
- `npm test`

Expected: both packages validate and project cleanly with no remaining cross-skill script references.

### Task 10: Finish With Intentional Small Commits

**Files:**
- Stage only the files changed by each task

**Step 1: Commit the rule codification separately**

Use a commit like:

```bash
git commit -m "docs(packaging): require self-contained installable skills and agents"
```

**Step 2: Commit the agent package self-containment refactor separately**

Use a commit like:

```bash
git commit -m "refactor(agent-lifecycle-manager): remove cross-skill script dependencies"
```

**Step 3: Commit the skill package cleanup separately**

Use a commit like:

```bash
git commit -m "refactor(skill-lifecycle-manager): tighten package boundary and slim workflow docs"
```

**Step 4: Commit eval and validation follow-up separately**

Use a commit like:

```bash
git commit -m "test(lifecycle): add portability and audit boundary regressions"
```
