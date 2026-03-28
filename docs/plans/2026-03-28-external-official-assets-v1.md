# External Official Assets V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend `my-agents.project.json` and the install/sync CLI so a project can declare both local assets from this repo and external official GitHub-hosted assets, then install them reproducibly into the correct runtime surfaces.

**Architecture:** Keep local canonical packages exactly as they are, and add a second manifest entry shape for external official assets. Treat GitHub URL input as a convenience layer only: `add <url>` parses and validates a single external asset, resolves its ref to a commit SHA, and writes a structured locator into the manifest. `sync-project` then installs local members from this repo and external members from GitHub using platform-aware rules and collision checks.

**Tech Stack:** Node.js 18+, CommonJS, JSON Schema (Ajv), existing install/runtime helpers, Git CLI, Markdown docs, optional Node built-in tests

---

### Task 1: Define the External Asset Manifest Contract

**Files:**
- Modify: `schemas/project-manifest.schema.json`
- Modify: `docs/metadata/project-manifest-policy.md`
- Modify: `docs/examples/my-agents.project.example.json`

**Step 1: Add a union entry shape for `skills` and `agents`**

Keep existing local string entries valid:

```json
"skills": ["brainstorming"]
```

Add an external object entry shape:

```json
{
  "source": "official",
  "provider": "github",
  "platform": "claude",
  "name": "agentic-engineering",
  "repo": "affaan-m/everything-claude-code",
  "declaredRef": "main",
  "resolvedCommit": "0123456789abcdef0123456789abcdef01234567",
  "path": "skills/agentic-engineering",
  "sourceUrl": "https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering"
}
```

**Step 2: Keep the external contract intentionally small**

V1 rules:
- only `source: "official"`
- only `provider: "github"`
- `resolvedCommit` must be a full 40-character SHA
- `path` must be repository-relative
- external entries live inside `skills` or `agents`; do not add new top-level arrays
- `platform` is required for external entries because install behavior differs by runtime surface

**Step 3: Document supported external shapes**

Document that V1 only accepts a URL that already points to one external asset:
- Claude skill: GitHub `tree/...` directory containing `SKILL.md`
- Claude agent: GitHub `blob/.../*.md`
- Codex agent: GitHub `blob/.../*.toml`

Document unsupported cases:
- repo root URLs
- category/collection directories containing multiple agents
- GitHub providers other than public GitHub repo URLs
- external packs

**Step 4: Document platform behavior**

Record the rule explicitly:
- local entries are installed according to the selected effective platforms
- external entries install only to their declared `platform`
- if an external entry’s `platform` is not included in the selected effective platforms, sync should fail with a clear error instead of silently skipping it

### Task 2: Add `add <url>` as the External Asset Authoring Flow

**Files:**
- Modify: `package.json`
- Modify: `scripts/install.js`
- Modify: `scripts/lib/install-shared.js`
- Create: `scripts/lib/github-package-url.js`
- Create: `scripts/lib/project-manifest-write.js`
- Modify: `scripts/lib/git-utils.js`

**Step 1: Add a friendly CLI entry point**

Expose a first-class CLI name while keeping the existing binary:

```json
{
  "bin": {
    "my-agents": "scripts/install.js",
    "my-agents-install": "scripts/install.js"
  }
}
```

Add help text for:

```bash
npx my-agents add <github-url>
npx my-agents add <github-url> --manifest path/to/custom.project.json
```

**Step 2: Extend argument parsing with a command mode**

Support a distinct `add` command in `scripts/install.js`:
- `add <url>`
- optional `--manifest <path>`
- reject `--all`, `--uninstall`, `--scope`, and package-name flags in `add` mode

**Step 3: Parse a GitHub asset URL into a locator**

Create `scripts/lib/github-package-url.js` with a pure parser that converts:

```text
https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering
```

into:

```json
{
  "repo": "affaan-m/everything-claude-code",
  "declaredRef": "main",
  "path": "skills/agentic-engineering",
  "sourceUrl": "..."
}
```

Also parse `blob/...` URLs for single-file agents.

**Step 4: Resolve the declared ref to an immutable commit**

Extend `scripts/lib/git-utils.js` with a capture helper for:

