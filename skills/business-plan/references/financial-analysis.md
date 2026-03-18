# Financial Analysis

Rigorous analysis of financial statements and business performance. Use when the user has financial data to analyze or needs to build financial models.

## Table of Contents
- [Analysis Framework](#analysis-framework)
- [Red Flags Checklist](#red-flags-checklist)
- [Industry Benchmarks](#industry-benchmarks)
- [Output Template](#output-template)
- [Quality Checklist](#quality-checklist)

## Analysis Framework

### Step 1: Data Collection

Request or identify:
- Income statement (P&L) — 2-3 years if available
- Balance sheet — 2-3 years if available
- Cash flow statement
- Industry/sector for benchmarking
- Business stage (startup, growth, mature)

### Step 2: Profitability Analysis

**Revenue Quality:**
- Growth rate (YoY, MoM)
- Revenue mix (products, services, recurring vs one-time)
- Customer concentration (flag if any single customer >20%)
- Seasonality patterns
- Revenue recognition method

**Margin Analysis:**

| Metric | Formula | What it reveals |
|--------|---------|-----------------|
| Gross Margin | (Revenue - COGS) / Revenue | Pricing power, production efficiency |
| Operating Margin | Operating Income / Revenue | Core business profitability |
| Net Margin | Net Income / Revenue | Bottom-line after all costs |
| Contribution Margin | (Revenue - Variable Costs) / Revenue | Unit economics viability |

**Cost Structure:**
- Fixed vs variable breakdown
- Operating leverage (higher fixed costs = higher leverage)
- Cost trend vs revenue trend (costs growing faster is a red flag)
- Unusual or one-time items (strip these out for clean analysis)

### Step 3: Liquidity Analysis

**Working Capital:**

| Metric | Formula | Target |
|--------|---------|--------|
| Current Ratio | Current Assets / Current Liabilities | >1.5 |
| Quick Ratio | (Cash + AR) / Current Liabilities | >1.0 |
| Working Capital | Current Assets - Current Liabilities | Positive |

**Cash Conversion Cycle:**

| Component | Formula | Goal |
|-----------|---------|------|
| Days Sales Outstanding (DSO) | (AR / Revenue) × 365 | Lower is better |
| Days Inventory Outstanding (DIO) | (Inventory / COGS) × 365 | Lower is better |
| Days Payable Outstanding (DPO) | (AP / COGS) × 365 | Higher (within terms) |
| Cash Conversion Cycle | DSO + DIO - DPO | Minimize |

### Step 4: Efficiency Analysis

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| Asset Turnover | Revenue / Total Assets | Higher = more efficient |
| Inventory Turnover | COGS / Average Inventory | Industry dependent |
| AR Turnover | Revenue / Average AR | Higher = faster collection |
| Fixed Asset Turnover | Revenue / Fixed Assets | Capital efficiency |

### Step 5: Leverage Analysis

| Metric | Formula | Risk Level |
|--------|---------|------------|
| Debt-to-Equity | Total Debt / Equity | <1.0 conservative |
| Debt-to-Assets | Total Debt / Total Assets | <0.5 conservative |
| Interest Coverage | EBIT / Interest Expense | >3.0 safe |
| Debt Service Coverage | Operating Cash Flow / Debt Payments | >1.25 |

### Step 6: Cash Flow Analysis

**Operating Cash Flow Quality:**
- Cash from operations vs net income ratio (>1.0 is healthy)
- Sources of cash: working capital changes, non-cash adjustments
- Sustainability of cash generation

**Free Cash Flow:**
```
Operating Cash Flow
- Capital Expenditures
- Working Capital Investment
= Free Cash Flow
```

**Burn Rate (for startups):**
```
Monthly Burn = (Cash_start - Cash_end) / Months
Runway = Current Cash / Monthly Burn
```

### Step 7: Unit Economics (for subscription/SaaS/recurring businesses)

| Metric | Formula | Target |
|--------|---------|--------|
| CAC | Total Sales & Marketing / New Customers | Context-dependent |
| LTV | ARPU × Gross Margin × (1 / Monthly Churn) | >3× CAC |
| LTV:CAC Ratio | LTV / CAC | >3:1 for healthy business |
| Payback Period | CAC / (Monthly ARPU × Gross Margin) | <12 months |
| Net Revenue Retention | (Start MRR + Expansion - Contraction - Churn) / Start MRR | >100% ideal |

### Step 8: Trend Analysis

Analyze 3-year trends for:
- Revenue growth acceleration or deceleration
- Margin expansion or compression
- Working capital efficiency changes
- Cash flow consistency

### Step 9: Benchmarking

Compare key metrics to:
- Industry averages (see benchmarks below)
- Direct competitors (if known)
- Historical company performance
- Stage-appropriate benchmarks

## Red Flags Checklist

### Revenue Red Flags
- [ ] Declining growth rate
- [ ] Customer concentration >20% from single customer
- [ ] Revenue recognition timing anomalies
- [ ] Large unexplained "other revenue"
- [ ] Revenue growing faster than cash collection

### Profitability Red Flags
- [ ] Gross margin declining over time
- [ ] SG&A growing faster than revenue
- [ ] Frequent "one-time" adjustments
- [ ] EBITDA significantly different from operating cash flow
- [ ] Aggressive capitalization of expenses

### Balance Sheet Red Flags
- [ ] AR growing faster than revenue (collection issues)
- [ ] Inventory growing faster than COGS (obsolescence risk)
- [ ] Goodwill >30% of total assets
- [ ] Related party receivables
- [ ] Off-balance sheet obligations

### Cash Flow Red Flags
- [ ] Persistent negative operating cash flow with positive net income
- [ ] Declining cash conversion despite revenue growth
- [ ] Heavy reliance on financing activities
- [ ] CapEx consistently exceeding depreciation
- [ ] Stretched payables funding operations

## Industry Benchmarks

Quick reference for common sectors (verify with current data when possible):

| Sector | Gross Margin | Operating Margin | Asset Turnover |
|--------|--------------|------------------|----------------|
| SaaS | 70-85% | 15-25% | 0.5-1.0 |
| E-commerce | 25-45% | 5-15% | 1.5-2.5 |
| Professional Services | 30-50% | 10-20% | 1.0-2.0 |
| Manufacturing | 20-40% | 5-15% | 1.0-1.5 |
| Retail | 25-35% | 3-8% | 2.0-3.0 |
| Marketplace | 60-80% | 10-30% | 0.5-1.5 |
| Fintech | 50-70% | 10-25% | 0.3-0.8 |
| Health Tech | 55-75% | 5-20% | 0.5-1.0 |

## Output Template

```
FINANCIAL ANALYSIS: [Company Name]
Period: [Date Range]
Industry: [Sector]

EXECUTIVE SUMMARY
[3-5 bullet points on overall financial health]

KEY METRICS DASHBOARD
Revenue:        $X.XM (YoY: +X%)
Gross Margin:   XX% (Industry avg: XX%)
EBITDA:         $X.XM (XX% margin)
Free Cash Flow: $X.XM
Runway:         X months at current burn

PROFITABILITY
[Analysis with trends]

LIQUIDITY & WORKING CAPITAL
[Analysis with trends]

EFFICIENCY
[Analysis with trends]

LEVERAGE & RISK
[Analysis with trends]

CONCERNS / RED FLAGS
1. [Issue with impact assessment]
2. [Issue with impact assessment]
3. [Issue with impact assessment]

RECOMMENDATIONS
Immediate (0-30 days):
1. [Specific action]

Short-term (1-3 months):
1. [Specific action]

Medium-term (3-12 months):
1. [Specific action]
```

## Quality Checklist

- [ ] Data sources identified and dated
- [ ] All ratios calculated correctly
- [ ] Benchmarks appropriate for industry and stage
- [ ] Trend analysis covers 2+ periods
- [ ] Red flags surfaced with specific impact assessment
- [ ] Recommendations are actionable and prioritized
- [ ] Limitations of analysis acknowledged (data gaps, assumptions)
