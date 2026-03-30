# Issue Agent OS — Architecture

> Status: proposed · Date: 2026-03-30

## 1. One-Sentence Summary

A thin concurrent controller pulls issues from a GitHub-issues-as-queue, fans out triage to parallel sub-agents, and dispatches workers based on their verdicts — the controller never reads issue content itself, keeping its context window light enough to run indefinitely.

## 2. System Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     GitHub Issues                         │
│              (priority queue + dependency graph)           │
│                                                           │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │P0: bug │ │P1: feat│ │P2: task│ │P3: debt│  ...       │
│  │queued  │ │queued  │ │queued  │ │queued  │            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
└────────────────────────┬─────────────────────────────────┘
                         │ queue.next(limit=N)
                         ▼
            ┌──────────────────────────┐
            │       Controller         │
            │    (thin dispatcher)     │
            │                          │
            │  context per issue: ~100 │
            │  tokens, not ~5000       │
            │                          │
            │  worker pool: max=6      │
            └──┬───┬───┬───┬───┬──────┘
               │   │   │   │   │
phase 1:  ┌────┘   │   │   │   └────┐     Triage (parallel)
          ▼        ▼   ▼   ▼        ▼
       ┌───────┐ ┌───────┐ ... ┌───────┐
       │Triager│ │Triager│     │Triager│  each reads issue,
       │  #10  │ │  #11  │     │  #15  │  thinks, returns verdict
       └───┬───┘ └───┬───┘     └───┬───┘
           │         │             │
           ▼         ▼             ▼
       { verdict:  { verdict:    { verdict:
         execute,    split,        reject,
         brief: ... reason: ... }  reason: ... }
         ... }

phase 2:  Controller reads short verdicts, dispatches:
          ▼        ▼        ▼            ▼
       ┌──────┐ ┌───────┐ ┌──────┐ ┌────────┐
       │Coder │ │Splitter│ │Coder │ │Debugger│
       │ #10  │ │  #11  │ │ #12  │ │  #14   │
       │(wt)  │ │       │ │(wt)  │ │ (wt)   │
       └──┬───┘ └───┬───┘ └──┬───┘ └───┬────┘
          │         │        │          │
       commits   sub-issues commits  diagnosis
       → review  → queue   → review  → review
```

## 3. GitHub Issues as Message Queue

GitHub Issues already have everything a task queue needs. No external queue, no database.

### State Machine (via labels)

```
         ┌────────┐
         │ queued │
         └───┬────┘
             │
             ▼
      ┌─────────────┐
      │  triaging   │  ← triager agent evaluating
      └──┬──┬──┬──┬─┘
         │  │  │  └──→ defer / reject / escalate (terminal or blocked)
         │  │  │
         │  │  └─────→ splitting ──→ children created ──→ blocked
         │  │                         (children enter queue as queued)
         │  └────────→ planning ──→ plan done ──→ in-progress
         │
         ▼
  ┌──────────────┐   worker done   ┌──────────┐
  │ in-progress  │───────────────→│  review   │
  └──────────────┘                └─────┬────┘
         ▲                              │
         │ needs changes                │ approved
         └──────────────────────────────┤
                                        ▼
                                   ┌────────┐
                                   │  done  │
                                   └────────┘
```

Labels:

- **State**: `agent:queued`, `agent:triaging`, `agent:in-progress`, `agent:splitting`, `agent:planning`, `agent:review`, `agent:done`, `agent:blocked`
- **Priority**: `P0` (critical) through `P3` (backlog)
- **Outcome** (terminal): `agent:deferred`, `agent:rejected`, `agent:needs-human`

### Dependencies

Convention in issue body:

```markdown
depends-on: #12, #34
```

An issue is **ready** when all `depends-on` issues are closed. The queue query resolves this.

When a parent issue is split, children get `depends-on` pointing to siblings where order matters. When all children close, the parent auto-transitions to `done`.

### Queue Query

One thin helper function (code, not agent):

```
queue.next(limit=N) → Issue[]
  1. List open issues with label `agent:queued`
  2. Filter out those with unresolved depends-on
  3. Sort by priority label (P0 first)
  4. Return up to N matches
