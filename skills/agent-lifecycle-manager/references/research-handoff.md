# Research Handoff

Use this reference when `Discover` delegates research before agent authoring begins. The goal is to keep research narrow, reusable, and clearly separate from `Create / Update`.

## Choose The Smallest Helper

| Need | Helper | Expected output |
| --- | --- | --- |
| Local overlap, repo mapping, neighboring packages, dependency graph | `explorer` | local evidence note |
| Official docs, specs, release notes, platform behavior, runtime-control semantics | `docs-researcher` | verified docs note |
| Broader external comparison, mixed official and community examples, landscape scan | `researcher` | multi-source research handoff |

If more than one helper is needed, keep their outputs distinct enough that the authoring stage can tell local evidence from external evidence.

## Required Handoff Contents

Before resuming `Create / Update`, the delegated research should hand back a concise brief that covers:

- the question being answered
- the source inventory, with official and community sources labeled clearly
- representative examples or candidate patterns when the field is broad
- what those sources imply for:
  - mission and non-goals
  - archetype choice
  - tool and permission budget
  - Codex runtime defaults such as `sandbox_mode`, `model_reasoning_effort`, `model`, and `web_search`
  - likely skill dependencies or sub-agent graph shape
- patterns to borrow
- patterns to reject
- unresolved unknowns
- the next recommended lifecycle step

The handoff does not need to be long. It does need to be specific enough that authoring is grounded in evidence rather than memory.

## Pause Rules

Use a lightweight pause when the search space is broad enough that the contract could still move significantly:

- if the user asked for an ecosystem survey or cross-platform comparison, start with a source or candidate inventory
- if the candidate set could materially change the contract, stop and let the user confirm or narrow it before deeper synthesis
- do not start drafting `agent.json`, `claude-code.md`, or `codex.toml` while the core contract is still under research

If the user already supplied the authoritative sources or the question is a narrow docs check, you can usually skip the extra pause and go straight to a short handoff brief.

## Re-entry To Authoring

Once the handoff exists, turn it into the smallest possible set of authoring decisions:

- choose the invocation posture
- choose the archetype
- set the tool and permission budget
- decide whether Codex runtime defaults should be explicit
- decide which skills or sub-agents, if any, belong in the contract

At that point, move into `Create / Update`. Keep the research artifact separate so future audits and revisions can see why the contract was chosen.
