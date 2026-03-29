# Architecture Skill Fusion Report

Research date: 2026-03-29
Scope: Deep Discover -> Collect -> Analyze
Status: Research handoff complete
Target: a cross-platform, cross-project architecture skill with future-aware technology sensing

## Executive Summary

The strongest direction is not a generic "software architecture" skill and not a narrow "architecture review" skill. It should be a `manual-first` orchestration skill for architecture work.

This skill should own the end-to-end architecture decision workflow:
- frame the problem and constraints
- expand and compare architecture options
- trigger fresh research on current technology and AI capability shifts
- produce decision-quality outputs
- record decisions as ADR-ready artifacts
- hand off to implementation planning when direction is already chosen

The local repository already covers important adjacent slices:
- [implementation-planning](/Users/liqiongyu/projects/pri/my-agents/skills/implementation-planning/SKILL.md) owns post-decision execution planning
- [brainstorming](/Users/liqiongyu/projects/pri/my-agents/skills/brainstorming/SKILL.md) owns option exploration and decision approval
- [deep-research](/Users/liqiongyu/projects/pri/my-agents/skills/deep-research/SKILL.md) owns citation-backed current-state research
- [planner](/Users/liqiongyu/projects/pri/my-agents/agents/planner/claude-code.md) already acts as an architecture/planning agent surface

So the new skill should not replace those. It should orchestrate them as architecture sub-workflows with a stronger architecture-specific method, stronger output contract, and explicit future-facing technology sensing.

## Recommended Direction

Recommended posture: `manual-first`

Recommended concept:
- A future-aware architecture orchestrator
- Primary job: help a user make architecture and technology decisions with current evidence, explicit trade-offs, and portable outputs
- Secondary job: translate architecture thinking into durable artifacts such as decision matrices, radar updates, and ADR seeds

What this skill is:
- architecture strategy and system/technical architecture workflow
- technology selection and trade-off orchestration
- current-state and near-future technology sensing
- decision documentation and handoff

What this skill is not:
- generic implementation planning after the architecture is already chosen
- a passive architecture principles cheat sheet
- a pure review-only skill
- a fully automatic background trigger

## Design Principle: Generic Core, Specialized Adapters

The target skill should be technology-agnostic at its core.

It should not be:
- a Python architecture skill
- a Java architecture skill
- a database-only architecture skill
- a cloud-vendor-specific architecture skill
- a model-framework-specific architecture skill

Instead, it should provide a reusable architecture method that can be applied to:
- programming language and runtime selection
- application and service architecture
- database and storage strategy
- cloud and deployment platform selection
- AI model, framework, and orchestration selection

The right design is a layered model:

1. Generic methodology core
   This layer owns architecture framing, quality attributes, trade-off analysis, option generation, future lens, and decision outputs.

2. Specialist evidence acquisition
   When the architecture question becomes domain-specific, this layer gathers fresh evidence by:
   - invoking `deep-research`
   - browsing/searching current sources
   - invoking specialized local or external skills when a high-confidence domain skill exists

3. Synthesis back into architecture decisions
   Domain-specific findings are normalized back into the same shared architecture method, so the final output stays consistent even when the evidence sources differ.

This means the skill body should encode the method, not hardcode stack-specific answers.

## Current Repository Implication

This repository currently does not contain first-class local skills dedicated to:
- Python architecture selection
- Java architecture selection
- database architecture selection
- cloud architecture selection

So the first version of the new skill should assume this fallback order:

1. use the generic architecture method
2. check whether an existing specialized skill is available and clearly relevant
3. if not, trigger research/search for current external evidence
4. synthesize those findings back into the architecture decision workflow

In other words:
- specialized skills are optional accelerators
- they are not required for the core skill to function
- the core skill remains useful even when no specialist adapter exists yet

## Source Inventory

### Official structure anchors

1. OpenAI skills catalog
   Source: <https://github.com/openai/skills>
   Signal: official Codex packaging/reference surface

2. Anthropic skills
   Source: <https://github.com/anthropics/skills>
   Signal: official Agent Skills marketplace/reference surface

