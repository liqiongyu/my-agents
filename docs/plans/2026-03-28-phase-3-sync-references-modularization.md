# Phase 3 Sync References Modularization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce coupling in `scripts/sync-references.js` by extracting Git execution and reference-manifest behavior into reusable modules while keeping the `npm run sync-references` command surface unchanged.

**Architecture:** Keep `scripts/sync-references.js` as a thin CLI entrypoint. Move manifest parsing, normalization, path derivation, and repository lookup into `scripts/lib/reference-repos.js`, and move clone/pull execution into `scripts/lib/git-utils.js`.

**Tech Stack:** Node.js CommonJS, npm scripts, Git, Markdown

---

### Task 1: Extract reference-manifest logic

**Files:**
- Create: `scripts/lib/reference-repos.js`
- Modify: `scripts/sync-references.js`

**Step 1: Move manifest and path logic**

Extract:

- manifest path constants
- URL parsing
- relative path normalization
- default clone path generation
- manifest normalization
- manifest read/write helpers
- repository label and lookup helpers

**Step 2: Keep manifest shape stable**

Do not change `.my-agents/reference-repos.json` format.

### Task 2: Extract Git synchronization logic

**Files:**
- Create: `scripts/lib/git-utils.js`
- Modify: `scripts/sync-references.js`

**Step 1: Move clone/pull behavior**

Extract:

- spawned Git command execution
- clone vs pull decision
- non-empty path protection

**Step 2: Keep output wording stable**

Preserve the existing `Cloning ...`, `Updating ...`, and summary output.

### Task 3: Verify the public operator surface

**Files:**
- Test: `scripts/sync-references.js`
- Test: `scripts/lib/reference-repos.js`
- Test: `scripts/lib/git-utils.js`

**Step 1: Run targeted verification**

Run:

```bash
npx eslint scripts/sync-references.js scripts/lib/reference-repos.js scripts/lib/git-utils.js
node scripts/sync-references.js --help
node scripts/sync-references.js list
node scripts/sync-references.js sync
```

Expected:
- lint exits `0`
- help output stays unchanged
- list shows the existing local manifest contents
- sync updates the current local references without changing manifest shape
