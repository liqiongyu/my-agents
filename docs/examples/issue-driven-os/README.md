# Issue-Driven Agent OS Reference Slice

This directory contains the first concrete reference slice for the Issue-Driven Agent OS.

It is intentionally example-first.
Its purpose is to make the bridge-layer documents tangible and to document the
reference side of the runtime, even though the repo now also ships a real
GitHub-backed execution path.

## What Is Here

- `runtime-walkthrough.md`
  - Phase 2 walkthrough for the minimal runtime path and the three deviation paths
- `projection-boundary-demonstration.md`
  - Phase 3 example showing how canonical objects derive GitHub-like projection surfaces
- `validation-pass.md`
  - Phase 4 check of the four starter scenarios against the bridge-layer documents
- `packaging-decision.md`
  - Phase 5 decision on whether the slice should stay example-only or project into a thin pack
- `objects/`
  - canonical object examples aligned with the bridge-layer schema
- `scenarios/`
  - starter scenario fixtures aligned with the evaluation pack

## Current Starter Coverage

- `G1`
  - small bug, no specialist
- `GT1`
  - review gate blocks merge
- `F1`
  - budget exhaustion
- `D1`
  - pre-execution decomposition

## Recommended Reading Order

1. Read [runtime-walkthrough.md](./runtime-walkthrough.md)
2. Read [projection-boundary-demonstration.md](./projection-boundary-demonstration.md)
3. Read [validation-pass.md](./validation-pass.md)
4. Read [packaging-decision.md](./packaging-decision.md)
5. Pick one scenario under [scenarios/](./scenarios/)
6. Follow the referenced objects under [objects/](./objects/)
7. Compare the object shapes against:
   - [/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-canonical-schema.md](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-canonical-schema.md)
8. Compare the actor and handoff boundaries against:
   - [/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-runtime-contract.md](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-runtime-contract.md)
9. Compare the scenario intent against:
   - [/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-evaluation-pack.md](/Users/liqiongyu/projects/pri/my-agents/docs/architecture/issue-driven-agent-os-evaluation-pack.md)

## How To Read This Slice

This slice is meant to answer three questions quickly:

- What is the smallest runtime form the architecture expects?
- Which existing repository assets can stand in for that runtime today?
- Where are services still conceptual rather than implemented?

The walkthrough page answers those questions first.
The scenario and object files then provide the concrete fixtures behind that story.

## Unified CLI Surface

You no longer need to remember the individual helper scripts to exercise this
reference runtime.
The canonical entrypoint is now:

```bash
npx my-agents issue-driven-os <command> ...
```

Available commands:

- `bundle`
- `simulate`
- `run`
- `project`
- `pipeline`
- `github produce`
- `github run`
- `github daemon`
- `github reconcile`

The most direct end-to-end path is:

```bash
npx my-agents issue-driven-os pipeline G1
```

The most direct real GitHub path is:

```bash
npx my-agents issue-driven-os github run owner/repo --repo-path /path/to/repo --issue 123
```

## Real GitHub Mode

The repo now includes a real GitHub-backed execution path in addition to the
reference helpers.

Use it when you want to work against a real repository, real issues, real
branches, and real pull requests:

- `github produce`
  - turn raw input into a GitHub issue and mark it ready
- `github run`
  - consume one real issue end to end
- `github daemon`
  - poll a real repository and run multiple issue workers
- `github reconcile`
  - sync issue state after merge or projection drift

Example:

```bash
npx my-agents issue-driven-os github daemon owner/repo \
  --repo-path /path/to/repo \
  --concurrency 4 \
  --once
```

This real mode uses:

- GitHub via `gh`
- Codex via `codex exec`
- one worktree per issue
- local runtime state under `~/.my-agents/issue-driven-os/`

## Runtime Bundle Helper

This slice now includes a thin reference-runtime helper.
It does not run a full orchestrator.
It resolves one starter scenario into a concrete runtime bundle that shows:

- starting canonical objects
- required runtime actors
- current repo stand-ins
- expected artifacts
- expected state outcomes

Run it with:

```bash
npm run issue-driven-os:bundle -- G1
```

For machine-readable output:

```bash
npm run issue-driven-os:bundle -- GT1 --json
```

## Scenario Simulation Helper

The repo now also includes a thin phase-driven simulation helper.
It still does not run a real orchestrator.
It takes one reference bundle and turns it into a structured transcript showing:

- which runtime actor owns each phase
- which current repo stand-in is used
- which inputs and expected artifacts are visible in that phase
- which state outcomes the phase is expected to drive

Run it with:

```bash
npm run issue-driven-os:simulate -- G1
```

For machine-readable output:

```bash
npm run issue-driven-os:simulate -- F1 --json
```

## Reference Run Helper

The repo now also includes a thin stateful run helper.
This helper is still reference-only.
It does not claim to be the final `Run Manager`, and it does not write canonical `Run Record` objects.
Instead, it persists a **reference runtime session artifact** that captures:

- the chosen starter scenario
- a timestamped session id
- the phase transcript
- the derived artifact trail
- the final expected state outcomes

Run it with:

```bash
npm run issue-driven-os:run -- G1
```

By default it writes to `.tmp/issue-driven-os-runs/`.

To choose a path:

```bash
npm run issue-driven-os:run -- F1 --out .tmp/f1-session.json
```

For stdout-only JSON:

```bash
npm run issue-driven-os:run -- GT1 --json
```

## Reference Projection Helper

The repo now includes a thin projection helper that consumes a persisted
reference runtime session and derives a GitHub-like projection payload.

This helper is still adapter-facing and reference-only.
It does not write to GitHub or redefine canonical state.
It only produces a derived outward payload for:

- issue labels and visible state
- PR review state and merge eligibility
- check conclusions
- artifact links and comment intents

Run it with:

```bash
npm run issue-driven-os:project -- .tmp/issue-driven-os-runs/g1-session.json
```

To choose an output path:

```bash
npm run issue-driven-os:project -- .tmp/issue-driven-os-runs/f1-session.json --out .tmp/f1-projection.json
```

For stdout-only JSON:

```bash
npm run issue-driven-os:project -- .tmp/issue-driven-os-runs/gt1-session.json --json
```

## Reference Stand-Ins

This slice originally used existing repository assets only as narrow stand-ins.
That is still true for the reference helpers, but the real GitHub mode now also
reuses the canonical issue-driven agent packages directly:

- intake and normalization
  - `agents/issue-intake-normalizer`
- shaping and decomposition
  - `agents/issue-shaper`
- primary execution path
  - `agents/issue-cell-executor`
- evaluator path
  - `agents/issue-cell-critic`
- governance and projection support
  - `packs/issue-driven-os-governance`
- execution-cell support
  - `packs/issue-driven-os-core`

The reference slice and the real GitHub path now coexist:

- the reference commands are still example-first
- the GitHub commands are the real consumer path

## Notes

- These examples are canonical-side fixtures, not GitHub-native projections.
- The reference helpers are still intentionally small and should not be confused with the real GitHub worker path.
- Runtime services such as admission, budget checks, verification gates, workspace management, and adapters are no longer only conceptual at the repo level; they now have an initial GitHub-backed implementation path.
- Projection examples in this directory are illustrative only and remain derived from canonical objects.
- The validation pass records what this slice can already represent without inventing additional architecture.
- The packaging decision records why the slice currently remains example-first instead of becoming a pack.
