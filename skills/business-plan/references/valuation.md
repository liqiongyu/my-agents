# Valuation

Business valuation methodologies for fundraising, M&A, strategic planning, or internal assessment.

## Table of Contents
- [Context and Method Selection](#context-and-method-selection)
- [Valuation Methods](#valuation-methods)
- [Adjustments](#adjustments)
- [Output Template](#output-template)
- [Quality Checklist](#quality-checklist)

## Context and Method Selection

### Key Questions First
1. **Purpose**: Fundraising? Sale? Internal planning? Estate?
2. **Stage**: Pre-revenue? Early revenue? Growth? Mature?
3. **Type**: SaaS? Service? Product? Asset-heavy?
4. **Control**: Minority stake? Majority? 100%?
5. **Liquidity**: Public? Private? Restricted shares?

### Method Selection by Stage

| Stage | Primary Method | Secondary |
|-------|---------------|-----------|
| Pre-revenue | Venture Method, Scorecard | Comparables |
| Early Revenue | Revenue Multiples | Venture Method |
| Growth | Revenue/EBITDA Multiples | DCF |
| Mature | DCF, EBITDA Multiples | Asset-based |
| Distressed | Asset-based, Liquidation | DCF |

Always use at least two methods and triangulate. A single-method valuation is an opinion, not an analysis.

## Valuation Methods

### 1. Comparable Company Analysis (Comps)

**Process:**
1. Identify 5-10 comparable public or recently-funded companies
2. Calculate relevant multiples
3. Apply to target company metrics
4. Adjust for size, growth rate, and risk differences

**Common Multiples:**

| Multiple | When to Use | Typical Range |
|----------|-------------|---------------|
| EV/Revenue | High growth, unprofitable | 1-20x |
| EV/EBITDA | Profitable, established | 5-15x |
| P/E | Mature, stable earnings | 10-25x |
| EV/ARR | SaaS businesses | 5-15x |
| Price/Book | Asset-heavy, financial services | 1-3x |

**SaaS-Specific Multiples:**
- ARR Multiple: Enterprise Value / Annual Recurring Revenue
- Rule of 40: Revenue Growth % + EBITDA Margin % (>40 is strong)
- NTM Revenue Multiple: Based on next twelve months projected revenue

### 2. Precedent Transactions

**Process:**
1. Find relevant M&A transactions from the last 3-5 years
2. Calculate transaction multiples
3. Adjust for market conditions and strategic premium
4. Apply to target

**Control Premium**: Typically 20-40% above trading price. Higher for strategic buyers, lower in competitive auctions.

**Sources**: PitchBook, Crunchbase (private), SEC filings (public), press releases, industry reports.

### 3. Discounted Cash Flow (DCF)

Best suited for businesses with predictable cash flows. Less reliable for pre-revenue or highly volatile businesses.

**Framework:**
```
Enterprise Value = Sum of (FCF_t / (1+WACC)^t) + Terminal Value / (1+WACC)^n
```

**Steps:**

1. **Project Free Cash Flow** (5-10 years)
   - Revenue projections (conservative base case)
   - Operating margins (trending toward industry norms)
   - Working capital changes
   - Capital expenditures

2. **Determine Discount Rate (WACC)**
   ```
   WACC = (E/V × Re) + (D/V × Rd × (1-T))
   Where:
   E = Market value of equity
   D = Market value of debt
   V = E + D
   Re = Cost of equity (CAPM)
   Rd = Cost of debt (interest rate)
   T = Tax rate
   ```
   For startups without debt, WACC simplifies to cost of equity. Use risk-adjusted rates: 20-40% for early stage, 15-25% for growth, 8-15% for mature.

3. **Calculate Terminal Value** (two methods, use both):
   - Gordon Growth: FCF_final × (1+g) / (WACC - g)
   - Exit Multiple: Final year EBITDA × industry multiple

4. **Sensitivity Analysis** — Create matrix varying WACC and terminal growth rate. This is not optional. A DCF without sensitivity analysis is a single-scenario fiction.

### 4. Venture Capital Method

For pre-revenue and early-stage companies.

```
Post-Money Valuation = Exit Value / Target Return Multiple
Pre-Money = Post-Money - Investment Amount

Where:
Exit Value = Projected Revenue at Exit × Expected Multiple
Target Return = 10-30x for early stage, 3-5x for later stage
```

**Example:**
```
Year 5 Revenue: $10M
Exit Multiple: 5x revenue
Exit Value: $50M
Required Return: 10x
Post-Money Valuation: $5M
Investment: $500K
Pre-Money: $4.5M
```

### 5. Scorecard Method (Angel/Seed)

Compare to average pre-money valuation for the region and stage, then adjust:

| Factor | Adjustment Range | Weight |
|--------|-----------------|--------|
| Team Quality | 0.5-1.5x | 30% |
| Market Size | 0.5-1.5x | 25% |
| Product/Technology | 0.5-1.5x | 15% |
| Competition | 0.5-1.5x | 10% |
| Partnerships/Traction | 0.5-1.5x | 10% |
| Need for Additional Funding | 0.5-1.5x | 10% |

Multiply weighted adjustments by average valuation for the stage.

### 6. Asset-Based Valuation

For asset-heavy businesses, distressed situations, or floor values.

- **Book Value**: Total Assets - Total Liabilities
- **Adjusted Book Value**: Mark assets to fair market value, add unrecorded intangibles, adjust for contingent liabilities
- **Liquidation Value**: Forced sale discounts (typically 20-50%) minus transaction costs

## Adjustments

### Discounts

| Discount | Typical Range | When Applied |
|----------|---------------|--------------|
| Lack of Marketability | 15-35% | Private companies (no liquid market) |
| Minority Interest | 15-25% | Non-controlling stake |
| Key Person | 5-20% | Heavy founder dependency |
| Customer Concentration | 5-15% | >20% revenue from single customer |

### Premiums

| Premium | Typical Range | When Applied |
|---------|---------------|--------------|
| Control | 20-40% | Acquiring majority control |
| Strategic | 10-50% | Synergy value to acquirer |
| Scarcity | Variable | Unique assets, IP, or market position |

## Output Template

```
VALUATION ANALYSIS: [Company Name]
Date: [Analysis Date]
Purpose: [Fundraising / Sale / Internal]

EXECUTIVE SUMMARY
Valuation Range: $X.XM - $X.XM
Midpoint: $X.XM
Primary Method: [Method]

COMPANY SNAPSHOT
Revenue: $X.XM (Growth: X%)
EBITDA: $X.XM (Margin: X%)
Stage: [Stage]
Key Assets: [IP, customers, team, data, brand]

COMPARABLE COMPANIES
| Company | Revenue | EV/Rev | EV/EBITDA |
|---------|---------|--------|-----------|
| Comp A  | $XXM    | X.Xx   | X.Xx      |
| Comp B  | $XXM    | X.Xx   | X.Xx      |
| Mean    |         | X.Xx   | X.Xx      |
| Median  |         | X.Xx   | X.Xx      |

Applied Multiple: X.Xx (adjusted for [factors])
Implied Value: $X.XM

DCF ANALYSIS (if applicable)
WACC: X.X%
Terminal Growth: X.X%
Enterprise Value: $X.XM

Sensitivity Matrix:
        | Growth 2% | 3% | 4% |
WACC 10%|           |    |    |
WACC 12%|           |    |    |
WACC 14%|           |    |    |

ADJUSTMENTS
Base Value: $X.XM
- [Discount/Premium] (X%): +/- $X.XM
Adjusted Value: $X.XM

VALUATION SUMMARY
| Method | Value |
|--------|-------|
| Comps (Revenue) | $X.XM |
| Comps (EBITDA) | $X.XM |
| DCF | $X.XM |
| Precedent Transactions | $X.XM |
| Weighted Average | $X.XM |

KEY ASSUMPTIONS & RISKS
- [Assumption with sensitivity impact]
- [Risk with impact on value]

RECOMMENDATIONS
[Negotiation strategy, value drivers to highlight, weaknesses to address]
```

## Quality Checklist

- [ ] Multiple valuation methods used for triangulation
- [ ] Comparables are truly comparable (industry, stage, geography)
- [ ] DCF assumptions clearly stated and reasonable
- [ ] Sensitivity analysis on key assumptions
- [ ] Appropriate discounts/premiums applied with justification
- [ ] Range provided, not a single point estimate
- [ ] Limitations of each method acknowledged
- [ ] Output matches the stated purpose (fundraising vs. internal differs)