3. Vercel skills
   Source: <https://github.com/vercel-labs/skills>
   Signal: open skills distribution and discovery ecosystem

### Domain pattern sources

1. .NET technology-selection
   Source: <https://raw.githubusercontent.com/dotnet/skills/main/plugins/dotnet-ai/skills/technology-selection/SKILL.md>
   Value: strong decision tree, layered technology selection, explicit guardrails

2. software-architecture
   Source: <https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/software-architecture/SKILL.md>
   Value: generic architecture principles baseline

3. ai-agents-architect
   Source: <https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/plugins/antigravity-awesome-skills-claude/skills/ai-agents-architect/SKILL.md>
   Value: failure-mode awareness, agent pattern catalog, autonomy guardrails

4. technology_radar
   Source: <https://raw.githubusercontent.com/davidcastagnetoa/skills/main/skills/technology_radar/SKILL.md>
   Value: periodic technology sensing and ring-based stack evolution

5. adr-writing
   Source: <https://raw.githubusercontent.com/existential-birds/beagle/main/plugins/beagle-analysis/skills/adr-writing/SKILL.md>
   Value: decision artifact generation with template and completeness checks

6. adr-decision-extraction
   Source: <https://raw.githubusercontent.com/existential-birds/beagle/main/plugins/beagle-analysis/skills/adr-decision-extraction/SKILL.md>
   Value: extracting decisions from messy conversation context before formalization

7. blueprint-mode
   Source: <https://raw.githubusercontent.com/github/awesome-copilot/main/agents/blueprint-mode.agent.md>
   Value: structured multi-workflow orchestration example, but also a cautionary anti-pattern

8. context-architect
   Source: <https://raw.githubusercontent.com/github/awesome-copilot/main/agents/context-architect.agent.md>
   Value: context map before change as a clean output contract

9. architect-review
   Source: <https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/architect-review/SKILL.md>
   Value: review-oriented architecture scope

10. architecture-patterns
    Source: <https://raw.githubusercontent.com/sickn33/antigravity-awesome-skills/main/skills/architecture-patterns/SKILL.md>
    Value: pattern-selection and migration framing

### Local baseline sources

1. [implementation-planning](/Users/liqiongyu/projects/pri/my-agents/skills/implementation-planning/SKILL.md)
2. [deep-research](/Users/liqiongyu/projects/pri/my-agents/skills/deep-research/SKILL.md)
3. [brainstorming](/Users/liqiongyu/projects/pri/my-agents/skills/brainstorming/SKILL.md)
4. [planner](/Users/liqiongyu/projects/pri/my-agents/agents/planner/claude-code.md)

## Pattern Analysis

### Pattern 1: Decision tree plus hard guardrails

Best example: `.NET technology-selection`

What works:
- starts from task classification instead of generic advice
- maps problem type to technology choice
- adds explicit guardrails and disallowed choices
- distinguishes abstraction layer vs provider vs orchestration layer

What to borrow:
- a decision tree for architecture problem classes
- branch-specific guardrails
- explicit "do not use this path when..." rules

What to avoid:
- overfitting to a single tech stack

### Pattern 2: Current-state technology sensing as a first-class workflow

Best example: `technology_radar`

What works:
- treats technology evolution as an ongoing practice, not a one-time decision
- classifies technologies as `Adopt`, `Trial`, `Assess`, `Hold`
- requires periodic reassessment

What to borrow:
- a radar lens for architecture recommendations
- explicit check of whether a "new" tool is actually necessary
- ring-based recommendation language

What to improve:
- make it trigger research on latest AI/model/platform shifts instead of only documenting the current stack

### Pattern 3: Decisions should become durable artifacts

Best examples: `adr-writing`, `adr-decision-extraction`

What works:
- separates "decision extraction" from "formal ADR writing"
- uses quality gates and gap markers
- assumes real-world ambiguity and incomplete information

What to borrow:
- extract architecture decisions from conversation or notes
- produce ADR-ready outputs instead of only prose summaries
- mark unknowns explicitly instead of pretending completeness

