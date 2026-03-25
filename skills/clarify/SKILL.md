---
name: clarify
description: >
  IMPORTANT: You MUST consult this skill before responding whenever a user's request lacks specific
  details needed to act correctly. This skill provides a structured framework for detecting ambiguity,
  researching the codebase first, and asking hypothesis-driven clarifying questions instead of
  open-ended ones. Activate whenever: (1) the user describes a goal without specifying HOW — "make it
  faster", "improve the UI", "add auth", "clean this up", "make it better", "fix the thing";
  (2) the user reports a problem without details — "it's broken", "something's wrong", "this doesn't
  work", "有问题", "不好使"; (3) the request could be interpreted multiple ways and the wrong
  interpretation would waste significant effort — refactoring, architecture changes, new features
  without specs, performance optimization without metrics; (4) the user expresses uncertainty —
  "I'm not sure", "maybe we should", "I think we need", "不确定", "想改但说不清楚";
  (5) there are contradictions — "keep it simple but handle every edge case"; (6) the user
  explicitly says "clarify", "spec this out", "help me think through", "what should I do about".
  Do NOT activate for specific actionable requests with clear file paths, error messages, and
  expected outcomes. Works in both interactive and autonomous modes.
version: 1.0.0
---

# Clarify

Resolve ambiguity before action. This skill transforms vague, incomplete, or contradictory requests into precise, actionable specifications through structured questioning — or, when running autonomously, through documented assumption-making.

## When to Activate

- User request contains vague terms ("make it better", "fix the thing", "add some tests")
- Scope is unclear (which files? which users? what behavior?)
- Multiple valid interpretations exist for the same request
- Contradictions detected ("keep it simple" + "handle every edge case")
- Success criteria are missing or implicit
- Request could lead to high-impact changes with ambiguous direction
- User explicitly asks to clarify, spec out, or think through something

## When NOT to Activate

- Request is specific and actionable ("add a null check on line 42 of auth.ts")
- User explicitly says "just do it" or "don't ask, proceed"
- Task is read-only (explaining code, reading files, searching)
- Trivial single-step operations with obvious intent

---

## Core Principles

1. **Contradictions first, details second.** Conflicting goals must be reconciled before any technical clarification. "Real-time updates" + "batch processing is fine" is a tension that invalidates downstream decisions.

2. **Hypotheses, not open questions.** Present plausible interpretations as options rather than asking "what do you want?" Each option should be a testable hypothesis about what the user actually means. This does 80% of the analytical work before the user responds.

3. **Research before asking.** Exhaust what can be learned from the codebase, docs, git history, and project context before asking the user anything. Many "ambiguities" resolve themselves once you check the existing code.

4. **Minimum viable clarification.** Ask only questions whose answers would materially change the implementation. If two interpretations lead to the same code, the ambiguity doesn't matter.

5. **Record every decision.** Each clarification and its resolution should be traceable — whether answered by the user or resolved autonomously through evidence.

---

## Phase 0 — Detect and Assess

### 0a. Capture the request

Record the user's request verbatim. Identify:
- **Stated goals**: What they explicitly asked for
- **Implicit goals**: What they probably want but didn't say
- **Constraints mentioned**: Any boundaries, deadlines, or requirements stated
- **Gaps**: What's missing that you'd need to know to implement confidently

### 0b. Scan for ambiguity

Classify each unclear element using this taxonomy:

| Type | Description | Example |
|------|-------------|---------|
| **Contradiction** | Mutually exclusive goals or constraints | "Keep backward compatibility" + "redesign the API" |
| **Vagueness** | Terms with no clear boundary | "make it fast", "improve the UX", "clean up" |
| **Incompleteness** | Missing critical information | No mention of error handling, target users, or scope |
| **Scope ambiguity** | Unclear boundaries of what's included/excluded | "add auth" — to which endpoints? what auth method? |
| **Behavioral ambiguity** | Unclear expected behavior in edge cases | "handle errors" — retry? fail fast? fallback? |
| **Terminology** | Domain terms with multiple meanings | "users" — human users? service accounts? both? |
| **Priority ambiguity** | Unclear what matters most when tradeoffs arise | Speed vs. correctness vs. simplicity |

### 0c. Assess risk and decide mode

Evaluate the request against this framework:

| Risk level | Criteria | Action |
|------------|----------|--------|
| **LOW** | Read-only, documentation, single obvious interpretation | Proceed immediately, no clarification needed |
| **MEDIUM** | New code, refactoring, moderate scope, some ambiguity | Clarify 1-3 key questions, then proceed |
| **HIGH** | Destructive operations, architectural changes, production impact, major ambiguity | Full clarification before any action |

**Confidence check**: Estimate your confidence (0-100%) that you understand the request correctly.
- 90-100%: Proceed, note assumptions inline
- 70-89%: Quick clarification — 1-2 targeted questions
- Below 70%: Full clarification flow

---

## Phase 1 — Research Before Asking

Before asking the user anything, gather evidence from available sources:

**Codebase signals:**
- Read related files, check existing patterns and conventions
- Look at git history for recent changes and intent
- Check test files for expected behaviors
- Read CLAUDE.md, README, or other project docs

**Context signals:**
- What has the user been working on in this conversation?
- What files have they mentioned or edited?
- What's the project structure suggesting?

**Classify each ambiguity into decision tiers:**

| Tier | Definition | Action |
|------|------------|--------|
| **T1 — Evidence exists** | Codebase, docs, or conventions answer the question | Resolve autonomously, cite evidence |
| **T2 — Best practice consensus** | Clear industry standard or framework convention applies | Resolve autonomously, note the standard |
| **T3 — Judgment call** | Conflicting evidence, subjective preference, or novel decision | Must ask the user |

