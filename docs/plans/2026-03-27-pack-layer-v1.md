# Pack Layer V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add installable, catalogued `packs/` as a composition layer above `skills/` and `agents/` without breaking existing package authoring or multi-platform install flows.

**Architecture:** Keep `skills/` and `agents/` as the canonical atomic packages. Introduce `packs/` as a pure distribution layer that explicitly references atomic members and is installed by reusing existing skill/agent install logic. Keep `categories` as search metadata only; use `packType` and `persona` for grouping semantics.

**Tech Stack:** Node.js 18+, CommonJS, JSON Schema (Ajv), Markdown catalogs, existing install/build/validate scripts

---

### Task 1: Define the Pack Metadata Contract

**Files:**
- Create: `schemas/pack.schema.json`
- Create: `docs/metadata/pack-metadata-policy.md`

**Step 1: Create the schema skeleton**

Add `schemas/pack.schema.json` with the same metadata style as `schemas/skill.schema.json` and `schemas/agent.schema.json`.

Required fields:

```json
{
  "schemaVersion": 1,
  "name": "product-manager",
  "displayName": "Product Manager Pack",
  "description": "Role-oriented pack of skills and agents.",
  "version": "1.0.0",
  "maturity": "experimental",
  "packType": "role-pack",
  "categories": ["business", "productivity"],
  "authors": [{ "name": "Qiongyu Li" }]
}
```

**Step 2: Add pack-specific fields**

Support these fields in the schema:

```json
{
  "persona": "product-manager",
  "skills": ["clarify", "brainstorming"],
  "agents": ["planner", "researcher"],
  "leadAgent": "planner",
  "tags": ["pm", "strategy"]
}
```

Rules:
- `packType` enum: `role-pack`, `agent-team`
- `skills` and `agents` are arrays of kebab-case names
- `leadAgent` is optional and valid only for `agent-team`
- no nested packs in v1
- no per-member version constraints in v1

**Step 3: Write the metadata policy**

Create `docs/metadata/pack-metadata-policy.md` covering:
- `categories` are search/filter labels, not install groups
- `persona` expresses target audience
- `packType` expresses grouping semantics
- packs must list members explicitly
- bump `pack.json.version` when membership or positioning changes

**Step 4: Sanity check file style**

Run: `node -e "console.log(require('./schemas/pack.schema.json').title)"`

Expected: prints the schema title without JSON parse errors

### Task 2: Scaffold New Packs

**Files:**
- Modify: `scripts/new.js`
- Modify: `package.json`

**Step 1: Extend CLI argument parsing**

Update `scripts/new.js` so `parseArgs()` supports:

```bash
npm run new -- --pack product-manager
```

Accepted flags:
- `--skill`, `-s`
- `--agent`, `-a`
- `--pack`, `-p`

**Step 2: Add `scaffoldPack()`**

Create a `scaffoldPack(repoRoot, name)` function that writes:
- `packs/<name>/pack.json`
- `packs/<name>/README.md`
- `packs/<name>/CHANGELOG.md`

Use this starter `pack.json`:

```json
{
  "schemaVersion": 1,
  "name": "TODO",
  "displayName": "TODO",
  "description": "TODO: one-line description",
  "version": "0.1.0",
  "maturity": "experimental",
  "packType": "role-pack",
  "categories": ["general"],
  "skills": [],
  "agents": [],
  "tags": [],
  "authors": [{ "name": "TODO: your name" }]
}
```

**Step 3: Update usage text and package scripts**

Add these scripts to `package.json`:

```json
{
  "install-pack": "node scripts/install.js --pack",
  "uninstall-pack": "node scripts/install.js --pack --uninstall"
}
```

Update `scripts/new.js` usage output to mention `--pack`.

**Step 4: Verify scaffolding works**

Run: `npm run new -- --pack example-pack`

Expected:
- `packs/example-pack/pack.json` exists
- `packs/example-pack/README.md` exists
- `packs/example-pack/CHANGELOG.md` exists

**Step 5: Clean the scratch pack**

Run: `rm -rf packs/example-pack`

Expected: no scratch content remains in git status

### Task 3: Add Packs to the Machine and Markdown Catalogs

**Files:**
- Modify: `schemas/catalog.schema.json`
- Modify: `scripts/build-catalog.js`
- Create: `docs/catalog/packs.md` (generated)

**Step 1: Extend the catalog schema**

Add a top-level `packs` array to `schemas/catalog.schema.json`.

Each pack catalog item should contain:

```json
{
  "name": "product-manager",
  "path": "packs/product-manager",
  "displayName": "Product Manager Pack",
  "description": "Role-oriented pack of skills and agents.",
  "version": "1.0.0",
  "maturity": "experimental",
  "packType": "role-pack",
  "persona": "product-manager",
  "categories": ["business", "productivity"],
  "tags": ["pm", "strategy"],
  "skills": ["clarify", "brainstorming"],
  "agents": ["planner", "researcher"]
}
```

**Step 2: Teach `scripts/build-catalog.js` to scan `packs/`**

Add helpers parallel to the existing skill/agent flow:
- read `packs/<name>/pack.json`
- convert to a catalog item
- sort by `name`
- write `docs/catalog/packs.md`
- write `dist/catalog.json.packs`

**Step 3: Render a generated Markdown catalog**

Create a simple table:

```md
| Name | Type | Version | Maturity | Categories | Members | Description |
```

`Members` should show counts like `4 skills, 2 agents`.

**Step 4: Verify build output**

Run: `npm run build`

Expected:
- `docs/catalog/packs.md` is generated
- `dist/catalog.json` contains a top-level `packs` key
- existing `skills` and `agents` catalog output still builds successfully

