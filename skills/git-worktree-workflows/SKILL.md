---
name: git-worktree-workflows
description: >
  Use when the user explicitly asks about `git worktree`, wants parallel
  checkouts or isolated branch work without stashing or recloning, needs help
  resolving a branch that is already checked out elsewhere, or wants to create,
  inspect, compare, move, lock, remove, prune, or repair worktrees safely. Do
  not use for ordinary single-branch Git help unless worktrees are part of the
  task.
version: 0.1.2
---

# Git Worktree Workflows

Turn `git worktree` usage into a small set of safe workflows instead of one-off commands. This skill favors official Git behavior over wrapper scripts, keeps repository-specific setup separate from worktree management, and treats destructive operations as explicit checkpoints.

The design bias is:

- Use **official Git semantics** as the source of truth
- Use **manual-first posture** so the skill activates only on clear worktree signals
- Use **repo conventions as overlays**, not as universal defaults

## Outputs

Depending on the request, produce one or more of:

- A recommendation on whether a worktree is the right tool for the task
- A safe command sequence for create, inspect, compare, cleanup, or repair workflows
- A brief safety note for destructive or ambiguous operations
- A short next-step checklist after the worktree action completes

## When Not To Use

Do not use this skill when:

- The task is ordinary branch switching, rebasing, or PR work and no extra checkout is needed
- The request is really about repo bootstrap, such as copying `.env*`, linking `.venv`, installing dependencies, or trusting local tool configs, unless the repository already documents those as project conventions
- The user only needs general Git advice and has not asked about worktrees or parallel checkouts
- Worktree use would add more overhead than value, such as a tiny one-file change on a clean branch with no context-switching pressure
- Worktrees are a minor part of a broader advanced Git session that also involves rebasing, bisect, or reflog; in that case defer to the broader Git skill unless worktree operations become the primary concern

## Route First

Do not force one giant worktree playbook on every request. Route the task first:

| Route | Primary question | Default move |
| --- | --- | --- |
| **Decide** | Is a worktree actually the right tool here? | Compare worktree vs simpler Git alternatives |
| **Create** | Does the user need a new isolated checkout? | Choose path, branch model, then add the worktree |
| **Inspect** | Does the user need to see what exists or where a branch is checked out? | Use `git worktree list`, often with `--porcelain` |
| **Compare / Merge** | Does the user want to inspect or selectively reuse changes across worktrees? | Use diff, restore, checkout, or cherry-pick workflows |
| **Cleanup** | Is the user done with a worktree or facing stale metadata? | Distinguish `remove` from `prune` and gate destructive steps |
| **Repair / Recover** | Was a worktree moved, deleted manually, or stored off-disk? | Use `repair`, `lock`, `unlock`, or `move` appropriately |

Read [official-command-model.md](references/official-command-model.md) when version-sensitive or edge-case behavior matters. Keep authoring-time research notes outside the runtime workflow so projected copies stay focused on official Git behavior and safe execution.

## Operating Rules

1. **Official Git wins.** Prefer built-in `git worktree` commands over repository wrappers unless the repo already defines a trusted wrapper workflow.
2. **Treat path choice as a convention, not a law.** Reuse existing repo conventions when they exist. If they do not, prefer the least surprising layout and explain the choice.
3. **Do not smuggle bootstrap policy into worktree guidance.** `.env`, `.venv`, package installs, `direnv`, `mise`, and similar setup steps are repository concerns, not universal worktree behavior.
4. **Never delete blindly.** Before `remove`, `unlock`, or any forceful cleanup, inspect the target with `git worktree list` and `git -C <path> status --porcelain`.
5. **Keep `remove`, `prune`, and `repair` distinct.** `remove` deletes a linked worktree, `prune` removes stale metadata, and `repair` reconnects moved worktrees.
6. **Avoid `--ignore-other-worktrees` by default.** It is a last resort and requires explicit user confirmation.
7. **Use machine-readable listing when debugging.** `git worktree list --porcelain` is the safest base for locating branches and interpreting state.
8. **Call out Git-version caveats when relevant.** Features like `worktree.useRelativePaths` can affect portability and compatibility with older Git versions.

## Workflow

### Phase 1: Triage

Start by classifying the request:

- **Use worktree**
  - parallel feature work
  - hotfix while another branch is in progress
  - isolated PR or branch review
  - long-running tests or experiments that should not disturb the current checkout
  - comparing implementations side by side
- **Usually skip worktree**
  - tiny one-off fix with no context switching
  - straightforward branch switch on a clean checkout
  - pure rebase or merge guidance with no multiple-checkout requirement

Then identify the route:

- Decide
- Create
- Inspect
- Compare / Merge
- Cleanup
- Repair / Recover

For route selection, gather only the minimum state you need:

```bash
git status --short
git worktree list
```

Use `git --version` when the task depends on config or feature details that may vary across installations.

### Phase 2: Choose Path And Branch Model

Before creating anything, respect repo conventions in this order:

