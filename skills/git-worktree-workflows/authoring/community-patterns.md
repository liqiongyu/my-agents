# Community Patterns

This reference summarizes the deep discovery pass used to author `git-worktree-workflows`. It distinguishes high-value patterns from overfitted assumptions that should stay outside the canonical skill.

## Discovery scope

- Official Git documentation on `git-scm.com`
- skills.sh results for `git worktree` and adjacent git-workflow skills
- Recent community skill repositories on GitHub
- Worktree usage notes and ADRs from agent and plugin ecosystems

## Candidate inventory

| Source | Type | High-value pattern | Pattern to avoid copying blindly |
| --- | --- | --- | --- |
| `obra/superpowers@using-git-worktrees` | skills.sh + GitHub skill | clear activation boundary, location-selection flow | hardcoded `.env` and `.venv` handling, auto-fixing ignore rules |
| `chen-gdp/git-worktrees-skill` | standalone skill repo | PR-based worktree examples, route-oriented structure | project-specific setup treated as universal behavior |
| `EveryInc/compound-engineering-plugin@git-worktree` | plugin skill + script | strong wrapper-script safety narrative, cleanup affordances | script-first design depends on repo-local tooling and auto-trust logic |
| `NeoLabHQ/context-engineering-kit@git:worktrees` | generic command skill | best generic command matrix, strong `remove/prune/repair` separation | slightly over-broad as a trigger surface if copied wholesale |
| `NeoLabHQ/context-engineering-kit@git:create-worktree` | creation workflow skill | branch-type detection, remote-tracking examples | automatic dependency installation is not a generic worktree rule |
| `kndoshn/git-worktree-skill` | concise skill repo | crisp safety rules and escalation for "already checked out" | lacks broader compare/merge and convention-handling depth |
| `yonatangross/orchestkit` worktree references | workflow docs | when-to-use heuristics, team isolation patterns | team branch naming and directory conventions are optional, not universal |
| `laurigates/claude-plugins` ADR-004 | design record | isolation rationale for agent changes, repo-local location as a policy choice | `.claude/worktrees/` is a repo convention, not a Git default |

## Patterns worth borrowing

### 1. Route by intent, not by one giant checklist

The best samples separate:

- deciding whether a worktree is appropriate
- creating one
- diagnosing where a branch is checked out
- cleaning up
- repairing stale metadata

This is more reusable than a single "create-and-bootstrap" procedure.

### 2. Treat "branch already checked out" as a first-class scenario

Multiple community samples surfaced the same user pain point. The safest escalation order is:

1. locate the existing worktree
2. use it if it already matches the user's goal
3. create a derived branch if separate work is needed
4. use detached HEAD for temporary inspection
5. mention riskier overrides only with explicit confirmation

### 3. Keep cleanup commands semantically precise

The strongest generic sample was `NeoLabHQ/context-engineering-kit@git:worktrees`, mainly because it kept `remove`, `prune`, `lock`, `unlock`, and `repair` clearly separated.

### 4. Prefer machine-readable listing for diagnostics

`git worktree list --porcelain` is a recurring high-signal pattern for:

- locating where a branch is checked out
- reasoning about locked or prunable states
- avoiding brittle parsing of human-formatted list output

## Patterns to reject from the canonical skill

### 1. Treating repo bootstrap as universal worktree behavior

Several skills automatically:

- copied `.env*`
- linked `.venv`
- ran `npm install`, `poetry install`, or `uv sync`
- auto-trusted `direnv` or `mise`

These can be valid repo policies, but they are not generic `git worktree` semantics. The canonical skill should surface them only when the repository already documents them.

### 2. Auto-committing or silently modifying ignore rules

Some samples treat "add `.worktrees` to `.gitignore` and commit it now" as a universal rule. A generic skill should explain the risk and ask permission rather than mutating versioned ignore files unprompted.

### 3. Hardcoding one directory convention

Community examples split between:

- repo-local hidden directories like `.worktrees/`
- sibling directories such as `../project-feature`
- tool-owned paths like `.claude/worktrees/`

The right default is to reuse repo convention first, not to impose one layout everywhere.

### 4. Wrapper-script absolutism

A wrapper script can be the right answer for one repo, but a generic skill should not require a script that may not exist in the user's environment.

## Authoring takeaways

- Keep the trigger explicit and conservative.
- Bias toward official commands and generic decision rules.
- Mention repo-specific overlays as optional follow-up steps, not as part of the Git core path.
- Make cleanup and recovery just as first-class as creation.
