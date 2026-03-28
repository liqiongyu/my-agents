---
name: review
description: >
  Structured review skill for PRs, diffs, commits, staged changes, code,
  documentation, API specs, database migrations, infrastructure config, and design
  documents. Activate for explicit, artifact-scoped review requests such as reviewing
  a PR, diff, commit, branch, staged changes, or named files, or phrases like
  "code review", "review my changes", "find bugs in", or "security review".
  Produces severity-graded findings with content-aware analysis, behavioral-change
  checks, and actionable fix directions.
  Do NOT activate for brainstorming, open-ended design feedback, governance/library
  audits, or general conversations about whether an approach seems good.
invocation_posture: hybrid
version: 0.5.0
---

# Review

Unified review skill for agent-performed reviews. Auto-detects content types in a change set, applies the appropriate review dimensions, and delivers severity-graded findings with actionable fixes.

## When to Activate

**Invocation posture: hybrid** — auto-trigger only on unmistakable, artifact-scoped review requests. For ambiguous requests, explicit invocation is preferred.

Activate when the user:
- Asks to review a PR, diff, branch, commit, staged changes, or specific files
- Uses: "code review", "CR", "LGTM?", "security review", "find bugs in", "review my changes", "check my PR"
- Names a concrete artifact and asks for bug finding, breaking-change checks, migration risk review, API/doc correctness, or config/infrastructure review
- Pastes code/text and asks for a review (not a discussion)

## When Not To Activate

Do not activate for:
- Open-ended design or architecture discussions ("what do you think about this approach?")
- Brainstorming, option comparison, or solution ideation
- Governance or library-audit requests about skills, agents, or repository hygiene
- Requests to teach review culture, reviewer communication, or mentoring practices
- General quality feedback without a concrete artifact or change set to inspect

Use `brainstorming`, `skill-lifecycle-manager`, or a general design discussion instead when the user wants exploration rather than a structured review protocol.

## Review Modes

| Mode | When | Behavior |
|---|---|---|
| **Quick** | ≤3 files or "quick look" | P0/P1 only. Inline findings, no template overhead. |
| **Standard** | 4–15 files (default) | Full analysis. Structured output with severity grading. |
| **Deep** | >15 files, "thorough", or high-risk | Full analysis + impact analysis + cross-file tracing. |

**Risk-based override**: File count is the default heuristic, but content risk takes precedence. Even with ≤3 files, upgrade to Standard if the change touches auth/authz, payment/billing, database schemas, or public API contracts. Conversely, user intent always wins — "quick look" means Quick, "thorough" means Deep, regardless of file count.

---

## Phase 1 — Scope

### 1a. Gather context

**Review target** — determine from user's request:
- **PR**: `gh pr diff <number>` or `git diff <base>...<head>`, plus PR description and linked issues
- **Branch**: `git log --oneline main..<branch>` + `git diff main...<branch>`
- **Staged**: `git diff --cached` | **Unstaged**: `git diff`
- **Specific files**: read directly | **Pasted content**: use as-is

If diff >2000 lines, chunk by directory/feature and inform the user.

### 1b. Read project conventions

Before analyzing, check for project-specific context that shapes what "good" looks like. Many agents auto-load project instruction files into context — check what's already available before reading files redundantly.

- Project instruction files (`CLAUDE.md`, `.cursorrules`, `AGENTS.md`, `copilot-instructions.md`, or similar) — may already be in context
- Linter/formatter configs (`.eslintrc`, `.prettierrc`, `pyproject.toml`) — if these exist, don't flag style issues they cover
- PR template or contributing guide — check if the PR follows the project's expected format
- Recent commit messages — understand the project's conventions

This context prevents generic feedback that ignores team decisions (e.g., flagging ORM usage when the project explicitly avoids ORMs).

### 1c. Understand intent

Summarize the change in one sentence before diving in. If intent is unclear from the diff and PR description, ask the user before proceeding. Reviewing without understanding intent produces noise.

### 1d. Classify content types

