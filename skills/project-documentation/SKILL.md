---
name: project-documentation
description: >
  Govern a repository's `docs/` directory or docs site by reorganizing structure,
  consolidating overlapping pages, refreshing stale docs after code changes, and
  auditing documentation for drift, dead links, duplication, and missing source-of-truth
  boundaries. Use when the user explicitly wants to clean up, restructure, maintain,
  or verify a docs set rather than write a README or review a PR. Do not use it for
  README-only requests, one-off root-level docs outside the docs set, deep external
  research, or generic PR/diff review.
invocation_posture: manual-first
version: 0.1.0
---

# Docs Governance

Govern a repository's `docs/` directory or equivalent docs set from repository reality rather than generic documentation advice. This skill is for documentation-system maintenance work: mapping the docs tree, consolidating duplicate pages, improving navigation and source-of-truth structure, refreshing stale docs after changes, and auditing docs for drift.

## Outputs

- Docs-set inventories with topic clusters, source-of-truth notes, and overlap findings
- Consolidation plans for `docs/` sprawl, duplicate pages, and broken information architecture
- Updated docs indexes, landing pages, navigation pages, and cross-links
- Targeted refreshes to pages inside `docs/` after code or workflow changes
- Verification reports covering drift, dead links, stale commands, and docs-to-repo mismatches
- Short assumptions logs when the repository does not fully answer an important documentation claim

## Invocation Posture

Treat this skill as `manual-first`.

Why:

- It overlaps with narrower skills such as `readme-craftsman` and `review`
- Governance work can expand quickly across many files
- The user usually knows when they want `docs/` maintenance rather than a single-file artifact

## When Not To Use

- Explicit `README.md` creation, update, or audit. Use `readme-craftsman`.
- Broad project-document authoring outside the managed docs set, such as a one-off root-level architecture memo or ad hoc guide that does not belong to `docs/`.
- Review of a PR, diff, commit, or named file set where the user wants severity-graded review findings on changed artifacts. Use `review`.
- Deep, citation-heavy external research where the main deliverable is the research itself. Use `deep-research`.
- Chinese pre-publish editorial or compliance review. Use `editorial-review`.
- Format conversion such as DOCX, PDF, or PPTX to Markdown. Use a document-conversion workflow instead.
- High-impact ambiguity about whether the task is really docs governance or a different documentation artifact. Use `clarify` if that ambiguity would materially change the deliverable.

## Supported Work

Use this skill for `docs/`-centric work such as:

- reorganizing the docs tree, landing pages, and local navigation
- consolidating overlapping setup, troubleshooting, or concept pages
- refreshing docs pages after refactors, renamed paths, or changed commands
- auditing docs for stale claims, dead links, duplicate sources of truth, and missing ownership boundaries
- adding or improving docs indexes, start-here pages, and topic maps
- tightening source-of-truth boundaries between `docs/`, generated references, runbooks, and root files

## Detailed References

- Read [artifact-matrix.md](references/artifact-matrix.md) when deciding what kind of docs-governance action fits the request.
- Read [verification-rubric.md](references/verification-rubric.md) when updating or auditing a docs set, or before finalizing navigation and source-of-truth changes.

## Core Rules

1. Default to the `docs/` directory or equivalent docs set as the managed surface.
2. Prefer fewer, clearer sources of truth over proliferating new pages.
3. Preserve unique value before deleting or merging anything.
4. Never invent commands, file paths, env vars, or docs pages that the repository does not support.
5. For external facts, vendor behavior, versions, or recent changes, verify them before treating them as accurate.
6. When auditing docs, findings come first; do not silently rewrite the whole docs set unless the user asked for fixes.
7. Keep cross-links, entry points, and local navigation coherent after restructuring.

## Workflow

### Phase 1: Classify the Governance Task

Identify:

- mode: `Structure`, `Refresh`, or `Verify`
- scope root: `docs/`, a docs site folder, or another explicit documentation subtree
- primary problem: navigation, duplication, stale content, broken source-of-truth boundaries, or mixed issues

Use these defaults:

- The user asks to reorganize, restructure, consolidate, clean up, or improve docs navigation: `Structure`
- The docs set exists but drifted after product or code changes: `Refresh`
- The user asks to check whether the docs set still matches the repository: `Verify`

If the request is materially ambiguous after reading the repository, ask the smallest question that changes the managed scope or mode. Otherwise proceed with stated assumptions.

### Phase 2: Inventory the Docs Set

Before editing, map the docs surface:

- list the pages under the managed docs root
- identify landing pages, indexes, and likely reader entry points
- cluster pages by topic such as setup, concepts, API, operations, and troubleshooting
- note overlaps, contradictions, and duplicate sources of truth
- identify references to root files, generated references, or external docs that the docs set depends on

Capture:

- what the docs set is trying to help readers do
- which pages are authoritative vs derivative
- where navigation breaks down
- where commands, paths, or claims look stale

### Phase 3: Route by Mode

#### Structure

1. Build a topic map from the docs inventory.
2. Decide the minimum structural change that fixes the real problem:
   - better landing page
   - clearer subfolder split
   - merged duplicate pages
   - source-of-truth cleanup
3. Propose or apply a target structure that:
   - reduces overlap
   - preserves unique value
   - gives readers a clear start path
4. Update indexes, local navigation, and cross-links after moving or consolidating content.

#### Refresh

1. Compare the current docs set to repository reality.
2. Update stale commands, file paths, flags, examples, and references.
3. Preserve accurate sections whenever possible.
4. If drift comes from duplicate pages, consolidate instead of patching every copy.
5. Keep the docs set aligned with its current source-of-truth boundaries.

#### Verify

Use [verification-rubric.md](references/verification-rubric.md).

1. Check docs-to-repo alignment:
   - paths, commands, env vars, options, and examples
2. Check information architecture:
   - clear entry points
   - coherent local navigation
   - obvious source-of-truth boundaries
3. Check drift and duplication:
   - stale pages
   - conflicting instructions
   - dead internal links
   - orphaned pages or missing indexes
4. For external claims:
   - verify current versions, vendor defaults, or linked references before approving them
5. Report findings with severity and evidence. Rewrite only if the user asked for fixes or the workflow already includes refresh work.

## Verification Loop

Before finalizing any structural or content change:

1. Re-read the result against [verification-rubric.md](references/verification-rubric.md).
2. Confirm referenced files, directories, commands, flags, and env vars still exist.
3. Check local navigation and cross-doc references when practical.
4. Make sure merged pages did not drop unique troubleshooting, caveat, or ownership detail.
5. If something could not be verified, call it out explicitly instead of guessing.

## Delivery

- `Structure` and `Refresh`: return the applied edits or proposed docs-set changes plus the key assumptions and what was verified.
- `Verify`: return findings first, ordered by severity, then open questions or fix direction.
- If the docs set needs both audit and repair, report the findings and then move into targeted fixes.

## Example Prompts

- Clean up the `docs/` directory and give it a clearer structure.
- Consolidate the overlapping setup and troubleshooting pages under `docs/`.
- Refresh the docs site after we renamed commands and moved config files.
- Audit `docs/` for stale commands, dead links, and duplicate sources of truth.
- Add a better start-here page for the docs folder without rewriting everything else.
- Check whether the runbook and onboarding pages under `docs/` still match the current repository.