### Pattern 4: Context map before architecture advice

Best example: `context-architect`

What works:
- maps primary files, secondary files, tests, patterns, and sequence
- makes architecture advice grounded in actual system context

What to borrow:
- a context map output for existing systems
- explicit impact radius before recommending structural change

### Pattern 5: Future-facing architecture needs failure-mode awareness

Best example: `ai-agents-architect`

What works:
- autonomy vs control is explicit
- sharp edges are documented
- patterns are concrete enough to apply

What to borrow:
- failure modes and guardrails for AI-native systems
- explicit view of graceful degradation
- clear rules for when orchestration complexity is justified

### Pattern 6: Generic principle dumps are weak

Best examples: `software-architecture`, `architect-review`

What works:
- broad coverage of architecture vocabulary
- useful as a principle library

What fails:
- weak activation boundaries
- little sequencing or methodology
- too much role/persona language, not enough workflow
- not enough current-tech sensing

What to reject:
- broad "master architect" persona as the primary design
- kitchen-sink capability lists without phase structure

### Pattern 7: Monolithic super-agents are cautionary examples

Best example: `blueprint-mode`

What works:
- workflow orientation
- explicit verification bias

What fails:
- oversized, noisy instruction surface
- mixes too many responsibilities
- style/personality occupies too much room

What to reject:
- giant all-purpose architecture skill
- bundling every engineering workflow into one artifact

## Fusion Strategy

The target skill should fuse these four ideas:

1. Architecture work is a workflow, not a persona.
2. Technology selection must be current-state and future-aware, not just pattern-driven.
3. Architecture decisions should end in durable outputs, not only conversation.
4. Existing specialized skills should be orchestrated, not duplicated.

Add one more fusion rule:

5. The methodology must stay domain-agnostic even when the evidence-gathering phase becomes domain-specific.

## Proposed Skill Shape

### Working identity

Candidate concepts:
- `future-aware-architecture`
- `architecture-orchestrator`
- `system-architecture-strategist`
- `tech-radar-architect`

Current recommendation:
- `future-aware-architecture`

Why:
- captures both architecture and forward-looking technology sensing
- clearly different from `implementation-planning`
- clearly different from generic `planner`

### Invocation posture

Use `manual-first`.

Why:
- architecture work is high leverage and high cost when mis-triggered
- current-tech sensing usually requires deliberate research
- this skill should often invoke other heavy skills

### Core workflow

1. Frame
   Clarify problem, constraints, success criteria, non-goals, and decision horizon.

2. Context Map
   For brownfield systems, inspect current architecture, dependency boundaries, and likely impact radius.

3. Option Space
   Use architecture thinking moves to generate and compare 2-3 viable directions.

4. Current-Tech Scan
   Trigger fresh research when the task depends on evolving technologies, especially AI models, agent frameworks, platform capabilities, and ecosystem maturity.

5. Decision Matrix
   Compare options by weighted criteria such as fit, cost, complexity, time-to-value, reversibility, and future optionality.

6. Future Lens
   Evaluate `Now`, `Next`, and `Option Value`:
   - `Now`: best fit under current constraints
   - `Next`: likely changes in the next 6-18 months
   - `Option Value`: what flexibility the decision preserves

7. Decision Artifacts
   Produce architecture brief, trade-off summary, radar note, and ADR-ready output.

8. Handoff
   If direction is chosen and execution is needed, hand off to `implementation-planning`.

### Generic methodology modules

The canonical core should likely include these reusable modules:

1. Problem framing
2. Constraint mapping
3. Quality attribute definition
4. Option generation
5. Evaluation criteria and weighting
6. Trade-off analysis
7. Future lens and option value
8. Decision artifact generation

These modules should work regardless of whether the current selection topic is:
- Python vs Java
- PostgreSQL vs MySQL vs MongoDB
- AWS vs Azure vs GCP
- LangGraph vs Semantic Kernel vs custom orchestration
- monolith vs modular monolith vs microservices

