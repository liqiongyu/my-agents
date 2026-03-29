# Issue-Driven OS Core Pack

This pack installs the first canonical team for the repository's
Issue-Driven Agent OS work:

- one intake normalizer
- one issue shaper
- one issue-cell execution unit
- one issue-cell critic
- the shared explorer dependency
- the core workflow skills those agents depend on

It is meant for projects that want the repo's issue-driven intake, shaping,
execution, and review path in one explicit installable unit.

## Included Skills

- `issue-normalization`
- `issue-shaping`
- `execution-briefing`
- `handoff-bundle-writing`
- `acceptance-verification`
- `clarify`
- `review`

## Included Agents

- `issue-intake-normalizer`
- `issue-shaper`
- `issue-cell-executor`
- `issue-cell-critic`
- `explorer`

`issue-cell-executor` is the lead agent for the team story. The pack still
lists all shared dependencies explicitly so catalog output, install behavior,
and runtime expectations stay aligned.

## Install

```bash
npx my-agents install pack issue-driven-os-core
npx my-agents install pack issue-driven-os-core --platform codex --scope project
```

Use project scope when you want the pack projected into the current repository's
runtime surfaces instead of your user home.

## Notes

- This pack is the first implementation-facing team for the Issue-Driven Agent
  OS, not the whole runtime system.
- Runtime services such as run management, projection sync, verification gates,
  and artifact storage are intentionally not packaged here.
- The pack is explicit on purpose: it ships the cooperative agent team and core
  workflow skills, not hidden transitive behavior.
