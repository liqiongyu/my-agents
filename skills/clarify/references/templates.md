# Clarify Templates

Use these templates when the main workflow has determined that clarification is actually needed.

## Hypothesis-Driven Question Pattern

Prefer this structure:

1. State the ambiguity you found
2. Offer 2-4 concrete interpretations
3. Recommend one option with a short reason
4. Include a catch-all option when the space is genuinely open

Example:

```markdown
I found one scope decision that changes the implementation:

1. **Add JWT middleware to all `/api/*` routes** (recommended — aligns with the existing middleware layout)
2. **Protect only admin routes first** (smaller rollout, but weaker coverage)
3. **Add session-based auth instead** (bigger change, different storage model)
4. **Other** — tell me the direction you want

Which direction should we use?
```

Avoid:

```markdown
What kind of authentication do you want?
```

## Assumptions Log Template

Use this when the user says to proceed, when the environment is non-interactive, or when waiting would cost more than the ambiguity.

```markdown
## Assumptions Log

### Resolved from evidence (T1)
- **Decision**: ...
- **Why**: existing code/docs/tests/history show ...

### Resolved from best practice (T2)
- **Decision**: ...
- **Why**: conventional default for this framework/domain

### Assumed pending review (T3)
- **Decision**: ...
- **Why**: least surprising reversible default
- **Marker**: `NEEDS_REVIEW`
```

## Clarification Summary Template

```markdown
## Clarification Summary

**Original request**: ...

**Clarified scope**:
- ...
- ...

**Key decisions**:
| Decision | Resolution | Source |
|----------|------------|--------|
| ... | ... | T1 / T2 / T3 |

**Out of scope**:
- ...

**Remaining uncertainties**:
- ...
```
