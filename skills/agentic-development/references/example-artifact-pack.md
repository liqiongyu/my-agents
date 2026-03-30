# Example Artifact Pack

Use this reference when the model needs a concrete example of the durable
output this skill should produce.

This is intentionally compact. It is not a universal template. Adapt the
sections to the actual request, but keep the output explicit enough that the
next workflow can build on it without re-deriving the system design.

## Example Scenario

Design an internal support agent that can search docs, draft answers, and open
tickets, but must pause for approval before risky actions.

## Example Output

### 1. Suitability Verdict

Agency is warranted, but only at a modest level. A deterministic workflow would
be too rigid because tool choice and recovery depend on the question, while a
multi-agent team would add coordination cost without a clear reliability gain.

### 2. Chosen Agency Level And Pattern

- Agency level: `L2 single agent`
- Pattern: `single-agent` with bounded tools plus human approval for risky
  actions

Why this is enough:

- one coherent operator can own retrieval, drafting, and ticket creation
- the main reliability lever is approval plus evals, not specialist delegation
- escalation to `L3` should happen only if review or routing becomes a distinct
  durable role

### 3. Framework Or Protocol Recommendation

- Primary direction: OpenAI Agents SDK or a comparable agent-loop runtime with
  first-class guardrails, tracing, and approvals
- Complement: MCP only if the team needs portable tool connectivity across
  multiple runtimes

Rationale:

- the system needs tool use, guardrails, and traceability more than graph-heavy
  branching
- the operating contract is agent-loop centric, not a long-running state graph

### 4. Tool Contract Summary

| Tool | Purpose | Risk band | Rule |
| --- | --- | --- | --- |
| `search_docs` | retrieve internal guidance | low | no approval required |
| `draft_reply` | prepare a proposed answer | medium | drafts only; never auto-send |
| `open_ticket` | create a support ticket | medium | require approval if priority, assignee, or external visibility is non-default |
| `escalate_to_human` | hand off ambiguous or risky cases | low | preferred fallback on uncertainty |

### 5. State And Memory Plan

- Working context: current conversation, retrieved passages, tool results
- Task artifact: draft answer, ticket draft, approval record
- Persistent memory: none at first beyond audit logs and ticket references
- Telemetry: traces, tool-call history, approval decisions, failure reasons

### 6. Eval And Operations Plan

- Capability evals: answer quality, correct ticket creation, correct use of
  fallback on ambiguity
- Safety evals: attempts to act without approval, malformed ticket fields,
  sensitive-data leakage in drafts
- Regression checks: retrieval quality, approval compliance, false escalation
  rate
- Operational gates: launch only after trace review is enabled and risky-action
  approvals are enforced

### 7. Next Specialist Route

- If framework choice is still contested and depends on current vendor facts,
  route to `deep-research`
- If the direction is accepted, route to `implementation-planning`
- If prompt behavior becomes the main problem later, route to
  `prompt-engineering`
