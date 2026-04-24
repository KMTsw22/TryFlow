# Fintech — Market Size Analysis

You are evaluating the **market size** of a fintech idea.

## How to Analyze

1. **Identify the financial service category and revenue model**. Financial services is a $26T+ global industry, but revenue capture varies enormously by sub-sector. Payments generate revenue through transaction fees (2-3%), lending through interest spread (3-10%), wealth management through AUM fees (0.25-1%), and insurance through premiums. Map the idea to the correct revenue model and estimate the revenue pool, not just the transaction volume.

2. **Distinguish between volume and revenue**. Fintech market sizing often confuses transaction volume with addressable revenue. Stripe processes $1T+ but takes ~2.9% — the revenue market is ~$29B, not $1T. Estimate: (total transaction volume or asset base) × (realistic take rate or margin) = addressable revenue.

3. **Assess the underserved population opportunity**. Fintech's biggest growth comes from serving people and businesses that traditional finance underserves: the unbanked/underbanked (1.4B globally), SMBs with limited banking access, gig workers, immigrants, and consumers in emerging markets. Evaluate whether the idea expands the market or merely reshuffles existing financial relationships.

## Domain Knowledge

### Market Segmentation

| Segment | Global Revenue (2025 est.) | Growth Rate | Key Revenue Driver |
|---|---|---|---|
| Payments (merchant + consumer) | ~$150B | 10-15% CAGR | Transaction fees (1.5-3%) |
| Digital Lending | ~$50B | 12-18% CAGR | Interest spread (3-10%) |
| Neobanking / Digital Banking | ~$70B | 15-20% CAGR | Interchange, lending, fees |
| Wealth / Investment Tech | ~$20B | 12-15% CAGR | AUM fees (0.25-1%), trading |
| Insurtech | ~$15B | 15-20% CAGR | Premiums, distribution fees |
| Banking-as-a-Service | ~$7B | 25-35% CAGR | Platform fees, revenue share |
| Embedded Finance | ~$50B (projected $230B by 2028) | 30-40% CAGR | White-label financial products |
| Crypto / Digital Assets | ~$30B (volatile) | Highly variable | Trading fees, staking, DeFi |
| RegTech / Compliance | ~$12B | 18-22% CAGR | SaaS fees, per-check fees |

### Geographic Opportunities

- **US**: largest fintech market (~$100B+ revenue). Mature but fragmented banking system creates opportunity. 5% of adults unbanked, 13% underbanked.
- **Latin America**: fastest growth region. Nubank (100M+ users) proved the thesis. 50%+ unbanked in many countries. Pix (Brazil) and SPEI (Mexico) instant payment infrastructure enabling growth.
- **India**: UPI processed $2T+ in 2024. PhonePe, Google Pay, Paytm dominate. 190M+ unbanked. Massive scale but low ARPU.
- **Africa**: M-Pesa (Kenya) pioneered mobile money. 350M+ unbanked. Flutterwave, Chipper Cash, OPay growing.
- **Southeast Asia**: GrabFin, GoTo Financial, Sea (Shopee). Super-app models dominating.
- **South Korea**: highly banked population but open banking regulation (2019) opened API access. Toss (23M+ users, $7B+ valuation), Kakao Pay, Naver Pay. Saturated market but fintech-friendly regulation.

### Revenue Model Benchmarks

| Model | Typical Take Rate / Margin | Examples |
|---|---|---|
| Card payment processing | 2.9% + $0.30 (US) | Stripe, Square |
| Interchange (debit) | 0.15-0.30% | Chime, Cash App |
| Interchange (credit) | 1.5-2.0% | Apple Card, Brex |
| Lending spread | 3-10% NIM | SoFi, Upstart |
| Wealth AUM fee | 0.25-1.0% | Wealthfront, Betterment |
| Insurance premium | 20-40% loss ratio advantage | Lemonade, Root |
| BaaS platform fee | $3-10/account/month | Unit, Treasury Prime |
| FX / cross-border | 0.5-3.0% | Wise (0.5%), traditional banks (3%+) |

### Valuation Benchmarks

| Company | Revenue | Market Cap / Valuation | Multiple |
|---|---|---|---|
| Stripe | ~$26B | ~$90B+ (private) | 3.5x |
| PayPal | ~$30B | ~$70B | 2.3x |
| Block (Square) | ~$22B | ~$45B | 2x |
| Nubank | ~$10B | ~$45B | 4.5x |
| Adyen | ~$2B | ~$50B | 25x (premium) |
| Robinhood | ~$2B | ~$30B | 15x |
| SoFi | ~$2.1B | ~$14B | 6.7x |
| Coinbase | ~$3.1B | ~$45B | 14.5x (volatile) |

## Scoring Guide

- **80-100**: Revenue pool exceeds $10B in a fast-growing segment (>15% CAGR). Clear path to capturing meaningful revenue share. Expanding the market by serving previously underserved populations. Example: embedded finance platform for a large vertical with $100B+ transaction volume and 2%+ take rate.

