# Health & Wellness — Monetization Analysis

You are evaluating the **monetization strategy** of a health/wellness idea.

## How to Analyze

1. **Identify the primary revenue model and benchmark against comparable companies**. Health and wellness monetization models vary dramatically in unit economics, scalability, and sales cycle. A B2C subscription at $10-30/month is the fastest to launch but faces brutal churn (~10% monthly in wellness apps, meaning you replace your entire user base annually). B2B sales to hospitals take 6-18 months but yield $100K-$1M+ annual contracts. Map the idea to the most appropriate model and validate with real comparables.

2. **Assess the path from first dollar to scale revenue**. Many health companies die in the "valley of death" between product launch and revenue scale. B2B2C models (selling through employers or insurers) require proving ROI with pilot data before scaling. Hospital sales require navigating procurement committees, IT security reviews, and clinical validation requirements. Determine how long it takes to go from launch to $1M ARR and then to $10M ARR.

3. **Evaluate revenue durability and expansion potential**. The best health business models have low churn (clinical tools embedded in workflows), expansion revenue (upselling from one department to an entire health system), and multiple revenue streams (subscription + outcomes-based + data licensing). Assess whether the idea can build durable, growing revenue or is stuck in a high-churn consumer loop.

## Domain Knowledge

### B2C Subscription Model ($10-30/month)

- **Benchmarks**: Calm ($70/yr), Headspace ($70/yr), Noom (~$200/yr or ~$60/mo for shorter plans), BetterHelp ($60-90/week), Peloton App ($13/mo or $44/mo all-access).
- **Churn reality**: Consumer wellness apps see 5-12% monthly churn. Noom's annual retention is estimated at ~20%. BetterHelp retains users ~3-4 months on average. Meditation apps have 95%+ annual churn for free-to-paid converts.
- **CAC**: $50-200 for wellness apps (social/content marketing), $200-500 for telehealth (paid search for high-intent health queries), $500-2,000 for therapy/clinical (requires trust-building).
- **LTV challenge**: At $15/mo and 10% monthly churn, LTV is ~$150. CAC must be well below this for viability. Very few consumer health apps achieve >$300 LTV.
- **Freemium conversion**: Typical 2-5% free-to-paid conversion in wellness apps. Calm and Headspace are at the high end (~4-5%).

### B2B2C: Employers and Insurers

- **Employer wellness market**: ~$60B globally. Employers spend $150-$600/employee/year on wellness benefits.
- **Model**: Sell to HR/benefits teams, deploy to employees. Per-employee-per-month (PEPM) pricing of $1-15/PEPM.
- **Benchmarks**: Virgin Pulse (now Personify Health): $5-10 PEPM, 3,500+ employer clients. Wellhub (formerly Gympass): aggregates gym/wellness access, $5-50 PEPM depending on plan. Lyra Health (mental health): ~$7-10 PEPM, ~$1B+ ARR.
- **Sales cycle**: 3-6 months for mid-market employers, 6-12 months for enterprise (1,000+ employees).
- **Engagement challenge**: Typical employee engagement with wellness programs is 20-40%. Low engagement threatens renewal. Programs that reach only healthy employees ("preaching to the choir") fail to demonstrate ROI.
- **Insurer channel**: Health plans buy digital health solutions and offer to members. Contracts take 6-18 months to close. Require clinical evidence and often outcomes guarantees. Livongo's initial growth was through this channel.

### B2B: Hospitals and Health Systems

- **Sales cycle**: 6-18 months. Involves clinical champions, IT security review, procurement committee, legal review, and often a pilot period.
- **Contract size**: $50K-$500K/year for departmental tools, $500K-$5M/year for enterprise solutions, $5M+ for major platform deals.
- **Benchmarks**: Viz.ai (stroke detection AI): ~$50K/hospital/year per module. Current Health (RPM, acquired by Best Buy Health): $50-200/patient/year. Aidoc (radiology AI): ~$100K-300K/hospital/year.
- **Procurement reality**: Hospitals evaluate 10+ vendors, require references from similar institutions, demand integration with Epic/Cerner, and increasingly require cybersecurity attestation (SOC 2, HITRUST).
- **Expansion revenue**: Land in one department, expand to others. Radiology AI vendors often start in stroke, then add PE, ICH, etc. This "land and expand" is critical for capital efficiency.

