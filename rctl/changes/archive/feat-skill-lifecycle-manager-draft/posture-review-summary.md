# Posture Review Summary

## Scope

This summary consolidates the two split posture-review iterations for `skill-lifecycle-manager`:

- `iteration-1`: `/private/tmp/slm-trigger-posture-test/skill-lifecycle-manager/iteration-1`
- `iteration-2`: `/private/tmp/slm-trigger-posture-test/skill-lifecycle-manager/iteration-2`

Reference artifacts:

- panels:
  - `/private/tmp/slm-trigger-posture-test/skill-lifecycle-manager/iteration-1/review/index.html`
  - `/private/tmp/slm-trigger-posture-test/skill-lifecycle-manager/iteration-2/review/index.html`
- assistant baselines:
  - `/private/tmp/slm-trigger-posture-test/skill-lifecycle-manager/iteration-1/review/assistant-review.json`
  - `/private/tmp/slm-trigger-posture-test/skill-lifecycle-manager/iteration-2/review/assistant-review.json`

## What We Tested

- explicit manual-first routing for heavy governance skill creation
- negative boundaries for general PR review, agent install, and API-description requests
- overlap-aware lifecycle triage for a README-focused skill request
- the `hybrid` versus `auto-first` boundary for a narrow frontmatter utility skill
- manual-first trigger tightening for `skill-lifecycle-manager` itself
- near-miss routing for a skill-library platform-readiness check

## Consolidated Findings

### 1. Manual-first positioning is working

Both Codex and Claude Code consistently treat `skill-lifecycle-manager` itself as a heavy meta-skill that should stay `manual-first`.

Evidence:

- `tp-manual-audit-skill` selected `manual-first` on both surfaces
- `tp-manual-trigger-tightening` selected `manual-first` on both surfaces

Interpretation:

- the current shortened description and explicit negative boundary are doing the right thing
- the skill is no longer drifting toward "catch every vaguely related request"

### 2. Negative boundaries are strong

Both surfaces correctly declined to route:

- general PR review
- agent installation
- non-skill documentation description work

Interpretation:

- the current trigger boundary is materially tighter than the earlier high-recall direction
- the skill now distinguishes "skill lifecycle work" from adjacent repo work reliably enough for practical use

### 3. Overlap-aware triage is a feature, not a bug

On the README-focused case, both surfaces treated duplicate-intent checking as part of the correct lifecycle response.

Interpretation:

- this is desirable behavior for a lifecycle manager
- recommending "update or retune an existing skill" is often better than minting a duplicate skill
- the fixture and review guidance should explicitly reward that behavior

### 4. The `hybrid`/`auto-first` boundary is still judgment-sensitive

On the tiny frontmatter utility case:

- Claude Code chose `auto-first`
- Codex chose a conservative `hybrid`

Interpretation:

- this is acceptable cross-surface variation rather than a clear failure
- the meaningful signal is whether the reasoning keeps implicit triggering tightly bounded to obvious frontmatter-cleanup cases
- exact label matching is less important than boundary discipline here

### 5. Claude Code still tends to widen the route more than Codex

This shows up most clearly in the manual-first audit case and the platform-readiness near miss.

Interpretation:

- Claude Code often adds an extra overlap-check or remediation stage
- this is worth noting for reviewers, but it no longer looks like a correctness problem

## Overall Judgment

`skill-lifecycle-manager` now meets the intent of this change:

- it is router-shaped rather than monolithic
- it covers the full lifecycle
- it encodes invocation posture explicitly
- it has cross-platform projections and projection validation
- it has direct CLI evaluation on both Codex and Claude Code
- it has a lightweight human review surface
- its posture-aware trigger suite now reflects realistic cross-surface behavior instead of fake exactness

## Closure Recommendation

This change is ready to close from a functionality and verification standpoint.

Why:

- the acceptance criteria in `plan.md` are satisfied
- the remaining differences are judgment/style differences, not core correctness failures
- the remaining engineering issues (`sys.path` hack, lack of unit tests, large single-file review panel) are P3 follow-ups rather than blockers for adoption

If we want to continue later, the best follow-up is a separate polish change focused on:

- packaging the Python helpers more cleanly
- adding a few targeted unit tests
- splitting the review panel into template/assets only if it continues to grow
