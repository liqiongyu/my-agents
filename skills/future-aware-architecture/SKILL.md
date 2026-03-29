---
name: future-aware-architecture
description: >
  Manual-first architecture methodology for system design and technology
  selection using problem-first framing, stack-agnostic trade-offs, uncertainty
  handling, and future-aware decision lenses. Use when a project needs
  architecture direction or selection decisions; do not use for pure
  implementation planning, narrow stack research, or review-only tasks.
invocation_posture: manual-first
version: 0.2.4
---

# Future-Aware Architecture

Design architecture decisions with a reusable method instead of stack-specific
prescriptions.

This skill is technology-agnostic at its core. It helps the user decide what
problem the architecture must solve, how to shape the system, what to select,
why that choice fits now, how uncertain the recommendation still is, and how
much option value it preserves for the future. When the decision depends on
fast-moving domains such as AI models, platform capabilities, cloud offerings,
or framework ecosystems, gather fresh evidence before locking the
recommendation.

The core pattern is:

1. define the problem before the solution
2. classify the decision and its risk
3. generate real options plus a baseline
4. gather specialist evidence only where needed
5. compare trade-offs, uncertainty, and reversibility
6. check social-technical fit
7. produce a durable decision artifact with review triggers

## When to Activate

- The user needs system architecture or technical architecture direction for a project, platform, service, or product
- The user needs technology selection across languages, frameworks, databases, cloud platforms, AI/model stacks, or integration approaches
- The user wants explicit trade-off analysis, a decision matrix, or architecture rationale rather than ad hoc advice
- The user wants architecture outputs that can become ADRs, design briefs, or implementation-planning inputs

## When Not To Use

Do not use this skill when:

- The direction is already chosen and the user mainly needs execution planning or rollout sequencing. Use `implementation-planning`.
- The task is pure open-ended ideation before an architecture problem is even framed. Use `brainstorming`.
- The user mainly wants current facts, source-backed comparison, or latest-status research without an architecture decision workflow. Use `deep-research`.
- The task is to review an existing design, PR, or document for defects or regressions. Use `review`.
- The user already knows the exact change to build and simply wants implementation.

## Invocation Posture

Treat this skill as `manual-first`.

Why:

- Architecture work is cross-cutting and high-impact
- False positives are expensive because the workflow can trigger research, trade-off analysis, and durable artifacts
- Users usually know when they want architecture design or technology selection help

The trigger should stay precise and boundary-heavy. Do not activate just because
the word "architecture" appears casually.

## Hard Rules

1. **Keep the core method stack-agnostic.** Do not hardcode "best" stacks or assume one language, database, cloud, or model framework is the default answer.
2. **Start from the problem, not the tool.** State the problem, affected users or workflows, current alternatives, and desired outcomes before recommending a technology or architecture style.
3. **Use fresh evidence when recency matters.** If the decision depends on current platform capabilities, AI model behavior, vendor offerings, regulatory shifts, or other time-sensitive facts, explicitly gather up-to-date evidence before recommending.
4. **Use specialist adapters only as inputs.** Specialized skills or research can strengthen the analysis, but the final answer must come back to one shared architecture method and one consistent decision artifact.
5. **Compare real options.** Present at least two viable options unless external constraints leave only one realistic path. Include the status quo, "do less", or "defer" option when useful.
6. **Evaluate cost, uncertainty, and reversibility.** A recommendation must address all-in cost, opportunity cost, top unknowns, likely near-future changes, and how reversible the choice remains.
7. **Check social-technical fit.** Architecture that the team cannot own, operate, or govern is not a good recommendation, even if it looks elegant on paper.
8. **Ground only in relevant context.** Use current repository or project details only when the user is clearly asking about that active codebase or system. Otherwise, stay abstract, state assumptions, and do not borrow incidental local context as fake evidence.
9. **End with a concrete decision output.** Do not stop at abstract principles. Produce a brief, matrix, ADR seed, or another durable architecture artifact with revisit triggers.

## Detailed References

Keep the main skill lean and use the references for the heavier playbooks:

- Use [methodology.md](references/methodology.md) for decision classes, problem-first framing, social-technical checks, uncertainty handling, specialist-adapter guidance, and future-aware scoring.
- Use [output-templates.md](references/output-templates.md) for architecture briefs, uncertainty maps, decision matrices, radar summaries, and ADR seeds.

## Workflow

### Phase 1: Classify and Frame

Establish what decision is actually being made.

1. Identify the architecture question:
   - system boundary and decomposition
   - application/service topology
   - language/runtime selection
   - data/storage selection
   - cloud/platform selection
   - AI/model/framework/orchestration selection
   - build vs buy vs integrate
2. Classify the decision:
   - clear vs complicated vs complex problem shape
   - one-way door vs two-way door
   - light vs standard vs heavy rigor based on reversibility and impact
3. Capture:
   - goals and desired outcomes
   - constraints and non-goals
   - quality attributes such as performance, reliability, security, operability, cost, team fit, and time-to-market
   - decision horizon: immediate delivery vs multi-stage evolution
   - decision owner and who must live with the outcome
