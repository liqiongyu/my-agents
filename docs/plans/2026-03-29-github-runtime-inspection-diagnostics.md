# GitHub Runtime Inspection Diagnostics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an operator-facing `npx my-agents issue-driven-os github inspect` command that exposes runtime leases, issue summary state, recent runs, and per-run artifact paths in text and JSON forms without changing the persisted runtime layout.

**Architecture:** Extend the existing read side of the issue-driven OS runtime instead of changing the writer path. Add state-store helpers for leases, run records, and artifact files; compose them in a GitHub-runtime inspection module; then surface the result through the existing CLI with deterministic text formatting and JSON output.

**Tech Stack:** Node.js 18+, CommonJS, built-in `node:test`, existing CLI/runtime helpers under `scripts/lib/`

---

### Task 1: Add runtime inspection read helpers

**Files:**
- Modify: `scripts/lib/issue-driven-os-state-store.js`
- Test: `scripts/tests/issue-driven-os-state-store.test.js`

**Step 1: Write the failing test**

Add coverage that persists lease, run, and artifact fixtures, then asserts helper functions can list lease records, read a run by id, list runs newest-first input-ready, and enumerate artifact files for one run.

**Step 2: Run test to verify it fails**

Run: `node --test scripts/tests/issue-driven-os-state-store.test.js`
Expected: FAIL because the new read helpers do not exist yet.

**Step 3: Write minimal implementation**

Add read helpers that:
- safely enumerate `leases/*.json`
- safely enumerate `runs/*.json`
- read one run record by id
- enumerate artifact files under `artifacts/<runId>/`
- return deterministic ordering

**Step 4: Run test to verify it passes**

Run: `node --test scripts/tests/issue-driven-os-state-store.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/lib/issue-driven-os-state-store.js scripts/tests/issue-driven-os-state-store.test.js
git commit -m "feat(issue-os): add runtime inspection read helpers"
```

### Task 2: Add GitHub runtime inspection summary and formatting

**Files:**
- Create: `scripts/lib/issue-driven-os-github-inspection.js`
- Test: `scripts/tests/issue-driven-os-github-inspection.test.js`

**Step 1: Write the failing test**

Add coverage for:
- empty runtime output
- populated runtime summary with leases, issue summary state, and recent runs
- narrowed run inspection with persisted run record and artifact file locations

**Step 2: Run test to verify it fails**

Run: `node --test scripts/tests/issue-driven-os-github-inspection.test.js`
Expected: FAIL because the inspection module does not exist yet.

**Step 3: Write minimal implementation**

Create an inspection module that:
- builds runtime paths from `<owner>/<repo>` and optional `--runtime-root`
- reads `state.json`, `leases/*.json`, `runs/*.json`, and `artifacts/<runId>/*`
- returns stable JSON-friendly payloads
- formats human-readable diagnostics for summary mode and run-detail mode

**Step 4: Run test to verify it passes**

Run: `node --test scripts/tests/issue-driven-os-github-inspection.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/lib/issue-driven-os-github-inspection.js scripts/tests/issue-driven-os-github-inspection.test.js
git commit -m "feat(issue-os): add runtime inspection formatter"
```

### Task 3: Surface the command in the CLI

**Files:**
- Modify: `scripts/issue-driven-os-cli.js`
- Modify: `scripts/tests/cli.test.js`
- Modify: `docs/examples/issue-driven-os/README.md`

**Step 1: Write the failing test**

Add CLI help and command-behavior coverage for:
- `github inspect` appearing in usage
- missing `<owner>/<repo>` failing clearly
- `--json` emitting the inspection payload

**Step 2: Run test to verify it fails**

Run: `node --test scripts/tests/cli.test.js scripts/tests/issue-driven-os-github-inspection.test.js`
Expected: FAIL because the CLI does not route the new command yet.

**Step 3: Write minimal implementation**

Wire `github inspect` into `scripts/issue-driven-os-cli.js`, reuse the existing `--runtime-root` behavior, support optional `--run <id>` and `--limit <n>`, and document the new command in CLI-facing docs.

**Step 4: Run test to verify it passes**

Run: `node --test scripts/tests/cli.test.js scripts/tests/issue-driven-os-github-inspection.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/issue-driven-os-cli.js scripts/tests/cli.test.js docs/examples/issue-driven-os/README.md
git commit -m "feat(issue-os): add github runtime inspect command"
```

### Task 4: Final verification

**Files:**
- Modify: `docs/cli/runtime-and-sync-commands.md`

**Step 1: Run full targeted verification**

Run: `node --test scripts/tests/cli.test.js scripts/tests/issue-driven-os-state-store.test.js scripts/tests/issue-driven-os-github-inspection.test.js`
Expected: PASS

**Step 2: Run repo validation slices that could catch integration drift**

Run: `npm run test:node`
Expected: PASS

**Step 3: Update docs if needed**

Document the operator diagnostics command in the CLI docs if the help output is now the only missing discoverability surface.

**Step 4: Re-run verification**

Run: `npm run test:node`
Expected: PASS

**Step 5: Commit**

```bash
git add docs/cli/runtime-and-sync-commands.md
git commit -m "docs(issue-os): document runtime inspection diagnostics"
```
