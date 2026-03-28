# Phase 2 Install Script Modularization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split `scripts/install.js` into focused modules so install, uninstall, project sync, manifest validation, projection behavior, and help handling evolve independently without changing the public npm command surface.

**Architecture:** Keep `scripts/install.js` as a thin CLI entrypoint that parses args, prints usage, and dispatches. Move reusable install logic into `scripts/lib/` modules for projection rules, runtime targets, project manifest handling, project sync state, and install/uninstall orchestration.

**Tech Stack:** Node.js CommonJS, npm scripts, Markdown, JSON schema validation

---

### Task 1: Extract shared install helpers and state handling

**Files:**
- Create: `scripts/lib/install-shared.js`
- Create: `scripts/lib/runtime-targets.js`
- Create: `scripts/lib/project-sync-state.js`
- Modify: `scripts/install.js`

**Step 1: Add helper modules**

Move shared constants and utility helpers out of `scripts/install.js`, including:

- platform constants
- `unique`
- `uniqueSorted`
- `difference`
- usage text
- project sync state normalization helpers

**Step 2: Keep behavior stable**

Ensure install and uninstall output wording remains unchanged.

### Task 2: Extract projection and manifest logic

**Files:**
- Create: `scripts/lib/projection.js`
- Create: `scripts/lib/project-manifest.js`
- Modify: `scripts/install.js`

**Step 1: Move skill projection behavior**

Extract:

- `normalizeRoots`
- `buildExcludedRoots`
- `loadProjectionConfig`
- `copySkillDirAtomic`

**Step 2: Move manifest validation and pack metadata**

Extract:

- project manifest schema validation
- project manifest loading
- pack metadata loading
- manifest member expansion

### Task 3: Extract runtime install orchestration

**Files:**
- Create: `scripts/lib/install-runtime.js`
- Modify: `scripts/install.js`

**Step 1: Move install and uninstall operations**

Extract:

- `installSkill`
- `installAgent`
- `installPack`
- `uninstallSkill`
- `uninstallAgent`
- `uninstallPack`
- `syncProject`
- `runAll`

**Step 2: Keep `scripts/install.js` thin**

Leave only:

- arg parsing
- help handling
- final dispatch

### Task 4: Fix help behavior and verify end-to-end

**Files:**
- Modify: `scripts/install.js`

**Step 1: Fix `--help` precedence**

Make sure these commands print help instead of performing installs:

```bash
node scripts/install.js --help
npm run sync-project -- --help
```

**Step 2: Verify**

Run:

```bash
npx eslint scripts/install.js scripts/lib/*.js
node scripts/install.js --help
npm run sync-project -- --help
npm run sync-references -- --help
npm test
```

Expected:
- install help commands show usage without mutating project state
- script linting passes
- `npm test` reflects only real repo issues outside this refactor, if any
