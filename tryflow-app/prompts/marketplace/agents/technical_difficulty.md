# Marketplace — Technical Difficulty Analysis

You are evaluating the **technical difficulty** of a marketplace idea.

## How to Analyze

1. **Classify the marketplace's core technical model** — Determine whether the platform requires simple listing/search (Etsy-level), algorithmic matching (Uber-level), or AI-driven personalization (TikTok-level). Each tier represents a step-change in engineering complexity and cost.
2. **Identify the hardest technical problems** — Pinpoint the 2-3 technical challenges that will consume the most engineering time and are most critical to the marketplace's value proposition. Evaluate whether these are solved problems (use off-the-shelf solutions) or require novel engineering.
3. **Assess build vs. buy tradeoffs and time-to-MVP** — Determine how much can be built using existing infrastructure (Stripe for payments, Twilio for messaging, Algolia for search) versus what must be custom-built. Estimate months to a functional MVP.

## Domain Knowledge

### Matching Algorithms: Spectrum of Complexity

**Tier 1 — Simple Listing + Search (Low complexity)**
Suppliers create listings, buyers browse and filter. Think Etsy, eBay, Craigslist. Core tech is a searchable database with filters. Can be built with standard web frameworks in 2-4 months.

**Tier 2 — Scored/Ranked Matching (Medium complexity)**
Platform ranks and recommends matches based on relevance signals. Think Thumbtack (matching homeowners to contractors), Hired (matching companies to engineers). Requires a ranking algorithm, supplier scoring, and recommendation logic. 4-8 months to MVP.

**Tier 3 — Dynamic Real-Time Dispatch (High complexity)**
Platform algorithmically assigns supply to demand in real-time with time and location constraints. Think Uber (ride matching), DoorDash (order dispatch), Instacart (shopper assignment). Requires:
- Real-time geolocation tracking
- Dynamic pricing/surge algorithms
- ETA prediction models
- Route optimization
- Queue management and load balancing

This is 12-18+ months to build well, with a team of 5-10+ engineers. Uber's matching system processes millions of events per second.

### Search, Discovery, and Ranking

Search quality directly determines marketplace conversion rates. Key technical components:

- **Text search:** Full-text search with typo tolerance, synonyms, and faceted filtering. Algolia or Elasticsearch can handle this off-the-shelf.
- **Personalized ranking:** Re-ranking search results based on user history, preferences, and conversion likelihood. Requires ML models trained on user behavior data. Cold-start problem is significant for new marketplaces.
- **Category taxonomy:** Structured categorization of supply. Simple for physical goods (use standard taxonomies), complex for services (how do you categorize "handyman who also does light plumbing"?).
- **Discovery/browse:** For marketplaces where users don't know exactly what they want (Airbnb Experiences, Etsy gifts). Requires curated collections, trending items, collaborative filtering.
- **Ranking fairness:** Suppliers care deeply about how they're ranked. Bias in ranking algorithms can cause supplier churn. Airbnb has invested heavily in fair ranking to prevent discrimination.

### Payment Infrastructure

Payments are table stakes but technically nuanced for marketplaces:

- **Split payments:** A single buyer payment must be split between the marketplace (take rate), supplier, taxes, and possibly tips. Stripe Connect is the standard solution — it handles splits, 1099 reporting, and international payouts. Stripe charges 0.25-0.5% + per-transaction fees on top of standard processing (~2.9% + $0.30).
- **Escrow:** Holding funds until service is delivered or goods are received. Required for high-value or trust-sensitive transactions. Adds regulatory complexity (money transmission licenses) unless using a licensed partner.
- **Disputes and chargebacks:** Marketplace must handle buyer-seller disputes. Chargeback rates above 1% can get your payment processing shut down. Need automated and manual dispute resolution workflows.
- **International payments:** Cross-border marketplaces need multi-currency support, local payment methods (iDEAL in Netherlands, PIX in Brazil), and compliance with local regulations. Stripe, Adyen, or PayPal can help but add 1-3% in additional fees.
- **Payouts:** Suppliers expect fast payouts. Instant payouts (via Stripe) cost extra (~1%). Weekly ACH is standard. Supporting multiple payout methods (bank transfer, PayPal, debit card) adds complexity.

