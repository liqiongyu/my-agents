# Project Manifest V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a project-level manifest and sync workflow so a target repository can declare the packs, skills, and agents it wants and project them into local Claude Code and Codex runtime surfaces reproducibly.

**Architecture:** Keep the project manifest outside the package catalog and treat it as repository-consumer configuration rather than a publishable package. Add a lightweight schema, validate the manifest when present, and implement `sync-project` as a project-scope installer that reuses the existing skill, agent, and pack install logic.

**Tech Stack:** Node.js 18+, CommonJS, JSON Schema (Ajv), existing install/build/validate scripts, Markdown docs

---

### Task 1: Define the Project Manifest Contract

**Files:**
- Create: `schemas/project-manifest.schema.json`
- Create: `docs/metadata/project-manifest-policy.md`

**Step 1: Create the schema**

Add a JSON Schema for a root-level manifest named `my-agents.project.json`.

Required core shape:

```json
{
  "schemaVersion": 1,
  "packs": ["product-manager"],
  "skills": ["clarify"],
  "agents": ["explorer"]
}
```

Optional fields:
- `description`
- `platforms` with `claude`, `codex`

**Step 2: Keep the manifest intentionally small**

Rules for v1:
- no nested manifests
- no version pinning
- no uninstall/prune semantics
- project scope only

**Step 3: Write the policy doc**

Document:
- when to commit the manifest
- how `packs`, `skills`, and `agents` should be used together
- how CLI `--platform` interacts with manifest `platforms`
- why this is a repository bootstrap artifact instead of a package

### Task 2: Add Sync Command Support

**Files:**
- Modify: `package.json`
- Modify: `scripts/install.js`

**Step 1: Add a package script**

Add:

```json
{
  "sync-project": "node scripts/install.js --sync-project"
}
```

**Step 2: Extend CLI parsing**

Support:

```bash
npm run sync-project
npm run sync-project -- --manifest docs/examples/my-agents.project.example.json
npm run sync-project -- --platform codex
```

Add flags:
- `--sync-project`
- `--manifest <path>`

**Step 3: Implement manifest loading**

Behavior:
- default manifest path: `my-agents.project.json`
- resolve relative paths from the current working directory
- fail clearly if the manifest does not exist or contains invalid JSON

**Step 4: Implement sync behavior**

Behavior:
- effective scope is always `project`
- if CLI `--platform` is passed, it wins
- otherwise use manifest `platforms` when present
- otherwise default to all platforms
- install manifest `packs`
- install manifest `skills`
- install manifest `agents`

The sync path may reuse existing install helpers and may perform duplicate installs if needed, but prefer de-duplicating explicit member names when cheap.

### Task 3: Validate Project Manifests

**Files:**
- Modify: `scripts/validate.js`

**Step 1: Compile the new schema**

Load and compile `schemas/project-manifest.schema.json`.

**Step 2: Validate root manifest when present**

If `my-agents.project.json` exists at repo root:
- validate schema
- validate referenced packs, skills, and agents exist
- reject duplicate references in each list
- validate manifest `platforms` values

**Step 3: Keep validation optional**

Do not fail just because a project manifest is absent. This is a consumer-facing config, not a mandatory package type.

### Task 4: Add a Canonical Example Manifest

**Files:**
- Create: `docs/examples/my-agents.project.example.json`
- Modify: `README.md`

**Step 1: Create an example file**

Seed a small committed example:

```json
{
  "schemaVersion": 1,
  "description": "Example project bootstrap manifest for a product-focused repository.",
  "platforms": ["claude", "codex"],
  "packs": ["product-manager"],
  "skills": [],
  "agents": []
}
```

**Step 2: Document usage**

Update README with:
- what `my-agents.project.json` is
- how to create it from the example
- how to run `npm run sync-project`

### Task 5: Verify End-to-End

**Files:**
- Modify: `README.md`

**Step 1: Run validation and build**

Run:

```bash
npm run build
npm test
```

Expected:
- validation passes
- existing pack catalog remains unaffected

**Step 2: Smoke test sync**

Run:

```bash
cp docs/examples/my-agents.project.example.json my-agents.project.json
npm run sync-project -- --platform claude
npm run sync-project -- --platform codex
rm my-agents.project.json
```

Expected:
- project-scope runtime files are created for both platforms
- removing the temporary manifest restores the repo to its prior tracked state

**Step 3: Confirm git status**

Run:

```bash
git status --short
```

Expected:
- only intended source/doc/generated changes appear

## Out of Scope for V1

- Sync pruning of removed entries
- Manifest lockfiles
- Multiple manifests per repo
- Environment-specific overlays
- Catalog generation for project manifests