```bash
git ls-remote https://github.com/<owner>/<repo>.git <ref>
```

Write `resolvedCommit` using the returned SHA. Reject ambiguous or missing refs.

**Step 5: Detect the asset kind from the URL target**

Rules:
- `tree/...` path: clone/fetch enough metadata to verify `<path>/SKILL.md` exists, then classify as Claude skill
- `blob/.../*.md`: classify as Claude agent
- `blob/.../*.toml`: classify as Codex agent
- everything else: reject with “URL must point to one supported external asset”

Do not use this repo’s internal `skill.json`, `agent.json`, `codex.toml`, or `claude-code.md` conventions for external classification.

**Step 6: Write the normalized entry into the correct manifest array**

Create `scripts/lib/project-manifest-write.js` to:
- create the manifest if missing with `schemaVersion: 1`
- preserve existing arrays when present
- append to `skills` or `agents` based on detected asset kind
- reject duplicates based on canonical entry identity
- keep JSON output stable and readable

### Task 3: Add External Install Primitives

**Files:**
- Create: `scripts/lib/external-assets.js`
- Modify: `scripts/lib/install-runtime.js`
- Modify: `scripts/lib/runtime-targets.js`
- Modify: `scripts/lib/fs-utils.js`

**Step 1: Add a canonical identity helper**

Inside `scripts/lib/external-assets.js`, define a stable ID shape for external entries:

```text
official:github:<repo>@<resolvedCommit>:<path>
```

Use it for duplicate detection, sync state, and logging.

**Step 2: Add platform-aware destination helpers**

Refactor `scripts/lib/runtime-targets.js` so install code can ask for a destination without assuming the source layout is local-repo-specific.

Expected destinations:
- Claude skill -> `.claude/skills/<name>/`
- Claude agent -> `.claude/agents/<name>.md`
- Codex agent -> `.codex/agents/<name>.toml`

**Step 3: Implement external asset materialization**

Use a temporary Git checkout workflow instead of raw-file-only downloads so directory-based skills can include extra files.

Suggested flow:
1. create temp dir under the OS temp directory
2. clone the GitHub repo
3. checkout `resolvedCommit`
4. copy only the requested `path`
5. install into the runtime target
6. remove the temp dir

Keep the implementation simple for V1; optimize with sparse checkout only if complexity stays manageable.

**Step 4: Validate source path shape before install**

Behavior:
- Claude skill entry must point to a directory containing `SKILL.md`
- Claude agent entry must point to a `.md` file
- Codex agent entry must point to a `.toml` file
- if the remote repo path does not match the expected shape at `resolvedCommit`, fail clearly

**Step 5: Reuse existing projection logic only where appropriate**

Rules:
- local skills continue using `projection.json`
- external assets are installed as-is
- do not invent projection overlays, patching, or wrapper behavior for official assets in V1

### Task 4: Integrate External Entries into `sync-project` and Pruning

**Files:**
- Modify: `scripts/lib/project-manifest.js`
- Modify: `scripts/lib/install-runtime.js`
- Modify: `scripts/lib/project-sync-state.js`
- Modify: `scripts/lib/validate-utils.js`

**Step 1: Expand manifest members into local and external groups**

Update `expandManifestMembers()` so it returns enough structure to distinguish:
- local packs
- local direct skills
- local direct agents
- external direct skills
- external direct agents

Do not flatten external objects into name strings.

**Step 2: Add collision detection before writing runtime files**

Reject collisions where two entries would write to the same runtime destination, for example:
- local Claude skill `brainstorming` and external Claude skill `brainstorming`
- local Codex agent `explorer` and external Codex agent `explorer`
- two external entries with the same `platform + type + name`

Surface the collision before any install begins.

**Step 3: Enforce effective platform compatibility**

Before syncing:
- compute effective platforms using the existing precedence rules
- verify every external entry’s `platform` is included
- if not, fail with a message naming the incompatible entry and selected platforms

**Step 4: Track external entries in sync state**

Extend project sync state to store canonical managed IDs instead of only local names when needed.

Suggested shape:

```json
{
  "platforms": {
    "claude": {
      "packs": ["product-manager"],
      "skills": ["brainstorming", "official:github:affaan-m/everything-claude-code@<sha>:skills/agentic-engineering"],
      "agents": ["official:github:affaan-m/everything-claude-code@<sha>:agents/code-reviewer.md"]
    }
  }
}
```

Keep local names as-is if convenient, but prune logic must be able to distinguish local vs external managed members deterministically.

**Step 5: Teach prune to remove external installs safely**

When `--prune` is used:
- remove project-installed external assets that were previously managed and are no longer desired
- never remove unrelated user-managed files
- never guess identity from filename alone if canonical state data is available

### Task 5: Add Validation and Focused Tests

**Files:**
- Modify: `scripts/validate.js`
- Modify: `package.json`
- Create: `scripts/tests/github-package-url.test.js`
- Create: `scripts/tests/project-manifest-write.test.js`
- Create: `scripts/tests/validate-project-manifest-entries.test.js`

**Step 1: Validate manifest object entries**

Update repo validation so `my-agents.project.json` and the example manifest can contain either:
- local string entries
- external object entries

Validation should stay offline-friendly. Do not require network access during `npm test`.

**Step 2: Validate duplicates and collisions at the data level**

Add validation helpers for:
- duplicate local strings
- duplicate external canonical IDs
- duplicate destination names within the same asset type/platform

**Step 3: Add pure parser tests with Node’s built-in test runner**

Test cases:
- Claude skill `tree/...` URL parses correctly
- Claude agent `.md` URL parses correctly
- Codex agent `.toml` URL parses correctly
- category directory URL is rejected
- repo-root URL is rejected
- unsupported file extension is rejected

Run with:

```bash
node --test scripts/tests/github-package-url.test.js
```

**Step 4: Add manifest write tests**

Test cases:
- missing manifest file gets created
- first external entry lands in the correct array
- second add does not duplicate an existing canonical entry
- local string entries remain untouched

**Step 5: Wire the new tests into validation**

Add an npm script such as:

```json
{
  "test:node": "node --test scripts/tests/*.test.js"
}
```

Then include it in `npm run validate`.

### Task 6: Update Docs and Verify End-to-End

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/metadata/project-manifest-policy.md`
- Modify: `docs/examples/my-agents.project.example.json`

**Step 1: Document the new authoring flow**

Add examples for:

```bash
npx my-agents add https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering
npx my-agents add https://github.com/affaan-m/everything-claude-code/blob/main/agents/code-reviewer.md
npx my-agents add https://github.com/VoltAgent/awesome-codex-subagents/blob/main/categories/01-core-development/api-designer.toml
```

Document that:
- the URL must point to one asset
- category directories are rejected
- manifest stores structured data, not just raw URLs

**Step 2: Show one mixed manifest example**

Document a project manifest that mixes:
- one local skill
- one external Claude skill
- one external Codex agent

Keep the committed example manifest simple if you want, but include at least one documented mixed example in README or the policy doc.

**Step 3: Run focused manual verification**

Run:

```bash
npm run format:check
npm test
```

Then smoke-test:

```bash
npx my-agents add https://github.com/affaan-m/everything-claude-code/tree/main/skills/agentic-engineering
npm run sync-project -- --platform claude
```

Expected:
- manifest entry is written with `resolvedCommit`
- sync installs the external Claude skill into `.claude/skills/agentic-engineering/`

Then test a Codex agent:

```bash
npx my-agents add https://github.com/VoltAgent/awesome-codex-subagents/blob/main/categories/01-core-development/api-designer.toml
npm run sync-project -- --platform codex
```

Expected:
- manifest entry is written under `agents`
- sync installs `.codex/agents/api-designer.toml`

**Step 4: Verify rejection paths**

Run:

```bash
npx my-agents add https://github.com/VoltAgent/awesome-codex-subagents/tree/main/categories/01-core-development
```

Expected:
- command fails clearly
- message explains that the URL points to multiple assets rather than one addable asset

## Out of Scope for V1

- non-GitHub providers
- community third-party sources beyond manually chosen “official” GitHub URLs
- external packs
- patching or overlaying official assets
- automatic update checking for newer tags/branches
- lockfiles beyond storing `resolvedCommit`
