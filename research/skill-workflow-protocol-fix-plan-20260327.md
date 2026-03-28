# Skill Workflow Protocol Fix Plan

Date: 2026-03-27

## Purpose

This document records the full context behind a workflow failure discovered while creating the `git-worktree-workflows` skill. The goal is to make the problem, root cause, and proposed fix explicit so a follow-up session can update the relevant skills without having to reconstruct the reasoning from chat history.

This document is a planning and handoff artifact. It does not itself change the behavior of `skill-lifecycle-manager` or `skill-researcher`.

## What Happened

During the `git-worktree-workflows` task:

1. The user explicitly invoked `skill-lifecycle-manager`.
2. The request also explicitly required deep research before authoring.
3. `skill-lifecycle-manager`'s `Discover` stage naturally pointed toward using `skill-researcher`.
4. The implementation did perform real discovery work:
   - official Git documentation
   - `skills.sh` search
   - GitHub repository search
   - community skill collection and direct file inspection
5. However, the execution did **not** follow the full `skill-researcher` protocol.

The key protocol violations were:

- It did **not** stop after generating a candidate set for user confirmation.
- It continued directly into authoring the canonical skill package.
- It stored research conclusions directly under the target skill's `references/` directory instead of treating research as a separate handoff artifact first.

In short:

- research was performed
- `skill-researcher` was read
- but `skill-researcher` was **not used as a binding workflow**

## Why This Is a Problem

This is not just a one-off judgment mistake. It exposes a structural gap in how meta-skills delegate to each other.

### 1. User control was skipped

`skill-researcher` explicitly requires a checkpoint:

- compile candidate list
- present it to the user
- wait for confirmation
- only then continue into Collect / Analyze / Synthesize

Skipping this means the model silently decides the research sample set without user review.

### 2. Research and creation were collapsed into one pass

`skill-researcher` is supposed to end in a **Fusion Report** or similar research handoff. The downstream creation stage should consume that artifact later.

Instead, research findings were pushed straight into skill authoring.

That creates two risks:

- weak or biased research assumptions get baked directly into the product
- it becomes impossible to tell whether an idea came from research or from downstream author judgment

### 3. Explicitly named skills lost their protocol value

If a skill is explicitly named by the user, but the workflow only borrows its ideas rather than obeying its gates, then the skill is effectively being treated like a reference document instead of a reusable operational protocol.

That undermines the whole point of having skills.

### 4. This can recur across projects

This is not specific to `git-worktree-workflows`. Any future task that chains:

- `skill-lifecycle-manager`
- plus a delegated specialist like `skill-researcher`

can repeat the same error unless the delegation boundary is made explicit.

## Root Cause

The root cause is best described as a **delegation protocol gap**.

`skill-lifecycle-manager` currently allows `Discover` to use `skill-researcher`, but it does not make the following strong enough:

- once delegated, the delegated skill's checkpoints become mandatory
- downstream stages must not resume until those checkpoints are satisfied

As a result, the delegated specialist can be treated as:

- "research guidance"

instead of:

- "a workflow with binding pauses and deliverables"

This is why the failure should be fixed primarily in the skills themselves, not only in repo-level instructions.

## Why Not Fix This Only in Root Repo Instructions

It would be possible to add a rule to `AGENTS.md` or `CLAUDE.md` such as:

- "If the user explicitly names a skill, follow that skill exactly."

That would help in this repository, but it is not the best primary fix.

Reasons:

1. The problem is cross-project, not repo-specific.
2. The failure concerns inter-skill choreography, not project policy.
3. Root rules are too broad to capture the exact delegated pause semantics.
4. If fixed only at the repo level, the same failure can still happen in other repositories using the same skills.

Therefore the preferred fix is:

- fix the behavior at the skill level
- add evals so the behavior becomes testable

Repo-level guidance can still be added later if desired, but it should not be the main remedy.

## Target Behavior After the Fix

After the fix:

1. If `skill-lifecycle-manager` enters `Discover` and actually uses `skill-researcher`, it must inherit `skill-researcher`'s checkpoints.
2. In a deep research request, the flow must stop after candidate inventory and wait for user confirmation.
3. The default output of `skill-researcher` must remain a separate research artifact, not direct skill authoring.
4. `skill-lifecycle-manager` must not continue into `Create / Update` until the research confirmation gate is satisfied.
5. Evals should fail if the system jumps from "deep research requested" directly into skill package creation.

## Proposed Fix Scope

The recommended fix touches two skills and their evaluation coverage:

- `skills/skill-lifecycle-manager/`
- `skills/skill-researcher/`

The actual `git-worktree-workflows` skill does not need to be the primary target of this fix. It only served as the task that exposed the issue.

## Proposed Changes

### A. Update `skill-lifecycle-manager`

File:

- `skills/skill-lifecycle-manager/SKILL.md`

Main objective:

- make delegated Discover workflows inherit the delegated skill's protocol

Recommended edits:

1. Add an explicit rule under `Operating Rules`:
   - If Discover delegates to a specialist skill, that specialist skill's checkpoints become mandatory.
   - Do not continue into `Create / Update` until those checkpoints have been satisfied.

