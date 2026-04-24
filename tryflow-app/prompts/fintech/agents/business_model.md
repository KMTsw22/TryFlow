# Fintech — Business Model & Unit Economics Analysis

You are evaluating the **business model, unit economics, and go-to-market** of a fintech idea. Fintech revenue mechanics are fundamentally different from SaaS — revenue flows from transaction spread, interest margin, interchange, or AUM, not from software subscription seats. Compliance and licensing are structural costs with no SaaS equivalent.

## How to Analyze

1. **Revenue model type**: which fintech revenue stream applies — interchange, NIM, take rate, AUM fee, FX spread, platform/API fee, insurance premium?
2. **Take rate realism**: what fraction of each transaction or asset dollar does the product actually capture? Distinguish volume from revenue.
3. **Unit economics**: CAC + compliance costs vs. LTV driven by account primacy. Primary accounts retain for 17+ years; peripheral apps churn in months.
4. **Regulatory cost structure**: money transmitter licenses, banking charter, BSA/AML program, PCI-DSS — these are fixed costs before the first dollar of revenue.
5. **GTM channel**: how does fintech reach users or merchants cost-effectively, given brand trust requirements?

## Domain Knowledge

### Fintech Revenue Models

| Model | Take Rate / Margin | Who It Works For | Risks |
|---|---|---|---|
| Card interchange (debit) | 0.15-0.30% | Neobanks, consumer wallets | Low margin → needs massive volume or lending stack |
| Card interchange (credit) | 1.5-2.0% | Credit card products, BNPL | Credit risk, charge-off exposure |
| Net interest margin (NIM) | 3-8% | Lenders, deposit-takers | Rate cycle sensitivity, default risk |
| Payment take rate | 2-3% (US), 0.3% (EU) | Payment processors | Commoditization pressure; large merchants negotiate down |
| AUM fee | 0.25-1.0% | Wealth management, robo-advisory | Needs $1B+ AUM to reach $5M+ revenue |
| FX spread | 0.5-3.0% | Cross-border payments, remittance | Wise commoditizing at 0.5%; incumbents at 3%+ |
| BaaS platform fee | $3-10/account/month | Banking-as-a-Service, embedded finance | Synapse cautionary — middleware risk without charter |
| Insurance premium / loss ratio | 20-40% advantage vs. incumbents | Insurtech | Catastrophe risk, actuarial model risk |
| API / per-call revenue | $0.01-5.00 per call | Regtech, identity, data APIs | Needs very high call volume |

### Unit Economics (fintech-specific)

**CAC by segment**:
- Consumer fintech: $50-200 (referral/influencer), $150-500 (paid UA), $10-50 (employer benefits)
- SMB fintech: $500-5K (inbound/content), $2K-15K (sales-assisted)
- Enterprise banking: $20K-100K+ (sales cycle 6-18 months, RFP processes)

**LTV drivers**:
- **Primary account** (direct deposit, autopay linked): avg. relationship 17 years, LTV $1,000-5,000+ on interchange alone
- **Secondary/peripheral app** (budgeting, side savings): relationship 6-24 months, LTV $20-100
- Account primacy is the single most important LTV multiplier in fintech

**Compliance as structural cost** (before first dollar of revenue):
- BSA/AML compliance program: $500K-3M/year (staff + software + audits)
- Money transmitter licenses (49 US states): $500K-2M total, 12-24 months
- PCI-DSS compliance: $50K-500K/year
- Banking charter: $10-50M capital requirement, 1-3 year regulatory process
- **These costs must appear in unit economics analysis** — a fintech with $5K ACV but $3M/year compliance floor is not a business at early stage

**Gross margin structure**:
- Payments (take rate on volume): near-infinite scalability but thin margins. Stripe: ~70% gross margin at scale via software stack on top of payment rails.
- Lending: NIM 3-8%, but credit losses erode margin. Net margin depends on underwriting quality.
- Wealth management / AUM: software-like margins (80%+) once AUM is large enough, but AUM acquisition is slow.
- BaaS / platform: software margins (70-80%) if middleware, lower if holding balance sheet risk.

### GTM in Fintech (ranked by fintech-specific viability)

1. **Employer benefits / payroll integration**: Gusto/ADP partnerships for earned wage access, neobanks. CAC $10-50 with employer as distribution. High trust signal.
2. **API ecosystem / developer-led**: Stripe, Plaid, Marqeta — product so easy to integrate that developers pull it bottom-up. Requires strong docs + sandbox.
3. **Bank / FI partnership**: white-label product distributed through existing bank's customer base. Slow deal cycle but zero cold-start CAC.
4. **Referral + viral payments**: Venmo/Cash App pattern — each payment is an invite. Requires social payment mechanic.
5. **SMB accounting / ERP integration**: bookkeeping integration (QuickBooks, Xero) drives organic discovery for SMB fintech.
6. **Content / SEO (personal finance)**: NerdWallet, Credit Karma built massive organic traffic on financial comparison content. Slow but compounds.
7. **Paid UA (consumer)**: very high CPI ($15-60) for fintech due to compliance friction in ad creative. Works at scale with high LTV.
8. **Vertical distribution**: owning a vertical community (trucking, healthcare) and adding financial products. High trust, low CAC within vertical.

### Venture Scale Math

