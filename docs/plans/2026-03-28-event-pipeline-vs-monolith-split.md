# Event Pipeline vs Script Monolith Split Implementation Plan

## Complexity Gate
This needs the deep planning path rather than a short recommendation:
- The choice changes repository structure, operational behavior, and verification scope.
- The current runtime surface is concentrated in a few large scripts, so sequencing matters.
- Introducing an event pipeline affects core build, validate, install, and sync flows.
- A bad order would combine refactor risk and new runtime semantics in the same change set.

## Goal
Choose the safer order for introducing a new internal event pipeline in this repository's current script-heavy architecture, then define a full execution plan with verification and containment.

## Scope
- Decide between:
  - splitting the current script monolith into shared modules and cleaner boundaries first
  - adding the new event pipeline directly inside the existing large scripts first
- Produce a phased implementation plan for the recommended path.
- Preserve the external npm and CLI surface while the internals evolve.

## Not In Scope
- Renaming public npm commands.
- Rewriting the repository into microservices.
- Selecting a long-term external message broker before the first internal event use case is proven.
- Changing package metadata, schemas, or generated catalog formats unless required by the refactor.

## What Already Exists
- [package.json](/Users/liqiongyu/projects/pri/my-agents/package.json) is the public command surface. It routes most core operations through a small set of scripts: `build`, `validate`, `install-*`, `sync-project`, `sync-instructions`, and `test`.
- [scripts/build-catalog.js](/Users/liqiongyu/projects/pri/my-agents/scripts/build-catalog.js) scans package directories, reads metadata, renders Markdown, and writes generated outputs in one file.
- [scripts/validate.js](/Users/liqiongyu/projects/pri/my-agents/scripts/validate.js) duplicates catalog collection and rendering logic instead of reusing a shared library, then layers schema checks, freshness checks, and manifest validation on top.
- [scripts/install.js](/Users/liqiongyu/projects/pri/my-agents/scripts/install.js) mixes argument parsing, manifest expansion, projection filtering, install/uninstall behavior, and project sync state mutation in one entrypoint.
- Existing planning work in [docs/plans/2026-03-28-phase-1-script-and-doc-modularization.md](/Users/liqiongyu/projects/pri/my-agents/docs/plans/2026-03-28-phase-1-script-and-doc-modularization.md) already identifies shared-library extraction as the next safe modularization step.
- Current flows are synchronous and file-driven. There is no existing event bus, queue, or internal event abstraction in the runtime path.

## Constraints
- Keep the public command contract stable during the migration.
- Avoid regressions in generated catalog files, validation behavior, and project sync state.
- Introduce the event path in a way that can be disabled without rolling back the structural refactor.
- Preserve CI and pre-commit expectations.

## Assumptions
- The desired event pipeline is internal orchestration or telemetry for command lifecycle events, not a user-facing product feature.
- The team wants durable enough event semantics to support future consumers, not just ad hoc logging.
- The current modularization plan remains valid and can be extended rather than replaced.
- The first event consumers can start simple: local file sink, stdout sink, or no-op sink behind a flag.

## Open Decisions
- What counts as an event for the first slice: telemetry only, internal lifecycle hooks, or durable workflow signals.
- Whether the first sink should be in-memory/no-op, local file output, structured stdout, or a durable store.
- Whether project-scope and user-scope install operations should emit the same event types.
- Which command phases need events first: build, validate, install, sync, or all of them.

## Recommendation
Split the script monolith first, then add the event pipeline on top of those cleaner boundaries.

## Why This Path Is Better
- The core scripts are already doing too much. Adding an event layer directly inside them would widen the blast radius before the responsibilities are disentangled.
- [scripts/build-catalog.js](/Users/liqiongyu/projects/pri/my-agents/scripts/build-catalog.js) and [scripts/validate.js](/Users/liqiongyu/projects/pri/my-agents/scripts/validate.js) currently duplicate catalog logic. Splitting first creates one stable place to instrument events instead of two drifting implementations.
- [scripts/install.js](/Users/liqiongyu/projects/pri/my-agents/scripts/install.js) is a high-risk orchestration surface because it mutates projection outputs and project sync state. Event work should land after its domain boundaries are clearer.
- This order isolates two kinds of change:
  - first, structure and ownership
  - second, runtime semantics and consumers