```

This is the ONLY scheduling logic in code. Everything else is agent judgment.

## 4. Concurrent Controller

**The only agent that runs persistently.** Everything else is spawned on demand and discarded after use.

### Design Principle: Thin Dispatcher

The controller NEVER reads issue content. It only sees:

- Issue numbers and titles (from queue query)
- Short structured verdicts (from triager agents)
- One-line status updates (from workers)

This keeps the controller's context budget at ~100 tokens per issue instead of ~5000. A 1M context window can track thousands of issues.

### The Loop

```
max_workers = 6   (configurable)

loop:
  # --- TRIAGE phase: fan out to triager agents ---
  slots = max_workers - active_workers.count
  if slots > 0:
    issues = queue.next(limit=slots)
    for issue in issues:
      label(issue, agent:triaging)
      spawn(triager, issue.number)           ← non-blocking, parallel

  # --- COLLECT phase: gather triage verdicts ---
  verdicts = wait_all(triager_agents)

  # --- DISPATCH phase: act on each verdict ---
  for (issue, verdict) in verdicts:
    lease = acquire_lease(issue)

    switch verdict.decision:
      "execute":
        worktree = create_worktree(issue)
        label(issue, agent:in-progress)
        spawn(coder, verdict.brief, worktree)
        track(issue, coder)

      "split":
        label(issue, agent:splitting)
        spawn(splitter, issue.number)
        track(issue, splitter)

      "plan_then_execute":
        label(issue, agent:planning)
        spawn(planner, issue.number)
        track(issue, planner)

      "investigate":
        worktree = create_worktree(issue)
        label(issue, agent:in-progress)
        spawn(debugger, verdict.brief, worktree)
        track(issue, debugger)

      "defer":
        label(issue, agent:deferred)
        # triager already posted comment asking for clarification
        release_lease(issue)

      "reject":
        close(issue)
        label(issue, agent:rejected)
        # triager already posted comment with reason
        release_lease(issue)

      "escalate":
        label(issue, agent:needs-human)
        # triager already posted comment explaining why
        release_lease(issue)

  # --- COMPLETION phase: handle finished workers ---
  completed = wait_any(active_workers)
  for result in completed:
    switch result.type:
      coder_done:
        spawn(reviewer, result.diff, result.issue)
        track(issue, reviewer)

      reviewer_done(approved):
        gh_pr_ready(result.pr)
        wait_ci(result.pr)
        gh_pr_merge(result.pr, squash=true, delete_branch=true)
        label(issue, agent:done)             ← issue auto-closes via "Closes #N"
        cleanup_worktree(issue)
        release_lease(issue)
        untrack(issue)

      reviewer_done(needs_changes):
        if review_count < max_reviews:
          spawn(coder, result.feedback, result.worktree)
          track(issue, coder)
        else:
          label(issue, agent:blocked)
          comment(issue, "Review loop exhausted after N rounds")
          untrack(issue)

      splitter_done:
        label(issue, agent:blocked)       ← waits for children
        untrack(issue)

      planner_done:
        worktree = create_worktree(issue)
        label(issue, agent:in-progress)
        spawn(coder, result.plan, worktree)
        track(issue, coder)

      debugger_done:
        if result.has_fix:
          spawn(reviewer, result.diff, result.issue)
          track(issue, reviewer)
        else:
          comment(issue, result.findings)
          label(issue, agent:blocked)
          untrack(issue)
