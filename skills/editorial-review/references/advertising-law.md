# Advertising Law Compliance Reference

Detailed rules for Layer 6 (Advertising Law Compliance).

Based on the PRC Advertising Law (中华人民共和国广告法) Article 9, Item 3, and the 2023 SAMR enforcement guidelines (市场监管总局文件第6号).

## Table of Contents

- [Prohibited Word Categories](#prohibited-word-categories)
- [Exception Rules](#exception-rules)
- [Industry-Specific Restrictions](#industry-specific-restrictions)
- [Detection Guide](#detection-guide)

---

## Prohibited Word Categories

### Category 1: Superlative "最" Terms

All variations of "most/best/highest/lowest" used as absolute claims:

最佳, 最好, 最优, 最优秀, 最高, 最低, 最便宜, 最先进, 最流行, 最受欢迎, 最新技术, 最大, 最小, 最强, 最快, 最新, 史上最低价, 全网最低, 最高级, 最高端, 最奢侈, 最赚, 最优惠, 最时尚, 最聚拢, 最安全, 最舒适, 最好吃

### Category 2: Ranking and Primacy Claims

第一, 中国第一, 全网第一, 销量第一, 排名第一, NO.1, Top1, 独一无二, 第一品牌, 首个, 首家, 首发, 全国首家, 全球首发, 填补国内空白, 唯一, 绝无仅有, 前所未有, 史无前例, 万人空巷

### Category 3: Grade and Level Terms

国家级, 世界级, 星级, 5A级, 超甲级, 国家级产品, 全球级, 宇宙级, 国际级

### Category 4: Extreme Quality Descriptors

顶级, 极品, 绝佳, 完美, 至尊, 无双, 巅峰, 无与伦比, 登峰造极, 出类拔萃, 冠绝, 无人能敌, 天花板, 极致, 极端, 终极, 究极

### Category 5: Scarcity and Exclusivity Claims

绝版, 稀少, 珍稀, 空前绝后, 寥寥无几, 独创, 独据, 开发者, 缔造者, 发明者, 独占, 垄断, 包揽

### Category 6: Brand Prestige Claims

大牌, 名牌, 王牌, 冠军, 之王, 皇家, 领导品牌, 领军品牌, 金牌, 驰名, 著名, 知名

### Category 7: Leadership and Superiority Claims

世界领先, 遥遥领先, 全球领先, 领袖品牌, 引领行业, 行业标杆, 业界翘楚, 龙头企业 (unless officially designated)

### Category 8: Authority and Endorsement Claims

特供, 专供, 国家领导人推荐, 国宴专用, 人民大会堂选用, 政府推荐, 指定用品, 国家机关推荐

### Category 9: False Guarantee Claims

永久, 万能, 百分之百, 100%, 绝对, 保证治愈, 保证见效, 根治, 药到病除, 无毒无害, 零风险, 无副作用

### Category 10: Deceptive Promotional Language

点击领奖, 恭喜获奖, 全民免单, 抽奖, 砸金蛋, 一元夺宝, 秒杀, 售罄 (when false), 再不抢就没了, 错过不再, 错过就亏大了, 最后一波, 倒计时, 限时秒杀 (when misleading)

---

## Exception Rules

Absolute terms are legally permitted in these contexts:

| Exception | Example | Why allowed |
|-----------|---------|-------------|
| **Corporate philosophy/goals** | "我们致力于提供最好的服务" | Expressing aspiration, not factual claim |
| **Internal product comparison** | "本系列中最畅销的产品" | Comparing within own product line, not industry-wide |
| **Product specifications** | "最佳饮用温度 60°C" | Technical specification, not quality claim |
| **Documented certifications** | "荣获2025年度最佳创新奖" with proof | Based on verifiable third-party award |
| **Government-assessed ratings** | "国家5A级景区" | Official government designation |
| **Registered trademarks** | Brand names containing absolute terms | Protected IP |
| **Factual metrics with bounds** | "2025年Q1上海地区销量第一" with data | Time-bound, location-bound, verifiable |
| **Non-commercial content** | News reporting, academic papers, editorial | Not subject to advertising law |

### The Key Test

Ask: "Is this an objective, verifiable claim about a product/service being promoted to consumers?" If yes, absolute terms are risky. If the content is editorial, aspirational, or internally comparative, exceptions may apply.

---

## Industry-Specific Restrictions

### Healthcare and Medical

Additional prohibitions beyond general advertising law:

- No efficacy guarantees: 根治, 药到病除, 百分百有效
- No medical endorsements from non-physicians
- No patient testimonials as treatment proof
- No comparisons with other treatments using superlatives
- No claims of "no side effects" (无副作用) without clinical evidence
- Drug ads must include adverse reaction warnings

### Financial Services

- No guaranteed returns: 保本保息, 稳赚不赔, 零风险投资
- No past performance as guarantee: "过去5年收益率X%，未来可期" implies guarantee
- Must include risk disclaimers for investment products

### Education

- No employment guarantees: 包就业, 保证录取, 100%通过率
- No false credential claims
- Must clearly distinguish official certifications from internal certificates

### Food and Health Products (保健品)

- Cannot claim disease treatment: "降血压", "治疗糖尿病"
- Must distinguish from medicine: 保健品 ≠ 药品
- No "miraculous" or "magical" effect claims

### Real Estate

- No guaranteed appreciation: 稳涨, 升值无忧, 投资回报保证
- No false location claims (distance calculations must be accurate)
- School district claims must be verified with education authorities

---

## Detection Guide

### Scanning Process

1. **Determine content type** — Is this commercial (advertising, marketing, product page) or non-commercial (news, editorial, academic)?
2. **If commercial**: Apply full prohibited word scanning
3. **If non-commercial**: Apply in advisory mode (flag but lower severity)
4. **For each flagged term**: Check if any exception applies
5. **Assess context**: A term like "第一" in "第一次" (first time) is not a violation; "行业第一" is

### Common False Positives

These look like violations but are not:

| Text | Why it's OK |
|------|-------------|
| 第一次, 第一步, 第一阶段 | Ordinal number, not ranking claim |
| 最后, 最近, 最初 | Temporal reference, not superlative |
| 最多不超过10人 | Quantitative limit, not quality claim |
| 独立, 独特 | Describing characteristic, not exclusivity claim (context-dependent) |
| 最高人民法院 | Official institution name |
| 顶楼, 顶部 | Physical location, not quality claim |

### Severity Assessment

| Condition | Severity |
|-----------|----------|
| Clear prohibited term in commercial ad copy | Critical |
| Borderline term in commercial context | Major |
| Prohibited term in non-commercial editorial | Minor (advisory) |
| Term covered by documented exception | Not an issue (note the exception in review) |
