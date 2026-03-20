# Fact-Checking Reference

Detailed methodology for Layer 4 (Factual Accuracy).

## Table of Contents

- [Verification Methodology](#verification-methodology)
- [Claim Types and Verification Approaches](#claim-types-and-verification-approaches)
- [Common Hallucination Patterns](#common-hallucination-patterns)
- [Chinese-Specific Verification Sources](#chinese-specific-verification-sources)
- [Practical Checklist](#practical-checklist)

---

## Verification Methodology

Based on practices from leading fact-checking organizations and adapted for AI-assisted review.

### Four-Phase Process

**Phase 1: Claim Extraction**

Read the full text and identify every verifiable statement:
- Factual assertions ("中国GDP增长5.2%")
- Statistics and data points ("超过3000万用户")
- Attributions ("据新华社报道")
- Dates and timelines ("2025年1月上线")
- Quotes ("马化腾表示'...'")
- Causal claims ("由于政策调整，导致...")
- Comparisons ("比去年增长了30%")
- Historical claims ("自1949年以来")

**Phase 2: Categorization**

For each claim, determine its type:

| Type | Description | Verification approach |
|------|-------------|----------------------|
| **Hard fact** | Numbers, dates, names, measurable data | Must verify against primary source |
| **Soft fact** | General knowledge, widely accepted truths | Verify if unusual or counterintuitive |
| **Attribution** | "X said Y", "According to Z" | Verify both source existence and accuracy of quote |
| **Inference** | Conclusions drawn from data | Check if evidence supports the conclusion |
| **Opinion-as-fact** | Subjective judgment stated as objective truth | Flag — should be clearly marked as opinion |

**Phase 3: Verification**

For each claim requiring verification:

1. **Trace to primary source** — Don't rely on secondary reporting. Find the original publication, press release, or dataset.
2. **Cross-reference** — Verify against at least two independent sources when possible.
3. **Check currency** — Is the data current? Statistics from 2020 may not apply to 2026.
4. **Check context** — Is the statistic used in its original context, or has it been cherry-picked or re-framed?

**Phase 4: Verdict**

For each verified claim, assign a status:

| Status | Meaning |
|--------|---------|
| **Confirmed** | Verified against reliable sources |
| **Partially supported** | Core claim is correct but details differ |
| **Unverified** | Could not confirm or deny with available tools |
| **Contradicted** | Evidence contradicts the claim |
| **Outdated** | Was true at one point but no longer current |

---

## Claim Types and Verification Approaches

### Names and Titles

| Check | Method |
|-------|--------|
| Person name spelling | Verify against official organizational pages, LinkedIn, press releases |
| Job title accuracy | Check against current company/organization information |
| Full name on first reference | Verify that abbreviated names have been introduced properly |
| Organization official name | Check against official registration or website |

**Common errors**: Using outdated titles (e.g., person changed roles), misspelling transliterated foreign names, using informal names for official organizations.

### Statistics and Data

| Check | Method |
|-------|--------|
| Source attribution | Is a source cited? Is it reliable? |
| Recency | When was the data collected? Is it still current? |
| Accuracy of citation | Does the cited number match the original source? |
| Context preservation | Is the statistic used in the same context as the original? |
| Unit consistency | Are units correct (万 vs 百万, 亿 vs billion)? |

**Common errors**: Confusing 万 (10K) with 百万 (1M), using data from one year while implying it's current, citing percentages without base numbers, rounding errors.

**Chinese number pitfalls**:
- 万 = 10,000 (not "ten thousand" in the same way; it's a unit)
- 亿 = 100,000,000 (100 million)
- Mixing Arabic and Chinese number systems: "3000万" = 30 million, not "3000 ten-thousands"

### Dates and Times

| Check | Method |
|-------|--------|
| Event dates | Cross-reference against known timelines and calendars |
| Day of week | Verify computationally if a specific day is cited |
| Relative dates | "去年" — verify which year this refers to given publication date |
| Time zone | For international events, verify time zone context |

### Quotes

| Check | Method |
|-------|--------|
| Quote accuracy | Find original speech, interview, or document |
| Context preservation | Is the quote used in the same context as originally stated? |
| Attribution accuracy | Did this person actually say this? |
| Selective editing | Were parts omitted that change the meaning? |

---

## Common Hallucination Patterns

When content was AI-generated or AI-assisted, watch for these specific patterns:

| Pattern | Description | Example |
|---------|-------------|---------|
| **Plausible fabrication** | Invented but realistic-sounding facts | Fake journal articles, non-existent companies |
| **Confident extrapolation** | "Studies show..." without any actual study | Unattributed research claims |
| **Temporal confusion** | Outdated info presented as current | Using 2023 data as if it's current 2026 data |
| **Attribution drift** | Correct info, wrong source | Attributing a quote to the wrong person |
| **Amalgamation** | Combining facts from multiple sources into a fictional synthesis | Merging two different companies' metrics |
| **Precision inflation** | Suspiciously precise numbers | "According to a 2025 survey, exactly 73.4% of users..." |

**Detection tip**: Numbers that are suspiciously round (exactly 50%, exactly 1 million) OR suspiciously precise (73.847%) in unsourced claims are red flags.

---

## Chinese-Specific Verification Sources

### Government and Official Sources

| Source | Use for |
|--------|---------|
| 国家统计局 (stats.gov.cn) | Economic data, demographic statistics, official surveys |
| 中国政府网 (gov.cn) | Policy documents, official announcements |
| 新华网 (xinhuanet.com) | Official news, government statements |
| 中国人大网 (npc.gov.cn) | Laws, regulations, legislative records |
| 国家企业信用信息公示系统 (gsxt.gov.cn) | Company registration, business data |
| 中国裁判文书网 (wenshu.court.gov.cn) | Legal judgments, court records |

### Academic and Research

| Source | Use for |
|--------|---------|
| 中国知网 CNKI (cnki.net) | Academic papers, journals, dissertations |
| 万方数据 (wanfangdata.com.cn) | Academic papers, standards, patents |
| 百度学术 (xueshu.baidu.com) | Academic search aggregator |

### Media and Fact-Checking

| Source | Use for |
|--------|---------|
| 明查 (by The Paper) | Fact-checking, misinformation debunking |
| 有据 (chinafactcheck.com) | Fact-checking platform |
| 腾讯较真 | Real-time fact-checking |

---

## Practical Checklist

For each article, systematically verify:

- [ ] All person names are correctly spelled and titles are current
- [ ] All organization names use official full names on first reference
- [ ] All dates have been verified against known events
- [ ] All statistics cite a specific, traceable source
- [ ] All direct quotes have been verified against original sources
- [ ] No statistics are presented without context (base numbers, time period, scope)
- [ ] No outdated information is presented as current
- [ ] No obvious AI hallucination patterns detected
- [ ] Geographic references are accurate
- [ ] Historical claims are consistent with established records
- [ ] Causal claims are supported by evidence, not just correlation
- [ ] Units are consistent and correct throughout (万/亿, %, etc.)