```

### Context Budget

| Item per issue                  | Tokens in controller |
| ------------------------------- | -------------------- |
| Issue number + title from queue | ~20                  |
| Triager verdict (structured)    | ~30                  |
| Worker status on completion     | ~30                  |
| Review verdict                  | ~20                  |
| **Total per issue**             | **~100**             |

Compare: if controller did triage itself, each issue would cost ~5000 tokens (reading body, reasoning, writing brief). Over 100 issues that's 500K tokens — half a 1M window gone. With the thin dispatcher model, 100 issues cost ~10K tokens. The controller can process thousands of issues across its lifetime.

### Concurrency Guarantees

- Each issue has its own **worktree** → no file conflicts between parallel workers
- Each issue has its own **lease** → no two workers on the same issue
- Workers are **stateless** → if one crashes, controller sees lease expire and can retry
- Controller tracks a **worker pool** → respects max concurrency, fills slots as they free up

### Platform Constraint

Claude Code sub-agents cannot spawn other sub-agents. Codex defaults to `max_depth=1`. This means:

- Controller MUST be the top-level session (not a spawned agent)
- All workers are direct children of the controller
- Workers never spawn other agents — the controller handles all routing

This constraint is consistent with the thin dispatcher design. The controller is the only entity that spawns.

## 5. Agent Definitions

Seven agents. One thin controller + one triager + five worker types.

### 5.1 Controller

**Role**: Thin concurrent dispatcher. Manages the queue-to-worker pipeline.
**Runs**: As the top-level session (persistently, or on schedule/webhook)
**Spawns**: All other agents
**Tools**: queue query, label management, lease management, worktree creation, PR creation, spawn agents
**Does NOT**: read issue bodies, reason about code, write briefs, touch files

The controller is deliberately dumb about issue content. It only understands structured verdicts and status updates. All intelligence lives in the agents it spawns.

### 5.2 Triager

**Role**: Read an issue, understand it, decide what to do, and prepare the brief.
**Input**: An issue number
**Output**: Structured verdict:

```json
{
  "decision": "execute | split | plan_then_execute | investigate | defer | reject | escalate",
  "brief": "...(for workers, only if decision is execute/investigate/plan)",
  "reason": "...(for defer/reject/escalate, also posted as GitHub comment)"
}
```

**Tools**: GitHub issue read, codebase exploration (read-only: Read, Grep, Glob)
**Context**: Fresh per invocation — no accumulation

The triager is the system's judgment core. It does all the heavy thinking:

1. Reads the full issue body and comments
2. Explores relevant code if needed (to assess scope and feasibility)
3. Checks for duplicates (searches existing issues)
4. Judges clarity, scope, and whether the issue is actionable
5. Decides the routing: execute / split / plan / investigate / defer / reject / escalate
6. If executing: writes a detailed brief for the worker (scope, key files, constraints, acceptance criteria)
7. If deferring/rejecting: posts a GitHub comment explaining why

Each triager invocation is independent with its own context window. 6 triagers running in parallel = 6 independent context windows, zero impact on the controller.

### 5.3 Splitter

**Role**: Decompose a large issue into right-sized sub-issues.
**Input**: An issue number
**Output**: 2-5 sub-issues created on GitHub with `agent:queued` label + dependency links
**Tools**: GitHub issue CRUD, codebase exploration (read-only)

The splitter reads the issue, explores the relevant code, and decomposes into concrete sub-tasks. Each sub-issue should be completable by a single coder in one pass. Sub-issues go back into the queue and are picked up naturally by the controller.

### 5.4 Coder

**Role**: General-purpose code implementation.
**Input**: A brief (what to do) + a worktree path (where to do it)
**Output**: Commits on the issue branch
**Tools**: Read, Edit, Write, Bash (build/test), Git operations within worktree

Handles features, refactors, docs, tests — anything that produces code changes. The triager crafts different briefs for different work types; the coder follows the brief.

**On specialization**: One general coder for v1. The architecture supports adding specialized coders (e.g., `frontend-coder`, `infra-coder`) later — the triager just sets a `worker_type` field in the verdict. Add specialization only when benchmarks show it performs meaningfully better.

### 5.5 Reviewer

**Role**: Independent code review with structured verdict.
**Input**: The diff + the original issue requirements (from the brief)
**Output**: Structured verdict — `approved` or `needs_changes` with specific, actionable feedback
**Tools**: Read, Grep, Glob, Bash (run tests/lint to verify)

Separate agent from the coder to avoid self-review bias. Reviews for correctness, security, style, test coverage, and whether the change actually addresses the issue requirements.

### 5.6 Planner

**Role**: Design and architecture before implementation.
**Input**: An issue number (for issues that need design work first)
**Output**: An implementation plan (approach, key files, risks, ordered steps) — becomes the coder's brief
**Tools**: Read, Grep, Glob, Bash (read-only exploration)

For issues where jumping straight to code would be wasteful — system design, cross-cutting refactors, new subsystem architecture.

### 5.7 Debugger

**Role**: Bug investigation and fix with hypothesis-driven workflow.
**Input**: A brief (bug context) + a worktree path
**Output**: Diagnosis + fix (commits), or diagnosis + findings only
**Tools**: Read, Edit, Write, Bash (reproduce, test hypotheses), Git operations

Follows a fundamentally different workflow than the coder: reproduce → hypothesize → verify → fix → confirm. Can produce a fix directly (goes to review) or findings only (controller marks issue as blocked for human re-routing).

## 6. Skills

Skills are reusable methodologies that enhance an agent's judgment. A skill runs inside the agent's own context — no extra spawn, no extra cost.

### Needed Skills

| Skill                 | Used by  | Purpose                                                                                                                                     |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `structured-review`   | Reviewer | Severity-graded review methodology with structured output format. Ensures consistent review quality across all issues.                      |
| `issue-decomposition` | Splitter | Methodology for finding natural boundaries, sizing sub-tasks, and setting up dependency ordering.                                           |
| `acceptance-check`    | Reviewer | Framework for judging whether a diff satisfies the original issue requirements — goes beyond code quality to check functional completeness. |

### Why Only Three Skills

The triager absorbed two skills from the previous design:

- `triage-routing` → now the triager agent's core prompt (it IS the triage methodology)
- `brief-writing` → now part of the triager's output (it writes the brief as part of its verdict)

Other agents' core competencies are their prompts, not separate skills:

- "How to write code" → that's what the coder IS
- "How to debug" → that's what the debugger IS
- "How to plan" → that's what the planner IS

**Skills are for cross-cutting methodology shared across agents or for methodology complex enough to benefit from structured invocation.** Review methodology and decomposition methodology qualify. Agent core competencies do not.

## 7. Infrastructure (Thin Code Layer)

| Component           | Status            | Role                                                      |
| ------------------- | ----------------- | --------------------------------------------------------- |
| GitHub adapter      | Exists ✅         | Issues, PRs, labels, comments, reviews — 16 functions     |
| Worktree manager    | Exists ✅         | Create/cleanup worktrees, branch ops, push — 10 functions |
| State store         | Exists ✅         | Leases, run records, artifacts, event log — ~50 functions |
| Queue query         | **New ~80 lines** | `queue.next(limit)` — priority + dependency resolution    |
| Worker pool tracker | **New ~60 lines** | Track active workers, slots, completion handling          |
| CLI entry point     | **New ~60 lines** | `npx my-agents run controller --repo owner/repo`          |

### What code does vs what agents do

| Concern                                     | Owner            | Why                            |
| ------------------------------------------- | ---------------- | ------------------------------ |
| "Should we work on this issue?"             | Agent (triager)  | Requires understanding         |
| "What priority label does this issue have?" | Code             | Deterministic label lookup     |
| "Write a brief for the coder"               | Agent (triager)  | Requires judgment              |
| "Create a worktree for issue #42"           | Code             | Deterministic FS operation     |
| "Is this code change correct?"              | Agent (reviewer) | Requires understanding         |
| "Label this issue as in-progress"           | Code             | Deterministic state transition |
| "Are all deps resolved?"                    | Code             | Deterministic graph query      |
| "How many worker slots are available?"      | Code             | Counter arithmetic             |

**Rule of thumb**: Understanding → agent. Deterministic → code.

## 8. Observability: GitHub as the Record

Every agent action that produces a judgment or artifact must be recorded on GitHub, not just in local agent context. GitHub is the single source of truth for human oversight.

### What gets recorded where

| Event                           | Where         | How                                                       |
| ------------------------------- | ------------- | --------------------------------------------------------- |
| Triager verdict (all decisions) | Issue comment | `gh issue comment` with verdict + reason + brief summary  |
| Coder first implementation      | Draft PR      | `gh pr create --draft`, push to `agent/issue-<N>`         |
| Reviewer findings               | PR review     | `gh pr review --request-changes` or `--approve` with body |
| Coder fix after review          | PR push       | Push new commits; PR shows diff automatically             |
| Controller state transitions    | Issue labels  | `gh issue edit --add-label --remove-label`                |
| Splitter decomposition          | Issue comment | Comment on parent listing sub-issues + rationale          |

### Why not local-only

- **Agent crashes lose context**. GitHub doesn't.
- **Humans can't see local agent context**. GitHub is always visible.
- **Review iterations are audit trail**. PR review history is permanent.
- **Mid-stream intervention**: humans can comment on the PR or issue at any point, and agents see it on next read.

### PR-Centric Workflow

The PR is created early (as Draft) and iterated on, not created at the end:

```
Coder: implement → commit → push → create Draft PR
Reviewer: read PR diff → post gh pr review (REQUEST_CHANGES or APPROVE)
Coder: read review → fix → push (PR updates automatically)
Reviewer: re-review on PR → APPROVE
Controller: gh pr ready → label issue agent:review
```

All review comments, code iterations, and decisions are recorded on the PR. A human reading the PR sees the complete story.

## 9. Worktree & Branch Model

```
~/.my-agents/issue-driven-os/<repo>/worktrees/
  issue-7/      ← coder working on #7
  issue-8/      ← coder working on #8
  issue-3/      ← debugger investigating #3
