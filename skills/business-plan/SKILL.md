---
name: business-plan
description: "Use this skill for substantial business planning work: drafting or revising a business plan, investor-ready financial analysis, market sizing, pitch deck narrative, strategic review, or business valuation. It is especially useful when the user needs structured commercial thinking, investor-grade outputs, China fundraising context, or AI/agent business analysis. Prefer this skill when the main deliverable is a business analysis or plan, not open-ended idea exploration, general current-events research, or final file production in slides, docs, or spreadsheets."
---

# Business Plan

A comprehensive business strategy skill that adapts to your stage, scale, and specific need — whether that is a full business plan, financial deep-dive, market sizing, pitch deck, strategic review, or valuation.

## Invocation Posture

This skill is `hybrid`.

- Trigger confidently for explicit business-planning requests and high-confidence asks for structured business analysis.
- Stay out of scope when the user is still deciding what business to pursue, primarily needs fresh cited research, or mainly wants a `.pptx`, `.docx`, or `.xlsx` file produced.

## When Not To Use

Do not use this skill when:

- The user is still exploring or comparing business directions and has not chosen a path yet; use `brainstorming` first.
- The main request is current market, competitor, fundraising, or regulatory research with fresh citations; use `deep-research` first, then use this skill to turn the findings into a plan.
- The primary deliverable is a final `.pptx`, `.docx`, or `.xlsx` artifact; use `pptx`, `docx`, or `xlsx` after the business content is defined here.
- The request is really for legal, tax, accounting, or investment advice that requires licensed professional judgment.

## Adjacent Skill Routing

- **`brainstorming` first** for open-ended business ideation, comparing opportunities, or deciding whether an idea is worth pursuing.
- **`deep-research` first** for time-sensitive market sizing, competitor tracking, funding landscape, or regulatory research that needs direct sources and dates.
- **`pptx` / `docx` / `xlsx` after this skill** when the final output must be a presentation, document, or spreadsheet file.
- **Execution workflows after this skill** when the business direction is chosen and the user wants implementation rather than planning.

## Workflow Routing

Detect the user's intent and route to the appropriate workflow. If unclear, ask.

| Workflow | Triggers | Reference |
|----------|----------|-----------|
| **Full Business Plan** | "write a business plan", "create a business plan", "business plan for X" | `references/business-plan-workflow.md` |
| **Financial Analysis** | "analyze financials", "P&L review", "cash flow", "financial health", "unit economics" | `references/financial-analysis.md` |
| **Market Analysis** | "market size", "TAM", "competitive landscape", "market research", "industry analysis" | `references/market-analysis.md` |
| **Pitch Deck** | "pitch deck", "investor presentation", "fundraising deck" | `references/pitch-deck.md` |
| **Strategic Review** | "strategic review", "SWOT", "competitive position", "strategic options" | `references/strategic-review.md` |
| **Valuation** | "value the company", "valuation", "what's it worth", "how much is my business worth" | `references/valuation.md` |

When the request spans multiple workflows (e.g., "business plan with detailed financials and a pitch deck"), execute them in logical sequence — plan first, then specialized outputs.
If the request spans adjacent skills too, run the least surprising sequence: `deep-research` -> `business-plan` -> `pptx` / `docx` / `xlsx` when needed.

### Context-Specific References

These references layer on top of any workflow when the context applies. Read them alongside the primary workflow reference.

| Context | When to Read | Reference |
|---------|-------------|-----------|
| **China Fundraising** | User targets Chinese investors, RMB funds, or dual-market (China + US) fundraising | `references/cn-fundraising.md` |
| **AI/Agent Industry** | User is building an AI or Agent business | `references/ai-agent-industry.md` |
| **Modern Frameworks** | Lean Canvas, Value Proposition Canvas, Blue Ocean tools, OKR planning, JTBD | `references/frameworks.md` |

## Interaction Model

Use the platform's standard interactive question mechanism when follow-up input is needed. Keep the canonical skill platform-neutral; projections can map this behavior to the surface-specific question tool.

**Language**: Respond in the same language the user uses. All user-facing output follows the user's language. Skill internals are English.

## Evidence And Freshness

The reference files in this skill provide durable frameworks, checklists, and output structures. They do **not** replace current evidence.