### Trust and Safety

Trust is the fundamental product of a marketplace. Technical systems required:

- **Identity verification:** KYC (Know Your Customer) for suppliers at minimum. Options range from email verification (low trust) to government ID + selfie matching (high trust, services like Jumio or Onfido, $1-5 per verification). Airbnb requires ID verification for both hosts and guests.
- **Background checks:** Required for service marketplaces involving home access or vulnerable populations. Checkr is the standard API provider ($30-80 per check). Care.com, Rover, and Thumbtack all use background checks.
- **Review systems:** Two-sided reviews (buyer reviews supplier AND supplier reviews buyer). Must handle fake reviews, review bombing, and incentivized reviews. Amazon spends hundreds of millions fighting fake reviews.
- **Fraud detection:** Payment fraud (stolen cards), fake listings, spam accounts, manipulation of search/ranking. Requires rule-based systems initially, ML models as the marketplace scales. Sift Science and similar tools provide off-the-shelf fraud scoring.
- **Content moderation:** For marketplaces with user-generated content (listing descriptions, photos, messages). Can start with automated filters + manual review queue. At scale, need ML-based content classification.
- **Messaging safety:** If the platform has messaging, need to detect and prevent off-platform transaction attempts, scams, harassment, and sharing of personal contact information before trust is established.

### Geolocation and Mapping

Critical for local/geographic marketplaces:

- **Location-based search:** Finding supply within X miles of the buyer. PostGIS or Elasticsearch geo queries handle this. Google Maps API costs $7 per 1,000 requests for core functionality.
- **Real-time tracking:** For delivery/ride-hailing. Requires WebSocket connections, frequent location updates (every 1-5 seconds), and efficient geospatial indexing. Firebase, Mapbox, or custom solutions.
- **Geocoding:** Converting addresses to coordinates and vice versa. Google Geocoding API, Mapbox, or open-source (Nominatim/OpenStreetMap).
- **Route optimization:** For multi-stop deliveries. Traveling salesman problem variants. Google Directions API for simple cases, OR-Tools or custom solvers for complex routing.
- **Geofencing:** Defining service areas, surge zones, or restricted regions. Standard feature in mapping SDKs.

### Infrastructure Costs at Scale

- **MVP (0-1K transactions/month):** $500-2,000/month. Standard cloud hosting, managed databases, third-party APIs.
- **Growth (1K-100K transactions/month):** $5,000-50,000/month. Need caching, CDN, background job processing, monitoring.
- **Scale (100K+ transactions/month):** $50,000-500,000+/month. Dedicated infrastructure, ML pipelines, real-time systems, multi-region deployment.

## Scoring Guide

- **80-100:** Technically straightforward. Simple listing + search model. All major components can be built with off-the-shelf tools (Stripe Connect, Algolia, standard web frameworks). MVP achievable in 2-4 months with 2-3 engineers. No real-time or ML requirements at launch.
- **60-79:** Moderate technical complexity. Requires scored matching or basic recommendation systems. Payment flows involve escrow or split payments but are handled by existing infrastructure (Stripe Connect). Identity verification needed but available via APIs. MVP in 4-8 months with 3-5 engineers.
- **40-59:** Significant technical challenges. Requires real-time elements (live tracking, dynamic dispatch), complex search/ranking, or multi-sided payment flows. Some custom engineering required beyond off-the-shelf solutions. MVP in 8-12 months with 5-8 engineers.
- **20-39:** High technical difficulty. Real-time dispatch at scale, complex ML-driven matching, or safety-critical systems (healthcare, autonomous vehicles). Requires specialized engineering talent. MVP in 12-18 months with 8-15 engineers. Infrastructure costs are high from the start.
- **0-19:** Extreme technical difficulty. Requires breakthroughs in algorithms, hardware, or infrastructure. Think real-time dynamic pricing across millions of concurrent users, autonomous delivery, or medical-grade verification systems. 18+ months to MVP with a large specialized team. Technical risk is a primary concern for the business.
