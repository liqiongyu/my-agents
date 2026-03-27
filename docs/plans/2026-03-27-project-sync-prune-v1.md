# Project Sync Prune V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend `sync-project` with safe pruning so project-scope runtime surfaces can converge toward the manifest's desired state without deleting unrelated user-managed installs.

**Architecture:** Add a hidden, ignored state file that records the skills and agents previously managed by `sync-project` per platform. When `--prune` is passed, compute the new desired state from the manifest, uninstall only previously managed items that are no longer desired, then persist the updated state.

**Tech Stack:** Node.js 18+, CommonJS, existing install helpers, JSON files, Markdown docs

---

### Task 1: Define Sync State Behavior

**Files:**
- Modify: `.gitignore`
- Create: `.my-agents/project-sync-state.json` (runtime only, not committed)

**Step 1: Choose a state file path**

Use a project-local hidden file such as:

```text
.my-agents/project-sync-state.json
```

**Step 2: Ignore it in git**

Update `.gitignore` so the sync state directory is not tracked.

**Step 3: Keep the state file simple**

Suggested shape:

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-03-27T00:00:00.000Z",
  "manifestPath": "my-agents.project.json",
  "platforms": {
    "claude": {
      "packs": ["product-manager"],
      "skills": ["clarify", "brainstorming"],
      "agents": ["explorer", "planner"]
    },
    "codex": {
      "packs": ["product-manager"],
      "skills": ["clarify", "brainstorming"],
      "agents": ["explorer", "planner"]
    }
  }
}
```

### Task 2: Add `--prune` to Sync

**Files:**
- Modify: `scripts/install.js`
- Modify: `README.md`
- Modify: `docs/metadata/project-manifest-policy.md`

**Step 1: Extend CLI parsing**

Support:

```bash
npm run sync-project -- --prune
npm run sync-project -- --manifest docs/examples/my-agents.project.example.json --platform codex --prune
```

**Step 2: Compute desired managed members**

Expand manifest packs into effective `skills` and `agents` sets, then combine with direct manifest additions.

**Step 3: Load previous state**

Behavior:
- if the state file is missing, treat previous managed sets as empty
- if `--prune` is used and the state file is invalid, fail clearly instead of guessing

**Step 4: Prune only managed items**

For each selected platform:
- uninstall previously managed skills no longer desired
- uninstall previously managed agents no longer desired

Do not touch installs not recorded in the sync state file.

**Step 5: Persist updated state**

After a successful sync, write the new state for operated platforms and preserve untouched platform state.

### Task 3: Verify Safety

**Files:**
- Modify: `README.md`

**Step 1: Test first sync without prune**

Run:

```bash
cp docs/examples/my-agents.project.example.json my-agents.project.json
npm run sync-project
```

Expected:
- install succeeds
- state file is written

**Step 2: Test prune path**

Edit the manifest to remove the pack, then run:

```bash
npm run sync-project -- --prune
```

Expected:
- previously managed pack members are removed
- unrelated project installs remain untouched

**Step 3: Clean up temporary files**

Run:

```bash
rm my-agents.project.json
```

Expected:
- no temporary manifest remains in the repo root
