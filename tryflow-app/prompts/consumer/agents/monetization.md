# Consumer App — Monetization Analysis

You are evaluating the **monetization potential** of a consumer app idea.

## How to Analyze

1. **Pricing model fit**: which model aligns with the user behavior and value delivered?
2. **Unit economics**: what does LTV, ARPU, and margin look like at scale?
3. **Platform tax**: how does the Apple/Google 30% cut affect viability?

## Domain Knowledge

### Monetization Models

#### 1. Freemium / Subscription
- Most proven consumer model — free tier drives adoption, premium unlocks full value
- Conversion benchmarks: 2-5% free-to-paid is healthy, 5-10% is excellent (Spotify ~3%, Duolingo ~8%)
- Subscription fatigue is real: average US consumer has 4-5 paid app subscriptions and resists adding more
- Annual pricing at discount (e.g., $59.99/yr vs $7.99/mo) improves retention and LTV
- Apple/Google take 30% year 1, 15% year 2+ for auto-renewing subscriptions

#### 2. In-App Purchases (IAP)
- Virtual goods, consumables, cosmetics, credits, tips — dominant in gaming and social
- Whale economics: top 1-2% of users generate 50-80% of IAP revenue
- Examples: Fortnite ($5.8B cumulative), Candy Crush ($1B+/year), TikTok gifts
- Non-consumable IAP (unlock forever) worse for LTV than consumables (buy repeatedly)
- Apple/Google 30% cut applies to all IAP

#### 3. Advertising
- **CPM benchmarks**: US iOS rewarded video $15-30, banner $1-5, interstitial $5-15, native $5-15
- Requires massive scale: 1M DAU minimum to build meaningful ad revenue
- ATT impact: post-iOS 14.5, ad CPMs dropped 30-50% for non-consented users
- Ad-supported models work for: casual games, utilities, news, weather, content aggregation
- Risk: ad revenue is volatile, platform-dependent, and creates misaligned incentives (engagement farming)

#### 4. Marketplace/Transaction Fees
- Take rate benchmarks: Airbnb 14-20%, Uber 25-30%, Etsy 6.5%, Fiverr 20%
- Works for: marketplace apps connecting buyers and sellers, service platforms
- Must reach liquidity: both supply and demand side at critical mass before monetization

#### 5. Hybrid Models
- Spotify: freemium + ads on free tier + premium subscription
- YouTube: ads + YouTube Premium subscription + Super Chat IAP
- Tinder: free tier + Tinder Plus/Gold/Platinum subscriptions + a la carte boosts (IAP)
- Best consumer apps layer multiple revenue streams

### ARPU Benchmarks by Category
- **Dating**: $15-20/month (highest consumer ARPU — Tinder ARPU ~$16)
- **Fitness/wellness**: $10-15/month (Peloton App $12.99, Calm $14.99, Strava $11.99)
- **Music/audio**: $10-13/month (Spotify $13.99, Apple Music $10.99)
- **Productivity/tools**: $5-10/month (Notion Personal $10, Todoist $5)
- **News/content**: $5-15/month (NYT $4.25-17, The Athletic $9.99)
- **Casual gaming**: $0.05-0.50/DAU from ads + IAP (low per user, massive volume)
- **Education**: $7-15/month (Duolingo $7.99, Headspace $12.99)

### The Platform Tax Problem
- Apple and Google take 30% of in-app revenue (15% for small developers under $1M/year on Apple)
- This effectively means: your $9.99/month subscription yields $6.99 to you
- Workarounds: web-based signup (Netflix, Spotify bypass), "reader app" exemption, linking to external payment (now allowed in EU under DMA)
- Epic Games v. Apple partially opened alternative payment options but adoption remains low
- Budget for 30% cut in unit economics — if margins don't work with the cut, the model is broken

### Key Unit Economics
- **LTV**: (ARPU x gross margin) / churn rate — target 3x+ of CAC
- **Payback period**: <6 months for consumer (users churn faster than B2B)
- **Gross margin**: subscriptions 70-85%, ad-supported 50-70%, marketplace 60-80%
- **Churn**: monthly subscription churn 5-15% for consumer apps (much higher than SaaS)
- **Day 30 retention x ARPU** is the best quick proxy for monetization health

### Subscription Fatigue Signals
- Users increasingly cancel subscriptions they don't use weekly
- Free alternatives erode willingness to pay (why pay when a free app is "good enough"?)
- Bundle competition: Apple One, Google One, Amazon Prime bundle multiple services cheaply
- Lifetime deals and annual pricing can mitigate churn but reduce near-term revenue

## Scoring Guide

- **80-100**: Proven willingness to pay in category, healthy ARPU ($10+/month), multiple revenue streams, margins work after platform cut
- **60-79**: Good model fit, reasonable ARPU ($5-10/month), clear free-to-paid conversion path
- **40-59**: Monetization possible but unproven — low ARPU, ad-dependent, or severe subscription fatigue in category
- **20-39**: Hard to monetize — users expect free, ad economics require unrealistic scale, 30% cut kills margins
- **0-19**: No clear monetization path — commodity utility, users will never pay, and scale for ads is unreachable

## Calibration Anchors

Pick the anchor closest in shape, then adjust ±10. **Use the full 5-95 range.**

**Score ~10 — "익명 메시지 게시판, 광고 없음, 구독 없음, 그냥 무료"**
수익 모델 자체가 부재. 사용자 지불 의향 zero, 광고 거부 명시, 구독 거부. Yik Yak / Whisper 이 이 패턴으로 망함. 서버·모더레이션 비용만 누적. ARPU $0. Apple/Google 30% 차감 이전에 매출 라인 자체가 없음.

**Score ~30 — "AI 관상 앱, 월 ₩3,900 구독"**
낮은 ARPU + churn 극심 (novelty 기반이라 3개월 뒤 이탈 90%+). $3/month 이 Apple 30% 차감 후 $2.10. 유의미 scale (100K paying) 에 도달해도 $210K/month 천장. Consumer ARPU 하위권. 광고 붙여도 DAU 작아서 CPM 무의미.

**Score ~70 — "피트니스 앱, 월 $12.99 / 연 $79.99 subscription"**
Fitness 카테고리 평균 ARPU $10-15/월 대 적합. 3-5% 전환율 healthy. Strava/Peloton 선례로 WTP 검증됨. 연 pricing 으로 churn 완화, 30% 차감 후에도 LTV 작동. 다이어트·습관 형성 같은 지속 가치가 churn 낮춤.

## Platform Stats Handling

- `saturation_level` High 인 성숙 카테고리 (dating, fitness, music) → subscription 경제 이미 검증됨, pricing power 유지 가능
- `saturation_level` High 인 commodity 카테고리 (general utility, basic social) → subscription 거부감 강함, 광고 레이스 불가피
- `trend_direction` Rising → 시장 spend 증가 신호 (+3 to +5), expansion 가능성
- Consumer 는 **platform tax 30% 항상 반영** — 계산식에서 Apple/Google 차감 후 경제성 따져야 함
- Subscription fatigue 가 점점 커지는 추세 — ad-supported + freemium hybrid 가 안전한 기본값
