# Phase 1 Script And Documentation Modularization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce coupling in the repository tooling by extracting shared catalog and filesystem logic, slimming the root READMEs, and creating dedicated command and architecture docs without changing the public npm command surface.

**Architecture:** Keep `package.json` scripts stable as thin entrypoints. Introduce a small `scripts/lib/` layer that centralizes reusable filesystem helpers plus catalog collection and rendering, then refactor `scripts/build-catalog.js` and `scripts/validate.js` to consume those modules. Move detailed command explanations out of the root READMEs into `docs/cli/` and `docs/architecture/`, leaving the root READMEs as navigational entrypoints.

**Tech Stack:** Node.js CommonJS, npm scripts, Markdown

---

### Task 1: Extract shared filesystem and catalog helpers

**Files:**
- Create: `scripts/lib/fs-utils.js`
- Create: `scripts/lib/catalog.js`
- Modify: `scripts/build-catalog.js`
- Modify: `scripts/validate.js`

**Step 1: Capture the current catalog behavior**

Run:

```bash
npm run build
node scripts/validate.js
```

Expected:
- `npm run build` exits `0`
- `node scripts/validate.js` reports the current repo state exactly as before the refactor

**Step 2: Create shared filesystem helpers**

Add `scripts/lib/fs-utils.js` with the shared helpers currently duplicated across scripts:

```js
const fs = require("node:fs/promises");

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(jsonPath) {
  const raw = await fs.readFile(jsonPath, "utf8");
  return JSON.parse(raw);
}

async function listDirs(baseDir) {
  if (!(await fileExists(baseDir))) return [];
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."));
}

module.exports = {
  fileExists,
  readJson,
  listDirs
};
```

**Step 3: Create shared catalog helpers**

Add `scripts/lib/catalog.js` with:

- path constants for generated catalog files
- `detectPlatforms`
- `toSkillCatalogItem`
- `toAgentCatalogItem`
- `toPackCatalogItem`
- `renderSkillsMarkdown`
- `renderAgentsMarkdown`
- `renderPacksMarkdown`
- `generateCatalogSnapshot(repoRoot)` returning:
  - `catalog`
  - `skillsMarkdown`
  - `agentsMarkdown`
  - `packsMarkdown`

**Step 4: Refactor `scripts/build-catalog.js` into a thin entrypoint**

Replace the duplicated local helpers with imports from `scripts/lib/fs-utils.js` and `scripts/lib/catalog.js`, keeping the CLI behavior unchanged:

```js
const fs = require("node:fs/promises");
const path = require("node:path");
const {
  MACHINE_CATALOG_PATH,
  SKILLS_CATALOG_PATH,
  AGENTS_CATALOG_PATH,
  PACKS_CATALOG_PATH,
  generateCatalogSnapshot
} = require("./lib/catalog");
```

**Step 5: Refactor `scripts/validate.js` to reuse the shared catalog layer**

Replace the duplicated catalog collection and Markdown rendering logic with `generateCatalogSnapshot(repoRoot)` while keeping validation-only logic inside `scripts/validate.js`.

**Step 6: Re-run the catalog commands**

Run:

```bash
npm run build
node scripts/validate.js
```

Expected:
- command exit codes match the pre-refactor baseline
- generated catalog files remain semantically identical except for expected `generatedAt` churn in `dist/catalog.json`

**Step 7: Commit**

```bash
git add scripts/lib/fs-utils.js scripts/lib/catalog.js scripts/build-catalog.js scripts/validate.js dist/catalog.json docs/catalog/skills.md docs/catalog/agents.md docs/catalog/packs.md
git commit -m "refactor(tooling): extract shared catalog helpers"
```

### Task 2: Separate validation-only helpers from validation orchestration

**Files:**
- Create: `scripts/lib/validate-utils.js`
- Modify: `scripts/validate.js`

**Step 1: Extract pure validation helpers**

Move the reusable non-catalog helpers into `scripts/lib/validate-utils.js`:

