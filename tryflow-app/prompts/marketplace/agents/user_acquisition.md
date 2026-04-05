# Marketplace — User Acquisition Analysis

You are evaluating the **user acquisition strategy** of a marketplace idea.

## How to Analyze

1. **Determine the chicken-and-egg strategy** — Every marketplace faces the cold start problem: buyers won't come without supply, and suppliers won't come without demand. Identify which side to seed first and how to create initial liquidity in a constrained market (single city, single category, single use case).
2. **Evaluate supply and demand acquisition channels** — Map the specific channels for acquiring each side. Assess cost per acquisition, scalability, and sustainability of each channel. Determine whether organic growth loops exist or if the marketplace will depend on paid acquisition indefinitely.
3. **Assess geographic launch and density strategy** — For local marketplaces, evaluate the city-by-city launch plan. Determine the minimum viable liquidity threshold per market and the cost to reach it. For global marketplaces, evaluate the channel strategy for reaching a distributed audience.

## Domain Knowledge

### The Chicken-and-Egg Problem

The fundamental challenge of every marketplace. No buyers without supply. No supply without buyers.

**Supply-first is the dominant strategy (~80% of successful marketplaces):**
- Supply is harder to acquire and more valuable once acquired. A marketplace with supply but no demand can still generate listings and content. A marketplace with demand but no supply delivers a terrible experience that causes permanent churn.
- Airbnb: Recruited hosts first by importing Craigslist vacation rental listings. Had supply ready before investing in demand.
- Uber: Recruited drivers with guaranteed hourly minimums ($25-35/hour) before riders existed. Subsidized supply.
- DoorDash: Manually called restaurants to add their menus (without restaurant permission initially). Built supply before demand.
- Etsy: Recruited craft sellers from existing forums and in-person craft fairs.

**Demand-first exceptions:**
- Groupon: Aggregated demand (buyer intent) first, then recruited merchants to fulfill it.
- ClassPass: Aggregated fitness class demand first, then negotiated with studios.
- Google Shopping: Had search demand; added merchant supply.

**Single-player mode:** Some marketplaces provide standalone value to one side even without the other, solving the cold start. OpenTable gave restaurants reservation management software (useful alone) before building consumer demand. Square gave merchants POS (useful alone) before building Cash App marketplace.

### Supply Acquisition Channels

**Direct outreach (highest quality, lowest scale):**
- Manually reaching out to potential suppliers via email, phone, social media DMs, or in-person visits. Labor-intensive but converts at 10-30%.
- DoorDash founders personally visited restaurants in Palo Alto. Airbnb founders flew to NYC to photograph apartments.
- Cost: $50-500 per supplier depending on category. Effective for the first 100-1,000 suppliers.

**Importing from existing platforms:**
- Scraping or importing supplier data from Craigslist, Yelp, Google, LinkedIn, or industry-specific platforms.
- Airbnb's famous Craigslist integration: allowed hosts to cross-post listings to Craigslist, driving traffic back to Airbnb.
- Thumbtack imported contractor information from state licensing databases.
- Risk: platform ToS violations, data quality issues, suppliers may not know they're listed.

**Supply-side referrals:**
- Incentivizing existing suppliers to recruit new ones. Uber's driver referral bonuses ($500-2,000 per referred driver at peak).
- Works well when suppliers know others in the same category (drivers know drivers, tutors know tutors).
- Referral quality is typically 2-3x better retention than paid acquisition.

**SaaS tool as supply acquisition:**
- Offering free or low-cost tools that suppliers need, then converting tool users to marketplace participants.
- Mindbody (scheduling software -> fitness marketplace), ServiceTitan (field service software -> home services marketplace), Faire (wholesale ordering -> retail marketplace).
- Higher upfront cost but creates lock-in and reliable supply pipeline.

**Community and content:**
- Building a community or content hub that attracts suppliers organically.
- Houzz started as an interior design inspiration site, then added a marketplace for designers and contractors.
- Behance (design portfolio community) feeds into Adobe's creative marketplace ecosystem.

### Demand Acquisition Channels

**SEO / long-tail organic search:**
- The most scalable and sustainable demand channel for marketplaces. Each listing creates a unique page that can rank for long-tail searches.
- Airbnb ranks for millions of location-specific queries ("cabin rental in Big Bear," "apartment in Shibuya").
- Yelp ranks for "[service] near [location]" queries across millions of combinations.
- Etsy's 100M+ listings create massive long-tail SEO surface area.
- Cost: Near-zero marginal cost per visitor once ranking is established. Requires 6-18 months of investment to see results.
- Marketplace SEO advantage: user-generated content (listings, reviews) creates organic content at scale that no single website can replicate.

**Paid acquisition (SEM, social ads):**
- Google Ads (search intent), Facebook/Instagram (discovery), TikTok (viral/social proof).
- Effective for demand-side acquisition in the early stage but rarely sustainable as the primary long-term channel.
- Target CAC by category: Physical goods marketplace demand-side CAC $5-20, services $30-100, high-value transactions (real estate, auto) $100-500.
- The LTV:CAC ratio should be >3:1 for sustainability. Most marketplaces start at 1:1 or worse and improve as repeat rates increase.

