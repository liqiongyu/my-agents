# Output Templates

Use these templates when the normalization pass reaches convergence.

## Normalized Issue Draft

Use for most issue-intake tasks.

```markdown
## Normalized Issue Draft: [Title]

**Source / Provenance**
- Source type: [chat note / bug report / review finding / handoff / run artifact / other]
- Source pointer: [link, file, message summary, run id, PR, or issue reference]

**Problem**
[What is wrong, missing, or risky]

**Why it matters**
[User impact, operator impact, delivery friction, maintenance cost, or opportunity]

**Current evidence**
- [Evidence 1]
- [Evidence 2]

**Scope**
- [What this issue includes]

**Non-goals**
- [What this issue does not include]

**Acceptance criteria**
- [Observable success condition]
- [Observable success condition]

**Dependencies / Related Items**
- [Dependency, related issue, or follow-up]

**Missing information**
- [Gap that still needs to be filled]

**Recommended next workflow**
[clarify / shaping / decomposition / review follow-up / admission / research]
```

## Intake Gap Log

Use when the source is too weak to normalize cleanly without signaling gaps.

```markdown
## Intake Gap Log

**Issue candidate**
[Short working title]

**What is clear**
- ...

**What is still missing**
- ...

**Why the gaps matter**
- ...

**Smallest next action**
- Ask: ...
- Or inspect: ...
```

## Split Recommendation

Use when one source contains multiple materially different issues.

```markdown
## Split Recommendation

**Why split**
[Different systems, owners, acceptance boundaries, or risk profiles]

**Issue A**
- Title: ...
- Primary goal: ...
- Why separate: ...

**Issue B**
- Title: ...
- Primary goal: ...
- Why separate: ...
```

## Review Or Handoff Follow-Up Issue

Use when converting a review finding, failed run, or handoff note into a tracked item.

```markdown
## Follow-Up Issue Draft: [Title]

**Origin**
- Source artifact: [PR / review / run / handoff]
- Triggering note: [short quote or summary]

**Problem**
[What the follow-up issue is meant to address]

**Current evidence**
- [Finding, log, screenshot, test result, or artifact reference]

**Not solved here**
- [What the original run or review did not settle]

**Acceptance criteria**
- ...

**Recommended owner or workflow**
[review follow-up / clarify / shaping / implementation]
```
