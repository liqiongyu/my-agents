# Docs Governance Verification Rubric

Use this rubric for `Refresh`, `Verify`, and final self-checks before claiming a docs set is accurate and well-governed.

## Layer 1: Docs-to-Repo Alignment

Check whether pages inside the managed docs set match what the repository actually contains:

- file and directory paths
- commands, flags, and scripts
- environment variables and config keys
- service names, route names, entrypoints, and schemas
- examples, snippets, and stated workflows

If a command or path cannot be confirmed, mark it as unverified instead of guessing.

## Layer 2: Navigation and Entry Points

Check whether a reader can tell:

- where to start
- which page is authoritative for a topic
- what the next page or task should be

A technically correct docs set still fails if readers cannot navigate it confidently.

## Layer 3: Source-of-Truth Boundaries

Check that topic ownership is clear:

- one primary page or source per topic
- generated refs vs human-written guides are not pretending to be the same thing
- root docs and `docs/` pages do not silently diverge
- merged pages do not leave orphaned or contradictory leftovers behind

## Layer 4: Freshness and Drift

Look for signs the docs set no longer reflects the current system:

- renamed or removed features
- dead internal links or outdated paths
- pages that still describe old commands or old locations
- duplicate pages that now disagree
- stale screenshots or copied examples

## Layer 5: Maintainability

Prefer docs changes that keep the docs set correct more easily over time:

- fewer duplicate pages
- clearer landing pages and section maps
- links instead of copied large policy or reference blocks
- scoped examples that are likely to survive future changes

## Layer 6: External Claims

When a docs page depends on facts outside the repository, verify them before approval:

- vendor defaults and platform behavior
- current versions or deprecations
- standards, regulations, and recent product changes
- linked external guides or APIs

If external verification is not possible, say so explicitly and downgrade confidence.

## Severity Guide

| Severity | Use when |
| --- | --- |
| Critical | The docs would cause a broken setup, unsafe operation, harmful recovery action, or severely misleading navigation |
| Major | The docs are materially stale, contradict the repo, point to dead core paths, or maintain multiple conflicting sources of truth |
| Minor | The issue is mainly wording, organization polish, or a low-risk detail mismatch |

## Minimum Verification Moves

Before finalizing docs-governance work:

1. Search the repo for referenced files, commands, flags, env vars, and target pages.
2. Open the most relevant source files rather than trusting old docs.
3. Run important setup or validation commands when practical.
4. Check local doc links, landing pages, and cross-doc navigation when practical.
5. State any remaining verification gaps in the final answer.
