# Advanced Reasoning Techniques

Deep dive into structured reasoning patterns for complex tasks. Read this when you need multi-step reasoning, verification, or planning capabilities in your prompts.

## Table of Contents

1. [Chain-of-Thought (CoT) Variants](#chain-of-thought-variants)
2. [Tree of Thought (ToT)](#tree-of-thought)
3. [ReAct Pattern](#react-pattern)
4. [Self-Consistency](#self-consistency)
5. [Self-Refine / Reflexion](#self-refine--reflexion)
6. [Meta-Prompting](#meta-prompting)
7. [Choosing the Right Technique](#choosing-the-right-technique)

---

## Chain-of-Thought Variants

### Zero-Shot CoT

The simplest reasoning elicitation. Append a reasoning trigger to your prompt.

```
Q: A store sells apples for $2 each and oranges for $3 each.
   Someone buys 5 fruits for $12. How many of each?

Think step by step before giving the final answer.
```

**When to use:** Quick analytical tasks, math problems, logic puzzles.
**When to skip:** Modern reasoning models (Claude with extended thinking, o1/o3) do this internally — adding "think step by step" can be redundant or even counterproductive.

### Few-Shot CoT

Provide example reasoning traces so the model learns the desired reasoning depth and style.

```
Q: If a train travels at 60 mph for 2.5 hours, how far does it go?
A: Distance = speed x time = 60 x 2.5 = 150 miles. The train travels 150 miles.

Q: A car travels at 45 mph. How long to cover 135 miles?
A: Time = distance / speed = 135 / 45 = 3 hours. It takes 3 hours.

Q: A plane flies at 500 mph. It has fuel for 4 hours. How far can it fly?
A:
```

**When to use:** When you need the model to match a specific reasoning style or depth, not just arrive at the right answer.

### Structured CoT

Define explicit reasoning steps the model must follow. More controlled than free-form CoT.

```
Evaluate whether this startup idea is viable.

Follow these reasoning steps:
1. MARKET: Identify the target market and estimate size
2. PROBLEM: Articulate the specific problem being solved
3. SOLUTION: Assess how well the proposed solution addresses the problem
4. COMPETITION: Identify existing alternatives and differentiation
5. ECONOMICS: Evaluate unit economics and path to profitability
6. RISKS: List top 3 risks and potential mitigations
7. VERDICT: Provide overall assessment with confidence level (high/medium/low)

Idea: "{startup_idea}"
```

**When to use:** Domain-specific analysis where you want consistent reasoning dimensions across different inputs.

---

## Tree of Thought

Explore multiple reasoning paths in parallel, then select the best one.

**When to use:** Problems with multiple valid approaches where the optimal path isn't obvious upfront. Strategic planning, creative problem-solving, architecture decisions.

### Single-Prompt ToT

```
Consider this design problem: {problem}

Generate 3 different approaches:

Approach A: [describe approach]
- Pros: [list]
- Cons: [list]
- Feasibility: [high/medium/low]

Approach B: [describe approach]
- Pros: [list]
- Cons: [list]
- Feasibility: [high/medium/low]

Approach C: [describe approach]
- Pros: [list]
- Cons: [list]
- Feasibility: [high/medium/low]

Now evaluate all three against these criteria:
1. Implementation complexity
2. Scalability
3. Maintainability

Select the best approach and explain why.
```

### Multi-Step ToT (via prompt chain)

For complex problems, implement ToT as a prompt chain:
1. **Generate**: Produce N candidate solutions
2. **Evaluate**: Score each candidate on defined criteria
3. **Expand**: Take the top candidates and develop them further
4. **Select**: Make final selection with full justification

---

## ReAct Pattern

Interleave reasoning (Thought) with actions (Act) and observations (Observe). This is the standard pattern for tool-using agents.

### Modern ReAct (2025+)

Modern frameworks (Claude Code, LangGraph, AutoGen) implement ReAct natively through structured tool calling. You don't need to format it as text — the model outputs tool calls directly, the framework executes them, and results flow back automatically.

**When writing prompts for ReAct agents, focus on:**
- What tools are available and when to use each
- What information to gather before acting
- When to stop and ask the user vs. proceeding autonomously
- How to handle tool failures gracefully

```
You have access to these tools:
- search(query): Search the web for information
- read_file(path): Read a local file
- write_file(path, content): Write to a local file
- run_command(cmd): Execute a shell command

For each task:
1. Think about what information you need
2. Use the appropriate tool to gather it
3. Analyze the results
4. Decide if you need more information or can proceed
5. Take action or provide your answer

If a tool call fails, try an alternative approach before giving up.
```

### Classic ReAct (for models without native tool calling)

```
Answer the question using this format:

Thought: [what you're thinking and planning]
Action: [tool_name(arguments)]
Observation: [result from the action]
... (repeat as needed)
Thought: [final reasoning]
Answer: [final answer]

Available tools: search(query), calculate(expression), lookup(term)

Question: {question}
```

---

## Self-Consistency

Sample multiple reasoning paths and aggregate results. Improves reliability for tasks where a single CoT might go wrong.

**When to use:** High-stakes decisions, mathematical proofs, classification tasks where you need confidence.

### Implementation via API

```python
import collections

# Sample N responses with temperature > 0
responses = []
for _ in range(5):
    response = client.messages.create(
        model="claude-sonnet-4-6",
        temperature=0.7,
        messages=[{"role": "user", "content": cot_prompt}]
    )
    answer = extract_final_answer(response)
    responses.append(answer)

# Majority vote
final_answer = collections.Counter(responses).most_common(1)[0][0]
confidence = responses.count(final_answer) / len(responses)
```

### Single-Prompt Approximation

When you can't make multiple API calls, simulate self-consistency in one prompt:

```
Solve this problem using 3 different approaches.
For each approach, show your reasoning and final answer.
Then compare all three answers. If they agree, that's your answer.
If they disagree, determine which reasoning is most sound and explain why.
```

---

## Self-Refine / Reflexion

Have the model critique and improve its own output iteratively.

### Self-Refine (single turn)

```
Complete this task: {task}

After your first draft, critique it:
- What could be improved?
- Are there errors or omissions?
- Does it fully address the requirements?

Then provide an improved version incorporating your critique.
```

### Reflexion (multi-turn)

Implement as a prompt chain:
1. **Attempt**: Generate initial output
2. **Evaluate**: Assess against success criteria
3. **Reflect**: Identify specific failure reasons
4. **Retry**: Generate improved output with reflection context

```python
# Reflexion loop
for attempt in range(max_attempts):
    output = generate(task_prompt + reflection_context)
    evaluation = evaluate(output, success_criteria)

    if evaluation.passed:
        break

    reflection_context += f"\nAttempt {attempt + 1} failed because: {evaluation.feedback}"
    reflection_context += f"\nSpecific improvements needed: {evaluation.suggestions}"
```

---

## Meta-Prompting

Use the model to generate or improve prompts.

### Prompt Generation

```
I need a prompt for this task: {task_description}

The prompt should:
- Be clear and unambiguous
- Include appropriate constraints
- Use {technique} (few-shot / CoT / structured output)
- Target {model_name}

Generate the prompt, then critique it for potential failure modes.
Revise if needed.
```

### Prompt Optimization

```
Here is my current prompt:
---
{current_prompt}
---

It fails on these inputs:
{failure_examples}

Analyze why it fails, then suggest specific improvements.
Provide the revised prompt.
```

---

## Choosing the Right Technique

| Task type | Recommended technique | Why |
|-----------|----------------------|-----|
| Simple classification | Direct instruction or few-shot | Reasoning overhead isn't needed |
| Math / logic problems | Structured CoT | Step-by-step prevents calculation errors |
| Multi-step analysis | Structured CoT with verification | Catches errors before final answer |
| Creative / strategic decisions | Tree of Thought | Explores multiple approaches before committing |
| Tool-using agents | ReAct | Interleaves reasoning with real-world actions |
| High-stakes decisions | Self-consistency (N=3-5) | Aggregation reduces single-path errors |
| Iterative improvement | Self-refine / Reflexion | Built-in critique loop catches issues |
| Writing new prompts | Meta-prompting | Models are good at understanding model behavior |

### Decision Flow

```
Is the task simple and well-defined?
├── Yes → Direct instruction or few-shot
└── No → Does it require external tools?
    ├── Yes → ReAct
    └── No → Is there one clear approach?
        ├── Yes → Structured CoT (+ verification if high-stakes)
        └── No → Tree of Thought
            └── Need high confidence? → Add self-consistency
```
