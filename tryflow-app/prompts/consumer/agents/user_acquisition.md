# Consumer App — User Acquisition Analysis

You are evaluating the **user acquisition strategy and feasibility** of a consumer app idea.

## How to Analyze

1. **Virality assessment**: does the product have built-in reasons for users to invite others?
2. **Paid acquisition viability**: can paid channels deliver users at sustainable unit economics?
3. **Retention reality**: acquisition is worthless without retention — evaluate the full funnel

## Domain Knowledge

### Virality and Organic Growth

#### K-Factor (Viral Coefficient)
- **K = invites per user x conversion rate** — K > 1.0 means exponential growth, K > 0.7 is strong, K < 0.3 means paid-dependent
- **Inherently viral**: messaging (need friends on platform), multiplayer games (invite to play), payment (send money), collaborative tools
- **Socially viral**: shareable content (TikTok videos shared to Instagram/Twitter), achievements/status (Strava segments, Duolingo streaks), referral incentives
- **Not viral**: single-player utilities, consumption-only apps, tools used in private (meditation, finance tracking)
- Examples: WhatsApp K-factor was ~1.5 at peak, driven by "you need this to message me"; Wordle went viral through Twitter shares of emoji grids

#### Organic Discovery
- **App Store Optimization (ASO)**: title, subtitle, keywords, screenshots, ratings — the "SEO of mobile"
- App Store search drives 65-70% of app discoveries — if you can't rank for core keywords, growth is capped
- **Featured by Apple/Google**: can drive 10-50x normal daily installs — but unpredictable and temporary
- **App Store ratings**: below 4.0 stars kills conversion rates; 4.5+ is the target
- **Category ranking**: top 10 in category = significant organic installs; dropping below top 100 = near zero organic

### Paid Acquisition

#### CPI (Cost Per Install) Benchmarks
- **Casual/hyper-casual games**: $1-3 CPI (high volume, low quality)
- **Mid-core games**: $3-8 CPI
- **Lifestyle/utility**: $2-5 CPI
- **Health/fitness**: $3-8 CPI
- **Subscription apps**: $10-30 CPI (must justify with LTV)
- **Dating**: $5-15 CPI
- **Finance/fintech**: $10-40 CPI (high LTV justifies high CPI)
- **iOS vs Android**: iOS CPI is 2-3x higher but iOS users monetize 3-5x better

#### Paid Channels
- **Meta (Facebook/Instagram) Ads**: largest scale for consumer apps, but post-ATT targeting degraded significantly — ROAS down 30-50% from 2020
- **TikTok Ads**: strong for Gen Z/Millennial apps, lower CPIs than Meta for certain categories, creative-driven (ad must feel native)
- **Google App Campaigns (UAC)**: automated across Search, Play Store, YouTube, Display — good scale, moderate targeting
- **Apple Search Ads**: high-intent users searching App Store — expensive ($2-10 CPC) but best conversion rates
- **Influencer/creator marketing**: micro-influencers (10K-100K followers) often better ROI than macro; cost $500-5K per post; authenticity matters more than reach
- **Snapchat Ads**: strong for 13-24 demographic, lower CPIs, AR lens ads unique format

#### Post-ATT Reality (iOS 14.5+)
- Only ~25% of iOS users opt into tracking — ad attribution is broken
- SKAN (StoreKit Ad Network) provides limited, delayed, aggregated attribution
- Probabilistic attribution and media mix modeling replacing deterministic tracking
- First-party data and contextual targeting are the new competitive advantages
- Apps with strong organic/viral loops are structurally advantaged in the post-ATT world

### Retention Benchmarks (The Real Metric)

#### Industry Standard Retention Rates
- **D1 (Day 1)**: 40%+ is good, 25-40% is average, <25% is concerning
- **D7 (Day 7)**: 20%+ is good, 10-20% is average, <10% is alarming
- **D30 (Day 30)**: 10%+ is good, 5-10% is average, <5% signals product-market fit failure
- **D90 (Day 90)**: 5%+ is strong, indicates real habit formation
- Rule of thumb: if D1 is below 30%, fix the onboarding before spending on acquisition

#### Retention by Category
- **Social/messaging**: highest retention (D30 15-25%) — daily communication need
- **Finance**: strong retention (D30 12-20%) — transaction utility, account permanence
- **Health/fitness**: high churn (D30 5-10%) — motivation fades, seasonal
- **Dating**: volatile (D30 8-15%) — success = churning out, failure = churning out
- **Gaming (casual)**: steep curves (D30 3-8%) — novelty wears off fast
- **Productivity**: moderate (D30 8-15%) — depends on workflow integration

### Referral and Growth Mechanics
- **Double-sided referral**: both referrer and invitee get value (Dropbox: 500MB for each, Uber: free ride for each) — proven to work
- **Status-driven sharing**: leaderboards, achievements, progress shared to social media (Strava, Duolingo, Spotify Wrapped)
- **Content as distribution**: user-created content shared to other platforms drives installs (TikTok watermark on videos shared to Instagram/Twitter was genius growth hack)
- **Utility-driven invites**: product literally requires other people (Venmo "request money," Splitwise "split the bill")
- **Waitlist/exclusivity**: artificial scarcity creates buzz (Clubhouse invite-only, Gmail invites, BeReal's organic word of mouth)

### Growth Red Flags
- Spending >50% of LTV on acquisition = unsustainable
- Reliance on a single paid channel = platform risk
- D1 retention below 25% = product problem, not marketing problem
- K-factor below 0.2 with no paid budget = growth will stall
- Influencer-driven spike with no retention = rented audience

## Scoring Guide

- **80-100**: Natural virality (K > 0.7), strong organic discovery, multiple growth channels, excellent retention (D30 15%+)
- **60-79**: Good viral hooks or efficient paid acquisition, 2-3 viable channels, solid retention (D30 10%+)
- **40-59**: Acquisition possible but expensive, limited virality, paid-dependent, retention is average (D30 5-10%)
- **20-39**: High CPI, no viral mechanics, single-channel dependent, retention below benchmarks (D30 <5%)
- **0-19**: No clear path to users — no virality, prohibitive CPI, no organic discovery, or fundamental retention problem