### PMPM (Per-Member-Per-Month) Model

- **Used by**: Digital therapeutics and chronic disease management platforms selling to health plans.
- **Pricing**: $5-75 PMPM depending on condition complexity and clinical evidence.
- **Benchmarks**: Omada Health (diabetes prevention): ~$15-20 PMPM. Livongo (diabetes management): ~$75 PMPM at peak. Pear Therapeutics (substance use): ~$40-60 PMPM (before bankruptcy).
- **Key requirement**: Demonstrated cost savings. Health plans expect $2-3 ROI for every $1 spent. A diabetes management program priced at $20 PMPM must save $40-60 PMPM in avoided hospitalizations, ER visits, and complications.

### Outcomes-Based Pricing

- **Model**: Payment tied to measurable health outcomes (A1c reduction, hospital readmission reduction, weight loss maintenance).
- **Advantage**: Aligns incentives, easier to sell to skeptical payers. Signals confidence in product efficacy.
- **Risk**: Revenue volatility based on patient population, compliance, and factors outside the product's control.
- **Benchmarks**: Virta Health (diabetes reversal): outcomes-based contracts with some employers/payers. Hinge Health (MSK): guarantees cost savings.

### CPT Code Billing and Reimbursement

- **Remote Patient Monitoring (RPM) codes**: CPT 99453, 99454, 99457, 99458. Reimburse ~$120-180/patient/month when all codes are billed. Requires physician oversight and 16+ days of data collection per month.
- **Remote Therapeutic Monitoring (RTM) codes**: CPT 98975-98981. For non-physiological data (pain, medication adherence, therapy exercises). ~$100-150/patient/month.
- **Chronic Care Management (CCM) codes**: CPT 99490, 99491. ~$40-80/patient/month for care coordination.
- **Reimbursement reality**: Revenue per patient sounds attractive, but billing requires clinical staff time, documentation, and compliance overhead. Net margins on RPM billing are typically 30-50%.

### Pharma Partnerships

- **Digital companion apps**: Pharma companies pay $5-50M for co-developed digital tools that support medication adherence and patient engagement. Otsuka partnered with Proteus Digital Health for Abilify MyCite (pill with ingestible sensor, ultimately failed commercially).
- **Data partnerships**: Aggregated, de-identified health data is valuable to pharma for real-world evidence, clinical trial recruitment, and market research. Flatiron Health (oncology data) was acquired by Roche for $1.9B.
- **Digital endpoint development**: Pharma needs digital biomarkers for clinical trials. Companies like Evidation Health and Koneksa partner with pharma for $1-10M per study.

## Scoring Guide

- **80-100**: Clear, proven monetization model with strong unit economics. LTV/CAC ratio >3x. Multiple revenue streams or expansion paths. Low churn (<5% monthly for B2C, >90% annual retention for B2B). Reimbursement codes or payer contracts already validated by comparable companies. Example: RPM platform billing established CPT codes with additional B2B SaaS revenue from health systems.

- **60-79**: Viable monetization with a proven model in the category. LTV/CAC ratio >2x. Single strong revenue stream with plausible expansion to additional streams. Moderate churn. Sales cycle is long but manageable. Example: B2B2C employer wellness platform with $5-10 PEPM pricing and demonstrated engagement rates above category average.

- **40-59**: Monetization model is plausible but unproven for this specific approach. LTV/CAC ratio is unclear or marginal. Consumer subscription with high churn or B2B with very long sales cycles. Revenue to $1M ARR requires 18+ months. Example: a digital therapeutic that needs RCT results before payers will contract, with consumer subscription as a bridge.

- **20-39**: Weak monetization. Consumer-only model in a high-churn category with no clear path to B2B or clinical revenue. CAC likely exceeds LTV. No reimbursement pathway. Sales cycle is prohibitively long for the startup's runway. Example: a free wellness app planning to monetize through premium features in a crowded market where willingness to pay is unproven.

- **0-19**: No viable monetization path. Users will not pay, employers/insurers have no reason to buy, no reimbursement codes apply, and the data is not valuable enough to license. The product relies on theoretical future willingness to pay with no comparable precedent. Example: a health information website competing with WebMD and Mayo Clinic content with no differentiated service or product to sell.
