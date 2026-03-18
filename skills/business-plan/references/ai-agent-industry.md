# AI/Agent Industry Guide

Industry-specific guidance for AI and Agent companies. Read this reference when the user is building an AI/Agent business — the economics, moats, risks, and investor questions differ structurally from traditional software.

## Table of Contents
- [AI Cost Economics](#ai-cost-economics)
- [AI-Specific Moat Framework](#ai-specific-moat-framework)
- [Platform Risk](#platform-risk)
- [Competitive Landscape Dynamics](#competitive-landscape-dynamics)
- [Market Sizing for AI](#market-sizing-for-ai)
- [AI Regulatory Landscape](#ai-regulatory-landscape)
- [Investor Questions Checklist](#investor-questions-checklist)
- [AI Financial Modeling](#ai-financial-modeling)
- [Positioning Strategy](#positioning-strategy)

## AI Cost Economics

Traditional COGS frameworks do not capture AI cost structure well. AI companies have a distinct cost profile that directly affects unit economics, gross margins, and scalability.

### Inference Cost Structure

```
Total Cost per Task/Query
├── Model API cost (tokens in + tokens out × price per token)
│   ├── Prompt tokens (input context)
│   └── Completion tokens (generated output)
├── Orchestration overhead
│   ├── Agent loop iterations (multi-step reasoning)
│   ├── Tool calls (search, code execution, API calls)
│   └── Memory/context management
├── Infrastructure
│   ├── Compute (GPU/CPU for self-hosted models)
│   ├── Storage (vector DB, conversation history, artifacts)
│   └── Networking (API calls to external services)
└── Human-in-the-loop (if applicable)
    ├── Quality review
    └── Edge case handling
```

### Key Metrics for AI Unit Economics

| Metric | Definition | Why It Matters |
|--------|-----------|----------------|
| Cost per task | Total cost to complete one user task | Core unit economics driver |
| Value per task | Revenue or value created per task | Must exceed cost for viable business |
| Value/Cost ratio | Value created ÷ Cost incurred | >3x for healthy AI business |
| Token efficiency | Useful output tokens / Total tokens consumed | Measures prompt engineering effectiveness |
| Task completion rate | Successfully completed / Total attempted | Quality metric that affects retention |
| Automation rate | Tasks completed without human intervention / Total | Determines scalability ceiling |
| Gross margin trajectory | Gross margin over time as costs decrease | AI margins should improve — if not, investigate |

### Cost Optimization Levers

1. **Model selection**: Use the cheapest model that meets quality requirements. Route simple tasks to smaller models, complex tasks to larger ones.
2. **Prompt optimization**: Reduce token count without losing quality. Cached prompts, compressed context.
3. **Caching and deduplication**: Cache common queries and intermediate results.
4. **Batching**: Batch non-real-time tasks for cost efficiency.
5. **Fine-tuning**: Custom models can be smaller and cheaper for specific tasks.
6. **Self-hosting**: At scale, self-hosted models can be cheaper than API — but the crossover point matters.

### Gross Margin Benchmarks for AI Companies

| Business Type | Current Typical GM | Target GM (at scale) |
|---------------|-------------------|---------------------|
| AI API / Model provider | 50-70% | 70-85% |
| AI SaaS (API-dependent) | 40-60% | 60-75% |
| AI Agent / Workflow automation | 30-55% | 55-70% |
| AI Professional Services | 25-45% | 40-55% |
| AI + Hardware | 20-40% | 35-50% |

Note: AI gross margins are generally lower than traditional SaaS (70-85%) due to inference costs. Investors understand this — but they want to see a clear path to margin improvement as you scale.

## AI-Specific Moat Framework

Traditional moat analysis (network effects, switching costs, etc.) applies but needs AI-specific augmentation. The central question investors ask: **"What happens when OpenAI/Google/Anthropic builds your feature?"**

### AI Moat Types

**1. Data Flywheel**
The strongest AI moat. Your product generates data that improves the model, which improves the product, which generates more data.

- Strength test: Is the data proprietary (only you can collect it)? Does it compound over time? Is it expensive to replicate?
- Strong example: Every customer interaction teaches the system domain-specific patterns that competitors cannot observe.
- Weak example: Fine-tuning on publicly available data — anyone can do this.

**2. Workflow Integration Depth**
How deeply embedded you are in the customer's daily work process.

- Strength test: How many steps does a customer need to replace you? Is your product the system of record for something important?
- Strong example: AI agent that manages end-to-end business processes with custom integrations to customer's internal systems.
- Weak example: A chatbot that sits on top of a website and can be swapped in minutes.

**3. Domain Expertise Encoding**
Proprietary knowledge about a specific domain that is hard to replicate without deep industry experience.

- Strength test: Could a general-purpose AI achieve the same results with a good prompt? If yes, this is not a moat.
- Strong example: Regulatory compliance engine built on years of legal expert review and edge case handling.
- Weak example: "We have industry-specific prompts" — prompts are trivially copyable.

**4. Distribution and Relationships**
Access to customers that competitors cannot easily reach.

- Strength test: Do you have exclusive partnerships, embedded relationships, or regulatory advantages?
- Strong example: Pre-installed AI tool in a platform that serves 80% of the target market.
- Weak example: "We are first to market" — being first is not a moat.

**5. Compound Intelligence**
The system gets meaningfully better over time in ways that are difficult to replicate from a standing start.

- Strength test: If a competitor started today with the same model and team, how long before they match your system's performance?
- Strong example: Multi-year accumulation of customer-specific knowledge, workflow patterns, and edge cases.
- Weak example: Prompt templates that improve with iteration — any team can iterate prompts.

### Moat Assessment for Investors

| Moat Type | Present? | Strength (1-5) | Time to Replicate | Evidence |
|-----------|----------|----------------|-------------------|----------|
| Data Flywheel | | | | |
| Workflow Integration | | | | |
| Domain Expertise | | | | |
| Distribution | | | | |
| Compound Intelligence | | | | |

Be honest. Most early-stage AI companies have weak moats. The plan should show how you build moats over time, not pretend they already exist.

## Platform Risk

Every AI company building on foundation models faces platform risk. Investors will ask about it. Have a clear, honest framework.

### Risk Categories

**1. Model Provider Dependency**
- What happens if your primary model provider raises prices 5x?
- What happens if they deprecate the model version you depend on?
- What happens if they build your application as a native feature?
- What happens if they restrict access for competitive reasons?

**2. API Stability**
- How sensitive is your product to model behavior changes between versions?
- Do you have regression testing for model updates?
- Can you pin to specific model versions?

**3. Capability Commoditization**
- What you build today as a differentiator may become a default model capability tomorrow.
- Example: RAG-based Q&A over documents — once cutting-edge, now a commodity feature.

### Mitigation Strategies

| Strategy | Description | Trade-off |
|----------|-------------|-----------|
| Multi-model support | Abstract model layer, support multiple providers | Higher engineering cost, testing complexity |
| Value above the model | Build value in orchestration, data, and workflow — not raw model capability | Requires deeper product thinking |
| Self-hosted fallback | Fine-tuned open-source model as backup | Infra cost, capability gap |
| Contractual protection | Long-term API agreements with SLAs | May limit flexibility |
| Speed of execution | Stay ahead of platform features through rapid iteration | Not sustainable long-term alone |

### How to Present Platform Risk to Investors

Do not hide it — investors know it exists. Frame it as:
1. "We are aware of this risk and here is our mitigation strategy"
2. "Our value is in [X] which sits above the model layer"
3. "Model improvement actually helps us because [specific reason]"
4. "We are model-agnostic / can switch providers with [specific effort]"

## Competitive Landscape Dynamics

AI competitive landscapes move faster than any previous technology sector. A competitive analysis from 6 months ago may be obsolete.

### Layer-Based Competition

Map competitors by where they operate in the stack:

```
┌─────────────────────────────────────────┐
│          Application Layer              │  ← You might be here
│   Vertical AI products, AI agents       │
├─────────────────────────────────────────┤
│          Platform/Infra Layer           │
│   Orchestration, vector DBs, tooling   │
├─────────────────────────────────────────┤
│          Model Layer                    │
│   Foundation models, fine-tuned models  │
├─────────────────────────────────────────┤
│          Compute Layer                  │
│   GPU clouds, inference optimization   │
└─────────────────────────────────────────┘
```

Competition is fiercest within a layer and from the layer below (foundation model providers moving up into applications).

### AI Competitive Analysis Template

For each competitor:
1. **Layer position**: Where in the stack do they operate?
2. **Model strategy**: Own model, fine-tuned, API-dependent?
3. **Data advantage**: What proprietary data do they have?
4. **Distribution**: How do they reach customers?
5. **Funding and runway**: How well-resourced?
6. **Trajectory**: Expanding scope? Narrowing focus?
7. **Vulnerability**: Where are they weakest?

### Incumbents vs. Startups

Address the "why won't Google/Microsoft/big tech just do this?" question:
- Incumbents optimize for existing revenue streams, not new ones
- Startups move faster in specific verticals
- Enterprise incumbents have integration debt
- But: incumbents have distribution, data, and resources

The winning frame: "Incumbents will build horizontal AI features. We are building deep vertical AI that requires domain expertise they do not have and cannot acquire quickly."

## Market Sizing for AI

Traditional TAM/SAM/SOM is difficult for AI because the market is still forming. Use these adapted approaches:

### Value-Based Sizing

Instead of counting potential customers × price, calculate the value your AI creates and estimate what fraction you can capture.

```
Total addressable value = [Number of tasks performed annually]
                        × [Current cost per task (human labor)]
                        × [% cost reduction from AI]

Capturable value = Total addressable value × Capture rate (typically 10-30%)
```

**Example:**
```
100M customer support tickets/year in target segment
× $15 average human cost per ticket
× 60% cost reduction with AI
= $900M total addressable value

× 15% capture rate
= $135M addressable revenue
```

### Wedge-and-Expand Sizing

Size the initial wedge market (specific use case where you start), then map expansion paths:

```
Wedge market: $50M (specific AI code review for Python)
Adjacent expansion 1: +$200M (all languages)
Adjacent expansion 2: +$500M (full SDLC AI)
Platform play: +$2B (developer productivity platform)
```

Investors want to see a credible wedge (small enough to dominate) with a large expansion path (big enough to be interesting).

### Market Creation Framing

For genuinely new categories, traditional sizing fails. Use analogy-based sizing:
- "AI agents for X will be as transformative as SaaS was for Y. SaaS for Y is a $ZB market."
- This is inherently speculative — acknowledge it and complement with bottom-up analysis.

## AI Regulatory Landscape

### Global Regulatory Map (2025-2026)

| Jurisdiction | Key Regulation | Impact on AI Agents |
|-------------|---------------|---------------------|
| **China** | 生成式AI管理暂行办法, 算法备案 | Must file before public launch; content safety requirements |
| **EU** | AI Act (effective 2025-2026) | Risk-based classification; high-risk AI requires conformity assessment |
| **US** | Executive Order on AI, state-level bills | Federal guidelines + patchwork of state laws; sector-specific rules emerging |
| **UK** | Pro-innovation approach | Lighter touch, sector-specific regulation |

### Agent-Specific Regulatory Concerns

AI Agents raise unique regulatory questions because they act autonomously:

1. **Decision authority**: What decisions can the agent make without human approval?
2. **Liability**: Who is liable when an agent makes a mistake?
3. **Transparency**: Can users understand why the agent took an action?
4. **Data access**: What systems and data can the agent access?
5. **Containment**: How do you prevent unintended actions at scale?

These are not just compliance issues — they are product design decisions. Having thoughtful answers demonstrates maturity to investors and regulators.

### Compliance as Competitive Advantage

Frame regulatory readiness as a moat:
- Completed filings reduce time-to-market vs. new entrants
- Compliance infrastructure is expensive and time-consuming to build
- Enterprise customers require vendors to be compliant before procurement
- Regulatory relationships are a form of institutional knowledge

## Investor Questions Checklist

AI/Agent investors will ask these questions. Prepare clear answers for each.

### Technology
- [ ] What foundation models do you use and why?
- [ ] What is your model strategy? Own, fine-tune, or API?
- [ ] How do you handle model version changes and regressions?
- [ ] What is your fallback if your primary model provider changes terms?
- [ ] What proprietary technology have you built vs. what is commodity?

### Defensibility
- [ ] What data do you have that competitors do not?
- [ ] What happens when [biggest AI company] builds your feature?
- [ ] What is your moat today? What will it be in 2 years?
- [ ] How does your product get better over time in ways that are hard to replicate?

### Economics
- [ ] What is your cost per task/query?
- [ ] How does inference cost scale with usage?
- [ ] What is your gross margin, and what is the path to 60%+?
- [ ] What is the cost structure difference between your current scale and 10x scale?
- [ ] How do you manage the trade-off between model quality and cost?

### Market
- [ ] How big is the market if AI can solve this problem well?
- [ ] What is the wedge use case and why do you start there?
- [ ] What does the expansion path look like?
- [ ] What is the competitive landscape — not just today, but in 12 months?

### Risk
- [ ] What is your regulatory exposure? How are you addressing it?
- [ ] What happens if AI costs drop 10x? (This can be positive or negative)
- [ ] What happens if AI capabilities plateau for 2 years?
- [ ] What is the biggest technical risk in your approach?

### Team
- [ ] Why is this team uniquely qualified to build this AI product?
- [ ] What is your AI/ML hiring strategy?
- [ ] How do you stay current as the technology evolves rapidly?

## AI Financial Modeling

### Revenue Model Patterns for AI Companies

| Model | Description | When It Works |
|-------|-------------|---------------|
| **Usage-based** | Charge per task, query, token, or API call | When value scales linearly with usage |
| **Seat-based SaaS** | Monthly fee per user | When AI augments individual productivity |
| **Outcome-based** | Charge based on results achieved | When outcomes are measurable (cost saved, revenue generated) |
| **Hybrid** | Base subscription + usage overage | Most common for AI SaaS — predictable base + growth upside |
| **Platform/marketplace** | Take rate on AI-powered transactions | When you facilitate connections or transactions |

### AI-Specific Financial Projections

In addition to standard P&L projections, model these AI-specific dynamics:

**Cost curves:**
- Model API costs typically decrease 20-40% per year as providers compete and optimize
- Self-hosted inference costs decrease as hardware improves and optimization matures
- Build declining cost assumptions into projections — but be conservative (20% annual decrease, not 50%)

**Quality-cost trade-off:**
- Project scenarios where you use cheaper models for some tasks
- Model the impact on customer satisfaction and retention
- Show that you think about this trade-off explicitly

**Scaling dynamics:**
```
Revenue = Customers × Tasks per customer × Price per task
COGS = Customers × Tasks per customer × Cost per task
Gross Profit = Revenue - COGS
Gross Margin = Gross Profit / Revenue

Key insight: Gross margin improves if price per task stays stable
while cost per task decreases. Model this explicitly.
```

## Positioning Strategy

### The Positioning Spectrum for AI Companies

```
Horizontal                                          Vertical
(AI platform for everything)              (AI for one specific domain)

← Higher TAM, more competition, harder to differentiate →
← Lower TAM, less competition, deeper moat, easier PMF →
```

Most successful AI startups start vertical and expand horizontal. Present your positioning as:
1. **Today**: Deep vertical focus in [specific domain]
2. **Phase 2**: Adjacent verticals with shared technology
3. **Vision**: Platform that serves multiple verticals

### Narrative Frameworks for AI Positioning

**"AI-native" frame:**
"We built this from scratch for AI, not bolted AI onto legacy software. This means [specific architectural advantage]."

**"Domain expert + AI" frame:**
"We combine deep [domain] expertise with AI capabilities. A pure AI company cannot replicate our domain knowledge, and a pure domain company cannot replicate our AI stack."

**"Infrastructure" frame:**
"We are building the picks and shovels for the AI gold rush. We win regardless of which application-layer companies succeed."

**"Data moat" frame:**
"Our product generates [specific data] that no one else has access to. This data makes our AI better, which attracts more users, which generates more data."

Choose the frame that most honestly describes your actual advantage. Investors see through borrowed narratives quickly.