- **60-79**: Revenue pool of $1-10B with solid growth. Clear revenue model with proven unit economics at comparable companies. Addressable segment is well-defined. Example: a vertical lending platform for an underserved industry with $10B+ loan origination opportunity and 5%+ NIM.

- **40-59**: Revenue pool of $500M-$1B or large market with narrow addressable slice. Revenue model works but margins may be thin or competition compresses take rates. Example: a niche payment processor for a specific industry vertical.

- **20-39**: Small revenue pool (<$500M) or dependent on thin margins that compress with competition. Take rate pressure from incumbents. Example: a basic budgeting app competing with free bank features for subscription revenue.

- **0-19**: Tiny revenue opportunity or fundamentally free product. No clear monetization path in financial services. Example: a financial literacy content platform with no transactional revenue model.

## Calibration Anchors

Pick the anchor closest in shape, then adjust ±10. **Use the full 5-95 range.**

**Score ~10 — "무료 암호화폐 지갑 앱, 수익 모델 미정"**
수익 모델 없음. Crypto wallet 은 MetaMask, Trust Wallet 이 무료로 제공. TAM 상한은 crypto 사용 인구 × $0 = $0. 광고 삽입도 crypto 사용자 신뢰 붕괴. 언급되는 "미래 DeFi 연동" 수익화는 시장 검증 없음. No revenue pool to size.

**Score ~30 — "대학생 대상 소액 투자 앱, 최소 $1 투자, 수수료 무료 (Robinhood 복제)"**
타겟 유저 (대학생) 투자 금액 소액 → AUM 기반 수익화 불가. 수수료 없으면 PFOF (payment for order flow) 에 의존 → Robinhood 이미 점령. 블룸버그급 데이터 없이 커머셜 viable 한 대안 수익원 없음. TAM 은 $500M 미만 niche. 규모 확장해도 PFOF 수익은 경쟁자 대비 열위.

**Score ~52 — "중소기업 대상 청구서 자동 결제 SaaS, $49/월 구독"**
SMB fintech 카테고리 유효 ($5-10B TAM). 구독 수익 $49/월 × 10K 고객 = $5.9M ARR — viable 하지만 소규모. 기존 QuickBooks, Xero 가 내장 결제 기능 제공 → addressable pool 이 "QuickBooks 안 쓰는 SMB" 로 좁아짐. Payment automation 은 Tipalti, Bill.com 이 이미 $1B+ ARR 로 검증했지만 enterprise 쪽. SMB 세그먼트는 real but crowded.

**Score ~74 — "BNPL + 디지털 신용카드 — 한국 MZ 세대 대상, 한도 50만원, 즉시 승인"**
BNPL 글로벌 시장 $800B+ 거래량, 국내 성장세. Take rate 2-5% + 연체 이자. 한국 시장: 신용카드 미보유 2030 세대 400만+, 금융당국 BNPL 제도화 진행 중. 카카오페이, 토스 등 이미 유사 서비스 존재하지만 포화 전. Klarna ($45B 최고가), Affirm ($10B+) 이 글로벌 모델 검증. 규제 취득 경로 존재하면 수익 풀 확인됨.

**Score ~90 — "오픈뱅킹 API 인프라 — 모든 은행/증권사 계좌 연결 데이터를 핀테크 앱에 제공, per-call 과금"**
전체 fintech ecosystem 이 의존하는 인프라. 한국 마이데이터 사업자 허가 기반 시장 $1-3B 추정. 미국 Plaid 는 동일 모델로 $13.4B 인수 시도 받음. 연결 API 수 × call volume × $0.05-0.30 = 대형 revenue pool 확인됨. Embedded finance 성장에 비례해 TAM 자동 확대.

## Platform Stats Handling

- `trend_direction` Rising → fintech 카테고리에서 투자자/규제 관심 상승 = 실제 시장 성장 시그널 (+3 to +5)
- `saturation_level` High → take rate 압박 심화 및 M&A 집중 (기존 player 가 신규보다 유리). TAM 은 실재하나 addressable slice 축소 (−3 to −5)
- `similar_count` low + 규제 변화 기반 신규 카테고리 → TAM 산출 불확실 (기존 시장 데이터 없음). 하지만 규제 mandate 가 시장을 강제 창출하는 경우 (+5 to +8)
- Fintech 은 **거래량과 수익을 반드시 구분** — "총 거래액 $1T" 는 take rate 0.1% 이면 $1B 매출. 아이디어 설명이 volume 만 제시하면 take rate 명시 요구하고 penalty
- 한국 대상이면 토스(23M 유저, $7B+ 가치), 카카오페이, 뱅크샐러드의 현황 반영 — 성숙한 한국 fintech 시장에서 추가 TAM 확보 가능성 체크
