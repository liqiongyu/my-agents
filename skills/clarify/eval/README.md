# Clarify Eval Suite

This suite checks whether `clarify` keeps a tight hybrid trigger boundary and whether its workflow improves ambiguous implementation requests without drifting into brainstorming or unnecessary interrogation.

## What To Test

- Explicit clarification requests should trigger the skill cleanly
- High-confidence implementation ambiguity should trigger automatically
- Open-ended direction-finding should route to `brainstorming` instead
- Already-specific tasks should not trigger a clarification ceremony
- "Proceed with assumptions" requests should use an assumptions log instead of repeated questioning

## Suggested Run Style

Run each case as a real user prompt with the skill available on the surface under test. Capture the response and score only the assertions listed for that case.
