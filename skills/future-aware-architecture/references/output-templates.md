# Output Templates

Use these templates when the workflow reaches convergence and capture.

## Quick Recommendation

Use for low-risk or quick-scope decisions that still need a minimum contract.

```markdown
## Quick Architecture Recommendation: [Topic]

**Problem**
[What is being decided]

**Recommendation**
[Chosen direction]

**Why now**
[Most important rationale]

**Top risk**
[Main downside or uncertainty]

**Revisit trigger**
[What would make us reopen this decision]
```

## Architecture Decision Brief

Use for most standard-scope decisions.

```markdown
## Architecture Decision Brief: [Topic]

**Problem**
[What decision is being made and why it matters]

**Decision classification**
- Problem shape: Clear / Complicated / Complex
- Reversibility: One-way door / Two-way door
- Decision owner: ...

**Context**
- Goals: [...]
- Constraints: [...]
- Non-goals: [...]

**Current alternatives**
- Status quo / manual workaround / incremental improvement: ...

**Options considered**
| Option | Summary | Best for | Main trade-off |
| --- | --- | --- | --- |
| A | ... | ... | ... |
| B | ... | ... | ... |

**Decision matrix**
| Criteria | Weight | Option A | Option B | Notes |
| --- | --- | --- | --- | --- |
| ... | ... | ... | ... | ... |

**Uncertainty map**
| Unknown | Why it matters | Confidence | Resolution path |
| --- | --- | --- | --- |
| ... | ... | ... | ... |

**Recommendation**
[Chosen direction and why]

**Now / Next / Option Value**
- Now: ...
- Next: ...
- Option Value: ...

**Risks and mitigations**
- [Risk]: [Mitigation]

**Assumptions**
- ...

**Review triggers**
- Review date: ...
- Stop / continue / revisit when: ...

**Next step**
[Research / ADR / implementation planning / review]
```

## Technology Radar Snapshot

Use when the architecture work includes current-state or near-future technology
assessment.

```markdown
## Technology Radar: [Scope]

| Item | Area | Ring | Why it belongs there | Revisit trigger |
| --- | --- | --- | --- | --- |
| ... | ... | Adopt / Trial / Assess / Hold | ... | ... |
```

## Decision Governance Note

Use when the architecture work needs a clearer decision process and review loop.

```markdown
## Decision Governance

- Decider / owner: ...
- Consulted parties: ...
- Informed parties: ...
- Review date: ...
- Kill / continue / expand triggers: ...
- What would change the decision: ...
```

## ADR Seed

Use when the user wants a durable record that can later become a full ADR.

```markdown
# ADR Seed: [Decision]

## Status
Proposed / Accepted / Superseded

## Context
[Situation, constraints, quality attributes, and why a decision is needed now]

## Options
- Option A: ...
- Option B: ...
- Option C: ...

## Decision
[Chosen option]

## Rationale
[Why this option won]

## Consequences
- Positive: ...
- Negative: ...
- Deferred follow-up: ...

## Assumptions
- ...

## Revisit Triggers
- ...
```

## Pilot or Spike Appendix

Use when a decision-critical uncertainty needs validation before commitment.

```markdown
## Pilot / Spike Appendix

**Question**
[What uncertainty this test resolves]

**Smallest useful scope**
[Bounded scope]

**Success signals**
- ...

**Guardrails**
- ...

**Exit criteria**
- Adopt / Iterate / Reject conditions
```

## Specialist Evidence Summary

Use when a narrow research or specialist-skill detour informed the decision.

```markdown
## Specialist Evidence Summary: [Domain]

**Question**
[What specific branch needed deeper evidence]

**Source path**
- Specialist skill used: ...
- Research/browse path used: ...

**What changed**
- Criteria impacted: ...
- New evidence: ...
- Recommendation impact: ...

**Caveats**
- ...
```

## Capture Rules

- Prefer the smallest artifact that still preserves the decision.
- Inline chat output is enough for low-risk, quick decisions.
- Save a file when the topic is cross-cutting, likely to be revisited, or likely to inform implementation planning.
- If the architecture decision materially depends on fresh external evidence, keep the evidence summary near the final recommendation instead of burying it.
- If reversibility, uncertainty, or decision rights materially affect the choice, include the governance note even when the rest of the artifact is short.
