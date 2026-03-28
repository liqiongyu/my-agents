# Local Reference Repositories Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a local-only workflow for external reference repositories that keeps the repo list and clones out of Git while giving agents a stable discovery path.

**Architecture:** Store shared guidance in tracked instruction sources, keep the actual reference index in `.my-agents/reference-repos.json`, clone repos into `workspaces/references/`, and manage everything through a small Node CLI that can add, list, sync, and remove entries.

**Tech Stack:** Node.js, npm scripts, Markdown, Git

---

### Task 1: Document the canonical local-only workflow

**Files:**
- Modify: `instructions/root/shared.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`

**Step 1: Add shared agent guidance**

Describe the tracked-to-local handoff: tracked instructions should point agents at `.my-agents/reference-repos.json` when it exists, while the file itself and the cloned repos remain ignored.

**Step 2: Document the operator workflow**

Add a short README section that explains where the local manifest lives, where reference repos are cloned, and which command manages them.

### Task 2: Add CLI automation for local reference repos

**Files:**
- Create: `scripts/sync-references.js`
- Modify: `package.json`

**Step 1: Add a manifest-driven CLI**

Implement `list`, `add`, `sync`, and `remove` commands around `.my-agents/reference-repos.json`, including duplicate detection and deterministic path generation under `workspaces/references/`.

**Step 2: Add npm entrypoint**

Expose the tool through `npm run sync-references -- <command>` so the workflow matches the repo's existing script conventions.

### Task 3: Seed the local manifest and verify behavior

**Files:**
- Create locally (ignored): `.my-agents/reference-repos.json`
- Create locally (ignored): `workspaces/references/<owner>__<repo>/...`

**Step 1: Populate the local manifest from the approved reference list**

Use the new CLI to add the deduplicated repositories without committing the manifest.

**Step 2: Sync and verify**

Run the sync command so missing repos clone into `workspaces/references/`, then verify the manifest, generated instructions, formatting, and script linting all pass.
