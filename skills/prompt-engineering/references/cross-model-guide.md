# Cross-Model Prompting Guide

How to write prompts that work across different LLMs, and how to adapt when you need model-specific optimization. Read this when migrating prompts between models or building multi-model systems.

## Table of Contents

1. [Universal Techniques](#universal-techniques)
2. [Model-Specific Best Practices](#model-specific-best-practices)
3. [Migration Checklist](#migration-checklist)
4. [Common Cross-Model Pitfalls](#common-cross-model-pitfalls)

---

## Universal Techniques

These techniques work reliably across all major models:

| Technique | Works everywhere | Notes |
|-----------|-----------------|-------|
| Clear, specific instructions | Yes | Foundation of all prompting |
| Few-shot examples | Yes | Models handle examples differently in detail, but the pattern is universal |
| Role / persona definition | Yes | Specificity of role matters more than the model |
| Output format specification | Yes | JSON, markdown, tables — all models respect explicit format requests |
| Step-by-step reasoning | Yes | Implementation varies (see below), but the concept is universal |
| Delimiter-separated sections | Yes | Use `---`, XML tags, or markdown headers to separate sections |

---

## Model-Specific Best Practices

### Claude (Anthropic)

**Structural preferences:**
- **XML tags** are Claude's preferred delimiter for separating sections:
  ```
  <context>
  Background information here
  </context>

  <instructions>
  What to do with the context
  </instructions>

  <output_format>
  How to structure the response
  </output_format>
  ```
- Claude handles long contexts well — put instructions at the end when working with large documents ("Based on the information above, ...")

**Reasoning:**
- Claude Opus 4.6 and Sonnet 4.6 support **extended thinking** — a built-in reasoning mode that produces higher-quality analysis. Enable via API parameter rather than prompting.
- For standard models, structured CoT with explicit steps works well.
- Claude responds to motivated reasoning ("This matters because...") better than rigid directives.

**Output control:**
- **Prefilling** — Start the assistant turn to anchor the response format:
  ```python
  messages=[
      {"role": "user", "content": prompt},
      {"role": "assistant", "content": "```json\n{"}
  ]
  ```
- Use `tool_use` for reliable structured output with schema validation.

**Unique strengths:**
- Excellent at following complex, multi-part instructions
- Strong at nuanced analysis and writing
- Handles very long contexts (200K tokens) without significant quality degradation
- Responds well to "above and beyond" explicit requests

**Prompt caching:**
- Use `cache_control: {"type": "ephemeral"}` on system prompts or large context blocks to reduce cost and latency for repeated calls.

### GPT (OpenAI)

**Structural preferences:**
- **Markdown** and **triple-backtick delimiters** work well:
  ```
  ### Context
  Background information here

  ### Instructions
  What to do

  ### Output Format
  Expected structure
  ```
- GPT-4.1 and later respond well to explicit context-reliance tuning: "Answer based only on the provided context."

**Reasoning:**
- o1/o3 series models have **built-in reasoning** — do NOT add "think step by step" as it can interfere with internal CoT.
- For GPT-4/4.1, explicit CoT prompting still helps.
- `response_format: { "type": "json_schema", "json_schema": {...} }` provides schema-enforced structured output.

**Output control:**
- `response_format` parameter for JSON mode
- Function calling / tool use for structured output
- `logit_bias` for controlling specific token probabilities

**Unique strengths:**
- Strong at code generation and function calling
- Good at following detailed formatting instructions
- Effective with system message for persistent behavior

### Gemini (Google)

**Structural preferences:**
- Favors **directness over persuasion** and **logic over verbosity**
- Concise prompts perform better — avoid unnecessary elaboration
- Place behavioral constraints in the System Instruction or at the very top
- For long contexts, place specific instructions at the **end** of the prompt

**Reasoning:**
- Gemini 2.x+ includes thinking mode — behavior similar to Claude's extended thinking
- Keep temperature at default `1.0` — lowering it can cause unexpected behavior
- Explicit planning and decomposition prompts work well

**Output control:**
- Specify schema via `response_schema` parameter for structured JSON
- By default produces direct, efficient answers — explicitly request conversational tone if needed

**Unique strengths:**
- Excellent multimodal capabilities (text + image + video + audio in same prompt)
- Strong at long-context tasks (1M+ tokens)
- Good at grounding responses in provided documents

### Open-Source Models (Llama, Mistral, Qwen, etc.)

**General guidance:**
- Simpler prompts tend to work better — these models have less instruction-following capacity
- Few-shot examples are more important (the model needs more demonstration)
- Keep system prompts short and direct
- Use chat template formats that match the model's training: `[INST]`, `<|user|>`, etc.
- Structured output is less reliable — consider output parsing/retry strategies

**Key differences:**
- May not handle XML tags as well as Claude
- System message support varies by model
- Context windows are typically smaller (4K-128K)
- More sensitive to prompt length — shorter prompts often perform better

---

## Migration Checklist

When moving a prompt from one model to another:

- [ ] **Replace model-specific delimiters**: XML tags (Claude) → markdown headers (GPT) → minimal structure (Gemini)
- [ ] **Adjust reasoning instructions**: Remove "think step by step" for reasoning models (o1/o3, Claude extended thinking, Gemini thinking mode)
- [ ] **Update structured output method**: Prefilling (Claude) → response_format (GPT) → response_schema (Gemini)
- [ ] **Recalibrate tone**: Claude responds to nuance; GPT responds to precision; Gemini responds to directness
- [ ] **Test on representative inputs**: A prompt that scores 95% on one model may score 70% on another
- [ ] **Adjust temperature**: Default 1.0 for Gemini; 0.0-0.3 for deterministic tasks on Claude/GPT
- [ ] **Check token limits**: Different models, different context windows, different pricing
- [ ] **Verify tool/function calling format**: Each model has its own tool calling schema

---

## Common Cross-Model Pitfalls

| Pitfall | What happens | Fix |
|---------|-------------|-----|
| Using Claude XML tags in GPT | Tags may be ignored or treated as content | Use markdown delimiters for GPT |
| "Think step by step" with o1/o3 | Interferes with internal reasoning | Remove explicit CoT triggers for reasoning models |
| Low temperature with Gemini 3 | "Unexpected behavior" per Google's docs | Keep temperature at 1.0 for Gemini |
| Long system prompts with open-source models | Quality degrades | Keep system prompts under 500 tokens |
| Assuming JSON mode is universal | Some models don't support it | Always have a parsing fallback |
| Same few-shot examples everywhere | Models learn differently from examples | Curate model-specific example sets |

## Writing Model-Agnostic Prompts

When you need one prompt to work across models (e.g., in a multi-model pipeline or when the model choice is configurable):

1. **Use markdown structure** — understood by all models
2. **Include 2-3 few-shot examples** — universal improvement
3. **Be explicit about output format** — show, don't rely on schema features
4. **Avoid model-specific features** — no prefilling, no XML tags, no response_format
5. **Keep instructions concise** — 150-300 words of instruction is the sweet spot
6. **Test on all target models** before shipping
