# Agent Archetypes

Use this reference when the lifecycle route includes `Create / Update`, `Audit / Governance`, or `Evaluate`. The goal is to make archetype choice explicit before it turns into accidental prompt drift.

## Valid Repo Archetypes

The current repository schema supports these archetypes:

| Archetype | Use when | Typical posture | Common mistake |
| --- | --- | --- | --- |
| `explorer` | The agent's job is read-only mapping, discovery, evidence gathering, tracing, or impact analysis | usually `manual-first` or `hybrid` | giving it write-heavy behavior that really belongs to `implementer` |
| `reviewer` | The agent's job is structured critique, findings-first review, and severity-ranked risk analysis | usually `manual-first` | letting it drift into solution implementation instead of review |
| `implementer` | The agent's job is writing code, refactoring, or executing a concrete plan | usually `manual-first` or `hybrid` | giving it broad planning or audit ownership that belongs elsewhere |
| `planner` | The agent's job is architecture, sequencing, trade-offs, and decision framing without code edits | usually `manual-first` | turning it into a read-write generalist |
| `debugger` | The agent's job is reproducing failures, isolating root cause, and applying minimal fixes | usually `manual-first` | making it a generic feature implementer |
| `custom` | The mission genuinely does not fit the built-in roles, even after tightening scope | depends on the mission | choosing it too early instead of adapting an existing role |

## Selection Heuristics

Prefer the smallest archetype that matches the job:

- If the core value is evidence before edits, start with `explorer`.
- If the core value is findings before fixes, start with `reviewer`.
- If the core value is shipping code, start with `implementer`.
- If the core value is planning before coding, start with `planner`.
- If the core value is reproduction and root-cause isolation, start with `debugger`.

Only choose `custom` when:

- the mission genuinely combines roles in a way that should stay combined
- splitting the work into existing archetypes would be more confusing than helpful
- you can explain the non-goals clearly enough to prevent the custom agent from becoming a generic catch-all

## Audit Questions

When reviewing an archetype choice, ask:

- Does the prompt surface match the declared archetype?
- Does the tool and permission budget match the archetype?
- Would a built-in archetype plus a delegated helper be clearer than `custom`?
- Does the archetype help keep neighboring agents distinct?
