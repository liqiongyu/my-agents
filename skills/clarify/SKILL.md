---
name: clarify
description: >
  Hybrid workflow for turning ambiguous implementation requests into actionable scope before
  execution. Use explicitly when the user asks to clarify requirements, disambiguate a request,
  or spec a change before building it. Activate automatically only when an implementation-oriented
  request contains direct contradictions, missing acceptance criteria that would materially change
  the build, or an explicit request to proceed with documented assumptions. Do not activate for
  open-ended direction-finding, brainstorming, or already-specific actionable tasks.
invocation_posture: hybrid
version: 1.2.1
---

# Clarify

Resolve ambiguity before action. This skill turns vague, incomplete, or contradictory implementation requests into precise, actionable scope through structured clarification or documented assumptions.

**Invocation posture:** `hybrid`. Prefer explicit invocation. Automatic activation should stay limited to high-confidence implementation ambiguity, not general idea exploration.

## When To Activate

- The user explicitly asks to clarify requirements, disambiguate a request, or spec a change before implementation
- An implementation request contains direct contradictions or mutually exclusive constraints
- Acceptance criteria or scope boundaries are missing in a way that would materially change what gets built
- The user asks you to proceed with assumptions and those assumptions need to be made explicit
- Multiple plausible implementations exist and choosing among them would change files, APIs, or user-visible behavior

## When Not To Use

- Open-ended option exploration, strategy work, or direction-finding; use `brainstorming`
- Requests that mainly ask "what should we do?" rather than "what exactly should we build?"
- Specific actionable tasks with clear files, error messages, or expected outcomes
- Read-only explanation, code reading, or search tasks where no implementation decision is blocked
- Cases where the user explicitly says to proceed without questions and there is no contradiction or material ambiguity to surface

## Outcome

Produce the smallest clarification artifact that unblocks execution:

- A concise clarification summary with clarified scope, key decisions, and out-of-scope items
- A short set of hypothesis-driven user questions when genuine T3 judgments remain
- An assumptions log when running non-interactively or when the user wants you to proceed without waiting

---

## Core Principles

1. **Contradictions first, details second.** Resolve conflicting goals before discussing implementation detail.
2. **Research before asking.** Mine the codebase, docs, tests, history, and current conversation first.
3. **Hypotheses, not open questions.** Offer plausible options with a recommendation instead of asking the user to design the answer from scratch.
4. **Minimum viable clarification.** Ask only what would materially change the implementation.
5. **Document decisions.** Every resolved ambiguity should be traceable to evidence, best practice, user choice, or explicit assumption.
6. **Stay out of brainstorming territory.** If the real issue is choosing a direction rather than clarifying requirements, hand off to `brainstorming`.
7. **Match the user's tempo.** If they say "proceed" or "don't ask," switch to autonomous clarification and record assumptions instead of interrogating them.
8. **Follow the user's language.** User-facing questions, summaries, and assumptions logs should use the user's language.

---

## Workflow

### Phase 0 — Detect and Assess

Capture the request and classify the ambiguity:
- **Stated goals**: What they explicitly asked for
- **Implicit goals**: What they probably want but didn't say
- **Constraints mentioned**: Any boundaries, deadlines, or requirements stated
- **Gaps**: What's missing that you'd need to know to implement confidently
- **Ambiguity types**: contradiction, vagueness, incompleteness, scope ambiguity, behavioral ambiguity, terminology, priority ambiguity
- **Risk level**:
  - **LOW**: single obvious interpretation; proceed
  - **MEDIUM**: some ambiguity; ask 1-3 targeted questions if needed
  - **HIGH**: destructive or high-impact ambiguity; clarify before action
- **Confidence check**:
  - 90-100%: proceed and note assumptions inline
  - 70-89%: quick clarification
  - below 70%: full clarification flow

---

## Phase 1 — Research Before Asking

Gather evidence before asking the user anything:

- Read related files, tests, docs, and instruction files
- Check recent history or existing conventions when they can answer scope questions
- Reuse conversation context, mentioned files, and surrounding patterns

Classify each ambiguity into decision tiers:

| Tier | Definition | Action |
|------|------------|--------|
| **T1 — Evidence exists** | Codebase, docs, or conventions answer the question | Resolve autonomously, cite evidence |
| **T2 — Best practice consensus** | Clear industry standard or framework convention applies | Resolve autonomously, note the standard |
| **T3 — Judgment call** | Conflicting evidence, subjective preference, or novel decision | Must ask the user |

Only T3 items should generate questions for the user. T1 and T2 items are resolved autonomously with documented reasoning.

---

## Phase 2 — Clarify Interactively Or Autonomously

If T3 decisions remain, choose the lightest mode that will safely unblock the task.

**Interactive clarification**
- Present 2-4 concrete options, not open-ended prompts
- Include a recommendation and short rationale
- Batch only related questions
- Default limits:
  - **MEDIUM risk**: 1-3 questions
  - **HIGH risk**: 3-7 questions
- Stop early if the user says to proceed or defer to your judgment

**Autonomous clarification**
- Resolve T1 with evidence
- Resolve T2 with best-practice defaults
- Resolve T3 with the least surprising, most reversible choice
- Mark human-review assumptions clearly so they can be overridden later

See [templates.md](references/templates.md) for question patterns, example wording, and an assumptions-log template.

---

## Phase 3 — Deliver And Hand Off

Summarize only what execution needs next:

- **Original request**
- **Clarified scope**
- **Key decisions** with source labels (`T1`, `T2`, `T3`)
- **Out of scope**
- **Remaining uncertainties** or assumptions that still need review

Then hand off appropriately:

- proceed to implementation when scope is now clear
- hand off to `implementation-planning` if the clarified task still needs a deep technical plan
- hand off to `brainstorming` if the unresolved issue is choosing a direction
- hand off to `deep-research` if clarification reveals a research-first problem
- hand off to `review` if the user wants existing work evaluated against clarified criteria

---

For reusable output patterns, context-specific prompts, and cross-skill boundaries, see:

- [templates.md](references/templates.md)
- [context-and-handoffs.md](references/context-and-handoffs.md)

---

## Validation

Validate the canonical package and its durable fixtures before shipping changes:

- `uv run python skills/skill-lifecycle-manager/scripts/quick_validate.py skills/clarify`
- `uv run python skills/skill-lifecycle-manager/scripts/validate_eval_suite.py skills/clarify/eval/eval-cases.json`
- `uv run python skills/skill-lifecycle-manager/scripts/validate_projection.py skills/clarify --platform all`

If you changed the runtime projections, regenerate them from the canonical package instead of hand-editing the projected copies:

- `uv run python skills/skill-lifecycle-manager/scripts/project_skill.py skills/clarify --platform all`

---

## Anti-Patterns to Avoid

- **Over-asking**: Do not create a questionnaire when one decision is the only real blocker.
- **Open-ended fumbling**: Avoid "what do you want?" when you could offer concrete hypotheses.
- **Premature implementation**: Do not code through unresolved HIGH-risk contradictions.
- **Ignoring evidence**: Do not ask about things the repository, docs, or tests already answer.
- **Analysis paralysis**: LOW-risk ambiguity is often best handled with a stated assumption and forward motion.
- **Brainstorming drift**: Do not use clarification as a substitute for genuine option exploration or strategy work.