- `formatAjvErrors`
- `checkChangelogHasVersion`
- `pushUnknownCategoryErrors`
- `findDuplicates`
- `validateProjectManifestReferences`
- `detectAgentCycles`

Export them as plain functions and keep side effects in `scripts/validate.js`.

**Step 2: Refactor `scripts/validate.js` into sections**

Reorganize `scripts/validate.js` so it reads as:

```js
// imports
// schema setup
// package validation passes
// generated file freshness checks
// result reporting
```

Do not change output wording unless necessary for clarity.

**Step 3: Run lint and validation**

Run:

```bash
npx eslint scripts/validate.js scripts/lib/validate-utils.js
node scripts/validate.js
```

Expected:
- ESLint exits `0`
- validation output matches the same repo state as before the refactor

**Step 4: Commit**

```bash
git add scripts/lib/validate-utils.js scripts/validate.js
git commit -m "refactor(validate): extract validation utilities"
```

### Task 3: Introduce dedicated CLI and architecture docs

**Files:**
- Create: `docs/cli/README.md`
- Create: `docs/cli/runtime-and-sync-commands.md`
- Create: `docs/architecture/tooling-layout.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`

**Step 1: Add a CLI index**

Create `docs/cli/README.md` that groups commands by operator task:

- authoring commands
- runtime install/sync commands
- local reference repo commands
- validation and formatting commands

**Step 2: Move detailed command explanations out of the root READMEs**

Create `docs/cli/runtime-and-sync-commands.md` with the detailed behavior now spread across the README sections for:

- `install-skill`
- `install-agent`
- `install-pack`
- `sync-project`
- `sync-instructions`
- `sync-references`

Keep exact command examples there.

**Step 3: Add an architecture note for maintainers**

Create `docs/architecture/tooling-layout.md` that explains:

- why `package.json` scripts stay stable
- what belongs in `scripts/lib/`
- what belongs in top-level CLI entrypoints under `scripts/`
- why root READMEs should stay short

**Step 4: Slim the root READMEs**

Update `README.md` and `README.zh-CN.md` so they:

- keep the repository layout table
- keep the highest-frequency workflows
- replace long command explanations with links to `docs/cli/`
- link maintainers to `docs/architecture/tooling-layout.md`

Do not remove beginner-friendly quick start guidance.

**Step 5: Run formatting**

Run:

```bash
npx prettier --write docs/cli/README.md docs/cli/runtime-and-sync-commands.md docs/architecture/tooling-layout.md README.md README.zh-CN.md
```

Expected:
- Prettier exits `0`

**Step 6: Commit**

```bash
git add docs/cli/README.md docs/cli/runtime-and-sync-commands.md docs/architecture/tooling-layout.md README.md README.zh-CN.md
git commit -m "docs(tooling): split cli and architecture guidance"
```

### Task 4: Verify the phase end-to-end

**Files:**
- Test: `scripts/build-catalog.js`
- Test: `scripts/validate.js`
- Test: `README.md`
- Test: `README.zh-CN.md`
- Test: `docs/cli/README.md`
- Test: `docs/cli/runtime-and-sync-commands.md`
- Test: `docs/architecture/tooling-layout.md`

**Step 1: Run the full tooling verification path**

Run:

```bash
npm run build
npm run sync-instructions -- --check
npm test
```

Expected:
- `npm run build` exits `0`
- generated instruction files are up to date
- `npm test` reflects only real repository issues, not regressions introduced by the modularization

**Step 2: Spot-check the public operator surface**

Run:

```bash
npm run sync-project -- --help
npm run sync-references -- --help
```

Expected:
- both commands still present the same public entrypoints
- no command names changed in `package.json`

**Step 3: Review README information architecture**

Confirm:
- root READMEs are shorter and easier to scan
- detailed operational content moved to `docs/cli/`
- maintainer-facing structure moved to `docs/architecture/`

**Step 4: Commit**

```bash
git add package.json scripts docs README.md README.zh-CN.md
git commit -m "refactor(tooling): complete phase 1 modularization"
```
