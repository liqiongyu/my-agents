# Repo Hygiene Best Practices Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a lightweight but robust repository hygiene baseline for linting, formatting, hooks, ignore rules, and CI.

**Architecture:** Keep the existing native `.githooks` approach, add ESLint and Prettier as the main quality tools, and separate fast staged-file checks from full-repo CI validation. This keeps local friction low while still giving the repo a more production-ready contributor workflow.

**Tech Stack:** Node.js, npm scripts, ESLint flat config, Prettier, GitHub Actions

---

### Task 1: Add quality tool configs

**Files:**
- Create: `eslint.config.js`
- Create: `.prettierignore`
- Create: `prettier.config.cjs`

**Step 1: Add an ESLint flat config**

Lint the repo's JavaScript authoring tooling with Node-aware globals and low-noise rules.

**Step 2: Add a Prettier config and ignore file**

Format repository source files consistently while excluding generated artifacts, runtime projections, and other disposable state.

### Task 2: Add script entrypoints and staged checks

**Files:**
- Modify: `package.json`
- Create: `scripts/run-staged-checks.js`
- Modify: `.githooks/pre-commit`

**Step 1: Add full-repo commands**

Create `lint`, `lint:fix`, `format`, `format:check`, and a stronger `validate` pipeline.

**Step 2: Add staged-file automation**

Format and auto-fix only staged files during `pre-commit`, then re-stage them so local commits stay fast.

### Task 3: Tighten repo hygiene and CI

**Files:**
- Modify: `.gitignore`
- Modify: `.github/workflows/validate.yml`
- Optional Create: `.github/dependabot.yml`

**Step 1: Expand ignore coverage**

Ignore local runtime projections and other disposable repo state that should not be committed.

**Step 2: Improve validation workflow**

Add workflow permissions, concurrency, and a clearer validation job that runs the stronger repo checks.

**Step 3: Add dependency maintenance automation**

If low-friction, add Dependabot for npm and GitHub Actions updates.

### Task 4: Document and verify

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`

**Step 1: Document the new quality workflow**

Explain what runs locally, what CI checks, and how contributors should use the lint and format commands.

**Step 2: Run fresh verification**

Run install plus the full validation commands and fix any violations before claiming success.
