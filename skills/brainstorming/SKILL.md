---
name: brainstorming
description: "Manual-first brainstorming workflow for turning ambiguous ideas or competing directions into an approved decision before planning or implementation. Activate when the user explicitly asks to brainstorm, explore options, compare approaches, or pressure-test a direction. Do not activate for clarification, review, detailed planning, or straightforward execution once a direction is already chosen."
invocation_posture: manual-first
version: 0.2.2
---

# Brainstorming

Transform ideas into validated decisions through structured dialogue before committing to a direction.

Brainstorming answers **WHAT** to do and **WHY**. It does not answer HOW — leave execution details to planning and implementation phases. This applies equally to software features, business strategies, product designs, market approaches, and any domain requiring structured thinking before action.

## Hard Gate

Do NOT write code, scaffold files, create deliverables, or take any action toward execution until the user has explicitly approved a direction. This applies to every task regardless of perceived simplicity. "Simple" problems are exactly where unexamined assumptions waste the most effort — the brainstorm can be brief, but it must happen and the direction must be approved.

## When Not To Use

Do NOT use this skill when the user is asking for:

- **Clarification only** — missing facts, contradictions, or acceptance criteria that must be pinned down before action. Use `clarify`.
- **Review of existing work** — code review, document critique, diff analysis, or bug-finding in something already written. Use `review`.
- **Detailed execution planning** — implementation breakdowns, task sequencing, or delivery plans after the direction is already decided. Use `writing-plans` or proceed with execution.
- **Straightforward execution** — the user already knows what they want built, changed, or written and just wants to start.

If the request begins with ambiguity but quickly resolves into a concrete chosen direction, finish the brainstorm cleanly and hand off instead of dragging the user through more ideation.

## Scope Classification

Assess scope before starting. Announce the selected scope and your reasoning.

| Scope | Signals | Process Weight | Output |
|-------|---------|----------------|--------|
| **Quick** | Small, well-bounded, low ambiguity. Config change, minor feature, clear tactical question. | 1–2 messages. Batch questions. | Approved direction in chat. No document. |
| **Standard** | Normal feature, bounded problem, moderate ambiguity, some decisions to make. | Full flow. One question at a time. 2–3 approaches. | Decision Brief (inline or file). |
| **Deep** | Cross-cutting, strategic, high ambiguity, novel territory. Multiple subsystems, stakeholders, or significant long-term consequences. | Full flow + thinking moves + domain frameworks + decision log + review gate. | Design Decision Record (saved to file). |

If scope is unclear, ask one targeted question to disambiguate. When in doubt, start Standard — you can escalate if complexity emerges.

## Question Handling

Use the platform's native user-input mechanism when one is available and appropriate for the current environment. If the surface does not expose a structured question tool, ask concise questions directly in chat and wait for the user's reply. Do not make the workflow depend on one specific tool name.

**Language**: Respond in the same language the user uses. All user-facing output (questions, summaries, decision records) follows the user's language. Skill internals are English.

---

## Process

### Phase 0: Orient

Before asking questions, establish context.

**0.1 Resume check**

If the user references an existing brainstorm, or a recent decision record exists in the project:
- Read it, then confirm: "Found an existing brainstorm for [topic]. Continue from here, or start fresh?"
- If resuming, summarize current state and continue from existing decisions.

**0.2 Context scan** — depth matches scope, sources match domain:

- **Quick**: glance at the most relevant context. Move on.
- **Standard**: scan what already exists — for code projects: structure, patterns, recent commits, instruction files; for business/strategy: existing plans, market data, prior decisions, competitive context.
- **Deep**: thorough scan of all relevant context. Identify what already exists vs. what is proposed. Surface constraints that appear implicit but unconfirmed.

**0.3 Scope announcement**

State the scope you selected and why. If the request describes multiple independent subsystems, flag this immediately — help the user decompose into sub-projects before brainstorming the first one.

### Phase 1: Understand

**Goal**: Shared clarity on the problem space.

**Interaction style by scope:**
- **Quick**: Batch 2–3 questions in one message. Prefer multiple choice. If the request is already clear, skip straight to Phase 2.
- **Standard**: One question at a time. Prefer single-select multiple choice. Open-ended when the design space is genuinely unconstrained.
- **Deep**: One question at a time. Explore thoroughly. Use multi-select only for compatible sets (goals, constraints) that can coexist.

**What to understand:**
- **Purpose** — What problem does this solve? For whom? What outcome actually matters?
- **Constraints** — Technical, time, resource, organizational limitations
- **Success criteria** — How will we know this worked?
- **Non-goals** — What are we explicitly NOT doing? (Prevents scope creep later)

**Constraints and requirements beyond the core ask** (Standard and Deep):

Surface the dimensions the user might not volunteer but that shape the solution. Adapt to the domain:
- **Technical**: performance, scale, security, reliability, maintenance burden
- **Business**: budget, timeline, team capacity, regulatory/legal, competitive pressure
- **Product**: target users, success metrics, adoption barriers, maintenance expectations
- **Strategy**: risk tolerance, reversibility, organizational alignment, time horizon

