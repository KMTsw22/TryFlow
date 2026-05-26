# Consumer App — Defensibility Analysis

You are evaluating the **defensibility and moat potential** of a consumer app idea.

## How to Analyze

1. **Identify moat types**: which competitive advantages can this product build over time?
2. **Time to moat**: how quickly does the moat become meaningful?
3. **Moat durability**: will these advantages hold as the market evolves?

## Domain Knowledge

### Moat Types in Consumer Apps (ranked by strength)

#### 1. Network Effects
- **Direct network effects**: each new user makes the product more valuable for all users (WhatsApp, iMessage, Venmo)
- **Cross-side network effects**: more creators attract more consumers and vice versa (TikTok, YouTube, Airbnb)
- **Local network effects**: value concentrates in geographic or social clusters (Nextdoor, Uber in a city)
- **Data network effects**: more users generate more data, improving recommendations/matching (Spotify Discover Weekly, TikTok For You page)
- Network effects are the single strongest consumer moat — but they take time to build and can collapse if a critical mass leaves (Friendster, Vine, Clubhouse)
- Metcalfe's Law: value of network proportional to n-squared — but only applies once past critical mass

#### 2. Habit Formation (The "Frequency Moat")
- **Daily use = defensible**: apps used daily become automatic behavior (Instagram, WhatsApp, Duolingo streaks)
- **Weekly use = vulnerable**: users can be pulled away by a better alternative
- **Monthly use = dead**: not enough frequency to build habit, easily forgotten and uninstalled
- Hook Model (Nir Eyal): Trigger → Action → Variable Reward → Investment — apps that complete this loop daily are nearly unbreakable
- Examples of habit moats: Wordle (daily ritual), Snapchat Streaks (loss aversion), Duolingo (streak + guilt notification)
- Internal triggers (boredom, loneliness, curiosity) are stronger than external triggers (push notifications)

#### 3. User-Generated Content (UGC) Moat
- Users create content that becomes the product itself — impossible to replicate by cloning the app
- **Content libraries**: years of posts, photos, videos, reviews create irreplaceable value (Instagram history, Reddit threads, Yelp reviews)
- **Content graphs**: relationships between content, users, and context build unique recommendation capability
- **Creator investment**: creators who built audiences on your platform resist switching (YouTube creators with millions of subscribers)
- Examples: TikTok (100M+ videos/day), Reddit (20+ years of threads), Wikipedia, Waze (user-reported traffic)

#### 4. Brand Identity and Emotional Moat
- **"Can it become a verb?"** — "Google it," "Uber there," "Venmo me," "FaceTime you" — verb status = ultimate brand moat
- **Identity signaling**: using the app says something about who you are (Strava = serious athlete, Letterboxd = film person, Goodreads = reader)
- **Community belonging**: users feel part of a tribe (Peloton community, Reddit subreddits, Discord servers)
- **Aesthetic/design brand**: distinctive visual identity that becomes cultural (Instagram's square photos era, Snapchat's ghost)
- Brand moat is real but takes years to build and can erode quickly with bad product decisions

#### 5. Creator/Supply-Side Ecosystem
- **Creator tools**: editing, analytics, monetization features that make creators productive on your platform
- **Revenue sharing**: creators earning money on your platform won't leave easily (YouTube Partner Program, TikTok Creator Fund, Twitch subscriptions)
- **Creator-audience bond**: relationships built on-platform are sticky — creators fear losing their audience
- **Third-party integrations**: developer ecosystem built on your platform (Roblox developers, Snapchat Lens creators)
- Example: YouTube's creator ecosystem is its deepest moat — over 2M creators in the Partner Program earning real income

### What Is NOT a Moat
- **Features**: any feature can be copied in weeks (Clubhouse audio rooms → Twitter Spaces → Spotify Greenroom)
- **First-mover advantage**: rarely matters in consumer — Facebook beat MySpace, Instagram beat Hipstamatic, TikTok beat Vine
- **VC funding**: more money does not create defensibility
- **Downloads/installs**: vanity metric — retention is what matters

### Time to Moat
- **0-3 months**: basic habit formation, initial content library (fragile)
- **3-12 months**: growing UGC, emerging community identity, early network effects
- **1-3 years**: strong network effects, creator ecosystem, brand identity established
- **3+ years**: verb status, cultural institution, multi-sided ecosystem with deep lock-in

## Scoring Guide

- **80-100**: Multiple compounding moats — strong network effects + daily habit + rich UGC + creator ecosystem (e.g., TikTok, Instagram, WhatsApp)
- **60-79**: One strong moat forming — clear network effect or daily habit potential, with path to additional moats
- **40-59**: Moderate defensibility — some habit potential or content advantage, but replicable with effort
- **20-39**: Weak moat — feature-driven differentiation, infrequent use, no network effects, easily cloned
- **0-19**: No moat — commodity utility, no network effects, no habit, no content, trivial to replicate

## Calibration Anchors

Pick the anchor closest in shape, then adjust ±10. **Use the full 5-95 range.**

**Score ~10 — "GPT-4 한국어 wrapper 챗봇 앱 — 대화만 하고 끝"**
순수 LLM API wrapper. 데이터 축적 zero (사용자 대화는 OpenAI 가 가져감), 네트워크 효과 zero (혼자 챗봇 과 대화), UGC zero, 창작자 생태계 zero, 브랜드 zero. 주말에 누구나 복제. OpenAI 가 한국어 강화하면 즉시 무력화. 습관 형성 어려움 (novelty 기반).

**Score ~30 — "월간 취미 커뮤니티 앱 (예: 달리기 기록 공유)"**
습관 형성 약함 (월 1-2 회 사용 빈도), UGC 있지만 규모 작음, 네트워크 효과 있으나 Strava 가 이미 카테고리 지배. Community 감각 일부 있으나 brand 와 identity signaling 약함. 복제 가능하지만 feature 이상의 wedge 존재.

**Score ~70 — "특정 skill 기반 학습 앱 with streaks + leaderboard + 사용자 컨텐츠 (Duolingo 형태)"**
매일 사용 유도 (streaks = 습관 moat), 사용자 데이터 누적 (progress history 이동 불가), 학습 커뮤니티 효과, 소셜 leaderboard 로 pull. Duolingo 같은 수준 도달 시 verb status 가능. UGC + habit + 약한 network effect 조합.

## Platform Stats Handling

- `similar_count` high + `trend_direction` Rising → 네트워크 효과 경쟁 격화, 선점자 이미 moat 형성 중 → 후발주자는 moat 실현 어려움 (-5 to -8)
- `similar_count` low + 아직 범주 형성 중 → moat 형성 window 열려있음 (적절한 메커니즘 있으면 +3 to +5). 하지만 "아무도 안 한다" 자체가 green light 아님
- Consumer 는 **habit formation = 핵심 moat** — idea 가 daily-use 유도 구조면 기본적으로 +5 to +10
- network effects 는 모든 idea 에 적용 안 됨 — "혼자 쓰는 앱" (날씨, 계산기) 은 구조적으로 network moat 불가능, 상한 낮춤
