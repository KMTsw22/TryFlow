# Consumer App — Regulation Analysis

You are evaluating the **regulatory environment** of a consumer app idea.

## How to Analyze

1. **Identify applicable regulations** based on user demographics, data collected, content type, and geography
2. **Assess platform gatekeepers** — App Store and Play Store policies can be more restrictive than law
3. **Check for regulatory tailwinds** — new rules that create demand or eliminate competitors

## Domain Knowledge

### App Store Policies (The "Real" Regulators)
- **Apple App Store & Google Play 30% cut**: all in-app purchases, subscriptions (drops to 15% after year 1 on Apple for subscriptions, 15% for small developers <$1M revenue)
- **Apple App Review**: can reject apps for subjective reasons — average review 24-48 hours, rejections cause launch delays
- **Reader app rules**: apps like Spotify, Netflix can link to external signup after EU DMA, but friction remains
- **Gambling/loot boxes**: many jurisdictions now require odds disclosure; Belgium and Netherlands ban certain loot box mechanics
- **Subscription transparency**: Apple requires clear cancellation flow, no dark patterns, auto-renewal disclosures
- **App Tracking Transparency (ATT)**: Apple's iOS 14.5+ prompt destroyed ad attribution — opt-in rates ~25%, decimated ad-funded business models (Meta lost ~$10B/year in revenue)

### Child Safety (COPPA and Beyond)
- **COPPA** (US): apps directed at children under 13 require verifiable parental consent, no behavioral advertising, strict data minimization
- **Age-gating**: if your app could attract minors, you need age verification — increasingly enforced
- **KOSA** (Kids Online Safety Act): proposed US legislation requiring duty of care for platforms accessible to minors
- **UK Age Appropriate Design Code**: 15 standards for apps likely accessed by children, including default privacy settings
- **App Store age ratings**: incorrect ratings lead to removal — 4+, 9+, 12+, 17+ have real content restrictions

### Content Moderation
- **DMCA** (US): safe harbor requires prompt takedown of infringing content, designated DMCA agent
- **EU Digital Services Act (DSA)**: transparency reports, illegal content removal within hours, risk assessments for large platforms (45M+ EU users)
- **Section 230**: protects platforms from liability for user content in US — but political pressure to reform
- **Content-related risks**: UGC platforms must handle hate speech, CSAM, misinformation, copyright — moderation at scale costs $0.01-0.10 per piece of content
- **AI-generated content**: emerging requirements for disclosure, watermarking, deepfake restrictions

### Data Privacy
- **GDPR** (EU): explicit consent for data collection, right to deletion, data portability — fines up to 4% of global revenue
- **CCPA/CPRA** (California): consumer data rights, opt-out of sale, right to know
- **Biometric data**: Illinois BIPA ($1,000-5,000 per violation), Texas, Washington — facial recognition, voice prints, fingerprints require explicit consent
- **Health data**: if collecting health/fitness data outside HIPAA-covered entities, FTC Health Breach Notification Rule applies
- **Location data**: precise location requires explicit consent and clear disclosure; selling location data increasingly restricted
- **Financial data**: if facilitating payments or holding funds, potential money transmitter licensing, PCI compliance

### Emerging Regulatory Trends
- **AI regulation**: EU AI Act classifies risk levels; biometric categorization and emotion recognition face restrictions
- **Age verification mandates**: multiple US states requiring age verification for social media (Utah, Texas, Louisiana)
- **Platform interoperability**: EU DMA requires messaging interoperability for gatekeepers
- **Algorithmic transparency**: growing pressure to explain recommendation algorithms

### Regulatory Tailwinds (Opportunity)
- Privacy regulations drive demand for privacy-first alternatives (Signal, DuckDuckGo benefited from privacy awareness)
- ATT disruption created opportunity for contextual advertising and first-party data tools
- Content moderation mandates create demand for safety/trust tools

## Scoring Guide (Higher = Easier)

- **80-100**: Minimal regulation — no UGC, no sensitive data, no children, standard App Store compliance only
- **60-79**: Standard compliance — GDPR, basic content moderation, straightforward App Store approval
- **40-59**: Moderate regulation — health/financial data, UGC moderation at scale, COPPA considerations
- **20-39**: Heavy regulation — biometric data, children as primary audience, gambling mechanics, financial services licensing
- **0-19**: Prohibitive — requires medical device approval, financial licenses across jurisdictions, or legally gray territory (crypto, cannabis, adult content)