```

- Branch naming: `agent/issue-<N>`
- One worktree per active issue — full isolation between parallel workers
- Created when controller dispatches work, cleaned up after PR merge
- If a branch already exists (resumed work), worktree reattaches
- Base branch refresh before each worker invocation

Parallel safety: 6 workers = 6 worktrees = 6 branches. No conflicts possible.

## 9. Cross-Platform Dispatch

Same agent definitions, different spawn mechanism.

### Agent Package Structure

```
agents/
  controller/       ← thin dispatcher (top-level only)
    agent.json
    claude-code.md
    codex.toml
    CHANGELOG.md
  triager/           ← judgment + brief writing
  splitter/          ← issue decomposition
  coder/             ← code implementation
  reviewer/          ← code review
  planner/           ← design + architecture
  debugger/          ← bug investigation
```

### Platform Dispatch

| Action               | Claude Code                                     | Codex                                |
| -------------------- | ----------------------------------------------- | ------------------------------------ |
| Spawn (non-blocking) | `Agent(type, prompt, run_in_background=true)`   | `spawn_agent(type, prompt)`          |
| Spawn (blocking)     | `Agent(type, prompt)`                           | `spawn_agent()` + `wait_agent(id)`   |
| Wait for any         | Automatic notification on background completion | `wait_agent()` with multiple IDs     |
| Parallel triagers    | Multiple `Agent()` calls in one message         | Multiple `spawn_agent()` calls       |
| Sub-agent nesting    | Not supported (controller must be top-level)    | Default `max_depth=1` (configurable) |
| Max concurrency      | ~5-6 practical                                  | `agents.max_threads` (default: 6)    |

### Running

```bash
# Claude Code — controller runs as the top-level session
claude --agent controller --prompt "Process the issue queue for owner/repo"