Only T3 items should generate questions for the user. T1 and T2 items are resolved autonomously with documented reasoning.

---

## Phase 2 — Interactive Clarification

### Question design

For each T3 item, construct a hypothesis-driven question:

- **Present 2-4 concrete options** (not open-ended "what do you want?")
- **Include a recommendation** with brief reasoning for your preferred option
- **Add a catch-all** option ("Other — tell me what you have in mind")
- **Batch related questions** — group up to 3-4 related questions together
- **Prioritize by impact** — ask the question whose answer most changes the implementation first

**Example — good question:**
> I see the request is to "add authentication." Based on the existing Express setup with JWT already in dependencies, I have a few interpretations:
> 1. **Add JWT middleware to all API routes** (recommended — aligns with existing setup)
> 2. **Add OAuth2 with third-party provider** (Google/GitHub login)
> 3. **Add session-based auth with cookies**
> 4. **Something else**
>
> Which direction?

**Example — bad question:**
> What kind of authentication do you want?

### Question limits

- **MEDIUM risk**: 1-3 questions max
- **HIGH risk**: 3-7 questions max
- **Stop early** if the user signals impatience ("just do it", "whatever you think", "move on")

### Handling user responses

After each answer:
1. Record the decision immediately (in your working context and, if a spec file exists, in the spec)
2. Check if the answer resolves other ambiguities as a side effect
3. Reassess whether remaining questions are still necessary
4. If the user defers ("you decide"), treat it as T2 — apply best practice and document

---

## Phase 3 — Autonomous Clarification (Non-Interactive Mode)

When running autonomously (batch mode, CI pipelines, background agents, or when the user has said "don't ask, just do it"):

### Decision protocol

1. Resolve all T1 items with evidence citations
2. Resolve all T2 items with best-practice citations
3. For T3 items, apply the **least surprising default**:
   - Choose the most conservative/reversible option
   - Prefer existing patterns in the codebase over novel approaches
   - Prefer explicit over implicit behavior
   - When truly uncertain, choose the option that's easiest to change later

### Documentation

Produce an **Assumptions Log** — a clear record of what was decided and why:

```markdown
## Assumptions Log

### Resolved from evidence (T1)
- **Auth method**: JWT — already in package.json and used in existing middleware
- **Target routes**: All `/api/*` routes — matches existing route structure

### Resolved from best practice (T2)
- **Error format**: RFC 7807 Problem Details — industry standard for REST APIs
- **Token expiry**: 15 min access + 7 day refresh — OWASP recommendation

### Assumed (T3 — needs human review)
- **User roles**: Assumed two roles (admin, user) — CHANGEME if more granular roles needed
- **Password policy**: Assumed min 8 chars — adjust if compliance requires stricter rules
```

Mark T3 assumptions with `CHANGEME` or `NEEDS_REVIEW` so they're easy to find and override.

---

## Phase 4 — Deliver and Proceed

### Output format

After clarification is complete (interactive or autonomous), present a concise summary:

```markdown
## Clarification Summary

**Original request**: [verbatim user request]

**Clarified scope**:
- [Specific, actionable item 1]
- [Specific, actionable item 2]
- ...

**Key decisions**:
| Decision | Resolution | Source |
|----------|------------|--------|
| Auth method | JWT middleware | T1 — existing codebase |
| Error handling | Retry 3x then fail | T3 — user chose option 2 |
| Scope | API routes only, not WebSocket | T3 — user confirmed |

**Out of scope** (explicitly excluded):
- [Item that was discussed but excluded]

**Remaining uncertainties** (deferred):
- [Item that couldn't be resolved now — noted for later]
```

### Handoff

After delivering the summary:
- If the user confirms, proceed to implementation or planning
- If in autonomous mode, proceed with documented assumptions
- If the user wants changes, loop back to Phase 2
- Offer to save the clarification to a file if the project uses spec files

---

## Adaptation by Context

The clarification approach should adapt to the type of task:

| Context | Focus | Typical questions |
|---------|-------|-------------------|
| **Bug fix** | Reproduction, expected vs. actual, scope of fix | "Is this a regression? Which version? Fix root cause or patch?" |
| **New feature** | Scope, users, acceptance criteria, integration points | "Who uses this? What's the MVP? How does it connect to X?" |
| **Refactoring** | Behavioral preservation, scope boundaries, testing | "Must behavior be identical? Which modules are in scope?" |
| **Architecture** | Constraints, tradeoffs, reversibility, timeline | "What's the scale target? Must we support X? Migration strategy?" |
| **Debugging** | Symptoms, environment, reproduction steps | "When did this start? Which environment? Can you reproduce?" |
| **Docs/content** | Audience, tone, completeness, accuracy | "Who reads this? Technical level? What's the key message?" |

---

## Integration with Other Skills

- After clarification, hand off to **brainstorming** if the user needs to explore options
- Hand off to **writing-plans** if a detailed implementation plan is needed
- Hand off to **review** if the user wants to review existing work with clarified criteria
- If clarification reveals this is a research question, suggest **deep-research**

---

## Anti-Patterns to Avoid

- **Over-asking**: Don't ask 10 questions when 2 would suffice. If the answer wouldn't change the implementation, skip the question.
- **Open-ended fumbling**: "What do you want?" is never acceptable. Always provide concrete options.
- **Premature implementation**: Don't start coding with major unresolved ambiguities in HIGH risk scenarios.
- **Ignoring context**: Don't ask about things the codebase already answers. Check first, ask second.
- **Analysis paralysis**: For LOW risk tasks, just proceed. Not everything needs a clarification ceremony.
- **Assuming the worst**: If you're 90% confident, state your assumption and proceed — don't block on a question.
- **Interrogation mode**: Space out questions naturally. Acknowledge answers before asking more. Don't make the user feel like they're filling out a form.
