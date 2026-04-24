# Fintech — Defensibility Analysis

You are evaluating the **defensibility** of a fintech idea.

## How to Analyze

1. **Identify the moat types available in financial services**. Fintech has unique moat dynamics: regulatory licenses are expensive barriers to entry, financial data creates powerful network effects, and switching costs for primary financial relationships are extremely high. Assess which moats the idea can realistically build and how long they take to become meaningful.

2. **Evaluate the switching cost and account primacy**. The strongest fintech moat is becoming the "primary" financial relationship — where the user's paycheck deposits, where they spend, where their savings sit. Primary banking relationships have <5% annual churn. Secondary/peripheral financial apps (budgeting, investing side accounts) have much weaker retention. Assess where the idea sits on this spectrum.

3. **Test the data flywheel**. Financial data compounds: more transaction data → better risk models → better pricing → more customers → more data. Companies like Plaid, Upstart, and Stripe leverage data network effects that are nearly impossible to replicate without similar scale. Evaluate whether the idea generates proprietary financial data that improves the product over time.

## Domain Knowledge

### Moat Types in Fintech (ranked by strength)

#### 1. Regulatory Moat
- **Banking charter**: takes 1-3 years, $10-50M+ to obtain. SoFi, LendingClub, Varo have charters. Enables direct lending, deposit-taking without partner bank dependency.
- **Money transmitter licenses**: required in 49 US states + DC. $500K-2M+ in bonds and compliance. Takes 12-24 months.
- **Broker-dealer registration**: FINRA + SEC. 6-12 months, $500K+ compliance. Required for securities trading.
- **Insurance licenses**: state-by-state, 6-18 months per state.
- Regulatory compliance costs $1-5M+/year for ongoing maintenance — this is a barrier for new entrants.