### Specialist adapter model

When the user is asking about a specific domain, the skill should branch into a bounded adapter step, for example:

- language/runtime adapter
- data/storage adapter
- cloud/platform adapter
- AI/model/framework adapter

Each adapter should:
- gather current evidence
- use any relevant specialist skill if one exists
- return normalized findings in a common comparison format

The adapter should not replace the architecture workflow. It only enriches the decision inputs.

### Delegation map

- Use `clarify` when requirements are contradictory or missing in a way that would change the architecture.
- Use `brainstorming` when the user is still choosing between fundamentally different directions.
- Use `deep-research` when the architecture depends on current external facts, latest platform capability, or changing AI technology.
- Use `review` when the user wants to critique an existing architecture doc, ADR, or design.
- Use `implementation-planning` only after the architecture direction is chosen.

## Output Contract

The new skill should produce a small number of repeatable outputs:

1. Architecture Brief
   Problem, constraints, proposed direction, alternatives, trade-offs.

2. Decision Matrix
   Criteria-weighted option comparison.

3. Future Lens
   `Now`, `Next`, `Option Value`.

4. Tech Radar Delta
   What should move into `Adopt`, `Trial`, `Assess`, or `Hold`.

5. ADR Seed
   Decision title, context, drivers, considered options, chosen option, consequences, open investigations.

6. Planning Handoff
   If needed, a clean handoff summary for `implementation-planning`.

## Boundary With Existing Local Skills

### Versus implementation-planning

This new skill decides and justifies architecture direction. It should stop before detailed execution sequencing unless it is explicitly handing off.

### Versus brainstorming

This new skill can use brainstorming moves, but it is architecture-specific and artifact-driven. It should not become the generic ideation skill.

### Versus deep-research

This new skill owns when research is necessary for architecture decisions. `deep-research` owns the actual citation-heavy research pipeline.

### Versus planner

The planner agent is a role surface. This new skill is a reusable architecture method package that can be invoked across platforms and projects.

## Key Risks

1. Becoming too generic
   Risk: it collapses into vague "software architecture best practices".
   Mitigation: use phase structure and output contracts.

2. Duplicating planner and implementation-planning
   Risk: overlap creates trigger confusion and context waste.
   Mitigation: keep this skill pre-implementation and decision-focused.

3. Losing current-tech awareness
   Risk: architecture advice becomes stale and framework-biased.
   Mitigation: require fresh research for time-sensitive decisions.

4. Becoming a huge monolith
   Risk: the skill becomes hard to maintain and expensive to load.
   Mitigation: keep the body lean and move heavier detail to references.

## Metadata Implications

Current repo categories do not include `architecture`.

Short-term safe option:
- use `design`, `research`, `workflow`

Possible repo-level change:
- add `architecture` later if this repo is expected to host more architecture-focused skills

## Recommended Downstream Create/Update Inputs

The next authoring pass should assume:

- name: likely `future-aware-architecture`
- invocation posture: `manual-first`
- categories: `design`, `research`, `workflow`
- shape: orchestration skill, not single-stack skill
- references likely needed:
  - architecture decision frameworks
  - technology radar and emerging-tech sensing
  - AI-native architecture patterns
  - ADR output templates
- eval focus:
  - should trigger on architecture/selection requests
  - should not trigger on pure implementation-planning
  - should not trigger on general brainstorming with no architecture intent
  - should escalate to research when "latest" or fast-moving technology matters

## Open Questions

1. The original requested feature list was not provided verbatim, so detailed functional scope still needs confirmation.
2. We still need to decide whether the canonical name should emphasize:
   - architecture
   - future awareness
   - technology selection
   - orchestration
3. We should decide whether the skill should generate a standalone "tech radar" artifact directly or only reference a radar section inside the architecture brief.

## Downstream Recommendation

Proceed next to `Create / Update`.

The strongest next step is to draft a canonical skill package around this architecture:
- lean `SKILL.md`
- metadata with `manual-first`
- references for methods and outputs
- initial trigger boundaries
- then validate before any trigger optimization
