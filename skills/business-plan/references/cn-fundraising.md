# China Fundraising Guide

Fundraising in China follows different norms, structures, and investor expectations compared to the US/EU. Read this reference when the user is targeting Chinese investors, RMB funds, or dual-market (China + US) fundraising.

## Table of Contents
- [BP Format Differences](#bp-format-differences)
- [Legal and Corporate Structure](#legal-and-corporate-structure)
- [Valuation Language](#valuation-language)
- [Track Narrative (赛道叙事)](#track-narrative)
- [Policy and Compliance](#policy-and-compliance)
- [Government Resources](#government-resources)
- [Exit Paths](#exit-paths)
- [Investor Expectations](#investor-expectations)
- [Dual-Market Fundraising](#dual-market-fundraising)

## BP Format Differences

Chinese investors typically expect a 商业计划书 (Business Plan) that differs from the US-style pitch deck:

| Dimension | US Style | China Style |
|-----------|----------|-------------|
| Format | 10-15 slide deck | 20-30 page document or 20+ slide deck |
| Data density | Sparse, one point per slide | Dense, multiple data points per page |
| Narrative style | Story arc (problem → solution → ask) | Track logic (赛道 → timing → team → product) |
| Financial depth | High-level in deck, detail in appendix | Detailed financials inline, especially unit economics |
| Team section | Brief, last third of deck | Often prominent, emphasizes founder background, resources, and connections (资源整合能力) |
| Market sizing | TAM/SAM/SOM | 赛道天花板 (track ceiling) + penetration rate logic |
| Policy section | Minimal or absent | Critical — policy tailwinds are investment thesis drivers |

### Recommended Structure for Chinese Investors

1. **赛道分析** (Track/Sector Analysis) — Why this sector, why now, policy tailwinds
2. **行业痛点** (Industry Pain Points) — Specific, quantified, with customer evidence
3. **产品与解决方案** (Product & Solution) — Demo, screenshots, user flow
4. **商业模式** (Business Model) — Revenue model, pricing, unit economics
5. **竞争格局** (Competitive Landscape) — Positioning matrix, differentiation
6. **核心壁垒** (Core Barriers/Moat) — What makes you defensible
7. **团队介绍** (Team) — Founder background, relevant experience, key hires
8. **运营数据** (Operating Metrics) — Traction, growth, retention
9. **财务预测** (Financial Projections) — 3-year P&L, key assumptions
10. **融资计划** (Fundraising Plan) — Amount, use of funds, milestones, valuation expectation

### Tone Differences

Chinese BPs tend to be more assertive about market opportunity and more detailed about execution capability. The "honesty about risks" principle still applies, but the framing is different — present risks with clear mitigation plans rather than open-ended acknowledgments. Chinese investors interpret excessive risk disclosure as lack of confidence, not intellectual honesty. Balance is key.

## Legal and Corporate Structure

### Common Structures

**USD Fund (美元基金) Path:**
- Cayman Islands holding company (top)
- Hong Kong intermediate entity
- WFOE (Wholly Foreign-Owned Enterprise) in China
- VIE structure if in restricted sectors (including AI/data)
- Target exit: US IPO (NASDAQ/NYSE) or HK IPO

**RMB Fund (人民币基金) Path:**
- Domestic Chinese company (境内公司)
- Simpler structure, faster setup
- Target exit: A-share IPO (科创板/创业板/北交所) or M&A
- Cannot easily accept USD investment later without restructuring

**Dual Structure (红筹架构):**
- Offshore holding + onshore operating entity
- Accepts both USD and RMB investment
- Most flexible but most complex
- Required for most AI companies that want to keep both options open

### VIE Structure (Variable Interest Entity)

Required when foreign investment is restricted in the sector. AI companies often need VIE because:
- Data processing and AI services may fall under restricted categories
- Telecom value-added services (ICP license) require VIE
- Algorithm filing (算法备案) requires a domestic entity

**Key investor question:** "Is your VIE structure compliant and will it survive regulatory scrutiny?" Have a clear answer with legal backing.

### Key Legal Considerations
- **Intellectual property ownership** — Must be held or licensed to the correct entity in the structure
- **Data localization** — Chinese data must stay in China (Data Security Law, PIPL)
- **Foreign exchange controls** — Moving money between onshore and offshore requires SAFE approval
- **Anti-monopoly filing** — Required for investments above certain thresholds

## Valuation Language

Chinese investors use different multiples and benchmarks:

| Stage | Common Approach | Notes |
|-------|----------------|-------|
| Angel/Seed | Post-money negotiation based on comparable deals | Less formula-driven, more "what did similar companies raise at" |
| Pre-A / A Round | PS (Price-to-Sales) or revenue multiple | If pre-revenue: team + track + product stage |
| B Round+ | PS, PE (Price-to-Earnings) | Profitability path matters more than in US |
| Pre-IPO | PE multiple benchmarked to public comps | Discount to public market PE (typically 30-50% IPO discount) |

### China-Specific Valuation Considerations

- **赛道溢价** (Track premium): Hot sectors command higher multiples. AI is currently premium but with increasing scrutiny on revenue quality.
- **政策红利折价/溢价**: Government support = premium. Regulatory risk = discount.
- **数据资产估值**: Proprietary datasets are increasingly valued as distinct assets in China.
- **对赌协议** (VAM — Valuation Adjustment Mechanism): Common in China. Investors may require founders to guarantee performance targets; failure to meet them triggers equity adjustment or buyback obligation. Negotiate carefully — aggressive VAM terms are a leading cause of founder distress.

## Track Narrative

Chinese investors think in terms of 赛道 (tracks/sectors). A strong track narrative answers:

1. **赛道有多大？** (How big is the track?) — Total market size with growth trajectory
2. **为什么是现在？** (Why now?) — Policy tailwinds, technology inflection, demand shift
3. **赛道格局如何？** (What does the competitive landscape look like?) — Fragmented vs. consolidated, who are the players
4. **你在赛道中的位置？** (Where are you positioned?) — Upstream/downstream, platform vs. vertical
5. **终局是什么？** (What is the endgame?) — Where does this track converge in 5-10 years

### Building the Track Narrative

Map the industry value chain:

```
上游 (Upstream)          中游 (Midstream)         下游 (Downstream)
基础设施/技术供给        产品/平台/解决方案        终端用户/应用场景
───────────────         ─────────────────        ──────────────────
芯片、算力、模型         AI 应用、Agent 平台       企业客户、消费者
```

Position your company on this chain. Chinese investors want to understand where value accrues and whether you are at a defensible point in the chain.

## Policy and Compliance

### AI-Specific Regulations in China

| Regulation | Key Requirements | Impact |
|------------|-----------------|--------|
| 生成式AI管理暂行办法 (Interim Measures for Generative AI) | Algorithm filing, content safety, training data compliance | Must file before public launch |
| 算法推荐管理规定 (Algorithm Recommendation Regulations) | Algorithm transparency, user opt-out rights | Affects recommendation/personalization features |
| 数据安全法 (Data Security Law) | Data classification, cross-border transfer restrictions | Data cannot leave China without assessment |
| 个人信息保护法 (PIPL) | Consent, data minimization, individual rights | Similar to GDPR but with China-specific requirements |
| 网络安全法 (Cybersecurity Law) | Network security, data localization, security reviews | Foundation for all above regulations |

### Compliance Checklist for AI Companies

- [ ] Algorithm filing (算法备案) completed or in progress
- [ ] Generative AI service filing if applicable
- [ ] ICP license for internet content services
- [ ] Data security assessment for cross-border data transfer
- [ ] Privacy policy compliant with PIPL
- [ ] Content moderation system in place
- [ ] Training data audit for compliance

### How to Present Compliance to Investors

Do not treat compliance as a risk section item only. Frame it as a **barrier to entry** — your compliance infrastructure is an asset that competitors must replicate. Completed filings demonstrate execution capability and reduce investor risk.

## Government Resources

Government support is a real and significant factor in China. Include in your plan if applicable:

### Types of Government Support

| Type | Typical Value | How to Access |
|------|--------------|---------------|
| 高新技术企业认定 (HNTE) | 15% corporate tax rate (vs. 25%) | Apply through local science & technology bureau |
| 专精特新 (Specialized and Innovative SME) | Tax benefits, procurement priority | Provincial/national level designation |
| 产业园区补贴 (Industrial Park Subsidies) | Rent discounts, cash grants, talent subsidies | Negotiate with specific parks |
| 政府引导基金 (Government Guidance Funds) | Direct investment, often at favorable terms | Through fund managers, usually requires local presence |
| 科技项目资金 (S&T Project Funding) | Project grants, typically RMB 500K-10M | Apply through relevant ministries |
| 人才计划 (Talent Programs) | Cash grants, housing subsidies for key hires | Local government HR bureaus |

### Investor Relevance

Chinese investors view government support as:
- Validation of the business direction
- A real revenue/cost reduction source
- A signal that the founding team has 资源整合能力 (resource integration capability)

Include government support in your financial projections when it is confirmed or highly likely. Label pending applications as assumptions.

## Exit Paths

| Exit Path | Timeline | Key Requirements | Typical Multiples |
|-----------|----------|------------------|-------------------|
| **科创板 (STAR Market)** | 3-5 years | Tech focus, R&D spending >15% of revenue, independent IP | PE 30-80x |
| **创业板 (ChiNext)** | 3-5 years | Growth + profitability, 2 years of profit | PE 25-50x |
| **北交所 (BSE)** | 2-4 years | SME-friendly, lower thresholds | PE 15-30x |
| **港股 (HKEX)** | 2-4 years | No profit requirement (Chapter 18A for biotech, 18C for tech) | PE 15-40x |
| **美股 (NASDAQ/NYSE)** | 3-5 years | USD structure required, geopolitical risk | PS 5-15x for AI |
| **并购 (M&A)** | Any time | Strategic fit, often by larger tech companies | Negotiated, typically 3-10x revenue |

### Current Considerations (2025-2026)

- US-China tensions create uncertainty for US IPO path — dual-listing (HK + A-share) is increasingly preferred
- 科创板 is the most natural exit for AI companies but has tightened listing requirements
- M&A activity is increasing as larger companies acquire AI capabilities

## Investor Expectations

### What Chinese Investors Specifically Look For

**1. 创始人背景 (Founder Profile)**
- Technical depth in AI/ML (publications, patents, industry experience)
- Relevant industry connections
- Prior startup or management experience
- 资源整合能力 — ability to pull together government, industry, and talent resources

**2. 核心壁垒 (Core Barriers)**
Chinese investors ask "壁垒是什么" (what are your barriers) more directly and earlier than US investors. Prepare a clear answer that goes beyond "our team is great":
- Proprietary data assets
- Technical moat (algorithms, models, patents)
- Customer lock-in and switching costs
- Regulatory compliance as a barrier
- Distribution and partnership advantages

**3. 商业化能力 (Commercialization Ability)**
China market is skeptical of "growth at all costs" since the internet bubble correction. Investors want to see:
- Clear path to revenue, ideally already generating
- Willingness-to-pay evidence from real customers
- Unit economics that work or a clear path to making them work

**4. 对标 (Benchmarking)**
Chinese investors often ask "你对标谁？" (who is your comparable?). Have an answer ready — a company (Chinese or global) that provides reference for your business model and potential scale. But also be ready to explain why the comparison breaks down.

## Dual-Market Fundraising

If raising from both US and China investors:

**Structure**: Offshore holding (Cayman) with onshore VIE is the standard playbook.

**Narrative adaptation**: You will need two versions of your materials:
- English deck for US investors: emphasize global TAM, technology differentiation, team pedigree
- Chinese BP for RMB investors: emphasize 赛道, policy tailwinds, 商业化 traction, local market opportunity

**Key tension**: US investors want global ambition; Chinese investors want China-first execution. Frame it as "dominate China market first, expand globally with proven playbook."

**Data room**: Maintain separate data rooms with jurisdiction-appropriate legal documents, financial statements, and compliance materials.