If the user is unsure, propose reasonable defaults and clearly mark them as **assumptions**.

**Understanding Lock** (Standard and Deep):

Before proposing any design, pause and present:
- A concise summary (3–5 bullets) of what is being built and why
- Assumptions listed explicitly
- Open questions, if any

Ask: *"Does this accurately capture your intent? Please confirm or correct before we move to design."*

Do NOT proceed until explicit confirmation.

### Phase 2: Explore

**Goal**: Expand the solution space, then narrow it to strong options.

**2.1 Challenge the framing** (all scopes, depth proportional):

Before generating solutions, pressure-test the problem:
- Is this the right problem, or a proxy for a more important one?
- What happens if we do nothing?
- Are we duplicating something that already exists?
- Is there a simpler framing that delivers the same value?

For Quick scope, this can be a single sentence. For Deep scope, spend real time here — reframing the problem often matters more than choosing between solutions. Ground the problem with rough quantitative estimates when possible (back-of-envelope calculations make abstract problems concrete).

**2.2 Propose approaches**

Present 2–3 viable approaches with trade-offs. Lead with your recommendation and explain why.

For each approach:
- Brief description (a short paragraph, not a wall of text)
- Pros and cons
- Key risks or unknowns
- When it's best suited

If one approach is clearly best and alternatives are not meaningful, state the recommendation directly — don't manufacture fake options.

Eliminate speculative complexity. Solve the confirmed problem, not hypothetical future ones. In engineering this is called YAGNI; in business it means not building for edge cases before validating the core.

**2.3 Thinking Moves** (Standard: pick 1–2 naturally; Deep: apply all five):

These are domain-agnostic cognitive tools that expand the solution space beyond the obvious. Practice them naturally in the conversation — the goal is better thinking, not process theater.

**Invert** — What if we solved the opposite problem? What if we removed this constraint entirely? What would make the problem disappear? This surfaces hidden assumptions and often reveals radically simpler solutions.

**Analogize** — What other system, domain, or product has solved a structurally similar problem? What can we borrow? The best answers are non-obvious transfers: how does [unrelated field] handle the same structural challenge? Import the mechanism, not the surface similarity.

**Pre-mortem** — Imagine it is one year from now and this decision has completely failed. What caused the failure? This triggers a different cognitive pathway than "what might go wrong" — it produces a more comprehensive list of risks because the mind retrieves causes of a known outcome rather than generating possibilities. Empirically one of the strongest debiasing techniques available.

**Second-order effects** — What happens after the first consequence? Every decision creates ripples. A pricing change affects not just revenue but customer perception, competitive response, sales team behavior, and support volume. Trace at least two levels of consequences before committing.

**Temporal lens** — How does this decision look in 1 month vs. 1 year vs. 5 years? Short-term optimal and long-term optimal often conflict. Name the tension explicitly rather than defaulting to one time horizon.

**2.4 Domain frameworks** (Deep scope, optional for Standard):

Different problem domains have specialized frameworks that surface dimensions generic thinking misses. When a brainstorm enters a recognized domain, suggest 1–2 relevant frameworks from `references/thinking-frameworks.md` and offer to apply them. Do not force frameworks — offer them and let the user decide.

Quick domain detection:
- Business model / pricing / revenue → Business Model Canvas, First Principles on cost structure
- Market entry / competition → Porter's Five Forces lens, Wardley Map evolution check
- Product design / user needs → Jobs-to-be-Done, Desirability/Feasibility/Viability check
- Technical architecture → trade-off analysis, constraint-driven design
- Strategy / major decision → Type 1/Type 2 classification, Pre-mortem, scenario planning
- Research direction → Hypothesis-Led approach, Abstraction Ladder

See `references/thinking-frameworks.md` for the full curated toolkit with usage guidance.

**2.5 Working within existing context**

- Explore what already exists before proposing changes. Follow existing patterns and conventions.
- Where existing work has problems that affect the current goal, include targeted improvements as part of the design.
- Don't propose unrelated improvements. Stay focused on the current problem.

### Phase 3: Converge

**Goal**: Lock in a direction with explicit, documented decisions.

**Quick scope**: State the recommended direction. Get approval. Move on. Max 1 revision round.

**Standard scope**:
- Present the chosen direction in digestible sections (scale each to its complexity — a few sentences if straightforward, up to 200–300 words if nuanced).
- After each section, check: *"Does this look right so far?"*
- Cover what is relevant to the domain: for technical work, architecture and data flow; for business, value chain and go-to-market; for product, user experience and success metrics.
- Max 2 revision rounds per section. If still misaligned, ask the user to state what they want directly. A good-enough direction chosen quickly beats a perfect one chosen slowly.

**Deep scope**:
- Same incremental presentation as Standard.
- **Design for clarity**: whatever you are designing — a system, a strategy, a product — break it into parts that each have one clear purpose and can be understood independently. Complexity that cannot be decomposed is complexity that cannot be managed.
- **Maintain a Decision Log**: for each significant decision during the conversation, record what was decided, what alternatives were considered, and why this option was chosen. This log feeds into the final Design Decision Record.

### Phase 4: Capture

Output scales to scope. Do not produce documents nobody will read.