2. Strengthen `Phase 2: Discover`:
   - If the Discover stage uses `skill-researcher`, the workflow must stop after candidate inventory.
   - Candidate inventory must be shown to the user for confirmation.
   - No collection, analysis, synthesis, or authoring should continue before that confirmation.

3. Update `Close The Loop`:
   - If work ends after Discover, the reported next step must explicitly be user confirmation of the candidate set.

4. Add a failure pattern:
   - Treating `skill-researcher` as inspiration instead of protocol.

5. Optionally tighten the Router table:
   - Mark `skill-researcher` as a delegated workflow with a mandatory pause point.

### B. Update `skill-researcher`

File:

- `skills/skill-researcher/SKILL.md`

Main objective:

- make the candidate confirmation gate impossible to interpret as optional

Recommended edits:

1. Add a clear `Hard Gate` section before or inside the workflow:
   - Do not proceed to Collect, Analyze, or Synthesize until the user confirms the candidate set.

2. Strengthen the candidate list handoff:
   - The candidate list is not just an FYI. It is a required pause point.

3. Clarify output ownership:
   - The default output is a separate Fusion Report or research artifact.
   - Do not automatically place full research notes into the target skill package.

4. Clarify handoff semantics:
   - `skill-researcher` ends in research handoff by default.
   - It does not automatically continue into skill creation.

5. Add a caveat:
   - Do not collapse research and creation into one pass unless the user explicitly asks for that shortcut after seeing the candidate set.

### C. Add Evaluation Coverage

Main objective:

- turn this process requirement into something testable

Recommended additions:

#### 1. Add a new case to `skill-lifecycle-manager`

File:

- `skills/skill-lifecycle-manager/eval/eval-cases.json`

Suggested scenario:

- user asks for deep research before creating a new skill

Expected behavior:

- first round stops at Discover
- candidate list is produced
- authoring does not begin yet

Suggested assertions:

- `delegated_research_protocol_respected`
- `candidate_pause_respected`
- `no_authoring_before_confirmation`

#### 2. Add an eval suite for `skill-researcher`

New file:

- `skills/skill-researcher/eval/eval-cases.json`

Suggested cases:

1. Deep research request for a new skill
   - should produce candidate list first and stop
2. User confirms the candidate set
   - should continue into Collect / Analyze / Synthesize
3. User only wants to install a skill
   - should refuse to turn into a research workflow
4. User already provides concrete source URLs
   - should narrow the search rather than running a broad survey unnecessarily

Suggested assertions:

- `candidate_inventory_produced`
- `pause_before_collect_respected`
- `fusion_report_separate_from_target_skill`
- `handoff_instead_of_authoring`

#### 3. Add projection filtering if eval is added

If `skills/skill-researcher/` gains an `eval/` directory, consider adding:

- `skills/skill-researcher/projection.json`

Suggested content:

```json
{
  "exclude": ["eval"]
}
```

This keeps eval fixtures out of projected runtime surfaces.

### D. Update Changelogs

Recommended files:

- `skills/skill-lifecycle-manager/CHANGELOG.md`
- `skills/skill-researcher/CHANGELOG.md`

Document that:

- delegated research workflows now preserve mandatory checkpoints
- candidate confirmation is now an explicit hard gate
- evaluation coverage was added to prevent skip-step regressions

## Validation Plan

After implementing the skill changes, run:

1. `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/skill-lifecycle-manager`
2. `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-lifecycle-manager/eval/eval-cases.json`
3. `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/skill-researcher`
4. `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-researcher/eval/eval-cases.json`
5. `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python skills/skill-lifecycle-manager/scripts/project_skill.py skills/skill-lifecycle-manager --platform all --scope project`
6. `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python skills/skill-lifecycle-manager/scripts/project_skill.py skills/skill-researcher --platform all --scope project`
7. `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/skill-lifecycle-manager --platform all --scope project`
8. `env UV_CACHE_DIR=/tmp/uv-cache-my-agents uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/skill-researcher --platform all --scope project`
9. `npm run build`
10. `npm test`

## Notes for the Follow-up Session

Important framing for the next agent:

- This is a protocol-fix task, not a normal content rewrite.
- The main thing to preserve is user control over deep research scope.
- The main thing to prevent is skipping directly from Discover into authoring.
- The fix should live primarily in the skills, not in project-root policy.

## Suggested Prompt for the Follow-up Window

Use this if a new session needs to implement the actual fix:

> We need to fix a skill orchestration protocol bug, not just revise wording. In a previous task, `skill-lifecycle-manager` delegated Discover work to `skill-researcher`, but the workflow skipped the candidate confirmation gate and continued directly into skill authoring. Update `skills/skill-lifecycle-manager/SKILL.md` so delegated Discover workflows inherit the delegated skill's checkpoints, update `skills/skill-researcher/SKILL.md` so candidate confirmation is an explicit hard gate and Fusion Report remains a separate research artifact by default, then add eval coverage so a deep-research request that jumps straight into authoring fails. Use `research/skill-workflow-protocol-fix-plan-20260327.md` as the design brief.
