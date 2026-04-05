# Education / EdTech — Regulation Analysis

You are evaluating the **regulatory environment** of an education/edtech idea.

## How to Analyze

1. **Identify data privacy requirements based on user age and geography**. Education is one of the most privacy-sensitive sectors. Products serving students under 13 must comply with COPPA (US), and those handling student educational records must follow FERPA. EU products need GDPR compliance with additional protections for minors. The cost and complexity of compliance depends entirely on the target user's age and the type of data collected.

2. **Assess accreditation and institutional requirements**. If the idea involves granting degrees, certificates, or academic credit, accreditation requirements apply. These vary by jurisdiction and take 1-5+ years to obtain. Even non-accredited products may need to comply with state education regulations if marketed as "educational." Determine whether the idea triggers accreditation requirements.

3. **Evaluate accessibility mandates**. Products sold to schools, universities, or government institutions must meet accessibility standards (ADA/Section 508 in US, EN 301 549 in EU, WCAG 2.1 AA). Failure to meet accessibility requirements can block institutional sales entirely. Assess the accessibility compliance effort required.

## Domain Knowledge

### Student Data Privacy

#### FERPA (US — Family Educational Rights and Privacy Act)
- Applies to any product that accesses student education records from schools receiving federal funding
- Schools must authorize data sharing; parents have right to review and amend records
- "School official" exception allows edtech vendors to access data under specific contract terms
- Violations: loss of federal funding for the school, legal liability for the vendor
- Compliance cost: $5K-20K for legal review and data handling procedures

#### COPPA (US — Children's Online Privacy Protection Act)
- Applies to products directed at children under 13 or that knowingly collect data from children under 13
- Requires verifiable parental consent before collecting personal information
- Limits data collection to what's necessary for the activity
- FTC enforcement: fines of $50K+ per violation (Epic Games fined $275M in 2022 for COPPA violations in Fortnite)
- Compliance cost: $10K-50K for legal review, consent mechanisms, and data handling

#### GDPR (EU — for educational data)
- Stricter rules for processing children's data (age of consent varies by country: 13-16)
- Data Protection Impact Assessment required for large-scale processing of children's data
- Right to deletion, data portability, and purpose limitation
- Fines: up to 4% of global revenue or €20M

#### State-Level (US)
- **Student Online Personal Protection Act (SOPPA)** — Illinois: strict student data transparency requirements
- California Student Online Personal Information Protection Act (SOPIPA)
- 40+ US states have student data privacy laws — patchwork compliance required
- **Student Data Privacy Consortium**: industry group providing standardized agreements

### Accreditation & Licensing

| Type | Authority | Timeline | Cost |
|---|---|---|---|
| Regional accreditation (US universities) | HLC, SACSCOC, WASC, etc. | 3-7 years | $100K-500K+ |
| Programmatic accreditation | ABET (engineering), AACSB (business), etc. | 2-5 years | $50K-200K |
| State licensing (K-12 supplemental) | State Department of Education | 3-12 months | $5K-50K |
| Continuing education credits | Professional associations (AMA, ABA, etc.) | 1-6 months | $5K-30K |
| Non-accredited certificates | None required | N/A | N/A |

### Accessibility Requirements

- **Section 508 / ADA**: required for products used by US government-funded institutions
- **WCAG 2.1 AA**: the standard for web accessibility — required for institutional sales
- **Key requirements**: screen reader compatibility, keyboard navigation, captions for video, color contrast, alt text
- Compliance cost: $10K-50K for audit and remediation
- K-12 and higher-ed procurement often requires a VPAT (Voluntary Product Accessibility Template)

### Content & Advertising Regulations

- **Children's advertising**: CARU (Children's Advertising Review Unit) self-regulatory guidelines
- **AI-generated content**: emerging regulations around AI in education (EU AI Act classifies education AI as "high-risk")
- **Content accuracy**: no specific US regulation, but liability risk if educational content causes harm (medical/legal education)
- **Proctoring and surveillance**: growing concerns and regulations around student monitoring software

### Regulatory Tailwinds

- Government digital education mandates (post-COVID) creating procurement budgets
- AI in education regulations (EU AI Act) creating demand for compliant AI edtech
- Workforce development legislation creating funding for reskilling platforms

## Scoring Guide (Higher = Easier)

- **80-100**: Minimal regulation — adult learner product with standard data practices, no accreditation needed. Basic GDPR/CCPA compliance only. Example: professional development platform for adults with standard privacy practices.

- **60-79**: Standard compliance — FERPA awareness required, WCAG accessibility for institutional sales. Manageable cost ($10-30K) and timeline. Example: higher-ed supplemental tool with standard student data handling.

- **40-59**: Moderate regulation — COPPA compliance for child users, state-level student privacy laws, accessibility audits. $30-75K compliance cost. Example: K-12 learning platform collecting student data with parental consent requirements.

- **20-39**: Heavy regulation — accreditation required, multiple privacy laws, strict accessibility. $75K-200K+ compliance, 12+ months. Example: an online degree program requiring regional accreditation and FERPA/COPPA/ADA compliance.

- **0-19**: Prohibitive — full university accreditation required (3-7 years), or operating in jurisdictions with edtech bans (e.g., China's 2021 private tutoring crackdown). Example: an unaccredited institution trying to grant degrees, or an edtech product targeting Chinese K-12 tutoring.