**Referrals and word-of-mouth:**
- The best marketplaces grow primarily through word-of-mouth once initial liquidity is achieved.
- Airbnb's referral program ($25 travel credit) drove 25%+ of new user acquisition at its peak.
- Network effects amplify word-of-mouth: every new user tells friends, who tell friends.
- Inherent virality: some marketplace actions naturally involve sharing (sending an Airbnb listing to a travel companion, sharing an Etsy product link).

**Partnerships and embedded distribution:**
- Integrating into platforms where demand already exists.
- Instacart partnered with grocery chains to power their delivery (embedded in retailer websites).
- DoorDash partnered with Chase Sapphire for free DashPass, acquiring high-value users through credit card partnerships.
- OpenTable embedded reservation widgets on restaurant websites, capturing demand at the point of intent.

### Geographic Launch and Density Strategy

For local/geographic marketplaces, the launch strategy is critical:

**Hyper-local launch (recommended):**
- Launch in one city (or even one neighborhood) and achieve dominant liquidity before expanding.
- Uber: San Francisco only for the first 18 months. Reached ~300 rides/day before expanding to NYC.
- DoorDash: Palo Alto only for the first year. Suburbs of the Bay Area before major cities.
- Advantages: Lower capital requirements, faster iteration, local word-of-mouth compounds, easier to achieve supply density.

**City-by-city expansion playbook:**
1. Select cities based on: existing supply density, demand indicators (search volume), competitive gaps, unit economics (population density, average order value).
2. Seed supply 2-4 weeks before marketing to demand. Ensure minimum viable liquidity (e.g., 50+ active listings, 20+ available providers at any time).
3. Launch demand acquisition with a local event, PR, or targeted paid ads.
4. Monitor liquidity metrics: search-to-fill rate (>60%), time-to-match (<24 hours for services, <5 minutes for on-demand), and buyer repeat rate.
5. Scale or kill the city within 3-6 months based on organic growth trajectory.

**Minimum viable liquidity thresholds (approximate):**
- Ride-hailing: ~300 rides/day, ~1,000 active drivers in a city.
- Food delivery: ~50 restaurants within 15-minute delivery radius, ~100 orders/day per zone.
- Home services: ~20 available providers per category per metro area.
- Peer-to-peer goods: ~500 active listings per category per metro area.
- Professional services (remote): ~100 providers per category globally.

### Subsidies and Incentives

Subsidies are often necessary to bootstrap liquidity but must be carefully managed:

**Supply subsidies:**
- Guaranteed hourly minimums (Uber paid drivers $25-35/hour regardless of rides during launch).
- Signup bonuses ($200-2,000 for new suppliers completing first N transactions).
- Reduced take rate for early suppliers (0% commission for the first 3 months, then gradually increase).

**Demand subsidies:**
- First-purchase discounts ($10-20 off first order is standard).
- Free delivery/service credits.
- Referral credits (give $X, get $X).

**Subsidy risks:**
- Mercenary users who churn after subsidies end. Groupon's merchant retention was notoriously poor (<20% repeat).
- Unsustainable burn rate. Uber spent $2B+ on driver incentives in a single year during its expansion phase.
- Attracting the wrong user profile (price-sensitive users who won't pay full price).

**Rule of thumb:** Subsidies should decrease over 3-6 months as organic liquidity builds. If the marketplace requires permanent subsidies to maintain activity, the fundamental value proposition is weak.

## Scoring Guide

- **80-100:** Clear chicken-and-egg strategy with proven precedent. Supply acquisition has a scalable, low-cost channel (existing platforms to import from, SaaS tool wedge, or community). Demand has strong SEO potential with millions of long-tail keywords. Geographic density is achievable in initial markets with modest capital. Organic growth loops (referrals, word-of-mouth, inherent virality) are built into the product.
- **60-79:** Viable supply and demand acquisition strategies with reasonable costs. At least one scalable organic channel (SEO or referrals) supplements paid acquisition. Geographic launch plan is logical with achievable minimum liquidity thresholds. Subsidies are needed but can be phased out within 6 months per market.
- **40-59:** Acquisition strategies exist but are expensive or unproven. Heavy reliance on paid acquisition for one or both sides. Geographic expansion requires significant capital per city. Minimum liquidity thresholds are high, making cold starts difficult. Limited organic growth loops.
- **20-39:** No clear path to affordable supply acquisition. Demand channels are expensive and undifferentiated. Geographic density requirements are extremely high. Cold start problem has no obvious solution beyond heavy subsidies. LTV:CAC ratio is likely below 2:1 even at scale.
- **0-19:** Severe chicken-and-egg problem with no viable bootstrap strategy. Both sides are expensive to acquire and quick to churn. No organic growth channels. Marketplace requires permanent subsidies to maintain any activity. Geographic expansion economics are prohibitive.
