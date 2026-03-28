# Official Command Model

This reference captures the official Git behavior that should anchor the `git-worktree-workflows` skill. Use it whenever a community example conflicts with upstream semantics.

## Source and version notes

- Primary source: `https://git-scm.com/docs/git-worktree`
- Manual page latest revision observed during authoring: `2.53.0`, updated `2026-02-02`
- Local Git in the authoring environment: `2.52.0`

The skill should avoid claiming version-specific behavior that depends on a newer Git than the user's environment unless the command is verified locally or clearly labeled as version-sensitive.

## Core official model

- A repository has one **main worktree** plus zero or more **linked worktrees**.
- `git worktree add <path>` with no explicit branch can create or reuse a branch named after the final path component.
- `git worktree add <path> <branch>` checks out an existing branch in a new worktree.
- `git worktree add --detach <path> <commit-ish>` is the official detached-head workflow for temporary experiments or inspection.
- If a remote-tracking branch matches uniquely, Git can treat `git worktree add <path> <branch>` like `--track -b <branch> <path> <remote>/<branch>`.

## Command responsibilities

| Command | Official role | Important caution |
| --- | --- | --- |
| `add` | Create a linked worktree | Branch/path defaults can surprise users if left implicit |
| `list` | Show worktrees and state | Use `--porcelain` for machine-readable diagnostics |
| `remove` | Remove an existing linked worktree | Intended for an actual worktree path, not missing metadata |
| `prune` | Remove stale admin metadata | Use when the directory was deleted manually or is permanently gone |
| `lock` / `unlock` | Preserve worktree metadata for portable/offline locations | Useful when storage is not always mounted |
| `move` | Relocate a linked worktree | Does not move the main worktree or linked worktrees containing submodules |
| `repair` | Reconnect moved worktrees | Prefer this after manual moves rather than hand-editing metadata |

## Config behaviors worth surfacing

### `worktree.guessRemote`

If no branch is specified and neither `-b` nor `-B` nor `--detach` is used, Git normally creates a new branch from `HEAD`. When `worktree.guessRemote=true`, Git first tries to match a unique remote-tracking branch of the same name and attach the new worktree to that.

Use this as a caveat, not as a required workflow. The skill should still recommend explicit remote refs for clarity when the user is reviewing or resurrecting a known remote branch.

### `worktree.useRelativePaths`

When `true`, Git links worktrees using relative paths rather than absolute paths. This can help if the repo and linked worktrees move together, but it implies `extensions.relativeWorktrees`, which makes the repository incompatible with older Git versions.

The skill should mention this only when path portability matters.

## Safety-sensitive distinctions

### `remove` vs `prune`

- Use `remove` when the linked worktree still exists and you want Git to remove it cleanly.
- Use `prune` when the directory is already gone and only the admin metadata remains.

Conflating these two operations is one of the easiest ways for a worktree skill to teach the wrong cleanup behavior.

### `move` vs `repair`

- Use `move` when Git should relocate a linked worktree itself.
- Use `repair` after a worktree or main checkout was moved manually and Git's bookkeeping no longer points at the right location.

### Locking portable worktrees

If a worktree lives on removable or unreliable storage, `lock` prevents Git from pruning its metadata just because the path is temporarily unavailable.

## Official caveats to keep visible

- Multiple checkouts remain a sensitive area around submodules; upstream still notes incomplete support for some submodule scenarios.
- A branch can only be checked out in one worktree at a time unless the user reaches for riskier escape hatches.
- Forceful options should be documented as exceptional, not as the first solution.