**Quick** — No artifact. The conversation is the record. Proceed to next step.

**Standard — Decision Brief** (inline in chat, or saved to file if the user requests):

```
## Decision Brief: [Topic]

**Problem**: [1–2 sentences on what we're solving and why]

**Approach**: [Chosen direction and key design elements]

**Key decisions**:
- [Decision]: [rationale]
- [Decision]: [rationale]

**Not doing**: [Explicit exclusions that might otherwise be assumed in scope]

**Assumptions**: [Things we believe to be true but haven't verified]

**Next step**: [proceed to planning / implementation / other]
```

**Deep — Design Decision Record** (saved to file):

```markdown
---
date: YYYY-MM-DD
topic: <kebab-case-topic>
scope: deep
---

# [Topic]

## Problem
[Who is affected, what is changing, and why it matters]

## Approach
[Description of the chosen design direction and its rationale]

## Design Overview
[Architecture, components, data flow — as detailed as the complexity warrants]

## Decisions

| # | Decision | Alternatives Considered | Rationale |
|---|----------|------------------------|-----------|
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |

## Assumptions
- [Assumption 1]
- [Assumption 2]

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ... | ... | ... | ... |

## Non-Goals
- [Explicit exclusion 1]
- [Explicit exclusion 2]

## Open Questions
- [Questions deferred to planning or implementation]

## Next Steps
[Recommended path forward]
```

Save to a sensible location in the project (e.g., `docs/decisions/`, `docs/brainstorms/`, or the project's existing convention). Ask the user if unsure about location.

### Phase 5: Handoff

Present next-step options appropriate to context. Use the platform's question tool when available.

Available options (present only those that apply):
- **Proceed to planning** — Create a detailed implementation plan
- **Proceed to implementation** — Only when scope is Quick or Standard with clear requirements and no meaningful open questions
- **Continue refining** — Dig deeper into unresolved areas or revisit decisions
- **Park for later** — Save current state and return when ready

Execute the user's choice. Do not add ceremony to the handoff.

---

## Exit Criteria

Before handoff, explicitly verify ALL of the following (state them in the conversation for Deep scope):

- [ ] Understanding of the problem is confirmed (Understanding Lock for Standard/Deep)
- [ ] At least one approach is explicitly approved by the user
- [ ] Key assumptions are documented (Standard/Deep)
- [ ] The user has chosen a next step from the handoff options

If any criterion is unmet, continue refining. Do not silently proceed to execution.

---

## Evaluate The Skill

When you change this skill's trigger wording or process shape, evaluate it with a small prompt mix before calling the update complete:

- **Should trigger**: explicit ideation asks such as "Let's brainstorm the rollout options" or "Help me think through whether we should build A or B first."
- **Should not trigger**: direct execution asks such as "Implement this API change" or "Write the migration plan for the chosen design."
- **Adjacent handoff cases**: requests that belong to neighboring skills, such as "Clarify the missing requirements", "Review this draft", or "Break the approved direction into tasks."

The update is healthy only if the skill stays quiet on clarification, review, planning, and straightforward execution prompts while remaining helpful on explicit direction-setting requests.

---

## Principles

These guide judgment calls throughout the process.

**Proportional ceremony** — Match process weight to task weight. A config change should not feel like an architecture review. Every piece of process must earn its place by preventing a real class of failure.

**Decisions over documents** — The value of brainstorming is clarity of thought, not volume of artifacts. A Decision Brief is a record of thinking, not bureaucratic overhead. If writing the document doesn't sharpen understanding, it's too heavy.

**Thinking partner, not interviewer** — Bring ideas, challenge assumptions boldly, suggest alternatives the user hasn't considered. A good brainstorming partner contributes substance, not just extracts information. If you see a flaw in the user's framing — say so directly and explain why. The governance problem may be harder than the technical problem; the market may not exist; the simpler approach may be 80% as good at 20% of the cost. Say these things.

**Ground with numbers** — Abstract problems produce abstract solutions. When possible, do back-of-envelope calculations to make the problem concrete: how many requests per second, what's the market size, what does this cost per unit, how many users are actually affected. Rough math beats no math.

**Bias toward action** — When two options are close in quality, pick one and go. Deliberation has diminishing returns. Movement creates clarity that deliberation cannot. Classify decisions as reversible (move fast) or irreversible (deliberate carefully) — most decisions are more reversible than they feel.

**Solve the confirmed problem** — Design for what is needed now, not hypothetical future scenarios. In engineering this means no speculative abstractions; in business it means validating the core before building for edge cases.

**Assumptions must be explicit** — Silent assumptions are the primary source of wasted work. Surface them, document them, get them confirmed. This applies in every domain — technical, business, organizational.

**One question at a time** (Standard/Deep) — Batching questions in Standard/Deep scope trades depth for speed. Each question should build on the answer to the last. For Quick scope, batching is fine — speed matters more.

## Additional Resources

For domain-specific thinking frameworks beyond the universal thinking moves, see `references/thinking-frameworks.md`. This file contains a curated toolkit of 12 frameworks organized by domain, each with clear usage conditions and when-to-apply guidance.
