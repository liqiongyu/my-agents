# Audit Rubric

Use this rubric when auditing one agent or an entire agent library. The goal is not only to catch broken files, but to identify overlap, overreach, drift, and lifecycle gaps.

## Severity Levels

| Level | Meaning | Typical action |
| --- | --- | --- |
| **Critical** | Unsafe, misleading, or structurally broken | stop and fix before use |
| **High** | Likely to cause repeated misuse, overreach, or routing failures | fix soon |
| **Medium** | Reduces quality, confidence, or maintainability | queue for improvement |
| **Low** | Useful polish, not urgent | backlog or opportunistic cleanup |

## Audit Dimensions

| Dimension | What to inspect | Failure examples |
| --- | --- | --- |
| Trigger quality | Short descriptions say what the agent does and when to use it | vague description, no negative boundary, over-triggering |
| Contract clarity | Mission, non-goals, archetype, and tool budget make sense together | "planner" behavior with implementer write tools, unclear ownership |
| Surface alignment | `agent.json`, `claude-code.md`, and `codex.toml` describe the same agent | Claude and Codex surfaces drift into different roles |
| Runtime-default discipline | Codex defaults match the intended permission and reasoning budget | read-only agent inherits `workspace-write`, reusable agent silently inherits reasoning effort |
| Package integrity | Required files and metadata line up | missing `agent.json`, name mismatch, changelog mismatch |
| Dependency graph health | Skill references and sub-agent graph are sensible | unknown skill, deep nested sub-agent chains, self-reference |
| Permission discipline | Tool and permission budget matches the job | broad write/network access for a read-only review agent, `web_search` enabled without a real research need |
| Validation readiness | The package can be checked before use | no obvious validation path, stale generated indexes |
| Evaluation readiness | The agent can be tested on realistic work | no realistic prompts, no durable evidence plan |
| Install readiness | Runtime target story is credible | unclear install surface, mismatched filenames |
| Library fit | The agent adds value to the overall inventory | duplicate intent, stale overlap with existing agent or skill |

## Recommended Audit Flow

1. **Run a structural scan first**
   - required files
   - JSON parse errors
   - changelog/version mismatch
   - category validity
2. **Inspect routing and contract quality**
   - could the agent be selected from realistic user language?
   - does the archetype fit the actual behavior?
   - is the permission budget proportional?
3. **Inspect surface parity**
   - do the authored files still describe the same agent?
   - do installed surfaces or generated catalogs drift from source?
4. **Inspect library fit**
   - does another local agent or skill already cover this intent?
   - would tightening or consolidation improve the library?
5. **Prioritize fixes**
   - structural breakage and dangerous overreach first
   - trigger failures next
   - overlap and polish after that

## Scoring

The automated audit script (`audit_agent_inventory.py`) computes a numeric health score so audit results are comparable across runs.

### Severity Weights

| Severity | Weight |
| --- | --- |
| Critical | 4 |
| High | 3 |
| Medium | 2 |
| Low | 1 |

### Health Score Formula

```
health_score = 1 - (weighted_findings / (agent_count * max_possible_per_agent))
```

Where `weighted_findings` is the sum of each finding's severity weight, and `max_possible_per_agent` is a normalizing constant.

### Thresholds

| Label | Score range | Meaning |
| --- | --- | --- |
| **Healthy** | >= 0.85 | Library is in good shape; low findings are polish |
| **Needs cleanup** | 0.60 - 0.84 | Actionable findings that should be addressed |
| **High-risk drift** | < 0.60 | Critical or high findings requiring immediate attention |

The score is reproducible: running the audit twice on the same inventory produces the same number.
