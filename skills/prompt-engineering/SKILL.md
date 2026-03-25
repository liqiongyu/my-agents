---
name: prompt-engineering
description: "Comprehensive prompt engineering and context engineering skill for designing, debugging, optimizing, and securing prompts for any LLM. Make sure to use this skill whenever the user wants to write or improve a prompt, rewrite a system prompt, add few-shot examples, build chain-of-thought reasoning scaffolds, enforce structured JSON output from LLMs, design agent instructions (CLAUDE.md, system prompts, codex.md), harden prompts against injection attacks, migrate prompts between models (Claude/GPT/Gemini), set up prompt A/B testing or evaluation, optimize token costs, build prompt chains or pipelines, or get more consistent and reliable outputs from any AI model. Also trigger when the user mentions hallucination reduction, output formatting issues, prompt templates, RAG prompt design, few-shot learning, prompt versioning, or anything related to making LLMs behave more predictably — even if they frame it as 'the AI keeps giving bad results' or 'my chatbot is inconsistent' without explicitly saying 'prompt engineering'. This skill covers the FULL prompt lifecycle from drafting to production hardening, and should be preferred over generic advice whenever prompt quality or LLM output reliability is the core concern."
version: 0.1.0
---

# Prompt Engineering

Design, optimize, and harden prompts that reliably produce the outputs you need — across models, across use cases, from prototype to production.

This skill covers the full prompt lifecycle: drafting, testing, optimizing, securing, and scaling. It is model-agnostic and works with any LLM-powered environment (Claude Code, Codex, Cursor, API integrations, or chat interfaces).

## When to Activate

- Writing or improving a prompt for any LLM
- Designing system prompts for agents, assistants, or chatbots
- Building few-shot examples or reasoning scaffolds
- Creating reusable prompt templates or chains
- Optimizing prompt performance (accuracy, consistency, cost, latency)
- Debugging prompts that produce inconsistent or incorrect outputs
- Hardening prompts against injection or misuse
- Migrating prompts between models (Claude <-> GPT <-> Gemini)

## Reference Files

This SKILL.md covers the core workflow and essential techniques. For deeper dives, read the targeted reference files:

| Reference | When to read |
|-----------|-------------|
| `references/advanced-reasoning.md` | Implementing CoT, ToT, ReAct, self-consistency, or multi-step reasoning |
| `references/cross-model-guide.md` | Writing prompts that work across Claude, GPT, Gemini, or open-source models |
| `references/production-patterns.md` | Versioning, testing, evaluating, caching, or scaling prompts in production |
| `references/security-patterns.md` | Defending against prompt injection, validating outputs, or building secure agent prompts |

---

## Core Workflow

### Workflow 1: Create a New Prompt

**Step 1 — Define success criteria before writing anything.**

Answer these questions first:
1. What is the task? (Be precise: "classify support tickets into 5 categories" not "handle support")
2. What does a good output look like? (Collect 3-5 examples of ideal outputs)
3. How will you measure success? (Accuracy %, format compliance, user satisfaction)
4. What are the constraints? (Token budget, latency target, model choice)

**Step 2 — Start simple, then add complexity only when needed.**

Follow the Progressive Disclosure principle:

| Level | When to use | Example |
|-------|-------------|---------|
| **L1: Direct instruction** | Try this first for any task | `Summarize this article in 3 bullet points.` |
| **L2: Add constraints** | L1 output is inconsistent | `Summarize in 3 bullets. Each under 20 words. Focus on actionable insights only.` |
| **L3: Add reasoning** | L2 misses nuance or logic | `First identify the 3 main findings, then summarize each in one bullet point.` |
| **L4: Add examples** | L3 format still drifts | Include 2-3 input-output pairs showing desired behavior |
| **L5: Add scaffolding** | Complex multi-step reasoning | Use CoT, structured output schemas, or prompt chains |

The right level is the simplest one that meets your success criteria. Over-engineering prompts wastes tokens and can confuse models.

**Step 3 — Structure the prompt with clear sections.**

Use this ordering — it matches how models process instructions most effectively:

```
[System context / Role]      ← Who the model is, persistent constraints
[Task instructions]           ← What to do, step by step
[Examples / Few-shot pairs]   ← Show, don't tell
[Input data]                  ← The actual content to process
[Output format specification] ← Exactly what the response should look like
```

**Step 4 — Test on at least 3 inputs.**

- One happy-path input (typical case)
- One edge case (unusual or boundary input)
- One adversarial input (malformed, ambiguous, or tricky)

If accuracy < 90% on your test set, return to Step 2 and move up one level.

### Workflow 2: Optimize an Existing Prompt

1. **Measure baseline** — Run the current prompt on 10+ diverse inputs. Record accuracy, consistency, format compliance, and token usage.
2. **Identify failure modes** — Categorize failures: wrong format? Wrong content? Hallucination? Inconsistency? Too verbose?
3. **Apply targeted fixes** — Change one variable at a time:

| Failure | Fix |
|---------|-----|
| Wrong output format | Add a concrete output example at the end |
| Inconsistent answers | Add 2-3 few-shot examples showing expected reasoning |
| Hallucination | Add "If unsure, say 'I don't know'" + constrain the answer domain |
| Too verbose | Add explicit word/sentence limit + "Be concise" instruction |
| Misses edge cases | Add an edge-case few-shot example |
| Ignores instructions | Move critical instructions to the beginning and end (primacy + recency) |
| Low reasoning quality | Add step-by-step reasoning scaffold (see Advanced Reasoning reference) |

4. **Re-test** — Run the same test set. Keep changes that improve metrics; revert those that don't.
5. **Document** — Record what changed, why, and the measured impact. Treat prompts as code.

### Workflow 3: Design a System Prompt for an Agent

System prompts are behavioral specifications — they define who the agent is and how it operates across all interactions.

**Framework — Four layers, in order of priority:**

```
Layer 1: Identity & Constraints
  → Role, expertise boundaries, what the agent must never do

Layer 2: Behavioral Guidelines
  → Communication style, error handling, uncertainty protocols

Layer 3: Task-Specific Instructions
  → Current domain knowledge, workflows, output formats

Layer 4: Safety & Guardrails
  → Content policies, injection resistance, escalation rules
```

**Calibrate freedom level based on task fragility:**

| Freedom | When | Prompt style |
|---------|------|-------------|
| **High** | Multiple valid approaches; context-dependent decisions | Text guidelines, heuristics, principles |
| **Medium** | Preferred pattern exists; some variation acceptable | Pseudocode or templates with parameters |
| **Low** | Fragile operations; consistency critical; specific sequence required | Exact scripts, no parameters, "run exactly this" |

**Example — High freedom:**
```
Analyze the code for potential issues. Consider correctness, security,
performance, and maintainability. Prioritize based on severity.
```

**Example — Low freedom:**
```
Run exactly: python scripts/migrate.py --verify --backup
Do not modify the command or add flags.
```

---

## Essential Techniques

### 1. Few-Shot Learning

Teach by showing examples instead of explaining rules. The model generalizes from patterns in your examples.

**When to use:** You need consistent formatting, specific reasoning patterns, or handling of edge cases.

**How many examples:** 2-5 is optimal. More examples improve accuracy but consume tokens. Balance based on task complexity and context budget.

**Example selection strategy:**
- Include diverse examples that cover the problem space (not 5 similar cases)
- Order from simple to complex for progressive learning
- Include at least one edge case
- Make sure examples match your actual target task (mismatched examples hurt more than no examples)

```
Extract structured data from support tickets:

Input: "My login doesn't work and I keep getting error 403"
Output: {"issue": "authentication", "error_code": "403", "priority": "high"}

Input: "Feature request: add dark mode to settings"
Output: {"issue": "feature_request", "error_code": null, "priority": "low"}

Input: "App crashes when uploading files over 10MB"
Output: {"issue": "file_upload", "error_code": null, "priority": "high"}

Now process this ticket:
Input: "{user_input}"
Output:
```

### 2. Chain-of-Thought Reasoning

Request step-by-step reasoning before the final answer. Improves accuracy on analytical tasks significantly.

**When to use:** Multi-step logic, mathematical reasoning, complex analysis, or when you need to audit the model's thinking.

**Modern context (2025+):** Reasoning models (Claude with extended thinking, o1/o3, Gemini with thinking) handle CoT internally. For these models, you often don't need explicit "think step by step" instructions — they reason automatically. However, providing a reasoning scaffold (structured steps to follow) still helps guide the direction of reasoning.

**Zero-shot CoT** (simplest — try first):
```
Analyze this bug report and determine the root cause.
Think through this step by step before giving your conclusion.
```

**Structured CoT** (when you need specific reasoning steps):
```
Analyze this bug report:

1. What is the expected behavior?
2. What is the actual behavior?
3. What changed recently that could cause this?
4. What components are involved?
5. What is the most likely root cause?

Bug: "{bug_report}"
```

**CoT with self-verification** (when accuracy is critical):
```
Solve this problem step by step.

After reaching your answer, verify it by:
- Checking it against the original requirements
- Testing with a simple example
- Looking for logical errors in your reasoning

If verification fails, revise before responding.
```

### 3. Structured Output

Enforce output schemas for reliable parsing and downstream processing.

**When to use:** API responses, data pipelines, tool calling, or any case where you need machine-readable output.

**Technique 1 — JSON schema in prompt:**
```
Analyze the sentiment. Respond with JSON only, no other text:
{
  "sentiment": "positive" | "negative" | "neutral",
  "confidence": 0.0-1.0,
  "key_phrases": ["phrase1", "phrase2"],
  "reasoning": "brief explanation"
}
```

**Technique 2 — Output prefilling** (Claude-specific):
Start the assistant response with the opening brace to anchor JSON output:
```python
response = client.messages.create(
    model="claude-sonnet-4-6",
    messages=[
        {"role": "user", "content": "Analyze: " + text},
        {"role": "assistant", "content": "{"}  # Prefill
    ]
)
```