- For market size, growth rates, benchmarks, competitor status, pricing, funding climate, regulatory requirements, and valuation multiples, verify current facts with up-to-date sources and include dates.
- If the user asks for a fast draft without research, clearly label stale or unverified numbers as assumptions rather than facts.
- Treat legal, securities, tax, and compliance content as business guidance only. Explain business implications, but recommend professional review for definitive decisions.

## Core Process

Every workflow follows this adaptive process. The depth scales to the task — a quick market sizing does not need the same ceremony as a full business plan.

### Step 1: Detect Stage and Scale

Before gathering information, classify the business context. This shapes which questions to ask and how deep to go.

**Business stage:**

| Stage | Signals | Adaptation |
|-------|---------|------------|
| **Idea** | No product, no revenue, exploring concepts | Focus on problem validation, market opportunity, Lean Canvas. Financials are rough estimates only. |
| **Pre-revenue** | Product exists or in development, no paying customers | Focus on go-to-market, customer discovery, MVP metrics. Bottom-up financial projections. |
| **Early Revenue** | Some customers, finding product-market fit | Focus on unit economics, growth levers, scaling strategy. Real data replaces assumptions. |
| **Growth** | Revenue growing, scaling operations | Focus on efficiency, competitive moats, team building, fundraising readiness. Full financial modeling. |
| **Mature** | Stable revenue, optimizing profitability | Focus on strategic review, diversification, valuation, exit planning. DCF and comparables. |

**Business scale:**

| Scale | Adaptation |
|-------|------------|
| **Solopreneur** | Emphasize automation, time leverage, single-person dependency risks. Operations plan centers on personal capacity. |
| **Small team (2-10)** | Emphasize role clarity, hiring plan, team risks. Lighter process. |
| **Startup (10-50)** | Full startup frameworks — fundraising, burn rate, runway. Investor-ready formats. |
| **SME / Enterprise** | Multi-department considerations, governance, board reporting formats. |

If the user does not state their stage and scale, infer from context or ask directly.

### Step 2: Gather Context

Ask targeted questions to fill gaps. Do not dump a questionnaire — adapt questions based on what the user has already shared and what the chosen workflow needs.

**Universal questions** (ask what is missing):
1. What does your business do? (one sentence)
2. What problem does it solve, and for whom?
3. How do you make money (or plan to)?
4. What stage are you at? (use the stage table above)
5. What is this plan for? (personal clarity, investors, partners, bank loan, internal alignment)

**Workflow-specific questions** are detailed in each reference file. Read the relevant reference before asking additional questions.

**Interaction style:**
- For quick/focused requests (market sizing, specific financial question): batch 2-3 questions, get answers, deliver.
- For comprehensive work (full business plan, strategic review): one question at a time, build understanding incrementally.
- When the user provides a document, data, or existing plan: analyze what exists before asking questions. Focus on gaps.
- When the answer depends on current external facts: verify the facts first or make the uncertainty explicit before you build a polished narrative on top of them.

### Step 3: Analyze and Generate

Read the relevant reference file and follow its specific structure and guidance. Key principles apply across all workflows:

**Honesty over optimism.** Every claim in a business plan should be backed by data, logic, or clearly labeled as an assumption. Projections are guesses — label them as such. Include conservative and optimistic scenarios. The conservative scenario should still be a viable business.

**Quantify everything possible.** "Large market" means nothing. "$4.2B TAM growing at 12% CAGR" means something. "Strong team" means nothing. "CTO built the payments system at Stripe that processes $1T annually" means something.

**Surface risks early.** Identifying risks does not weaken the plan — it demonstrates clear thinking. Pretending competitors are weak or risks do not exist makes the plan less credible, not more.

**Show the math.** "Year 1 revenue: $500K" without underlying logic is useless. Show: customer count × price × conversion rate = revenue. Bottom-up beats top-down.

**Challenge assumptions.** Before generating output, consider: Is this the right problem? What happens if we do nothing? Is there a simpler approach? Are we solving for the confirmed need or hypothetical future needs?

**Use fresh evidence for time-sensitive claims.** Current market share, regulatory posture, investor sentiment, funding comparables, pricing, and valuation ranges should be sourced, dated, and framed with an appropriate confidence level.

**Keep business guidance separate from professional advice.** You can explain the business impact of a VIE structure, fundraising path, or compliance burden, but do not present legal or tax conclusions as definitive.

### Step 4: Quality Check

