---
name: editorial-review
description: "Comprehensive editorial review for Chinese content before publication. Use when the user asks to 'review my article', 'proofread this', 'check for errors', 'editorial review', 'pre-publish check', 'compliance review', or any Chinese text that needs proofreading, grammar checking, fact verification, political sensitivity screening, or advertising law compliance before release. Also activate when the user says '审校', '校对', '审核', '检查错误', '发布前检查', '合规审查', or submits Chinese content asking for quality review. Covers articles, news, blog posts, press releases, marketing copy, social media posts, and any public-facing Chinese text. Even if the user only asks for 'a quick check' or 'look this over', use this skill to ensure thorough coverage."
---

# Editorial Review

Systematic editorial review for Chinese content before publication. Modeled after the publishing industry's "Three Reviews, Three Proofs" (三审三校) quality system, adapted for AI-assisted single-pass comprehensive review.

This skill catches errors that embarrass authors and organizations: typos, grammar mistakes, factual inaccuracies, political landmines, and advertising law violations. It produces a structured review report with every issue located, categorized, and accompanied by a concrete fix.

## When to Activate

- **Proofreading**: "help me proofread", "check for typos", "审校一下", "校对"
- **Editorial review**: "review before publishing", "发布前审核", "editorial check"
- **Compliance review**: "check for sensitive content", "合规检查", "advertising law check"
- **Grammar check**: "check grammar", "检查语法", "有没有病句"
- **Fact verification**: "verify the facts", "核实数据", "fact-check this"
- **General quality**: user submits Chinese text and asks to "look it over", "check this", "review"

## Review Modes

Select mode based on content length, stakes, and user request. Announce the selected mode before starting.

| Mode | Content Length | Layers | Output | Use When |
|------|---------------|--------|--------|----------|
| **Quick** | < 500 chars | Layers 1-3 | Inline comments | Social media, short posts, internal messages |
| **Standard** | 500-5,000 chars | Layers 1-6 | Structured report | Blog posts, articles, newsletters |
| **Deep** | > 5,000 chars or high-stakes | All 8 layers | Full report + summary | Press releases, official statements, regulatory filings, news articles |

Default to **Standard**. Escalate to **Deep** if the content is public-facing and high-stakes (government, legal, financial, medical). Use **Quick** only when explicitly requested or for obviously short, low-stakes content.

## Platform Compatibility

Map interactive tools to whatever the current environment provides:

| Platform | Question tool | File write |
|----------|--------------|------------|
| Claude Code | `AskUserQuestion` | `Write` / `Edit` |
| Codex | `request_user_input` | `write_file` / `edit_file` |
| Gemini | `ask_user` | file tools |
| Other / Claude.ai | Numbered options in chat | inline output |

**Language**: The review report is written in the same language as the content (Chinese). Skill internals and reference files are in English.

## The 8-Layer Review Pipeline

Process layers sequentially. Each layer catches a distinct class of errors. Do NOT skip layers — earlier layers catch surface errors that could mask deeper issues.

For each issue found, record: **location** (paragraph/sentence number or quote), **category** (layer + sub-type), **original text**, **suggested fix**, and **severity** (Critical / Major / Minor).

### Layer 1: Character Accuracy (文字准确性)

The most fundamental layer. Chinese input methods produce homophone and shape-similar errors that spell-checkers miss.

**Check for:**
- Homophone confusion (同音字): 的/地/得, 在/再, 以/已, 做/作, 即/既, etc.
- Similar-looking character errors (形近字): 已/己/巳, 未/末, 拔/拨, 辩/辨/辫
- Common fixed-phrase errors: 松驰→松弛, 穿流不息→川流不息, 渡假→度假, 再接再励→再接再厉
- Missing or duplicated characters (e.g., 党的的领导)
- Inconsistent simplified/traditional character mixing

Consult `references/typography-and-punctuation.md` § "Common Character Errors" for the full error list.

**Severity**: Typos in titles/headlines = Critical. Body text typos = Major. Rare/debatable cases = Minor.

### Layer 2: Punctuation and Typography (标点与排版)

Chinese has its own punctuation system (GB/T 15834-2011) with strict rules that differ from English.

**Check for:**
- Full-width vs half-width punctuation (Chinese text must use full-width: ，。！？；：)
- Spaces between Chinese and Latin characters/numbers (花了 5000 元, not 花了5000元)
- NO space between numbers and %, °C, etc. (90%, not 90 %)
- Proper ellipsis (……, six dots, not ... three dots)
- Proper em-dash (——, two character widths)
- No stacked punctuation (！！！ is wrong)
- Book title marks 《》 used only for published works, not events/brands/courses
- Nested quotation marks (outer " ", inner ' ')
- Proper noun capitalization in mixed text (GitHub not github, iOS not IOS)

