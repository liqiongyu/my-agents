---
name: skill-researcher
description: >
  Research existing community skills for a skill topic, pause for candidate
  confirmation, and produce a Fusion Report for downstream skill creation.
  Use only for skill-ecosystem research, not installation, general research,
  or direct skill authoring.
version: 0.2.3
---

# Skill Researcher

Research the agent-skills ecosystem before authoring or revising a skill. The
default output is a separate Fusion Report: a structured handoff artifact that
captures what exists, what patterns are worth keeping, and what should happen
next in a downstream creation workflow.

This is a manual-first skill. It should activate only when the request is
already clearly about skill discovery, skill comparison, or fusion research for
future skill work.

## When to Activate

- The user wants to create or improve a skill and first needs to survey what already exists
- The user asks to "find skills for X", "compare skills on Y", or "see what is out there"
- The user wants to combine the best patterns from multiple existing skills
- A skill workflow needs a research handoff before create/update work begins

## When Not To Use

Do not use this skill when:

- The user already has the exact source material and wants direct authoring work - use `skill-creator` or the create/update stage in `skill-lifecycle-manager`
- The user wants the fastest way to install a skill - use the installer or platform-native search flow
- The task is general research rather than skill research - use `deep-research`
- The user mainly needs projection, install, publish, or governance work - use `skill-lifecycle-manager`

## Invocation Posture

Treat this skill as `manual-first`.

Why:

- It is a heavy research workflow with multiple mandatory pauses
- False positives are expensive because the skill can expand into a large survey
- Users usually know when they want ecosystem research instead of direct authoring

That means the trigger should stay precise and boundary-heavy. If the user's
intent is vague, ask whether they want skill-ecosystem research instead of
assuming it.

## Hard Gates

These gates are mandatory whether this skill is used directly or delegated by
another meta-skill.

1. **Depth mode is a gate for broad discovery.** If the plan requires an open-ended ecosystem search and the user has not specified Quick, Standard, or Deep, stop and ask before broad discovery begins. If the user already supplied a bounded source set and no broad discovery is needed, keep the scope narrow instead of forcing a depth-mode question first.
2. **Candidate confirmation is a gate.** After discovery produces a candidate list, stop and wait for explicit user confirmation before any Collect, Analyze, or Synthesize work.
3. **Research handoff is the default end state.** Deliver a separate Fusion Report or research artifact. Do not silently continue into target-skill authoring unless the user explicitly asks for that shortcut after reviewing the candidate set.
4. **User-supplied scope is binding.** If the user provides specific URLs, repositories, or platforms, keep the research constrained to that scope unless they explicitly ask to widen it.

## Detailed References

Keep the main skill lean and use the references for the heavier playbooks:

- Use [scope-rules.md](references/scope-rules.md) for default source breadth, cross-platform coverage, and narrowing behavior when the user already supplied sources.
- Use [search-playbook.md](references/search-playbook.md) for tool mapping, depth modes, search tiers, candidate-list format, and collection guidance.
- Use [fusion-report-template.md](references/fusion-report-template.md) for the report structure, quality gates, and handoff expectations.

## Workflow

### Phase 1: Scope

Understand what the user wants before searching.

1. Identify the skill topic.
2. Clarify whether the user is creating, improving, or comparing skills.
3. Confirm the depth mode only when broad discovery is needed and it was not specified.
4. Decide the source scope:
   - default: cross-platform search across relevant skill ecosystems
   - override: preserve any platform or source constraints the user already supplied
5. If working in a skill repository, check whether a local skill on this topic already exists.

Before moving on, summarize the search plan in one or two sentences. If depth
mode is unresolved for a broad survey, stop here and ask. If the scope is
already constrained to user-supplied sources, summarize the narrow plan and
continue without widening it.

### Phase 2: Discover

Search for candidate skills using the playbook in
[search-playbook.md](references/search-playbook.md).

Default behavior:

- Prefer official and high-signal sources first
- Search broadly enough to find substantively different approaches
- Deduplicate aggressively
- Capture enough detail for the user to approve or adjust the sample

At the end of discovery, present a concrete candidate list and stop for
confirmation. Do not move into deeper collection or synthesis yet.

### Phase 3: Collect

Run this phase only after the candidate list has been explicitly confirmed.

For each confirmed candidate:

- Read the actual skill content, not just metadata
- Capture the source, file layout, and platform assumptions
- Note the distinctive strengths, weaknesses, and unique techniques
- Summarize very large skills instead of copying them verbatim

Drop irrelevant candidates when necessary and say why.

### Phase 4: Analyze

Systematically compare the collected skills.

At minimum, inspect:

- scope and negative boundaries
- trigger design
- workflow shape
- output format
- unique techniques
- quality signals
- weaknesses
- platform assumptions and adaptation costs

Then synthesize the cross-skill patterns:

- common workflow phases
- taxonomies or classification schemes
- escalation models
- recurring output structures
- standout innovations worth preserving
- repeated anti-patterns

### Phase 5: Synthesize

Produce a standalone Fusion Report using
[fusion-report-template.md](references/fusion-report-template.md).

The report should:

- stay separate from the target skill package
- attribute ideas to specific sources
- recommend a concrete fusion strategy
- end with the next downstream step

Unless the user explicitly asked to collapse research and authoring after
reviewing the candidate set, stop at the research artifact.

## Validation

Use these checks when editing or auditing the canonical package:

```bash
python3 skills/skill-lifecycle-manager/scripts/quick_validate.py skills/skill-researcher
python3 skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-researcher/eval/eval-cases.json
python3 skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/skill-researcher/eval/trigger-posture-cases.json
python3 skills/skill-lifecycle-manager/scripts/validate_projection.py skills/skill-researcher --platform all
```

If the package metadata changes, refresh generated outputs with `npm run build`
and confirm the repository with `npm test`.

## Handoff

After delivering the Fusion Report:

1. Ask whether the user wants to adjust the fusion strategy.
2. Hand off to `skill-creator`, `skill-lifecycle-manager`, or another downstream creation workflow.
3. If the user explicitly wants to continue immediately, summarize the key decisions as input for the downstream workflow, but do not silently keep authoring inside this skill.

## Caveats

- Community quality varies widely. Read the actual content, not just stars or short descriptions.
- Cross-platform adaptation still needs judgment. Cursor rules, command sets, and `SKILL.md` packages do not map 1:1.
- Recency matters. Prefer maintained sources when quality is comparable.
- Quantity is not quality. Twenty near-duplicates are less useful than a small set of distinct approaches.
- Attribution is required. The Fusion Report should make it obvious where ideas came from.
- Large-source collection can hit network or rate-limit constraints. Explain the limitation and narrow scope when needed.
- Do not collapse research and creation into one pass by default.
