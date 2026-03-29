# Issue-Driven OS Governance Pack

This pack bundles the governance-facing part of the Issue-Driven Agent OS:

- shaping and admission decisions
- priority and risk judgment
- run-budget framing
- acceptance verification
- backlog curation
- projection and artifact traceability support

It is intended for teams that want the control-plane side of the Agent OS to be
installable and explicit rather than hidden across scattered workflows.

## Included Skills

- `issue-shaping`
- `priority-scoring`
- `risk-gating`
- `admission-routing`
- `budget-decision`
- `acceptance-verification`
- `backlog-curation`
- `projection-sync`
- `artifact-linking`

## Included Agents

- `issue-shaper`
- `issue-cell-critic`
- `explorer`

The pack stays explicit about agent membership, including `explorer`, so the
catalog and install behavior match the real runtime dependencies.

## Install

```bash
npx my-agents install pack issue-driven-os-governance
npx my-agents install pack issue-driven-os-governance --platform codex --scope project
```

## Notes

- This pack represents the governance and control-plane side of the Agent OS at
  the package level; it does not claim that runtime services are fully
  implemented in this repo.
- Service families such as `Run Manager`, `Verification & Gate Engine`, and
  `Projection / State Sync Adapter Layer` are still runtime concepts first.
- The included skills are the repo-level authoring and projection forms for
  those governance capabilities.