Consult `references/typography-and-punctuation.md` § "Punctuation Rules" and § "CJK-Latin Mixing" for full rules.

**Severity**: Systematic punctuation errors = Major. Isolated cases = Minor.

### Layer 3: Grammar and Logic (语法与逻辑)

Chinese grammar errors (病句) fall into six standard categories. Logical fallacies undermine credibility.

**Check for the six error types:**
1. **Improper word order** (语序不当): misplaced modifiers, adverbials after predicates
2. **Mismatched collocation** (搭配不当): subject-predicate, verb-object, modifier mismatches
3. **Missing/redundant components** (成分残缺或赘余): missing subject after 使/让/通过, redundant modifiers
4. **Tangled structure** (结构混乱): mid-sentence subject shifts, blended constructions
5. **Ambiguous meaning** (表意不明): unclear pronoun references, scope ambiguity
6. **Illogical statements** (不合逻辑): self-contradictions, one-sided/two-sided mismatches, improper classification in parallel lists

**Also check for:**
- Run-on sentences (> 80 characters without punctuation)
- Logical fallacies: hasty generalization, false cause, circular reasoning, equivocation
- Unsupported causal claims

Consult `references/grammar-and-logic.md` for detailed examples and detection patterns.

**Severity**: Ambiguity or contradiction = Critical. Grammar errors = Major. Style-level issues = Minor.

### Layer 4: Factual Accuracy (事实准确性)

Incorrect facts damage credibility and may create legal liability.

**Check for:**
- Person names, titles, and affiliations — are they current and correct?
- Organization names — official full name on first use?
- Dates and times — do they match known events?
- Statistics and data — traced to a primary source? Correctly quoted?
- Direct quotes — verified against original source? No selective editing?
- Geographic references — correct place names and relationships?
- Historical claims — consistent with established record?
- Scientific/technical claims — supported by evidence?

**When web access is available**, verify key claims using search tools. When unavailable, flag unverifiable claims rather than silently passing them.

Consult `references/fact-checking.md` for the verification methodology.

**Severity**: Factual errors in key claims = Critical. Unverified statistics = Major. Minor date/name details = Minor.

### Layer 5: Political and Territorial Compliance (政治与领土合规)

Content published in or about China must observe strict political sensitivities. Violations can result in content removal, fines, or worse.

**Key areas:**
- **Taiwan**: Must be "Taiwan Province" or "China's Taiwan region", never a separate country. No "Republic of China" or Taiwan flag references.
- **Hong Kong / Macau**: Must use "SAR" designation, not standalone country references.
- **Tibet / Xinjiang**: No framing suggesting independence or separatism.
- **Maps**: Must include nine-dash line, Taiwan, Diaoyu Islands, Nansha Islands if applicable.
- **Historical events**: Handle Cultural Revolution, specific political campaigns with care.
- **Leadership references**: Correct titles, no satirical nicknames, no unauthorized commercial use.
- **Ethnic and religious content**: No content promoting division or extremism.

Consult `references/political-compliance.md` for the full framework and examples.

**Severity**: Territorial sovereignty violations = Critical. Sensitive framing = Major. Borderline references = Minor (flag for human review).

### Layer 6: Advertising Law Compliance (广告法合规)

Chinese advertising law (广告法) prohibits absolute claims and deceptive language with fines of 200K-1M yuan.

**Prohibited categories:**
- Superlatives: 最好, 最优, 最先进, 史上最低价
- Ranking claims: 第一, NO.1, 全网第一, 独一无二
- Grade/level terms: 国家级, 世界级, 顶级, 极品
- Exclusivity: 独创, 缔造者, 发明者
- Scarcity manipulation: 绝版, 空前绝后
- Authority endorsement: 特供, 专供, 国家领导人推荐
- Urgency manipulation: 再不抢就没了, 错过不再
- Unsubstantiated medical/health/financial claims

**Exceptions exist** — terms used in corporate philosophy, internal product comparisons, product specifications, or backed by documented certifications are permitted.

Consult `references/advertising-law.md` for the complete prohibited word list and exception rules.

**Severity**: Clear prohibited terms in commercial content = Critical. Borderline terms = Major. Non-commercial content = Minor (advisory).

### Layer 7: Consistency and Style (一致性与风格)

Inconsistency signals carelessness and confuses readers.

