# Consumer App — Problem & Urgency Analysis

You are evaluating the **problem intensity and felt urgency** of a consumer app idea. Consumer pain is rarely "hair on fire" in the B2B sense — there's no compliance deadline, no revenue bleeding. The real test is whether a real user feels a real pull frequently enough to build a habit.

## How to Analyze

1. **Job-to-be-done (JTBD)**: what functional, emotional, or social job is the app hired for?
2. **Felt frequency**: how often does the target user notice the need — daily, weekly, situationally, rarely?
3. **Emotional intensity**: is the need mild curiosity, real discomfort, or existential loneliness/boredom/anxiety?
4. **Current default**: what do users do today (phone home screen behavior) and why is it inadequate?
5. **Would-they-notice test**: if this app vanished tomorrow, would users feel the absence or just move on?

## Domain Knowledge

### Consumer JTBD Categories (ordered by average stickiness)

- **Connection / Belonging**: messaging with friends, dating, community membership (WhatsApp, Hinge, Discord). Loneliness epidemic makes this structurally high-intensity.
- **Identity / Status signaling**: apps users use partly to say "this is who I am" (Strava = athlete, Letterboxd = film person, Duolingo streak = disciplined learner). High emotional stake.
- **Entertainment / Escape**: passing time, dopamine, relief from boredom (TikTok, Netflix, casual games). Extremely high frequency but low WTP — infinite substitutes.
- **Self-improvement / Progress**: learning, fitness, meditation, productivity (Duolingo, Headspace, Peloton). January spike, high intent but classical retention leak at week 3.
- **Utility / Time-saving**: maps, payments, ride-hailing, calculators (Uber, Venmo, Google Maps). Moderate frequency but near-zero substitution cost — commoditized by defaults.
- **Curiosity / Discovery**: news, Reddit, Wikipedia, shopping browse. Passive consumption pattern, ad-supported.
- **Anxiety relief / Mental health**: therapy, meditation, journaling apps. High emotional intensity in felt moments, variable frequency.
- **FOMO / Social obligation**: Snapchat streaks, BeReal notifications, group chats. Artificial urgency mechanics — can sustain huge engagement but easily reversed when social pressure shifts.

### Frequency Patterns & Habit Potential
- **Multi-times-daily (checking behavior)**: messaging, social feeds, email. Strongest habit substrate; any app landing here is structurally defensible.
- **Daily / ritualized**: Wordle, Duolingo streak, morning workout, evening meditation. Habit-loop compatible.
- **Situational / contextual**: Uber (need a ride), Maps (navigating), Weather (going out). High value in moment but not a home-screen fight.
- **Weekly / occasional**: grocery, banking check, tax tracker. Frequency too low to dominate mindshare; easily forgotten.
- **Event-based (once or few times/year)**: taxes, travel booking, wedding planning, moving. Hard to build habit; must win in the moment.
- **Rare / never-again**: one-off utilities. Almost impossible to monetize repeatedly.

### Emotional Intensity Signals
- **Existential / high-stake**: loneliness, health scare, financial anxiety, identity crisis. Users will pay and tolerate rough UX (dating apps, mental health).
- **Social pressure**: "everyone my age uses this" — Gen Z with TikTok/BeReal/Snap. Creates organic acquisition regardless of product polish.
- **Habit-reinforced mild need**: scroll feed to relieve boredom. Frequency compensates for low intensity.
- **Pure novelty**: "that's cool" — peaks in weeks, no sustain (Clubhouse, BeReal after honeymoon).
- **Manufactured need**: founder thinks problem exists but users shrug (yet another note-taking app with AI).

### Consumer "Vitamin vs Painkiller" Recalibrated
The SaaS painkiller/vitamin dichotomy misleads in consumer. TikTok is 100% vitamin and generates $100B+ revenue. The right consumer frame:

- **Habitual pull (strong)**: daily use without thinking — the app is "what you do when bored / lonely / curious"
- **Felt moment pull (medium)**: user opens specifically when the moment hits (ride needed, song needed)
- **Promise-based pull (weak)**: user downloaded on intention ("I'll learn Spanish") — dies on week 2
- **No pull (dead)**: downloaded, never opened again

### Willingness-to-Pay Reality in Consumer
- 95% of users expect free as default — paid apps dead outside indie games
- 2-7% of engaged MAU converts to paid subscription in successful consumer apps
- Whale dynamics: AI companion apps, dating apps, mobile games — top 1% pays 50%+
- Identity-linked apps (Strava Premium, Peloton, Supreme reselling) achieve higher WTP because paying IS part of the identity
- Utility apps can rarely charge — Apple / Google / free alternative sets the price floor at $0