- Rollback stays simpler. If the event layer causes trouble later, you can disable it while keeping the refactor benefits.

## When Building The Event Pipeline First Would Be Better
- The event requirement is urgent enough that even a short modularization phase is unacceptable.
- The desired events are purely passive logs with no lifecycle semantics, retries, or consumers.
- The current scripts already expose clean hook points, which this repository does not yet show.

## Scope Challenge
- Do not combine shared-library extraction and event-consumer semantics in the same PR series.
- Do not start with every command. Prove the pattern on one or two lifecycle-heavy flows first.
- Do not let “events” become a vague wrapper for logging, metrics, retries, and workflow orchestration all at once.
- Do not commit to an external broker before the internal event model is stable.

## Phases

### Phase 0: Lock The Event Intent And First Slice
- Outcome:
  The team agrees on what the first event pipeline is for and which commands emit events first.
- Files / components:
  Architecture note, command inventory, existing plans, CI contract.
- Steps:
  1. Define the first event use case: internal telemetry, workflow hooks, or durable lifecycle stream.
  2. Pick the first emitting commands, recommended: `build` and `validate`, because they have deterministic lifecycles and strong verification.
  3. Define a minimal event envelope: event name, timestamp, command, phase, status, duration, correlation id, and optional payload.
  4. Decide which sink ships first: no-op by default plus structured stdout or local JSONL file when enabled.
- Verify:
  A short design note is approved with event purpose, initial producers, initial sink, and explicit non-goals.
- Depends on:
  Team alignment on event intent.

### Phase 1: Split Shared Build And Validation Logic First
- Outcome:
  Shared catalog and validation helpers exist behind thin CLI entrypoints, reducing duplication and creating stable instrumentation points.
- Files / components:
  [scripts/build-catalog.js](/Users/liqiongyu/projects/pri/my-agents/scripts/build-catalog.js), [scripts/validate.js](/Users/liqiongyu/projects/pri/my-agents/scripts/validate.js), new `scripts/lib/*`, generated catalog outputs.
- Steps:
  1. Execute the modularization direction already captured in [docs/plans/2026-03-28-phase-1-script-and-doc-modularization.md](/Users/liqiongyu/projects/pri/my-agents/docs/plans/2026-03-28-phase-1-script-and-doc-modularization.md).
  2. Extract shared filesystem and catalog helpers into `scripts/lib/`.
  3. Remove duplicated catalog generation logic from validation in favor of one shared implementation.
  4. Keep entrypoint CLI behavior and output text stable.
- Verify:
  `npm run build`, `node scripts/validate.js`, and `npm test` pass with only expected generated-file churn.
- Depends on:
  Phase 0.

### Phase 2: Create A Minimal Internal Event Abstraction
- Outcome:
  A small event API exists, but it is disabled by default and has no impact on command behavior when off.
- Files / components:
  New `scripts/lib/events.js`, config/env flag handling, possibly small sink modules.
- Steps:
  1. Add a tiny event interface such as `emitEvent(event)` plus a sink loader.
  2. Implement a no-op default sink so behavior is unchanged unless explicitly enabled.
  3. Add one or two simple sinks:
     - structured stdout
     - local JSONL file
  4. Keep transport and storage decisions isolated behind the sink interface.
  5. Add correlation id generation so one command execution can be traced across phases.
- Verify:
  With events disabled, command outputs and side effects remain unchanged. With events enabled, structured event records appear without changing exit codes.
- Depends on:
  Phase 1.

### Phase 3: Instrument The Lowest-Risk Command Lifecycles
- Outcome:
  `build` and `validate` emit lifecycle events at clear boundaries using the new abstraction.