1. Existing project docs or local instructions
2. Existing worktree layout already used by the repository
3. A user-specified location
4. A reasonable default if none of the above exist

If the location is inside the repository, verify that it is ignored before treating it as a default:

```bash
git check-ignore -q .worktrees
```

If the directory is not ignored, do not silently commit ignore changes. Explain the risk and either ask permission to update ignore rules or choose a location outside the tracked tree.

Choose the creation model based on user intent:

| Case | Command shape |
| --- | --- |
| New branch from a known base | `git worktree add -b <branch> <path> <start-point>` |
| Existing local branch | `git worktree add <path> <branch>` |
| Unique remote-tracking branch | `git worktree add --track -b <branch> <path> <remote>/<branch>` |
| Detached experiment | `git worktree add --detach <path> <commit-ish>` |
| Brand-new history | `git worktree add --orphan <path>` |

If the user just wants "a clean parallel workspace", prefer creating a new branch from the repository's integration branch rather than attaching to a drifting local topic branch by accident.

### Phase 3: Execute The Right Route

#### Route: Decide

When the user is unsure whether a worktree helps, answer this directly:

- choose a worktree when isolation, parallelism, or side-by-side comparison matters
- skip it when a simple `git switch`, `git stash`, or separate commit on the current branch is enough

Make the recommendation before dumping commands.

#### Route: Create

**New branch from a clean base**

```bash
git fetch origin
git worktree add -b feature/my-task ../myrepo-my-task origin/main
```

**Existing branch already on this repository**

```bash
git worktree add ../myrepo-review feature/existing-branch
```

**Remote branch review**

```bash
git fetch origin feature/existing-branch
git worktree add --track -b feature/existing-branch ../myrepo-review origin/feature/existing-branch
```

**Detached experiment**

```bash
git worktree add --detach ../myrepo-experiment HEAD
```

When the user asks for a PR or remote branch review and the branch name is not known locally, fetch the remote ref explicitly instead of assuming local state is current.

#### Route: Inspect

Use simple list output for humans:

```bash
git worktree list
git worktree list -v
```

Use porcelain output for debugging or scripting:

```bash
git worktree list --porcelain
```

This is the preferred route when the user hits "branch is already checked out". First locate the existing worktree before proposing any workaround.

#### Route: Compare / Merge

For side-by-side comparison:

```bash
git diff main..feature-branch -- path/to/file
diff ../worktree-a/path/to/file ../worktree-b/path/to/file
```

For selective file adoption:

```bash
git restore --source=feature-branch -- path/to/file
git restore -p --source=feature-branch -- path/to/file
```

For commit-level reuse:

```bash
git cherry-pick <commit>
git cherry-pick --no-commit <commit>
```

Prefer `git restore` or targeted cherry-picks when the user wants a subset of changes rather than a full branch merge.

#### Route: Cleanup

Normal cleanup:

```bash
git -C ../myrepo-review status --porcelain
git worktree remove ../myrepo-review
```

If the user already deleted the directory manually, do not try `remove` against a missing path. Use:

```bash
git worktree prune --dry-run
git worktree prune
```

If cleanup would discard uncommitted changes, stop and surface the risk before suggesting `--force`.

#### Route: Repair / Recover

If a worktree path was moved manually or the main worktree moved:

```bash
git worktree repair
git worktree repair /new/path/to/worktree
```

If a worktree lives on removable or occasionally unavailable storage:

```bash
git worktree lock --reason "portable drive"
git worktree unlock /path/to/worktree
```

If the user wants to relocate a worktree intentionally:

```bash
git worktree move /old/path /new/path
```

Call out an official limitation: the main worktree, and linked worktrees containing submodules, cannot be moved with `git worktree move`.

### Phase 4: Handle The "Already Checked Out" Error

Resolve in this order:

1. Locate the existing checkout:

```bash
git worktree list --porcelain
```

2. Prefer using that existing worktree if it already matches the user's goal.
3. If the user needs a separate line of work, create a new branch from the checked-out branch:

```bash
git worktree add -b feature/derived-task ../myrepo-derived feature/original-branch
```

4. If the user only needs temporary inspection or testing, use detached HEAD:

```bash
git worktree add --detach ../myrepo-inspect feature/original-branch
```

5. Mention `git switch --ignore-other-worktrees` only as a last resort with explicit warning and explicit confirmation.

### Phase 5: Close The Loop

Before finishing:

- report the chosen route
- show the exact commands or explain why a worktree is unnecessary
- call out any destructive risk or repo-convention assumption
- end with the next obvious step, such as `cd` into the new worktree, run `git worktree list`, or clean up stale metadata

## Example Prompts

- Show me the safest way to create a worktree for a hotfix while my feature branch has uncommitted changes.
- I got "branch is already checked out at ..." when trying to add a worktree. What should I do?
- Help me compare two branches side by side with worktrees and selectively keep only one file.
- I manually deleted a worktree folder. How do I clean up Git's metadata correctly?
- Should I use a worktree here, or is a normal branch switch enough?