Before delivering output, verify against the workflow-specific quality checklist in the reference file. Universal checks:

- [ ] Executive summary stands alone — someone reading only it understands the whole picture
- [ ] All claims backed by data, logic, or clearly marked as assumptions
- [ ] Time-sensitive claims are sourced and dated
- [ ] Financial projections are internally consistent and show the math
- [ ] Competitive analysis is honest — acknowledges competitor strengths
- [ ] Risks identified with specific mitigations
- [ ] Legal, regulatory, and fundraising guidance is framed with appropriate caveats
- [ ] Output matches the stated purpose (investor deck ≠ personal planning doc)

### Step 5: Deliver and Advise

Deliver the output in the requested format. Then provide practical next-step advice:

- What to validate first (highest-risk assumptions)
- What data to gather to strengthen weak sections
- Which current facts still need verification or fresher sourcing
- When to update the plan (monthly for first 6 months, quarterly after)
- Who to share it with for feedback

## Output Format Options

The same underlying analysis can be delivered in multiple formats. Ask which format the user wants, or default based on context:

| Format | When to use | Length |
|--------|------------|--------|
| **Full Business Plan** | Investors, bank loans, comprehensive planning | 15-30 pages |
| **Lean Plan** | Internal clarity, early stage, fast iteration | 3-5 pages |
| **Executive One-Pager** | Quick pitch, board summary, partner intro | 1 page |
| **Pitch Deck Outline** | Fundraising preparation | 12-15 slides outlined |
| **Canvas View** | Visual strategy mapping (BMC, Lean Canvas, VPC) | Single-page canvas |

If the user asks for the actual `.pptx`, `.docx`, or `.xlsx`, finish the business reasoning and outline here first, then hand off final file production to the artifact-specific skill.

## Common Mistakes to Avoid

Surface these when relevant — they are the most frequent failure modes:

- **Writing once and filing away.** A plan that does not evolve with reality is fiction. Update it as assumptions are validated or disproven.
- **Not distinguishing assumptions from facts.** Every unverified claim should be labeled. When reality proves it right or wrong, update explicitly.
- **Projections without math.** Revenue projections must show the drivers: customer count, price, conversion rates, churn.
- **Burying competitive analysis.** Name competitors' real strengths. Explain specifically why you win despite them.
- **Keeping it private.** Show the plan to 2-3 trusted people. Outside eyes catch the blind spots you cannot see.
- **Treating the plan as the goal.** The plan drives decisions and action. A polished 30-page document with no customers is a well-documented failure.

## Plan Maintenance

For users creating a living business plan (not a one-time document):

- **Update monthly** during the first 6 months, quarterly after.
- **Mark assumptions clearly.** When reality proves one right or wrong, update it and note what changed.
- **Version it.** Keep old versions. Comparing your plan from 3 months ago to today reveals how your forecasting improves.
- **Track what changed and why.** This builds institutional memory even for solopreneurs.

## Reference Files

Each workflow has a dedicated reference file with detailed structure, frameworks, output templates, and quality checklists. Read the relevant file before generating output, but treat those references as reusable frameworks rather than authoritative current facts.

| File | Contents |
|------|----------|
| `references/business-plan-workflow.md` | Full business plan structure, section-by-section guidance, information gathering checklist |
| `references/financial-analysis.md` | P&L analysis, cash flow, balance sheet, unit economics, ratio analysis, benchmarks, red flags |
| `references/market-analysis.md` | TAM/SAM/SOM methodology, competitive matrix, Porter's Five Forces, PESTEL, research sources |
| `references/pitch-deck.md` | Slide-by-slide structure, storytelling arc, visual guidelines, delivery tips |
| `references/strategic-review.md` | SWOT analysis, TOWS matrix, competitive positioning, moat analysis, strategic options evaluation |
| `references/valuation.md` | DCF, comparables, precedent transactions, venture method, scorecard, adjustments |
| `references/frameworks.md` | Lean Canvas, Value Proposition Canvas, Blue Ocean tools, OKR planning, Jobs-to-be-Done |
| `references/cn-fundraising.md` | China fundraising: BP format, VIE structure, valuation language, policy compliance, government resources, exit paths |
| `references/ai-agent-industry.md` | AI/Agent industry: inference cost economics, AI moat framework, platform risk, regulatory landscape, investor Q&A |