**Check for:**
- Same concept using different terms across the text
- Mixed date formats (2026年3月 vs 2026-03 vs 3月2026)
- Mixed number formats (Arabic vs Chinese numerals for same context)
- Person/organization name variations
- Tone shifts (formal ↔ colloquial) without purpose
- Mixed use of 你 vs 您 (formality level)

**Severity**: Terminology inconsistency = Major. Minor format variations = Minor.

### Layer 8: Structure and Readability (结构与可读性)

The final layer evaluates whether the content works as a whole.

**Check for:**
- Title accurately reflects content
- Lead/abstract summarizes key points (for news/articles)
- Logical paragraph progression
- No duplicate content across sections
- Image captions present and accurate (if applicable)
- Hyperlinks functional and relevant (if applicable)
- Appropriate length for the format
- Clear conclusion or call-to-action

**Severity**: Misleading title = Critical. Structural gaps = Major. Readability nits = Minor.

## Output Format

### Review Report Structure

Always produce the report in this structure:

```
# Editorial Review Report (审校报告)

## Overview
- Content type: [article / news / press release / marketing copy / ...]
- Word count: [X characters]
- Review mode: [Quick / Standard / Deep]
- Review date: [YYYY-MM-DD]

## Summary
- Critical issues: [N]
- Major issues: [N]
- Minor issues: [N]
- Overall assessment: [Ready for publication / Needs revision / Needs major rework]

## Issues by Layer

### Layer 1: Character Accuracy
| # | Location | Original | Suggested Fix | Severity | Explanation |
|---|----------|----------|---------------|----------|-------------|
| 1 | Para 2, line 3 | "松驰" | "松弛" | Major | Homophone error... |

### Layer 2: Punctuation and Typography
...

[Continue for each applicable layer]

## Clean Version (Optional)
[If requested, provide the corrected full text with all fixes applied]

## Reviewer Notes
[Any observations about overall quality, patterns, or recommendations for the author]
```

### Severity Definitions

| Severity | Meaning | Action |
|----------|---------|--------|
| **Critical** | Factual error, political violation, legal risk, or meaning-altering mistake | Must fix before publication |
| **Major** | Clear error that harms quality or credibility | Should fix before publication |
| **Minor** | Style preference, debatable choice, or minor inconsistency | Fix if time permits |

## Workflow

1. **Receive content** — Read the full text before making any comments. Understand the content type, target audience, and publication context.
2. **Select mode** — Announce: "This is a [length] [content type]. I'll run a [mode] review covering Layers [N-M]."
3. **Execute layers sequentially** — Work through each layer. Record every issue found.
4. **Compile report** — Organize issues by layer. Count severities. Assess overall readiness.
5. **Present report** — Share the structured report. If the user wants a corrected version, produce it.
6. **Iterate** — If the user revises and resubmits, run a focused re-review on previously flagged issues.

## Examples

**Example 1: Quick review**

User: "帮我看看这条朋友圈：新年到了,祝大家在新的一年里万事如意!我们公司是全国最好的AI公司,欢迎合作."

Review: Two issues found.
- Layer 2 (Punctuation): Half-width commas and period used. Should be full-width ，and 。 → Major
- Layer 6 (Advertising Law): "全国最好的" is a superlative claim prohibited by advertising law → Critical

**Example 2: Standard review trigger**

User: "审校一下这篇公众号文章" [pastes 2000-char article]

→ Standard mode, Layers 1-6, full structured report.

**Example 3: Deep review trigger**

User: "这是要发到官网的新闻稿，帮我仔细检查一下，特别是合规方面" [pastes 8000-char press release]

→ Deep mode, all 8 layers, extra attention to Layers 5-6.

## Caveats

- **Political compliance is advisory, not authoritative.** This skill flags potential issues based on known patterns, but political sensitivities evolve. Always have a qualified human reviewer make final decisions on politically sensitive content.
- **Fact-checking depends on available tools.** With web access, the skill can verify claims. Without it, the skill flags unverifiable claims but cannot confirm accuracy.
- **Advertising law applies to commercial content.** Non-commercial editorial content (news reporting, academic papers) has different rules. The skill adjusts its severity accordingly.
- **This skill does NOT rewrite content.** It identifies issues and suggests fixes. The author retains creative control. A clean corrected version is only produced when explicitly requested.
- **Dialect and regional variations exist.** The default standard is mainland simplified Chinese (普通话). For Taiwan (Traditional Chinese) or Hong Kong contexts, some rules (especially Layer 5) may need adjustment — inform the skill of the target region.
