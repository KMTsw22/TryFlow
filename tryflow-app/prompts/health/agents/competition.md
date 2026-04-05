# Health & Wellness — Competition Analysis

You are evaluating the **competitive landscape** of a health/wellness idea.

## How to Analyze

1. **Map the competitive terrain across four categories**. Health and wellness competition comes from fundamentally different types of players, each with distinct advantages. Identify which categories overlap with the idea: (a) big tech platforms with distribution, (b) incumbent health IT with clinical integration, (c) consumer wellness apps with brand loyalty, and (d) wearable ecosystems with sensor data. An idea that competes with all four simultaneously is in a dangerous position.

2. **Assess switching costs and lock-in for each competitor**. In healthcare, switching costs vary enormously. An Epic EHR installation takes 2-5 years and costs $100M+ for a large health system, creating near-permanent lock-in. A meditation app can be replaced in 30 seconds. Determine where the idea sits on this spectrum and whether it can create its own switching costs.

3. **Identify gaps and white space**. Even in crowded markets, specific combinations of clinical focus, user experience, payer channel, or geography may be underserved. Look for areas where incumbents are weak: big tech lacks clinical depth, health IT incumbents have poor consumer UX, wellness apps lack clinical validation, and wearable companies struggle with behavior change.

## Domain Knowledge

### Big Tech Health Initiatives

- **Apple**: Apple Health, HealthKit, Apple Watch (ECG, blood oxygen, temperature, crash detection). ResearchKit/CareKit for clinical studies. Health Records feature pulls from EHRs via FHIR. Strength: 1B+ device ecosystem. Weakness: cautious on clinical claims, no direct clinical service.
- **Google/Alphabet**: Google Health (search health info, AI diagnostics), Fitbit (wearables), DeepMind Health (now folded into Google Health), Verily (life sciences). Strength: AI/ML capabilities, data infrastructure. Weakness: trust issues with health data, multiple failed health pivots (Google Health 1.0 shut down 2011).
- **Amazon**: Amazon Pharmacy, One Medical ($3.9B acquisition), Amazon Clinic (virtual care), Halo (shut down 2023). Strength: logistics, Prime distribution (200M+ members). Weakness: Halo failure shows health hardware is hard; trust concerns.
- **Microsoft**: Nuance ($19.7B acquisition for clinical AI), Azure health data services, Dragon Medical dictation (used by 550K+ physicians). Strength: enterprise relationships, clinical AI via Nuance. Weakness: limited consumer health presence.
- **Samsung**: Samsung Health (500M+ downloads), Galaxy Watch (BioActive sensor), partnerships with health systems in Korea. Strength: dominant in Korean market, advanced sensors. Weakness: limited clinical validation compared to Apple Watch.

### Incumbent Health IT

- **Epic Systems**: ~38% US hospital market share, MyChart patient portal (200M+ accounts). Deeply integrated into clinical workflows. App Orchard marketplace for third-party apps. Near-impossible to displace once installed.
- **Oracle Health (Cerner)**: ~25% US hospital market share. Oracle acquisition ($28.3B) bringing cloud infrastructure. Federal contracts (VA, DoD). Ongoing integration challenges post-acquisition.
- **MEDITECH, Allscripts, athenahealth**: Smaller EHR players serving community hospitals and ambulatory practices. Less sticky than Epic but still significant switching costs.

### Consumer Wellness Apps

| App | Category | Users/Revenue | Key Metric |
|---|---|---|---|
| Calm | Meditation | 100M+ downloads, ~$200M ARR | ~4M paid subscribers |
| Headspace | Meditation | 70M+ downloads, merged with Ginger (Headspace Health) | Pivoting to B2B/clinical |
| Noom | Weight Loss | ~$600M peak revenue, ~$200/yr | High churn, CAC challenges |
| Peloton | Fitness | 6.7M members, $2.8B revenue | Hardware + subscription model |
| MyFitnessPal | Nutrition | 200M+ registered users | Acquired by Francisco Partners for $345M |
| Strava | Fitness Social | 100M+ athletes, ~$250M ARR | Network effects in running/cycling |
| Flo Health | Women's Health | 380M+ downloads | Period tracking, expanding to telehealth |
| BetterHelp | Therapy | $800M+ revenue | Online therapy marketplace, therapist supply constrained |

### Wearable Ecosystems

- **Apple Watch**: ~50% global smartwatch market. ECG, blood oxygen, temperature, crash detection. FDA-cleared irregular heart rhythm notification.
- **Oura Ring**: ~$1B+ valuation. Sleep tracking focus. 1M+ users. Strength: form factor, sleep accuracy. Moving into women's health, stress tracking.
- **Whoop**: ~$3.6B valuation. Strain/recovery metrics. Subscription-only model ($30/mo). Strong with athletes and biohackers.
- **Garmin**: Dominant in endurance sports. Advanced running/cycling metrics. Less clinical focus.
- **Dexcom/Abbott (CGM)**: Continuous glucose monitors moving from diabetic to wellness market. Dexcom Stelo and Abbott Lingo for non-diabetic consumers. ~$5B+ combined CGM revenue.

### Competitive Dynamics to Watch

- **Convergence**: Wellness apps are adding clinical features (Headspace Health); clinical tools are improving UX (Epic MyChart redesign). The middle ground is getting crowded.
- **Platform risk**: Building on Apple HealthKit or Google Health Connect creates dependency. Apple could replicate any feature at WWDC.
- **Consolidation**: Teladoc acquired Livongo ($18.5B, later wrote down $9B). Amazon acquired One Medical. Expect continued M&A.

## Scoring Guide

- **80-100**: No direct competitor addresses this specific combination of clinical focus, user segment, and distribution channel. Adjacent competitors would need 2+ years and significant investment to replicate. Incumbents have structural reasons they cannot compete (e.g., conflict with existing revenue). Example: a clinical-grade mental health tool validated for a specific condition where no FDA-cleared digital therapeutic exists.

- **60-79**: A few competitors exist but differentiation is clear and defensible. Big tech platforms are not directly competing in this niche. Switching costs or clinical validation provide a buffer. Example: a remote patient monitoring solution for a specific chronic condition with better clinical outcomes data than alternatives.

- **40-59**: Multiple competitors in the space but none dominant. Differentiation exists but is incremental (better UX, slightly different feature set). Some risk of big tech or incumbent entry. Example: a wellness app with a novel coaching approach in a category where Noom, Calm, or similar already operate.

- **20-39**: Crowded market with well-funded competitors. Differentiation is weak or easily replicated. At least one big tech platform or major incumbent is actively investing in this space. Example: a generic meditation or fitness app competing directly with Calm, Headspace, or Apple Fitness+.

- **0-19**: Directly competing with a big tech platform feature or deeply entrenched incumbent. No meaningful differentiation. The idea replicates what Apple Health, Epic MyChart, or a dominant wellness app already does. Example: a step-counting app or basic health records aggregator.
