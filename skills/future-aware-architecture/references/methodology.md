# Methodology

Use this reference when the main skill needs more detailed architecture guidance
without bloating `SKILL.md`.

## Core Positioning

The method is intentionally technology-agnostic.

It should help answer:

- What problem are we actually solving, apart from a preferred tool or pattern?
- What architecture problem are we solving?
- What decision classes are involved?
- What criteria should govern the decision?
- What evidence do we need before selecting?
- What uncertainty still matters?
- How do we preserve future flexibility without overengineering?

It should not assume:

- one preferred language or runtime
- one default database
- one cloud vendor
- one model stack
- one universal architecture style

## Problem-First Discipline

Architecture quality improves when the problem is stated clearly before the
solution is discussed.

Minimum framing:

- affected user, operator, or team
- current pain or failure mode
- why now
- what outcome matters
- current alternatives, including manual workarounds, incremental improvement, or doing nothing

Rules:

- do not let the problem statement smuggle in a technology choice
- treat proposed technologies as hypotheses until the criteria are clear
- include the status quo as an option baseline whenever it is plausible
- use local codebase or repository evidence only when the request is explicitly about that active system; otherwise, label assumptions instead of overfitting to incidental context

If the user cannot explain the problem without naming the tool, stay in framing.

## Decision Classes

Most architecture work can be framed as one or more of these classes:

1. **System shape**
   - boundaries, services, modules, integration style, eventing, sync vs async
2. **Execution substrate**
   - language/runtime, framework, deployment target, hosting model
3. **State and data**
   - transactional storage, analytical storage, caching, vector search, event logs, file/blob strategy
4. **Platform and operations**
   - cloud vendor, managed services, observability, security controls, delivery model
5. **AI and decision systems**
   - model provider, inference path, agent architecture, orchestration framework, evaluation loop, safety controls
6. **Build vs buy vs integrate**
   - custom build, managed product, open-source component, hybrid assembly

Architecture requests often blend multiple classes. Separate them before
comparing options so the trade-offs stay understandable.

## Decision Shape and Process Intensity

Before evaluating architecture options, classify the decision on two axes:

### Problem shape

- **Clear**: repeatable, familiar, low ambiguity
- **Complicated**: requires expertise and analysis, but is still decomposable
- **Complex**: outcomes emerge through interaction and feedback; learn-as-you-go is required

This determines how much confidence you should place in up-front design.

### Reversibility

- **Two-way door**: reversible, low switching cost, can favor speed
- **One-way door**: hard to reverse, high lock-in or migration cost, needs more rigor

This determines how much process, evidence, and caution the recommendation
needs.

## Quality Attribute Prompt Set

Use these prompts to define the evaluation criteria. Not every project needs
every prompt.

- **Performance**: What latency, throughput, or concurrency matters?
- **Reliability**: What failure modes are unacceptable? What recovery time is required?
- **Security and compliance**: What data sensitivity, auditability, residency, or policy constraints exist?
- **Scalability**: Which dimensions are expected to grow first: users, data, requests, workflows, teams?
- **Operability**: How much operational complexity can the team absorb?
- **Changeability**: Which parts are most likely to evolve and need loose coupling?
- **Cost**: What capex/opex or budget envelope matters?
- **Team fit**: What skills, hiring realities, and maintenance capacity exist?
- **Time-to-value**: How quickly does the first useful version need to ship?

Turn these prompts into weighted decision criteria when options need formal
comparison.

## Current System and Social-Technical Fit

Architecture is not only a software structure. It is also a coordination
system.

Check:

- dependency hotspots
- ownership overlaps or gaps
- unclear decision rights
- operational maturity required by the proposed design
- team cognitive load and maintenance burden
- whether the architecture assumes platform capabilities or org interfaces that do not exist yet

Questions that often change the recommendation:

- Is this actually an architecture problem, or mainly a governance/process problem?
- Which dependencies would this option remove vs merely move?
- Can the current team operate this architecture well 12 months from now?
- Does the architecture fit the product coupling and integration needs?

