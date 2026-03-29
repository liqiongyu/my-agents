# Output Templates

Use these templates when the shaping pass reaches convergence.

## Shaped Issue Brief

Use for most shaping tasks.

```markdown
## Shaped Issue Brief: [Title]

**Problem**
[What is wrong, missing, or risky]

**Desired outcome**
[What success looks like at issue level]

**In scope**
- ...

**Out of scope / Non-goals**
- ...

**Acceptance criteria**
- ...
- ...

**Dependencies / blockers**
- ...

**Execution risks**
- ...

**Readiness verdict**
[ready / needs-clarify / needs-exploration / needs-decomposition / needs-reframing]

**Recommended next workflow**
[admission / execution / clarify / exploration / decomposition / other]
```

## Decomposition Recommendation

Use when the issue is real but too broad or mixed.

```markdown
## Decomposition Recommendation

**Why split**
[Different owners, systems, acceptance boundaries, or uncertainty classes]

**Suggested split axes**
- ...

**Parent issue should keep**
- ...

**Child issue candidates**
- [Candidate 1]: [purpose]
- [Candidate 2]: [purpose]

**What should happen next**
[Route to decomposition workflow / draft child issues / gather more evidence first]
```

## Exploration Brief

Use when shaping cannot close honestly without more evidence.

```markdown
## Exploration Brief

**What is still unknown**
- ...

**Why it blocks shaping**
- ...

**Smallest next check**
- ...

**Expected output from exploration**
- repo reconnaissance
- acceptance clarification
- specialist evidence
- other: ...
```

## Execution Brief Seed

Use when the issue is shaped and nearly ready for execution.

```markdown
## Execution Brief Seed

**Goal**
[This run should accomplish...]

**What this issue owns**
- ...

**What it must not expand into**
- ...

**Key acceptance checks**
- ...

**Dependencies / risks**
- ...
```

## Done-Contract Seed

Use when the shaping pass should hand off a clear completion contract.

```markdown
## Done-Contract Seed

- [Observable success condition]
- [Observable success condition]
- [Evidence or verification artifact expected]
```
