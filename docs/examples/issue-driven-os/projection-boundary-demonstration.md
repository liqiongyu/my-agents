# Projection Boundary Demonstration

This page is the Phase 3 projection-boundary example for the Issue-Driven Agent OS reference slice.

Its goal is simple:

- show how canonical objects can derive a GitHub-like projection surface
- show which lifecycle markers and references are adapter-facing
- avoid turning projection examples into new truth sources

## Boundary Rule

For this reference slice, projection is always downstream of canonical objects.

That means:

- canonical issue state is decided in canonical records
- run state is decided in run records
- change state is decided in change objects
- gate outcomes are decided in verification reports
- projection surfaces only mirror or translate those results

The projection layer may expose mismatches and request correction.
It does not redefine canonical meaning.

## Smallest Useful Projection Surface

This walkthrough uses a GitHub-like surface because it is familiar and easy to inspect.

The projection example includes:

- an issue
- labels or fields
- a branch and PR
- review state
- check or gate outcomes
- comments or links back to artifacts

It deliberately does not include:

- a new source of truth for issue state
- free-form comments as the final gate decision
- adapter-owned lifecycle semantics that disagree with canonical records

## Example Mapping: `G1`

Canonical path:

- issue
  - [canonical-issue-g1-small-bug.yaml](./objects/canonical-issue-g1-small-bug.yaml)
- run
  - [run-record-g1-success.yaml](./objects/run-record-g1-success.yaml)
- change
  - [change-object-g1-success.yaml](./objects/change-object-g1-success.yaml)
- verification
  - [verification-report-g1-pass.yaml](./objects/verification-report-g1-pass.yaml)

Possible GitHub-like projection:

| Canonical object    | Canonical signal               | GitHub-like projection example                                    | Projection notes                                              |
| ------------------- | ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| Canonical Issue     | `type: bug`                    | issue label `type:bug`                                            | Derived label, not the truth source                           |
| Canonical Issue     | `priority: p2`                 | issue label or project field `priority:p2`                        | Either form is acceptable if adapter mapping stays consistent |
| Canonical Issue     | `risk_level: low`              | issue field or label `risk:low`                                   | Projection only                                               |
| Canonical Issue     | `state: ready` then `resolved` | project status or issue state marker                              | Must stay derived from canonical lifecycle                    |
| Run Record          | `id: run_g1_small_bug_01`      | linked workflow run, check run, or issue comment                  | Runtime attempt identity stays canonical-side                 |
| Change Object       | `branch_ref` + `pr_ref`        | branch + PR #501                                                  | Platform-native delivery handle                               |
| Verification Report | gate pass results              | check run success, required status pass, or structured PR comment | Gate result comes from verification artifact first            |

## Adapter-Facing Markers

The projection layer usually needs a few explicit markers so that adapters can map canonical records to platform surfaces without inventing new semantics.

Representative marker types:

- external handle
  - issue number
  - PR number
  - review id
  - check run id
- projection state marker
  - synced
  - pending_update
  - drift_detected
- lifecycle mirror
  - issue visible status
  - PR merge eligibility
  - review requested / changes requested / approved

These markers help adapters do translation work.
They are not replacements for canonical objects.

## Gate-Blocked Projection: `GT1`

Canonical path:

- issue stays active
  - [canonical-issue-gt1-review-gate.yaml](./objects/canonical-issue-gt1-review-gate.yaml)
- change becomes blocked
  - [change-object-gt1-review-blocked.yaml](./objects/change-object-gt1-review-blocked.yaml)
- verification fails
  - [verification-report-gt1-fail.yaml](./objects/verification-report-gt1-fail.yaml)

GitHub-like projection implications:

- PR remains open
- PR review surface shows requested changes
- merge button or merge automation remains blocked
- issue is not auto-closed

The key boundary is this:
the PR review surface expresses the block, but the formal gate outcome still comes from the verification report.

## Failure Projection: `F1`

Canonical path:

- run terminates with `budget_exhausted`
  - [run-record-f1-budget-exhausted.yaml](./objects/run-record-f1-budget-exhausted.yaml)
- recovery trail is emitted
  - [handoff-bundle-f1-budget-exhausted.yaml](./objects/handoff-bundle-f1-budget-exhausted.yaml)

GitHub-like projection implications:

- issue stays open or active
- a structured handoff comment or linked artifact may be posted
- any check run tied to the failed attempt may conclude as failed or neutral
- a follow-up label such as `needs-reshape` or `needs-new-run` may appear

What must not happen:

- issue auto-close
- silent PR abandonment
- unstructured failure with no recovery artifact

## Decomposition Projection: `D1`

Canonical path:

- oversized issue is decomposed before execution
  - [canonical-issue-d1-oversized-feature.yaml](./objects/canonical-issue-d1-oversized-feature.yaml)

GitHub-like projection implications:

- parent issue may remain open
- child issues may be created or linked
- project board may show the parent as decomposed or split
- no PR or change object should exist yet

This is important because it prevents projection surfaces from implying execution has started when the canonical runtime says no run exists yet.

## What Adapters Translate, And What They Do Not

Adapters may translate:

- canonical identifiers into platform handles
- canonical lifecycle changes into visible platform markers
- verification outcomes into checks, review decisions, or merge eligibility
- artifact links into comments or metadata fields

Adapters must not translate:

- a comment thread into canonical gate truth
- a label change into authoritative issue lifecycle mutation without canonical approval
- platform mergeability into final canonical verification success

## Projection Drift Example

One useful reason to model projection explicitly is drift detection.

Example:

- canonical issue remains `active`
- a projection surface accidentally shows the issue as closed

The correct response is:

1. detect drift
2. mark projection state as inconsistent
3. let the control plane or projection service repair the surface

The correct response is not:

- silently treating the projection state as the new truth source

## Why This Page Exists

The reference slice needs one projection example so later implementation work does not collapse canonical ontology into GitHub-first semantics.

This page therefore demonstrates:

- projection is useful
- projection is expected
- projection is derivative

## Next References

- full walkthrough:
  - [runtime-walkthrough.md](./runtime-walkthrough.md)
- current architecture:
  - [issue-agent-os-architecture.md](../../architecture/issue-agent-os-architecture.md)
- system blueprint:
  - [issue-driven-agent-operating-system.md](../../architecture/issue-driven-agent-operating-system.md)