## Specialist Adapter Rule

Use specialist evidence only where it changes the decision.

### When to invoke a specialist skill or research path

- A branch of the decision is domain-specific enough that generic architecture reasoning is no longer sufficient
- Recency matters because products, models, frameworks, or vendors change quickly
- The user explicitly asks for the latest or current state
- The architecture recommendation would be weak without external evidence

### Adapter order

1. Local specialist skill, if one exists and is clearly relevant
2. Bounded external browsing for a narrow current-state check
3. `deep-research` for broad or high-stakes comparisons

### Normalization rule

Always map specialist findings back to the same shared questions:

- What capability or constraint did the evidence change?
- Which evaluation criteria moved?
- Did the recommendation change for `Now`, `Next`, or `Option Value`?
- What new risk or migration consideration appeared?

### Pilot and spike rule

If research still leaves a decision-critical gap:

- define the smallest pilot, spike, or proof-of-value that could change the recommendation
- set success signals, guardrails, and exit criteria
- keep the pilot decision-oriented, not exploration theater

## Option Generation Heuristics

Generate options that are meaningfully different. Good contrasts usually vary
along one or more of these axes:

- centralized vs modular
- managed service vs self-managed component
- integrated platform vs composable stack
- synchronous coordination vs asynchronous/event-driven
- model-rich/AI-heavy flow vs deterministic/product-logic-heavy flow
- optimize for speed now vs optimize for long-term flexibility

Avoid fake options that differ only in names while preserving the same
architecture shape.

## Evaluation Structure

Use a weighted decision matrix when the choice matters.

Recommended columns:

- option
- evaluation criteria
- weight
- score
- evidence note
- key risk

Recommended criteria pool:

- problem fit
- quality attribute fit
- team fit
- delivery speed
- operating burden
- cost profile
- ecosystem maturity
- security/compliance fit
- reversibility
- strategic leverage

Do not pretend the weights are objective. If they are assumptions, say so.

### Cost model

Do not compare only license cost or implementation effort.

Include:

- direct spend
- engineering time
- maintenance burden
- operational/on-call load
- coordination overhead
- migration or switching cost
- opportunity cost: what does not get done if this option is chosen

### Uncertainty model

When precision is weak, use ranges and confidence instead of fake exactness.

Capture:

- top unknowns
- key assumptions
- leading indicators
- pre-mortem failure modes
- likely "worse first" dip and mitigation plan
- stop, continue, or revisit triggers

Use experiments only when they can actually change the decision.

## Future-Aware Lens

Use three time horizons:

- **Now**: What best satisfies the current problem and constraints?
- **Next**: What changes in the next 6-18 months are plausible enough to matter?
- **Option Value**: How much freedom does this decision preserve if the future differs from the current assumptions?

This is not a license to optimize for distant hypotheticals. The purpose is to:

- notice when the environment is moving quickly
- avoid painting the system into a corner
- distinguish durable principles from fragile ecosystem bets

### Radar language

When helpful, classify technologies or approaches as:

- `Adopt`: strong fit and mature enough for the current use case
- `Trial`: promising for bounded use, but still needs controlled adoption
- `Assess`: worth monitoring or prototyping, not yet the default recommendation
- `Hold`: avoid for now, or revisit only if a constraint changes

## Decision Governance

A good recommendation also defines how the decision will be governed.

Include:

- decision owner
- who must be consulted
- review date
- assumptions to revisit
- kill, continue, or expand triggers

For high-stakes architecture changes, note whether the decision behaves more
like a one-way door or a two-way door.

## Decision Closure

A good architecture answer should leave behind:

- one recommended direction
- one or more rejected alternatives with reasons
- a list of assumptions
- the top risks and mitigations
- current alternatives that were considered, including status quo when relevant
- uncertainty and revisit triggers
- triggers for revisiting the decision
- a concrete next step

If these are missing, the work is still analysis, not decision-making.