# Codex — controller runs as the top-level agent
codex --agent controller --prompt "Process the issue queue for owner/repo"

# With concurrency override
claude --agent controller --prompt "Process queue for owner/repo, max_workers=3"
```

## 10. Failure & Recovery

| Failure                         | Recovery                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker crashes                  | Lease expires (30min). Controller sees issue still `in-progress`, re-acquires lease, sees partial branch, spawns worker to continue.                                                  |
| Triager crashes                 | Issue stays `agent:triaging`. Controller re-spawns triager on next loop iteration.                                                                                                    |
| Review loop exhausted (3x)      | Controller labels `agent:blocked`, comments with review history. Human intervenes.                                                                                                    |
| Dependency cycle                | Queue returns empty despite queued items. Controller posts warning on affected issues.                                                                                                |
| Merge conflict                  | `refreshIssueBranch()` returns `conflicted`. Controller retries after rebase or labels `agent:blocked`.                                                                               |
| Controller crashes              | Stateless — all state in GitHub labels + state store. Restart picks up where it left off. Active workers may still be running (they're independent processes in their own worktrees). |
| Splitter creates bad sub-issues | Sub-issues go through normal triage. Triager will defer them if they're unclear. Natural self-correction.                                                                             |

## 11. What We Explicitly Do NOT Build

- **No JS orchestration logic** — no hardcoded decision trees, no phase machines
- **No thick controller** — controller never reads issue content, never reasons about code
- **No framework** — agents are prompts with tools, not class instances
- **No premature specialization** — one coder for v1, specialize only when proven
- **No governance layer** — no admission boards, risk gates, budget committees in code
- **No portability abstraction** — platform adapter is minimal, not an abstraction layer

## 12. Implementation Order

Each step is independently useful and testable:

1. **Queue helper** (~80 lines) — `queue.next(limit)` with priority + dep resolution
2. **Triager agent definition** — the judgment core: read issue, decide, write brief
3. **Controller agent definition** — thin concurrent dispatcher
4. **Coder agent definition** — implementation worker with worktree tools
5. **Reviewer agent definition** — structured review worker
6. **Splitter agent definition** — issue decomposition worker
7. **Planner + Debugger agent definitions** — additional worker types
8. **Skills** — `structured-review`, `issue-decomposition`, `acceptance-check`
9. **Worker pool tracker** (~60 lines) — concurrency management
10. **CLI entry point** (~60 lines) — `npx my-agents run controller --repo owner/repo`

New code total: ~200 lines. Everything else is agent/skill definitions (prompts).

## 13. Example: End-to-End with 100 Issues

100 issues in the repo. 40 are `agent:queued`. 25 have all deps resolved. Sorted by priority, top 6 are eligible.

```
 t0  Controller: queue.next(limit=6) → [#10, #11, #12, #13, #14, #15]
     Controller spawns 6 triagers in parallel (one per issue).
     Controller context: +120 tokens (6 issue numbers + titles)

 t1  All 6 triagers complete. Verdicts:
       #10 → { decision: "investigate", brief: "Login 500 error..." }
       #11 → { decision: "split", reason: "3 unrelated changes" }
       #12 → { decision: "execute", brief: "Add pagination to..." }
       #13 → { decision: "defer", reason: "No repro steps, asked in comment" }
       #14 → { decision: "execute", brief: "Rename config keys..." }
       #15 → { decision: "reject", reason: "Duplicate of #8" }
     Controller context: +180 tokens (6 short verdicts)

     #13 deferred (triager already commented), #15 rejected (triager already closed).
     4 issues to dispatch, 2 filtered out with zero worker cost.

 t2  Controller dispatches 4 workers in parallel:
       Debugger  → #10 (worktree-10)
       Splitter  → #11
       Coder     → #12 (worktree-12)
       Coder     → #14 (worktree-14)
     active=4, slots=2
     Controller context: +80 tokens (4 dispatch records)

 t3  Splitter #11 finishes → created #11a, #11b, #11c (agent:queued)
     #11 → agent:blocked. Slot freed → active=3, slots=3.
     Controller: queue.next(limit=3) → [#11a, #16, #17]
     Spawn 3 triagers in parallel.
     Controller context: +60 tokens

 t4  Coder #12 finishes.
     Controller spawns Reviewer → #12. active=3 (coder replaced by reviewer).
     Triagers for #11a, #16, #17 return verdicts.
     Controller dispatches accordingly.
     Controller context: +90 tokens

 t5  Reviewer #12 → approved.
     Controller: create_pr(#12), label(agent:review). Slot freed.
     Debugger #10 finishes with fix → spawn Reviewer #10.
     Controller context: +40 tokens

     ...continues until queue is empty.

 Total controller context for 100 issues: ~10K tokens.
 If controller did triage itself: ~500K tokens.
 50x reduction.
```