- Files / components:
  [scripts/build-catalog.js](/Users/liqiongyu/projects/pri/my-agents/scripts/build-catalog.js), [scripts/validate.js](/Users/liqiongyu/projects/pri/my-agents/scripts/validate.js), `scripts/lib/events.js`.
- Steps:
  1. Emit start, success, and failure events at command level.
  2. Emit bounded sub-phase events only where there is clear value, such as catalog generation or freshness-check completion.
  3. Avoid payloads that duplicate entire generated files or validation reports.
  4. Keep event emission best-effort at first unless the approved event model requires durability.
- Verify:
  Event streams accurately reflect command lifecycle and failure states across successful and failing test cases.
- Depends on:
  Phase 2.

### Phase 4: Refactor And Instrument Install/Sync Flows
- Outcome:
  The higher-risk install and sync paths gain cleaner boundaries first, then lifecycle events.
- Files / components:
  [scripts/install.js](/Users/liqiongyu/projects/pri/my-agents/scripts/install.js), project sync state handling, projection logic, new shared helpers if needed.
- Steps:
  1. Extract install/sync responsibilities into focused modules before adding events broadly.
  2. Identify safe event points: command start, manifest resolution complete, projection install complete, sync state written, uninstall complete, command fail.
  3. Decide whether state-write events should include before/after summaries or only high-level metadata.
  4. Keep event payloads scrubbed of local-only or sensitive path data where possible.
- Verify:
  Install, uninstall, and project sync flows still produce the same filesystem results with events disabled, and expected event sequences when enabled.
- Depends on:
  Phase 3 and a narrower modularization pass for install/sync internals.

### Phase 5: Harden, Document, And Decide On Durability
- Outcome:
  The internal event pipeline is proven, documented, and ready either to remain lightweight or to grow into a more durable system.
- Files / components:
  README/docs updates, tests, CI docs, event schema docs, optional durable sink.
- Steps:
  1. Document the event model, enabling mechanism, and sink behavior.
  2. Add regression tests for enabled and disabled modes.
  3. Review whether the event stream is still best-effort telemetry or now important enough to require durable guarantees.
  4. Only after that review, decide whether to add retries, spool files, or an external broker-backed sink.
- Verify:
  Docs match runtime behavior, tests cover both modes, and the team has an explicit decision on durability instead of accidental semantics.
- Depends on:
  Phase 4.

## Verification
- Baseline:
  Capture current behavior of `npm run build`, `node scripts/validate.js`, `npm run validate`, and install/sync flows before refactoring.
- Automated:
  Add unit coverage for shared helpers and event formatting plus end-to-end command checks with events on and off.
- Generated outputs:
  Confirm catalog files and validation freshness logic remain semantically stable.
- CI:
  Keep `.github/workflows/validate.yml` green after each phase, not just at the end.

## Risks
- Risk:
  The modularization changes output ordering or generated-file formatting.
  Impact:
  Freshness checks and downstream expectations fail unexpectedly.
  Mitigation:
  Treat semantic output parity as a release gate for Phase 1.

- Risk:
  Event semantics stay vague and expand mid-implementation.
  Impact:
  The abstraction becomes a dumping ground for logs, metrics, and workflow control.
  Mitigation:
  Approve a small event contract in Phase 0 and keep non-goals explicit.

- Risk:
  Install/sync instrumentation leaks local machine details.
  Impact:
  Sensitive local paths or state details appear in event payloads.
  Mitigation:
  Keep payloads minimal and review emitted fields before enabling broader sinks.

## Rollback Or Containment
- Trigger:
  Modularization changes behavior unexpectedly.
  Action:
  Revert to the previous thin-entrypoint implementation for the affected command while preserving unrelated completed refactors.

- Trigger:
  Event emission causes regressions, noisy output, or incorrect failure handling.
  Action:
  Disable event sinks via flag or config and keep the structural refactor in place.

## Next Step
Approve the sequencing decision: split the script monolith first. Then execute Phase 0 and Phase 1 before writing any runtime event code.
