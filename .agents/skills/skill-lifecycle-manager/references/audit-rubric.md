# Audit Rubric

Use this rubric when auditing one skill or an entire skill library. The goal is not only to catch broken files, but to identify drift, overlap, context waste, and lifecycle gaps.

## Severity Levels

| Level | Meaning | Typical action |
| --- | --- | --- |
| **Critical** | Unsafe, badly misleading, or structurally broken | stop and fix before use |
| **High** | Likely to cause repeated misuse or broken lifecycle flow | fix soon |
| **Medium** | Reduces quality, confidence, or maintainability | queue for improvement |
| **Low** | Useful polish, not urgent | backlog or opportunistic cleanup |

## Audit Dimensions

| Dimension | What to inspect | Failure examples |
| --- | --- | --- |
| Trigger quality | Frontmatter `description` says what the skill does and when to use it | vague description, no trigger phrases, only says what the skill "is" |
| Boundary clarity | The skill states what it should not handle | over-triggers on adjacent tasks, no "when not to use" guidance |
| Package integrity | Required files and metadata line up | missing `skill.json`, changelog mismatch, dir/name mismatch |
| Reference hygiene | Heavy detail lives in references rather than bloating the body | giant monolithic `SKILL.md`, dead reference links |
| Script safety | Scripts are necessary, scoped, and unsurprising | undeclared network side effects, destructive actions, opaque helpers |
| Validation readiness | The skill can be structurally checked before use | no fast validation path, metadata inconsistency |
| Evaluation readiness | The skill can be tested on realistic work | no eval plan, no obvious realistic prompts, no workspace conventions |
| Trigger optimization readiness | Description can be tuned independently | body and description are tightly entangled |
| Install / publish readiness | There is a credible target-surface story | unclear install target, no packaging boundary |
| Projection health | Platform copies match the canonical source and omit the right repo-only files | stale `.claude/skills` copy, wrong install surface, Codex/Claude drift |
| Inventory health | The skill adds value to the library as a whole | duplicate intent, stale upstream copy, context waste |

## Recommended Audit Flow

1. **Run a structural scan first**
   - required files
   - JSON parse errors
   - changelog/version mismatch
   - category validity

2. **Inspect trigger quality**
   - could the model discover this skill from real user language?
   - is the activation boundary too narrow or too broad?

3. **Inspect lifecycle completeness**
   - if the skill helps create things, can it also validate them?
   - if the skill helps improve things, does it define how success is measured?

4. **Inspect library fit**
   - does another local skill already cover this intent?
   - would combining or deprecating improve the library?

5. **Prioritize fixes**
   - fix structural breakage before wording polish
   - fix trigger failures before adding more clever body content
   - fix duplicate overlap before adding more near-identical skills

## Audit Output Template

```markdown
## Audit Summary: <scope>

**Verdict**: Healthy / Needs cleanup / High-risk drift

### Critical
- ...

### High
- ...

### Medium
- ...

### Low
- ...

### Recommended next lifecycle step
- Discover / Create-Update / Validate / Evaluate / Optimize Trigger / Install-Publish
```
