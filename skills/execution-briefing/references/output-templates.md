# Output Templates

Use these templates when the briefing pass reaches convergence.

## Execution Brief

Use for most briefing tasks.

```markdown
## Execution Brief: [Title]

**Goal**
[What this run should accomplish now]

**Issue boundary recap**
[Compact reminder of the issue and current scope]

**This run owns**
- ...

**This run must not expand into**
- ...

**Recommended path / Starting surfaces**
- ...

**Dependencies / blockers**
- ...

**Execution risks**
- ...

**Acceptance focus**
- ...

**Required checks**
- ...

**Required evidence**
- ...

**Required gates / Preconditions**
- ...

**Gate sources of truth**
- ...

**Escalation triggers**
- ...

**Briefing verdict**
[brief-ready / needs-shaping / needs-clarify / needs-exploration / needs-planning]
```

## Quick Execution Brief

Use for compact, already-stable issues when a shorter artifact is enough.

```markdown
## Quick Execution Brief: [Title]

- Goal: ...
- Do not expand into: ...
- Start from: ...
- Required checks: ...
- Required evidence: ...
- Required gates / Preconditions: ...
- Gate sources of truth: ...
- Escalate if: ...
- Verdict: [brief-ready / needs-shaping / needs-clarify / needs-exploration / needs-planning]
```

## Done Contract

Use when the brief should hand off a clear completion contract.

```markdown
## Done Contract

**Required outcomes**
- ...

**Required checks**
- ...

**Required evidence**
- ...

**Known accepted risks**
- ...

**Merge preconditions**
- ...

**Close preconditions**
- ...

**Operational gate sources of truth**
- ...
```

## Route-Back Note

Use when execution briefing reveals the work is not ready for a run brief.

```markdown
## Route-Back Note

**Verdict**
[needs-shaping / needs-clarify / needs-exploration / needs-planning]

**Why this brief is not ready**
- ...

**Smallest next workflow**
- ...

**What should be resolved before re-briefing**
- ...
```

## Kickoff Summary

Use when another execution owner will pick up the run immediately.

```markdown
## Kickoff Summary

- Current run goal: ...
- Do not expand into: ...
- First place to start: ...
- Required checks before claiming done: ...
- Named gate sources of truth: ...
- Stop and reroute if: ...
```

## Approval Checkpoint Note

Use when the brief should pause for sign-off before execution begins.

```markdown
## Approval Checkpoint

**Brief lane**
[quick / standard]

**Decision requested**
[Approve this brief for execution / Route back for more shaping / Route to planning / Route to clarify]

**What is ready**
- ...

**What execution is still waiting on**
- explicit sign-off
- any named preconditions

**If approved, next execution owner starts with**
- ...
```

## Machine-Readable Brief Contract

Use only when another workflow or tool will benefit from a structured contract.

```json
{
  "brief_version": "1",
  "lane": "standard",
  "verdict": "brief-ready",
  "goal": "Stabilize retry behavior for failed email delivery without duplicate sends.",
  "non_goals": [
    "Do not redesign templates.",
    "Do not change notification preferences."
  ],
  "starting_surfaces": [
    "Retry worker",
    "Delivery failure tests"
  ],
  "required_checks": [
    "Retry path is covered by an automated check or equivalent validation."
  ],
  "required_evidence": [
    "Test output or equivalent proof for duplicate-send prevention."
  ],
  "required_gates": [
    "Code review"
  ],
  "gate_sources_of_truth": [
    "Retry regression review checklist"
  ],
  "escalation_triggers": [
    "Evidence points to a different subsystem than the current issue scope."
  ],
  "approval_required": false,
  "hold_reason": null
}
```
