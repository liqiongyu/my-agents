# Context And Handoffs

Use this reference to calibrate clarification depth and avoid overlapping adjacent skills.

## Context-Specific Focus

| Context | Focus | Typical clarification target |
| --- | --- | --- |
| Bug fix | Reproduction, expected vs actual, scope of fix | root-cause fix vs patch, affected environments |
| New feature | Users, acceptance criteria, integration points | MVP scope, touched systems, non-goals |
| Refactoring | Behavioral preservation, boundaries, tests | what must remain identical, which modules are in scope |
| Architecture | Constraints, reversibility, migration risk | must-have constraints before design work starts |
| Debugging | Symptoms, environment, reproduction | when it started, where it reproduces, what changed |
| Docs/content | Audience, tone, completeness | target reader, must-cover points, excluded detail |

## Clarify vs Brainstorming

Use `clarify` when:

- the user already has a target task and needs the request disambiguated before execution
- the missing information is mostly about scope, acceptance criteria, or contradictions

Use `brainstorming` when:

- the user needs help deciding what to do, not just what an existing request means
- the real job is option exploration, tradeoff comparison, or strategic direction
- phrases like "what should we do", "help me think through", or "which approach makes sense" are the main request

## Downstream Handoffs

- Hand off to `writing-plans` when the clarified task still needs a structured implementation plan.
- Hand off to `review` when the user wants existing work checked against the clarified criteria.
- Hand off to `deep-research` when clarification reveals that the missing input is external knowledge, not project intent.