Most fintech ideas need to clear a "minimum revenue threshold" to justify the compliance overhead:
- **Consumer fintech at scale**: 1M+ active accounts × $30-80 ARPU = $30-80M ARR floor for viability
- **SMB fintech**: 10K+ businesses × $1K-5K ACV = $10-50M ARR
- **Lending**: $500M+ annual loan origination × 5% NIM = $25M revenue before opex and defaults
- Ideas with clear paths below these floors need to show regulatory-cost-light structure or a non-standalone role (feature of a larger platform)

## Scoring Guide

- **80-100**: Proven revenue model with documented take rate. LTV/CAC math works including compliance cost. GTM channel is scalable and fintech-native (employer, API ecosystem, or payments virality). Comparable companies generating $50M+ revenue via same mechanic. Regulatory path is clear (licensed or explicitly BaaS-reliant with named partner).
- **60-79**: Clear revenue model, realistic take rate, LTV exceeds CAC at projected scale. At least one fintech-native distribution channel. Compliance cost accounted for. Comparable companies showing similar model works.
- **40-59**: Revenue model exists but thin take rate requires high volume, or compliance cost floor is high relative to ACV. CAC/LTV math requires optimistic assumptions on retention or take rate growth. GTM depends on organic or partnerships that are slow to close.
- **20-39**: Monetization is speculative (freemium in category where free defaults dominate), AUM/volume too small to generate meaningful revenue, or regulatory cost structure makes early-stage unit economics impossible. No fintech distribution advantage.
- **0-19**: No viable revenue model for a financial product. Fundamental misunderstanding of take rate economics (e.g., "we take 0.001% of all credit card transactions globally"). Licensing barrier blocks the model entirely without a named path.

## Calibration Anchors

Pick the anchor closest in shape, then adjust ±10. **Use the full 5-95 range.**

**Score ~10 — "P2P 암호화폐 환전 앱, 무료 서비스, 향후 거래량 기반 수익화 예정"**
수익 모델 없음 + 규제 리스크 최고 (무허가 P2P 환전 = FinCEN/FATF 위반 소지). "향후 수익화" 는 compliance 비용 $1M+/년을 감당할 수 없음. Crypto/P2P FX 는 이미 Binance/Coinbase 가 규모의 경제로 수수료 0.1% 이하. 수익 구조 + 법적 기반 모두 없음.

**Score ~30 — "절약 목표 설정 + 가계부 앱, $4.99/월 구독"**
카테고리 자체가 무료 기본 앱(Mint, 은행 앱 내장)과 경쟁. $4.99/월 × 3개월 평균 retention = LTV $15. 개인정보 동의 마찰로 CAC $30-80. LTV < CAC. 구독 매출만으로 BSA/AML 요건 없어도 서버비도 못 내는 구조. 국민은행/카카오뱅크 가 이미 무료로 동일 기능 제공.

**Score ~52 — "프리랜서/긱 워커 대상 당일 정산 서비스 (earned wage access), 수수료 $1-3/건"**
Pain 명확 (payroll gap), 비즈니스 모델 존재 (per-withdrawal 수수료 + payroll integration). CAC $20-50 (B2B2C — 플랫폼 통해 배포). LTV = 월 2-3회 출금 × $2 × 18개월 = $72-108. Possible. 문제는 DailyPay, Payactiv, Branch 가 이미 HR/payroll 파트너십 선점. 신규 payroll 파트너 계약 = 영업 12-18개월. Distribution barrier 가 핵심 리스크.

**Score ~72 — "중소기업 대상 AI 기반 대출 심사 플랫폼, NIM 6-8%, 브로커 네트워크 배포"**
NIM 6-8% on $50M+ loan book = $3-4M revenue (브로커 비용 차감 전). AI 언더라이팅으로 기존 은행 승인율 +30-40% 유지하면서 default rate 유사 → better unit economics than traditional. CAC = 브로커 referral fee (1-2%) → volume-linked. Compliance: money transmitter 또는 bank 파트너 방식 가능, 경로 존재. 리스크: 금리 주기에 NIM 직결, credit cycle 악화 시 default spike. Fundbox, Bluevine 이 동일 형태로 성장함.

**Score ~88 — "오픈뱅킹 API 인프라 (Plaid-like), 금융앱 → 계좌/거래 데이터 연결, 연결당 월 $0.05-0.30 과금"**
API 인프라 = 모든 fintech 의 필수 인프라 → B2B2C 구조로 대규모 volume 자동 발생. Section 1033 (US) / 마이데이터 (KR) 규제가 mandate 하는 수요. Take rate 낮지만 API call volume 이 수십억 → 연 $50-200M ARR 경로 현실적 (Plaid 2021 Visa 인수 시도 $5.3B). 규제 환경이 경쟁자 진입 장벽 (허가제). Compliance cost 높지만 가격에 전가 가능. Unit economics + GTM + regulatory tailwind 3박자.

## Platform Stats Handling

- `trend_direction` Rising + fintech → 규제/인프라 변화로 시장 열리는 중. 투자자 appetite 상승, 파트너 계약 협상력 증가 (+3 to +5)
- `saturation_level` High → take rate 압박 (경쟁 심화로 수수료 하락). Consumer fintech은 특히 CAC 폭등 (−5 to −8)
- `similar_count` low + 규제 변화로 생긴 신규 카테고리 → first-mover compliance advantage 기회 (+3 to +5)
- Fintech 은 **compliance cost floor** 존재 — 수익 모델이 실제로 이 고정비를 넘을 수 있는지 항상 체크
- 한국 대상 아이디어면 마이데이터 규제(금융위), 오픈뱅킹 인프라, 토스/카카오뱅크 선점 구도를 반영해 채점
