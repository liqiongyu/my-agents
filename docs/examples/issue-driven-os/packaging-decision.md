# Packaging Decision

This page is the Phase 5 decision note for the Issue-Driven Agent OS reference slice.

## Decision

For now, the reference slice should remain example-only.

It should not yet be projected into a dedicated pack.

## Why This Is The Right Decision Now

The slice has already achieved its current purpose:

- the canonical objects are concrete
- the runtime walkthrough exists
- projection boundaries are illustrated
- the first four starter scenarios are validated

At this stage, adding a pack would create more hardening pressure than clarity.

## What Packaging Would Risk Right Now

If a pack were added too early, it could accidentally imply that:

- the current example structure is already the final runtime decomposition
- the current stand-in agents are already the right long-term package boundaries
- projection choices are more stable than they really are
- the docs-first slice is already ready for installation semantics

Those implications would all be premature.

## What Still Benefits From Staying Example-Only

The current slice still needs freedom in at least four places:

- decomposition artifacts may still gain dedicated object examples
- projection examples may still branch into GitHub, Codex, and Claude variants
- runtime services are still conceptual in parts
- stand-in assets may later be replaced by thinner wrappers or more precise packages

Keeping the slice example-only preserves that freedom.

## When Packaging Would Become Justified

A thin reference pack becomes reasonable only when all of the following are true:

- the slice has a stable enough projection story
- the slice no longer relies on ambiguous stand-ins
- the runtime contract has at least one implementation-facing reference path
- packaging would clarify adoption more than it would freeze ontology

## What A Future Thin Pack Could Contain

When the slice is ready, a thin pack should remain deliberately small.

It would likely include only:

- pointers to the canonical docs
- a small projection manifest
- a curated set of stand-in assets for demo installation

It should not become:

- a hidden orchestrator
- a dumping ground for runtime services
- a shortcut that bypasses canonical schema or runtime contract

## Current Outcome

The reference slice remains:

- example-first
- bridge-doc-driven
- projection-friendly
- not yet package-hardened

That outcome is intentional.

## Next Step

The next best move is no longer to add more architecture docs.
It is to decide whether to start a minimal implementation-facing reference path from the bridge docs, while keeping this slice as the stable example baseline.
