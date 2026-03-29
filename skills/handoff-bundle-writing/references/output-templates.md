# Output Templates

Use these templates when the handoff-writing pass reaches convergence.

## Standard Handoff Bundle

Use for most real transfers, interruptions, and pause points.

```markdown
## Handoff Bundle: [Title]

**Handoff reference**
[handoff_... / pending-id / unknown]

**Issue reference**
[issue reference]

**Run reference**
[run reference]

**Created at**
[ISO timestamp or equivalent]

**Current state**
[Short structured state snapshot]

**Completed**
- ...

**Remaining**
- ...

**Blockers**
- ...

**Next step**
- ...

**Artifact refs**
- ...

**Budget snapshot**
- ...

**Resume notes**
- ...

**Warnings**
- ...

**Specialist pending**
- ...

**Handoff verdict**
[handoff-ready / needs-run-context / needs-execution-brief / needs-exploration / needs-state-sync]
```

## Quick Handoff Bundle

Use for short pauses, user takeovers, or simple same-owner continuation.

```markdown
## Quick Handoff Bundle: [Title]

- Current state: ...
- Completed: ...
- Remaining: ...
- Blockers: ...
- Next step: ...
- Artifact refs: ...
- Resume notes: ...
- Verdict: [handoff-ready / needs-run-context / needs-execution-brief / needs-exploration / needs-state-sync]
```

## Resume Checklist

Use when the next owner needs a clean pickup sequence.

```markdown
## Resume Checklist

1. Read first:
   - ...
2. Confirm current blocker or warning state:
   - ...
3. Execute next step:
   - ...
4. Recheck required gates or verification surfaces:
   - ...
5. If the state has drifted since the handoff, route to:
   - ...
```

## Route Note

Use when a real handoff bundle cannot be written honestly yet.

```markdown
## Route Note

**Verdict**
[needs-run-context / needs-execution-brief / needs-exploration / needs-state-sync]

**Why the handoff is not ready**
- ...

**Smallest next workflow**
- ...

**What should be resolved before re-handoff**
- ...
```

## Machine-Readable Handoff Bundle

Use only when another workflow or tool benefits from a structured contract.

```json
{
  "id": "handoff_01JXYZ",
  "issue_id": "issue_01JXYZ",
  "run_id": "run_01JXYZ",
  "created_at": "2026-03-29T12:58:00Z",
  "current_state": "waiting_for_browser_validation",
  "completed": [
    "Unified backend and UI coupon expiry logic",
    "Added API-layer regression tests"
  ],
  "remaining": [
    "Confirm browser checkout flow against updated API behavior"
  ],
  "blockers": [],
  "next_step": "Trigger browser QA specialist, then re-run the merge gate if evidence matches expectations.",
  "artifact_refs": [
    "change_01JXYZ",
    "evidence_03",
    "decision_01"
  ],
  "budget_snapshot": "Within current run budget envelope",
  "resume_notes": [
    "Do not re-open the coupon expiry design debate unless browser evidence fails."
  ],
  "warnings": [],
  "specialist_pending": [
    "Browser QA specialist"
  ],
  "verdict": "handoff-ready"
}
```