#### 2. Network Effects
- **Payment networks**: two-sided (payers + payees). Cash App, Venmo, Zelle — value increases with each user. Winner-take-most dynamics.
- **Data network effects**: more transactions → better fraud detection → lower losses → lower pricing → more merchants (Stripe's model).
- **Marketplace effects**: lending platforms connecting borrowers and investors (LendingClub), wealth platforms connecting advisors and clients.
- Payment network effects are among the strongest moats in all of technology.

#### 3. Switching Costs
- **Primary banking relationship**: direct deposit, autopay, linked accounts — switching requires updating 10-20+ payment connections. Average US consumer has had their primary bank for 17 years.
- **Merchant payment processing**: POS systems, integrations, employee training. Switching from Square to Toast costs time and retraining.
- **Financial data history**: years of transaction data, credit history, tax records create institutional knowledge that's painful to recreate elsewhere.
- **Integration depth**: API integrations with accounting software, ERP, payroll — deeper integration = higher switching cost.

#### 4. Trust & Brand
- **Financial trust**: consumers are more cautious with money than with any other product category. Brand trust takes years to build.
- **FDIC insurance**: partnership with FDIC-insured banks or owning a charter provides trust signal.
- **Track record**: years of operation without security incidents, smooth account operations.
- **Institutional credibility**: enterprise clients require SOC 2, PCI-DSS, and references.

#### 5. Proprietary Risk Models / Data
- **Credit scoring**: alternative data models (Upstart uses 1,600+ variables vs. FICO's ~20). Requires large data sets to train and validate.
- **Fraud detection**: ML models trained on millions of transactions. More transactions = better detection.
- **Underwriting**: proprietary algorithms for loan pricing, insurance risk assessment.
- Takes 2-3 years and millions of transactions to build meaningful proprietary models.

### Time to Moat

| Moat Type | Time to Build | Durability |
|---|---|---|
| Banking charter | 1-3 years | Very High (permanent regulatory advantage) |
| Money transmitter licenses | 1-2 years | High (ongoing compliance required) |
| Payment network effects | 2-5 years | Very High (winner-take-most) |
| Primary account switching costs | 6-18 months (per user) | Very High (<5% annual churn) |
| Proprietary risk models | 2-3 years | High (requires scale data to replicate) |
| Brand trust | 2-5 years | High (but can be destroyed instantly) |
| Integration depth | 6-18 months | Medium-High |

### Cautionary Tales

- **Synapse (BaaS)**: shut down in 2024, stranding customer deposits. Showed the risk of middleware fintech without own charter. Partner bank dependency is fragile.
- **Chime**: massive growth but regulatory scrutiny over calling itself a "bank" without a charter. Eventually obtained banking license.
- **Robinhood**: gamification controversy, GameStop trading halt, $70M FINRA fine. Brand trust is fragile in finance.

## Scoring Guide

- **80-100**: Multiple strong moats compounding. Regulatory license + network effects + deep switching costs. Competitors need years and significant capital to replicate. Example: a chartered neobank with primary account status, payment network, and proprietary credit scoring from millions of transactions.

- **60-79**: One strong moat with potential for more. Either regulatory advantage, meaningful switching costs, or data network effects beginning to compound. Example: a vertical fintech with money transmitter licenses in 30+ states and deep integration with industry-specific workflows.

- **40-59**: Moderate defensibility. Some switching costs or integration depth, but no regulatory moat or network effects. Product is good but replicable by a well-funded competitor. Example: a financial management tool with moderate user data but no proprietary risk models or regulatory barriers.

- **20-39**: Weak moat. Primarily UX advantage or marketing spend. No regulatory barriers, minimal switching costs, no data network effects. Example: a budgeting app with nice design but no proprietary data advantage, competing with free bank features.

- **0-19**: No moat. Commodity financial product, no regulatory advantage, trivial switching costs. Any neobank or mega-fintech can replicate. Example: a basic payment splitting app or expense tracker.

## Calibration Anchors

Pick the anchor closest in shape, then adjust ±10. **Use the full 5-95 range.**

**Score ~10 — "UI 예쁜 가계부 앱, 오픈뱅킹 연동, 무료"**
데이터 누적 없음 (거래 내역은 은행 서버에 있음), 네트워크 효과 없음, 규제 장벽 없음, 스위칭 비용 없음. 브랜드 아무것도 없음. 뱅크샐러드, 토스가 동일 기능 무료 제공. 주말에 복제 가능. No moat of any kind.

**Score ~25 — "BNPL 앱, 기존 신용카드 가맹점 네트워크 연동"**
카드 네트워크 외부에서 접근 → Visa/Mastercard merchant 를 재활용하지만 해당 네트워크 자체는 소유 못 함. 독자 가맹점 계약 없으면 switching cost = 0 (merchant 가 Affirm 대신 Klarna 쓰면 그만). 신용 모델이 proprietary 하지 않으면 risk model = FICO 의존 → commodity. 규제 취득 (money transmitter) 은 있지만 경쟁자도 동일하게 가능.

**Score ~52 — "HR/급여 플랫폼 연동 earned wage access 서비스 (ADP, 더존 파트너십)"**
스위칭 비용 = 고용주의 HR 소프트웨어 교체 마찰. Integration depth 中 수준. 직원이 개인적으로 직접 이탈하기 어려움 (고용주 계정에 묶임). 하지만 HR 벤더 자체가 동일 기능 내장 시 즉시 대체됨 (ADP 자체 earned wage access 출시 가능). Moderate switching cost + partner dependency risk.

**Score ~68 — "AI 기반 대출 심사, 대안 데이터 2년치 누적 (배달 이력, 임대 납부 등), 승인율 +35%"**
2년치 데이터 누적 = 후발 복제 어려움 (데이터가 없으면 모델 못 만듦). 승인율 개선이 증명될수록 데이터 → 고객 → 더 많은 데이터 flywheel. 하지만 규제 라이센스 (대부업, 여신업) 는 시간이 걸릴 뿐 복제 가능. 모델 특허 없으면 알고리즘 구조 자체는 공개될 수 있음. Data flywheel 있지만 regulatory moat 없어 한계.

**Score ~88 — "은행업 인허가 보유 디지털 뱅크 (직접 예금 수취, 대출, 결제 가능)"**
Banking charter = 1-3년 + $10-50M 자본 요건. 후발주자가 동일 규제를 통과하는 데 동일한 시간과 비용 필요 → 진입 장벽이 시간 자산. 여기에 primary account 스위칭 비용 (자동이체 20개 변경 = 평균 10시간) + 데이터 flywheel (거래 → 리스크 모델 → 더 좋은 금리 → 더 많은 고객) 복합. SoFi, Varo 가 이 경로로 moat 쌓는 중.

## Platform Stats Handling

- `similar_count` High + Fintech → 선점자가 이미 regulatory moat 형성 중. 후발주자가 동일 라이센스 없으면 defensibility 심각하게 낮아짐 (−8 to −12)
- `trend_direction` Rising + 규제 변화 카테고리 → 규제 선취 player 에게 유리한 timing. 먼저 라이센스 취득하면 moat window 열려있음 (+3 to +5)
- `similar_count` very low + 신규 규제 기반 → 규제 자체가 진입장벽 역할. 라이센스 선점 시 moat 가능 (+5 to +8)
- Fintech 의 핵심 moat 체크리스트: (1) 규제 라이센스 보유 여부, (2) primary account 지위 가능성, (3) 거래 데이터 flywheel 구조 — 이 3가지 없으면 상한 50대
- **Synapse 교훈**: BaaS 미들웨어 만으로는 regulatory moat 없음. 파트너 은행 의존 = 단일 실패 지점 → 라이센스 독립성 평가 중요