**Technique 3 — API-level enforcement:**
Use structured output features when available: Claude's tool use, OpenAI's `response_format`, or Gemini's schema parameter. These are more reliable than prompt-only approaches.

### 4. Template Systems

Build reusable prompt structures with variables and conditional sections.

```python
# Reusable template with clear variable slots
REVIEW_TEMPLATE = """You are a senior {role} reviewing {artifact_type}.

Context:
{context}

Review for:
{criteria}

For each issue found, provide:
- Location (line number or section)
- Issue description
- Severity (critical / warning / suggestion)
- Recommended fix

{artifact_type}:
{content}"""

# Usage
prompt = REVIEW_TEMPLATE.format(
    role="security engineer",
    artifact_type="API endpoint code",
    context="This handles user authentication for a banking app",
    criteria="1. SQL injection\n2. Auth bypass\n3. Data exposure",
    content=code
)
```

### 5. Prompt Chains

Break complex tasks into sequential prompts where each step's output feeds the next.

**When to use:** Tasks too complex for a single prompt, or where intermediate validation is needed.

```
Step 1: Extract    → "Extract all entities from this document"
Step 2: Classify   → "Classify these entities: {step1_output}"
Step 3: Relate     → "Identify relationships between: {step2_output}"
Step 4: Synthesize → "Generate a knowledge graph summary from: {step3_output}"
```

Each step can use a different model, different temperature, or include validation before proceeding.

### 6. Role & Persona Design

Establish expertise and behavioral boundaries through role definition.

**Effective role prompt anatomy:**
```
You are a [specific role] with expertise in [specific domains].

Your responsibilities:
- [What you do]
- [How you approach problems]

Your constraints:
- [What you don't do]
- [When to escalate or defer]

Communication style:
- [Tone and format preferences]
```

Avoid vague roles ("You are a helpful assistant"). The more specific the role, the more consistent the behavior.

---

## Context Engineering Principles

Modern prompt engineering extends beyond the prompt itself to the entire context window. Think of the context window as RAM — every token competes for the model's attention.

### Principle 1: Minimize context, maximize signal

Every piece of information in the context should earn its place. Challenge each section:
- Does the model need this to do the task?
- Can I assume the model already knows this?
- Does this paragraph justify its token cost?

### Principle 2: Position matters

Models attend more to the beginning and end of context (primacy and recency effects). Place critical instructions at the top and reinforce them at the bottom. Put large data blocks in the middle.

### Principle 3: Progressive disclosure for agents

Don't load everything upfront. Use a three-tier pattern:
- **Discovery** (~80 tokens): Names and descriptions only
- **Activation**: Full instructions load when relevant
- **Execution**: Scripts and reference materials load only during task completion

### Principle 4: Compress history

For multi-turn conversations, summarize older context rather than keeping the full transcript. Keep the last 3-5 exchanges verbatim; summarize everything before that.

---

## Quality Gates

Before shipping a prompt to production, verify:

- [ ] Accuracy > 90% on 10+ diverse test cases
- [ ] < 5% variance across 3+ repeated runs
- [ ] All edge cases handled gracefully
- [ ] Output format matches spec on every test case
- [ ] Token usage within budget
- [ ] No prompt injection vulnerabilities (see `references/security-patterns.md`)
- [ ] Tested on target model(s) — behavior varies across models

---

## Best Practices

1. **Start simple** — Try the simplest prompt first. Add complexity only when measurements show it's needed.
2. **Show, don't tell** — Examples are more effective than descriptions. One good example beats a paragraph of instructions.
3. **Be specific** — "Summarize in 3 bullet points, each under 20 words" beats "write a short summary."
4. **Explain the why** — When giving constraints, explain the reason. Models with good theory of mind respond better to motivated instructions than rigid MUST/NEVER directives.
5. **One variable at a time** — When optimizing, change one thing, measure, decide. Changing multiple things makes results unattributable.
6. **Test on the target model** — Prompts that work on Claude may fail on GPT and vice versa. See `references/cross-model-guide.md`.
7. **Version your prompts** — Track prompt changes with the same discipline as code changes.
8. **Document intent** — Future you (or your team) needs to know why the prompt is structured this way.

## Common Pitfalls

| Pitfall | Why it hurts | Fix |
|---------|-------------|-----|
| Over-engineering | Wastes tokens, adds ambiguity | Start at L1, escalate only on failure |
| Vague instructions | Multiple valid interpretations | Add format examples, explicit constraints |
| Example pollution | Examples don't match target task | Curate examples that represent real inputs |
| Context overflow | Important instructions get lost | Compress, summarize, use progressive disclosure |
| No error handling | Silently produces wrong output | Add confidence scores, fallback behaviors |
| Ignoring model differences | What works on Claude may fail on GPT | Test cross-model, use the reference guide |
| ALL-CAPS directives | Can overtrigger models, reduce quality | Explain the reasoning; reserve emphasis for true safety constraints |
| Assuming longer = better | Extra detail adds noise after ~300 words of instruction | Be concise; token cost compounds over thousands of calls |
