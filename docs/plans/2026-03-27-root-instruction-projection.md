# Root Instruction Projection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a single-source workflow for shared root instructions, generate `AGENTS.md` and `CLAUDE.md`, and make synchronization mostly automatic.

**Architecture:** Keep canonical instruction fragments under `instructions/root/`, render the root files with a small Node script, and enforce freshness through a versioned Git hook plus validation. This preserves platform-specific deltas without hand-maintaining two near-duplicate files.

**Tech Stack:** Node.js, npm scripts, Git hooks, Markdown

---

### Task 1: Add canonical root instruction sources

**Files:**
- Create: `instructions/root/shared.md`
- Create: `instructions/root/claude.md`
- Create: `instructions/root/codex.md`

**Step 1: Write the shared and platform-specific fragments**

Capture the repository-wide rules in `shared.md`, then keep only Claude-specific caveats in `claude.md` and Codex-specific caveats in `codex.md`.

**Step 2: Verify the split matches the intended maintenance model**

Confirm that shared rules no longer need to be hand-edited twice and that platform-specific notes stay small.

### Task 2: Add generation and automation

**Files:**
- Create: `scripts/instruction-sync.js`
- Create: `scripts/sync-instructions.js`
- Create: `scripts/setup-git-hooks.js`
- Create: `.githooks/pre-commit`
- Modify: `package.json`

**Step 1: Add a reusable renderer**

Implement a small Node helper that reads the canonical fragments and renders target outputs for `AGENTS.md` and `CLAUDE.md`.

**Step 2: Add CLI entrypoints**

Provide a write mode and a `--check` mode so humans, hooks, and CI can all use the same logic.

**Step 3: Wire local automation**

Install a versioned `pre-commit` hook through a lightweight setup script and have the hook regenerate plus stage the root instruction files automatically.

### Task 3: Regenerate root files and document the workflow

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`

**Step 1: Regenerate the root instruction files**

Replace the hand-written roots with generated outputs so the runtime files match the new source-of-truth model.

**Step 2: Update contributor docs**

Document where the canonical instruction fragments live, how to regenerate them, and how the hook plus validation protect against drift.

### Task 4: Verify end-to-end behavior

**Files:**
- Test: `package.json`
- Test: `scripts/sync-instructions.js`

**Step 1: Run sync in write mode**

Ensure the generated files are created from the canonical fragments without manual edits.

**Step 2: Run sync in check mode and full validation**

Verify that stale files fail check mode and that repository validation now covers instruction drift as well.