### Task 4: Validate Pack Packages and References

**Files:**
- Modify: `scripts/validate.js`

**Step 1: Load and compile the new schema**

Add `pack.schema.json` to the existing Ajv setup.

**Step 2: Validate pack package structure**

For each `packs/<name>/pack.json`, validate:
- JSON parses successfully
- schema matches
- `pack.name === dirName`
- `README.md` exists and is not trivially short
- `CHANGELOG.md` exists and contains the current version

**Step 3: Validate member references**

Check that every referenced skill exists under `skills/<name>/skill.json` and every referenced agent exists under `agents/<name>/agent.json`.

Also reject duplicate names inside `skills` or inside `agents`.

**Step 4: Validate `agent-team` rules**

If `packType === "agent-team"`:
- `leadAgent` must be present
- `leadAgent` must appear in `agents`

**Step 5: Validate agent dependency completeness**

When a pack includes an agent, inspect that agent's declared `skills` and `agents`.

Validation rule for v1:
- every declared agent skill dependency must also appear in the pack's `skills`
- every declared sub-agent dependency must also appear in the pack's `agents`

This keeps packs explicit and prevents hidden installs.

**Step 6: Verify the validation suite**

Run: `npm test`

Expected:
- passes with no new warnings for existing packages
- fails clearly when a pack references a missing skill/agent

### Task 5: Install and Uninstall Packs

**Files:**
- Modify: `scripts/install.js`

**Step 1: Extend argument parsing**

Teach `parseArgs()` to accept:

```bash
npm run install-pack -- product-manager
npm run uninstall-pack -- product-manager --platform codex --scope project
```

`type` values should now include `skill`, `agent`, and `pack`.

**Step 2: Implement `installPack()`**

Behavior:
- read `packs/<name>/pack.json`
- collect `skills` and `agents`
- de-duplicate member names
- call the existing `installSkill()` and `installAgent()` helpers for each member
- preserve existing `--platform` and `--scope` semantics

**Step 3: Implement `uninstallPack()`**

Behavior mirrors `installPack()`:
- read the pack
- uninstall all listed skills
- uninstall all listed agents

**Step 4: Keep error reporting clear**

If one member fails:
- print which member failed
- continue processing remaining members
- set `process.exitCode = 1` at the end

**Step 5: Verify end-to-end install**

Run:

```bash
npm run install-pack -- product-manager --platform codex --scope project
```

Expected:
- `.agents/skills/<name>/` directories created for each referenced skill
- `.codex/agents/<name>.toml` files created for each referenced agent

Run:

```bash
npm run uninstall-pack -- product-manager --platform codex --scope project
```

Expected:
- the corresponding installed artifacts are removed

### Task 6: Seed a Canonical Example Pack and Document It

**Files:**
- Create: `packs/product-manager/pack.json`
- Create: `packs/product-manager/README.md`
- Create: `packs/product-manager/CHANGELOG.md`
- Modify: `README.md`

**Step 1: Create one real pack**

Seed a canonical example using existing repository packages:

```json
{
  "schemaVersion": 1,
  "name": "product-manager",
  "displayName": "Product Manager Pack",
  "description": "Product strategy, requirements, and research workflow pack.",
  "version": "0.1.0",
  "maturity": "experimental",
  "packType": "role-pack",
  "persona": "product-manager",
  "categories": ["business", "productivity"],
  "skills": ["clarify", "brainstorming", "business-plan", "deep-research"],
  "agents": ["planner", "researcher"],
  "tags": ["pm", "product", "strategy"],
  "authors": [{ "name": "Qiongyu Li" }]
}
```

**Step 2: Write the pack README**

Explain:
- who the pack is for
- which skills and agents it includes
- how to install it to user scope and project scope
- which platforms it is expected to work with

**Step 3: Update the repository README**

Add:
- `packs/<name>/` to the repo layout table
- `docs/catalog/packs.md` to the generated catalog section
- `npm run install-pack -- <name>` to install workflows

**Step 4: Rebuild generated outputs**

Run:

```bash
npm run build
npm test
```

Expected:
- README references match actual commands
- generated pack catalog is fresh
- validation passes

### Task 7: Final Verification and Release Readiness

**Files:**
- Modify: `dist/catalog.json` (generated)
- Modify: `docs/catalog/packs.md` (generated)

**Step 1: Run the full verification sequence**

Run:

```bash
npm run build
npm test
git status --short
```

Expected:
- only intended pack-related source and generated file changes appear
- no scratch directories remain

**Step 2: Smoke-test both platforms at project scope**

Run:

```bash
npm run install-pack -- product-manager --platform claude --scope project
npm run uninstall-pack -- product-manager --platform claude --scope project
npm run install-pack -- product-manager --platform codex --scope project
npm run uninstall-pack -- product-manager --platform codex --scope project
```

Expected:
- Claude installs to `.claude/skills/` and `.claude/agents/`
- Codex installs to `.agents/skills/` and `.codex/agents/`
- uninstall reverses the install cleanly

**Step 3: Commit in focused slices**

Suggested commit order:

```bash
git commit -m "feat(packs): add pack schema and scaffolding"
git commit -m "feat(catalog): add pack catalog generation"
git commit -m "feat(install): support pack install and validation"
git commit -m "docs(readme): document pack workflows"
```

## Out of Scope for V1

- Pack nesting
- Remote pack registry
- Per-pack prompt patching or platform overrides
- Pack member version pinning
- Project manifest sync

## Planned V2 Follow-Ups

- Add project-level manifest support for reproducible repo bootstrap
- Consider `agent-team` playbook fields beyond `leadAgent`
- Add optional platform compatibility warnings during validation
