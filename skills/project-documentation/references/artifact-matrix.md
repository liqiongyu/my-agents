# Docs Governance Matrix

Use this guide when deciding what kind of `docs/` governance change the request actually needs. Pick the smallest action that improves the docs set meaningfully.

## Primary Governance Actions

| Action | Choose it when | Usually produce | Usually avoid |
| --- | --- | --- | --- |
| Landing-page or index improvement | Readers cannot tell where to start or how topics relate | start-here page, section map, audience split, cross-links | rewriting every child page without fixing navigation |
| Consolidation | Multiple pages cover the same setup, troubleshooting, or concept area | merged page, redirect notes, source-of-truth cleanup | deleting pages before unique value is preserved |
| Structural reorganization | The docs tree no longer matches how readers think about the system | clearer subfolders, renamed sections, topic ownership boundaries | cosmetic moves with no navigation gain |
| Refresh after code changes | Commands, paths, env vars, or flows drifted after implementation work | targeted edits to stale pages plus index touch-ups if needed | full-doc rewrites when only a few sections changed |
| Audit or verification | The user wants to know whether the docs set still matches the repository | findings report with severity, evidence, and fix direction | broad rewriting before reporting the drift clearly |

## Selection Rules

- If the request is explicitly about `README.md`, use `readme-craftsman` instead of this skill.
- If the task is a PR, diff, or artifact-scoped review, use `review` instead of this skill.
- If the request is a one-off document outside the managed docs set, do not stretch this skill to cover it.
- If the docs set lacks a clear entry point, fix navigation before deep page-by-page polishing.
- If many pages disagree on the same topic, prefer consolidation over patching every copy.

## Mode Mapping

| Mode | Best fit | Typical trigger words |
| --- | --- | --- |
| `Structure` | The docs set is confusing, bloated, or badly organized | reorganize, restructure, clean up, consolidate, improve navigation |
| `Refresh` | The docs set exists but drifted after implementation changes | refresh, sync, update, fix stale docs |
| `Verify` | The user wants to know whether the docs set is still accurate | check, audit, validate, verify |

## Practical Heuristics

- Prefer landing-page work when the problem is "I don't know where to start."
- Prefer consolidation when setup or troubleshooting knowledge exists in multiple places.
- Prefer a source-of-truth map when generated refs, root docs, and `docs/` pages overlap.
- Prefer targeted refreshes when the structure is fine but commands or paths drifted.