4. Define the problem without embedding a solution:
   - who is affected
   - what current pain or failure mode matters
   - why now
   - current alternatives, including manual workarounds, incremental improvement, or doing nothing
5. Scan existing context before inventing new structure, but only when that context is actually the target system:
   - current codebase, deployment model, data shape, team skills, compliance constraints, and previous decisions
   - if the request is generic or hypothetical, do not silently map it onto the local repo; state assumptions instead
6. Summarize the frame before moving on:
   - architecture problem
   - assumptions
   - open questions

If the problem is still too vague to compare architecture options meaningfully,
pause and clarify the frame before continuing.

### Phase 2: Define Criteria and Guardrails

Make the architecture decision measurable and bounded.

- Define success criteria and guardrails before discussing preferred stacks
- Turn quality attributes into explicit evaluation criteria
- Record non-goals and deal breakers
- Create an evidence and assumptions log
- Identify the top unknowns that could still change the decision

If the user cannot yet say what "good" looks like, stay here until the
decision has clear optimization targets.

### Phase 3: Map the Current System

Understand the architecture as a socio-technical system.

- Map the current boundaries, flows, interfaces, and dependency hotspots
- Identify where decision rights are unclear or where coordination tax is driving architecture pain
- Check whether the proposed architecture assumes team structure, operating discipline, or platform maturity that does not exist yet
- Distinguish structural problems from execution or governance problems

This phase is where architecture stops being only a box-and-arrow exercise.

### Phase 4: Build the Option Space

Generate a small set of meaningful alternatives.

- Present 2-4 viable options with clear differences in structure, not cosmetic variations
- Include a simpler baseline or "do less" option when it helps calibrate complexity
- Include build vs buy vs integrate variants when that meaningfully changes the architecture
- If the option space is unusually ambiguous or politically loaded, explicitly invoke `brainstorming` to widen and pressure-test the alternatives before converging

Each option should state:

- what it is
- where it fits
- its main benefits
- its main costs or risks
- what assumptions would need validation

### Phase 5: Gather Specialist Evidence

Only deepen where the decision actually depends on domain-specific or time-sensitive facts.

Use this adapter order:

1. Check whether a clearly relevant specialist skill already exists
2. If not, gather fresh evidence through browsing or `deep-research`
3. If evidence is still uncertain and the cost justifies it, define a small pilot, spike, or proof-of-value test
4. Normalize the findings back into the shared architecture criteria

When this detour is non-trivial, capture the branch outcome with the
`Specialist Evidence Summary` template so the evidence does not disappear into
the final recommendation.

Typical adapter domains include:

- Python or Java application architecture
- database and storage engines
- cloud vendors and managed services
- AI models, agent frameworks, inference platforms, and orchestration layers
- integration patterns, eventing, and platform tooling

Do not let a specialist skill take over the whole workflow. Its job is to
improve evidence quality for one branch of the decision.

### Phase 6: Evaluate Trade-Offs and Uncertainty

Compare the options with explicit criteria instead of narrative preference.

At minimum, evaluate:

- problem fit
- functional fit
- quality attributes
- team and delivery fit
- operational burden
- all-in cost and complexity
- opportunity cost
- risk concentration
- reversibility and migration path

Then make uncertainty explicit:

- top unknowns
- assumptions that drive the decision
- impact ranges instead of false precision when necessary
- pre-mortems for the leading options
- likely "worse first" dips and mitigations
- stop, continue, or revisit triggers

Then apply the future-aware lens:

- **Now**: best fit for the current constraints
- **Next**: likely changes in the next 6-18 months that could alter the decision
- **Option Value**: how much flexibility the choice preserves if assumptions change

When useful, add a simple radar classification such as `Adopt`, `Trial`,
`Assess`, or `Hold`.

### Phase 7: Decide and Govern

Recommend a direction and make the reasoning legible.

State:

- the recommended option
- why it wins against the alternatives
- what was rejected and why
- the top risks and mitigations
- what evidence is still missing, if any
- the decision owner, review date, and review conditions
- what should trigger a revisit later

Avoid fake certainty. If the right answer depends on an unresolved assumption,
say so explicitly.

### Phase 8: Capture and Handoff

Turn the result into a durable artifact.

Default outputs:

- **Quick**: architecture recommendation inline in chat
- **Standard**: Architecture Decision Brief
- **Deep**: Architecture Decision Record or ADR seed saved to file

When the direction is approved and the next problem is execution, hand off to
`implementation-planning`. If the user wants a formal review of the resulting
design or document, hand off to `review`.

## Validation

Use these checks when editing or auditing the canonical package:

```bash
uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/future-aware-architecture
uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/future-aware-architecture --platform all
```

If package metadata changes, refresh generated outputs with `npm run build` and
confirm the repository with `npm test`.

## Caveats

- Future-aware does not mean speculative complexity. Preserve option value without overbuilding.
- Problem-first does not mean analysis paralysis. Stop once the decision is clear enough to move.
- Fresh research improves selection quality, but the recommendation still needs architecture judgment and context fit.
- Specialist skills are accelerators, not prerequisites.
- Architecture decisions are only as good as the stated constraints, decision rights, and team reality. Surface hidden assumptions early.