Each changed file maps to one or more content types. The Dimensions column below shows key dimensions for each type; the reference file contains the full checklist — apply all dimensions listed there, not just the ones summarized here. When a file matches multiple types, use the **most specific** match.

| Priority | Content type | Detected by | Dimensions | Reference |
|---|---|---|---|---|
| 1 | **API Spec** | `openapi.*`, `swagger.*`, `*.graphql`, `*.proto` | Compat, Naming, Versioning | `references/content-checklist.md` |
| 2 | **Database** | `*.sql`, `migrations/`, `schema/` | Safety, Indexes, Rollback | `references/code-checklist.md` |
| 3 | **Infrastructure** | `Dockerfile`, `*.tf`, `k8s/`, CI YAML | Secrets, Limits, Idempotency | `references/code-checklist.md` |
| 4 | **Tests** | `*.test.*`, `*_test.*`, `__tests__/` | Coverage, Isolation, Quality | `references/code-checklist.md` |
| 5 | **Design Doc** | `*prd*`, `*design*`, `*rfc*`, `*adr*` | Feasibility, Completeness, Trade-offs | `references/content-checklist.md` |
| 6 | **Documentation** | `*.md`, `docs/`, `README*` | Accuracy, Completeness, Clarity | `references/content-checklist.md` |
| 7 | **Frontend** | `*.tsx`, `*.vue`, `*.css`, `components/` | Rendering, A11y, State, Bundle | `references/code-checklist.md` |
| 8 | **Configuration** | `*.yaml`, `*.json`, `*.toml`, `*.env*` | Secrets, Correctness | `references/content-checklist.md` |
| 9 | **Code** (default) | `*.py`, `*.ts`, `*.go`, `*.java`, `src/` | Security, Perf, Correctness, Design | `references/code-checklist.md` |

**Priority resolves overlaps**: a `*.tsx` file in `__tests__/` is **Tests** (priority 4), not Frontend (7). A `config.yaml` in `k8s/` is **Infrastructure** (3), not Configuration (8).

For the detailed checklist of each content type, read the relevant reference file.

---

## Phase 2 — Analyze

For each detected content type, read the corresponding reference checklist and apply its dimensions. Two principles guide the analysis:

**Scope to changes only.** Read surrounding code for context, but only comment on what was added or modified. A pre-existing bug in untouched code is not a finding (unless the change makes it worse).

**Look beyond code patterns.** Checklists catch code-level issues (injection, duplication, naming) but can miss behavioral changes — places where the system now *does something different*. For refactoring PRs especially, ask: "Does the new code behave identically to the old code in all cases?" See the Behavioral Change Analysis section below.

**Prioritize by impact, not by checklist order.** Security vulnerabilities and correctness bugs matter more than style preferences. Don't spend equal time on every dimension — go deep on what matters for *this specific change*.

**Calibrate severity carefully.** A common mistake is marking maintainability issues as P3/Nit when they are actually P2. Ask: "Will this cause a real problem if left unfixed?" Duplicated logic that will silently diverge on the next edit is P2, not P3. A pure style preference with no consequence is P3.

### Cross-cutting concerns

Beyond the per-type checklists, always check these regardless of content type:

- **Code-doc consistency**: If code and docs changed in the same PR, do the docs reflect the new behavior?
- **Missing companions**: New API endpoint with no tests? New feature with no docs? Schema change with no migration?
- **Changelog**: User-facing changes should have a changelog entry (if the project uses one).

### Non-findings

Do not spend review budget on noise:

- Formatting, import ordering, or linter-only issues already covered by project automation
- Pure style preferences with no behavioral, maintainability, or policy consequence
- Untouched pre-existing issues unless the current change makes them worse
- Alternate designs that do not identify a concrete risk in the submitted change

### Behavioral change analysis

Checklist-driven code review tends to focus on code-level patterns (injection, N+1, naming) and can miss *behavioral* changes — places where the system does something different than before, even if the code looks clean. This matters most in refactoring PRs where the intent is "same behavior, better structure." For any PR that modifies or replaces existing logic, explicitly check:

- **State model changes**: Did enums gain/lose variants? Did a 3-state machine become 2-state? This changes what the system can express.
- **Error handling changes**: Did error paths change from silent to throwing, or vice versa? Did catch-all branches (`_ => ...`, `default:`) change what they swallow?
- **Default value changes**: Did a field go from required to optional (or `String` to `Option<String>`)? Downstream consumers may break.
- **Timing/ordering changes**: Did synchronous calls become async? Did fire-and-forget become blocking (or vice versa)? These change backpressure and failure modes.
- **API contract changes**: Were CLI flags, environment variables, response shapes, or event types removed or renamed? These are breaking changes even if the code compiles.
- **Scope narrowing**: Did a function that previously handled N cases now only handle a subset? The dropped cases may fail silently.

When you find a behavioral change, assess whether it is **intentional** (documented in PR description) or **accidental** (a side effect of refactoring). Accidental behavioral changes are typically P1.

### Removal inventory (Deep mode)

For large refactoring PRs with significant deletions, briefly inventory what was removed and confirm clean removal:
- Are all references to deleted types/functions/modules also removed?
- Are there orphaned imports, dead config entries, or stale test helpers?
- Is the removal documented in the PR description or changelog?

This catches partial removals where a type is deleted but a consumer still references it at runtime via a string key or dynamic dispatch.

### Open questions

A good review doesn't just find problems — it also surfaces things the reviewer *can't determine from the diff alone*. After analyzing, note questions where the answer would change your assessment:

- Implementation details outside the diff that affect correctness (e.g., "The `with_command_meta` method isn't in this diff — does it already exist on main?")
- Design intent that isn't documented (e.g., "Is the `--apply` flag in `command_path` intentional per the envelope spec, or should it be normalized to `apply`?")
- Missing context about contracts, consumers, or deployment (e.g., "Are there schema-level contract tests validating these envelope fields?")

Use a question only when the missing answer would materially change severity, correctness, or whether something is a finding at all. Do not soften a clear bug, contract break, or migration risk into a question. These go in a dedicated "Questions" section in the output.

### Impact analysis (Deep mode only)

For changes to exported functions, public APIs, schemas, or shared interfaces:
1. Search the codebase for all callers/consumers of the changed interface
2. Identify if any consumer would break or behave differently
3. Check if migration scripts are needed and included

---

## Phase 3 — Synthesize

### Severity levels

| Level | Label | Merge gate | When to use |
|---|---|---|---|
| **P0** | 🔴 Critical | Block | Security vuln, data loss, crash, factual error in docs causing harm |
| **P1** | 🟠 High | Should fix | Correctness bug, breaking API change, missing rollback, misleading docs |
| **P2** | 🟡 Medium | Recommended | Design issue, missing tests, incomplete docs, unclear PRD; DRY violations with >2 copies, inconsistent conventions that will confuse consumers |
| **P3** | 🟢 Nit | Optional | Style preference, minor wording that doesn't cause confusion |
| — | 💡 Suggestion | — | Alternative approach, learning opportunity |
| — | 🎉 Praise | — | Good pattern, clean code, thorough docs |

### Finding protocol

Every `P0`, `P1`, and `P2` finding must include:

- **Issue**: what is wrong
- **Consequence**: why it matters
- **Evidence**: file path, line, schema field, config key, or diff hunk
- **Fix direction**: the expected repair direction, not just "please fix"

Questions supplement findings; they do not replace clear findings. Do not report formatter noise, import ordering, or lint-only issues unless they reveal a real behavioral or policy risk.

### Output by mode

**Quick mode** — concise, no template:

```
[verdict emoji] [verdict]. [1 sentence summary].

- 🔴 **[title]** (`file:line`): [issue + fix]
- 🟠 **[title]** (`file:line`): [issue + fix]
- ❓ [question, if any — omit if none]
```

**Standard mode** — structured:

```markdown
## Review: [brief title]

### Summary
[1-2 sentences. What it does, overall assessment.]

**Verdict**: ✅ Approve / ⚠️ Approve with suggestions / 🔴 Request changes
**Risk**: Low / Medium / High | **Files**: N (+X/-Y lines)

---

### Findings

[For mixed PRs, group by content type. Within each group, order by severity.]

#### 🔴 P0 — Critical
> **[Title]** (`path/to/file:line`)
> [Why this matters — not just what's wrong, but the consequence]
> ```diff
> - problematic
> + fixed
> ```

[P1, P2, P3, Suggestions follow same format]

#### 🎉 What Looks Good
- [Acknowledge good patterns, thorough tests, clean design]

### Questions
[Things the reviewer can't determine from the diff alone — where the answer would change the assessment. Skip this section if there are no genuine open questions.]

### Quick Wins
[Top 3-5 high-impact, low-effort fixes]
```

If findings >15, show top 10 and offer to expand.

**Deep mode** — Standard format plus:
- **Behavioral Changes**: list each behavioral difference between old and new code, noting whether it is intentional or accidental
- **Removal Inventory**: confirm clean removal of deleted types/functions/modules (no orphaned references)
- Impact analysis section with consumer list
- Summary table: `| Content Type | P0 | P1 | P2 | P3 |`
- Escalation flags (see below)

### Verdict logic
- **✅ Approve**: No P0, no P1
- **⚠️ Approve with suggestions**: No P0; exactly 1 P1 where the author is aware and has a clear fix path
- **🔴 Request changes**: Any P0, or 2+ P1s, or any P1 without a clear fix

---

## Phase 4 — Act

Review before repair. Present findings first. Only apply changes when the user explicitly asks for fixes or chooses one of the next-step options below.

After presenting the review, offer next steps based on content type:

**Code / Tests / Frontend / Infrastructure / Configuration:**
> 1. 🔧 Fix all — 2. 🔴 Fix critical only — 3. 🎯 Fix specific — 4. ⏭️ Skip

Apply code edits directly. Explain behavioral impact before applying changes.

**Documentation:**
> 1. ✏️ Rewrite flagged sections — 2. 🎯 Rewrite specific — 3. ⏭️ Skip

Rewrite the relevant sections inline.

**PRD / Design Doc / API Spec:**
> 1. 💡 Provide suggested rewrites — 2. ⏭️ Skip

These content types reflect design decisions that belong to the author. Provide concrete rewrite suggestions and explain the reasoning, but don't apply changes directly — the author decides what to adopt.

---

## Tone

Review is an execution protocol, not a conversation style guide:
- **Be direct, evidence-based, and severity-calibrated.**
- **Explain consequences**, not just rules. "This is vulnerable to injection *because*..." not just "use parameterized queries."
- **Use questions only when missing context blocks confidence.** Do not turn a clear correctness or security issue into a suggestion.
- **Keep praise brief and selective.** Use it only when it helps preserve a strong pattern worth keeping.
- **Separate opinion from requirement.** Style preferences are P3 at most, and often omitted if automation already covers them.
- **Show, don't just tell.** Every non-trivial finding gets a concrete before/after — diff for code, rewritten text for docs.

## Escalation Triggers

Flag for senior review instead of resolving yourself:
- Database schema changes, public API contract changes
- Auth/authz logic, payment/billing/PII processing
- New external dependencies (security-sensitive)
- Infrastructure changes affecting production
- Architecture decisions with long-term consequences

## Validation And Evaluation

Authoring note for maintainers of the canonical skill package:

- Validate structural changes with local authoring tooling before release.
- Evaluate trigger boundaries with the canonical `eval/trigger-posture-cases.json` suite.
- Evaluate realistic review behavior with the canonical `eval/eval-cases.json` suite.
- Keep authoring-only assets such as `eval/` out of runtime projections.

## Caveats

- Reviews changes for quality — does not execute tests or run the app
- Large diffs (>50 files) split across multiple passes
- Domain detection is heuristic — tell the reviewer your stack if it gets it wrong
- Read-only by default; fixes in Phase 4 need write permission
- Assesses artifact quality and change risk, not open-ended solution ideation — that belongs in brainstorming or design discussion