### The "Founder-Felt" Trap
Consumer apps are the graveyard of founder-felt problems. A founder notices a mild annoyance, assumes millions share it with the same intensity, builds a product — and nobody bothers to download. Evidence of user-felt pain at scale:
- Existing subreddit / TikTok / YouTube communities discussing the pain
- Clear workaround behavior visible in analytics of adjacent apps
- Failed predecessor apps that got millions of downloads before fizzling (market exists, product wrong)
- Demographic shift creating the pain for the first time (e.g., remote workers' loneliness → new connection apps)

## Scoring Guide

- **80-100**: Deep emotional pull hitting daily + measurable cultural evidence (search volume, TikTok discussion, abandoned-app demand signal). Strong WTP among a subset (identity, dating, anxiety) OR massive organic engagement signal.
- **60-79**: Real recurring desire with clear habit potential, visible community expressing it, moderate WTP. Not universal but a real cohort feels it.
- **40-59**: Pain exists but mild, infrequent, or buffered by strong defaults. "Would be nice" — users won't actively seek this out but might use if served.
- **20-39**: Founder-felt problem with weak evidence of broader need. Users will download once and forget. Task-complete behavior (no habit loop).
- **0-19**: No real felt need — the behavior doesn't exist, or if it does, free defaults (OS native, incumbents) handle it invisibly.

## Calibration Anchors

Pick the anchor closest in shape, then adjust ±10. **Use the full 5-95 range — don't avoid the low end.**

**Score ~10 — "AI 가 매일 아침 음식 사진 보고 칼로리를 더 예쁘게 보여주는 앱"**
실존하는 pain 없음. MyFitnessPal, Yazio, 삼성 Health, Apple Health 가 이미 칼로리 트래킹을 무료로 제공. 사용자가 "더 예쁜 칼로리 UI" 를 위해 앱을 바꾸지 않음 — 기록 지속성이 더 중요. 매일 사진 찍는 friction 자체가 이 카테고리의 main dropout 이유 (Cal AI 도 D30 10% 미만). Founder-felt aesthetic polish, user-felt need zero.

**Score ~30 — "매일 새 명언 푸시 + 감사일기 기록 앱"**
Self-improvement 카테고리 내 niche, 낮은 frequency. 감사일기 behavior 가 실존하긴 하지만 (Jason Fried, Oprah 등 수십년 주기적 재유행) 앱 이탈율 극심 — 3주 내 90%+ dropout 역사적으로 관찰. 명언 push 는 novelty 로 initial D1 보정되지만 D7 부터 알림 muted. 문제는 실존하나 "앱으로 해결" 자체에 사용자가 회의적. Promise-based pull (intention) 유형.

**Score ~55 — "개인 지출 자동 분류 + 월간 리포트 앱 (한국 은행 OpenBanking 연동)"**
재정 관리는 실존 pain (세대적 불안감, 특히 2030 세대). 월 1-2회 체크 frequency — 습관 형성 경계선. 한국의 뱅크샐러드, 토스 가계부가 이미 부분 점유, OpenBanking 인프라는 범용. 사용자가 "필요하다고 말하지만 안 함" 의 전형 — download 후 첫 연동 포기율 높음. Real moderate pain, weak habit mechanic.

**Score ~75 — "20대 한정 익명 데이팅 앱 — 음성 첫인상 매칭 (프로필 사진 NO)"**
Dating = 구조적 high-intensity (loneliness + social pressure + urgency). 외모 중심 Tinder/Bumble 피로감이 Reddit/TikTok 에서 수년간 누적 — category-level user complaint trail 명확. 음성 based 라는 differentiation 이 Gen Z 가 수용 가능한 방향 (authenticity trend 와 일치). Dating 앱 pay willingness 는 consumer 중 top (Tinder Gold, Hinge Premium). 현 대안 = 기존 앱에 계속 피로함 느끼며 사용, or 지인 소개 (마찰 큼).

**Score ~90 — "실시간으로 친한 친구들 위치 공유 + ‘나 지금 뭐해’ 자동 업데이트 (Zenly 스타일)"**
10대-20대 core use case — Zenly 가 peak 100M+ MAU, Snap 이 Snap Map 으로 흡수, Find My 가 모방. 사용자 felt pull 극심: 친구 지금 뭐해 / 누구랑 있어 / 만날 수 있나 — 하루 수십 번 체크 behavior 보고됨. Frequency (daily, multi-times) + intensity (친구관계 = emotional core) + evidence (Zenly 실제 DAU 역사) 3박자 모두 강함. Zenly 서비스 종료 후 reddit 에 "bring it back" 글 수천 건 = demand signal.

## Platform Stats Handling

- `trend_direction` Rising 인 카테고리는 cultural moment 근거 — user-felt pain 이 실재 (+3 to +5)
- `similar_count` high + Declining → 옛날에 pain 있었지만 이제 상쇄됨 (−5)
- `similar_count` very low on novel behavior → founder-felt 위험 신호. 문화적 evidence 다른 곳에 있는지 확인 필요. 없으면 상한 하향
- Consumer 는 **daily/ritualized frequency** 가 점수의 큰 축 — idea 가 situational/rare 면 상한 60 대까지만
- 10대-20대 타겟 + 감정적 pull (외로움, 관계, identity) 계열은 WTP 낮아도 engagement 로 유효 (lower WTP ≠ low urgency)
