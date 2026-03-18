# Thinking Frameworks — Curated Toolkit

Domain-specific frameworks that surface dimensions generic thinking misses. Each framework is here because it imposes a **structural breaking move** — it forces you out of a cognitive default you would not otherwise notice.

Use 1–2 frameworks per brainstorm, selected by domain relevance. Do not dump frameworks on the user — offer them naturally when the conversation enters their territory.

---

## Table of Contents

1. [Universal Structural Tools](#universal-structural-tools)
2. [Product & Design](#product--design)
3. [Business Strategy & Competition](#business-strategy--competition)
4. [Decision-Making](#decision-making)
5. [Domain Selection Guide](#domain-selection-guide)

---

## Universal Structural Tools

### First Principles Thinking

**Breaks**: reasoning by analogy (doing what worked before, copying competitors, following convention).

**Process**:
1. Identify every assumption and convention embedded in the current approach
2. Deconstruct to fundamental components — physical, economic, or logical truths
3. Reconstruct: what solution would you design starting only from those truths?

**When to use**: Any situation where the current answer feels like inherited convention rather than reasoned solution. Particularly powerful for cost structures, product architecture, and business model design.

**When NOT to use**: Time-constrained decisions where speed matters more than optimality. This is expensive thinking — reserve it for high-leverage decisions.

---

### MECE Decomposition

**Breaks**: false exhaustiveness (believing you have covered a problem when you have only covered the parts that come to mind naturally).

**Process**: Break a problem into sub-parts that are Mutually Exclusive (no overlap) and Collectively Exhaustive (nothing missing). Then verify: "Is there anything we haven't placed in a bucket? Do any buckets overlap?"

**When to use**: Any complex problem that needs structuring — strategy, root cause analysis, scope definition. Best applied AFTER divergent exploration, not before.

**When NOT to use**: Early divergent ideation. MECE forces boundaries too soon.

---

### Hypothesis-Led Approach

**Breaks**: boiling the ocean (conducting open-ended research without a focusing question).

**Process**: Begin with an explicit, testable hypothesis about the answer. Structure all analysis to prove or disprove it. If disproved, form a new hypothesis. This directs effort and surfaces disconfirming evidence fast.

**When to use**: Analysis-heavy work where research resources (time, data) must be directed efficiently. Strategy, root cause analysis, market research.

**Risk**: Confirmation bias if the hypothesis becomes a commitment rather than a falsifiable claim.

---

## Product & Design

### Jobs-to-be-Done (JTBD)

**Breaks**: feature-level thinking (defining products by what they do rather than what the customer is trying to accomplish).

**Core reframe**: Customers don't buy products — they "hire" them to make progress in their lives. A commuter doesn't buy a milkshake for its features; they hire it to make their commute less boring and more filling.

**Two flavors**:
- **Christensen**: qualitative, empathy-driven. Best for strategic repositioning and new market entry.
- **Ulwick (Outcome-Driven Innovation)**: quantitative, survey-based. Best for feature prioritization and roadmapping.

**The Four Forces of Progress** (companion model):
- Switching happens when: Push (frustration with current) + Pull (appeal of new) > Anxiety (fear of switching) + Habit (inertia)
- A product that only addresses Pull while ignoring Anxiety and Habit will see poor adoption even when technically superior.

**When to use**: Product strategy, feature definition, market entry. Especially when a team is stuck debating features and needs to reconnect to customer purpose.

---

### Working Backwards PR/FAQ (Amazon)

**Breaks**: vague value propositions and premature commitment.

**Process**: Write a hypothetical press release announcing the product as if it has already shipped. Include: who the customer is, what problem they had, how the product solves it, and a direct quote from a satisfied customer. Follow with a FAQ addressing the hardest questions. All before any execution begins.

**Why it works**: The press release forces customer-centric specificity at the moment teams are most tempted to stay abstract. If you cannot write a compelling press release, the product probably should not be built.

**When to use**: New product definition, initiative scoping, feature validation.

---

### Desirability / Feasibility / Viability Check (IDEO)

**Breaks**: single-lens evaluation (optimizing for what is buildable while ignoring what is wanted or sustainable).

**Three questions**:
1. **Desirable** — Do people actually want this? Have we validated demand beyond our own assumptions?
2. **Feasible** — Can we build/deliver this with available technology and resources?
3. **Viable** — Is this sustainable as a business? Does the economics work?

A strong solution sits at the intersection of all three. Use as a rapid 5-minute filter on any proposed direction.

---

### Friction Logs (Stripe)

**Breaks**: metric-level blindness (aggregate metrics improving while specific user experiences degrade).

**Process**: Use the product as a customer would. Walk through an entire user journey. Document every point of friction, confusion, or unexpected behavior — no matter how small. The log is qualitative and specific, not quantified.

**When to use**: Product quality assessment, prioritization of UX improvements, onboarding optimization. Particularly powerful when NPS or satisfaction scores are declining without an obvious cause.

---

## Business Strategy & Competition

### Porter's Five Forces (as a lens, not a ritual)

**Breaks**: competitor-only thinking (defining competition as "other companies that do what we do").

**Five forces**: Threat of new entrants, bargaining power of suppliers, bargaining power of buyers, threat of substitutes, competitive rivalry. The insight is that competition is not just direct rivals — it is the entire set of forces that compress margins.

**Practical extraction**: For any business decision, ask: "Which of the five forces most threatens our position? Are we strengthening or weakening our position relative to it?"

**When to use**: Market entry analysis, competitive strategy, pricing decisions. Skip the full framework unless the team is unfamiliar — use the five forces as a quick diagnostic lens.

---

### Wardley Mapping (evolution lens)

**Breaks**: static strategic thinking (planning based on how things are rather than where they are going).

**Core idea**: Every capability in a value chain sits somewhere on an evolution axis: Genesis (novel, uncertain) → Custom (understood but bespoke) → Product (standardized) → Commodity (utility). Strategy depends on where things are AND which direction they are moving.

**Practical extraction**: For each capability you are building, ask: "Where is this on the Genesis-to-Commodity spectrum? Should we be building it, buying it, or treating it as a utility?" Capabilities moving toward commodity should be outsourced; capabilities in Genesis are where differentiation lives.

**When to use**: Technology strategy, build-vs-buy decisions, platform strategy. Requires more time investment than other frameworks (~1 hour minimum for a useful map).

---

## Decision-Making

### Type 1 / Type 2 Decisions (Bezos)

**Breaks**: uniform deliberation (treating every decision with the same weight regardless of reversibility).

**Type 1** (one-way door): Irreversible or very costly to reverse. These require slow, careful deliberation, data gathering, and broad input.

**Type 2** (two-way door): Reversible, correctable, low cost to undo. These should be made fast by individuals or small groups. The biggest risk is excessive caution.

**When to use**: Always. Before any decision, classify it. Most decisions are more reversible than they feel — defaulting to Type 1 deliberation on Type 2 decisions is the most common organizational failure.

---

### Pre-mortem (detailed protocol)

The universal thinking moves in the main skill include Pre-mortem as a thinking mode. For structured sessions, here is the full protocol:

1. Brief the group: "Assume we are one year from now and this project/decision has completely failed."
2. Each participant silently writes 2–3 causes of failure (5 minutes, no discussion).
3. Round-robin sharing — each person reads one cause, continue until all are shared.
4. Facilitator clusters the causes into themes.
5. Identify which risks are addressable before committing.
6. Total time: 30–60 minutes.

**Why the silence matters**: Individual generation before group discussion is empirically superior. The silence prevents anchoring to the first person's ideas and makes it socially legitimate to voice doubts.

---

### Scenario Planning

**Breaks**: single-future thinking (planning as if one predicted future is certain).

**Process**: Identify 2 key uncertainties (the axes). Create a 2×2 matrix of four scenarios. For each scenario, ask: "What would we do? Does our current strategy survive this?" A good strategy performs reasonably across multiple scenarios, not perfectly in one.

**When to use**: Long-term strategic decisions with high uncertainty. Market entry into volatile regions, technology bets, organizational transformation.

---

## Domain Selection Guide

| Your brainstorm is about... | Start with... |
|----------------------------|---------------|
| A new product or feature | JTBD → DFV check |
| Pricing or business model | First Principles on cost structure → Business Model Canvas |
| Market entry or competition | Porter's Five Forces lens → Scenario Planning |
| Technical architecture | Trade-off analysis → Wardley evolution check |
| A major irreversible decision | Type 1/Type 2 classification → Pre-mortem |
| Why something isn't working | Friction Logs → MECE root cause decomposition |
| Open-ended exploration | Hypothesis-Led → First Principles |
| Optimizing an existing system | MECE decomposition → Constraint identification |

Remember: frameworks are lenses, not liturgy. Use them to see what you would otherwise miss, then put them down and think.
