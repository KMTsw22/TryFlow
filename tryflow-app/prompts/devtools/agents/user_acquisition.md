# Dev Tools — User Acquisition Analysis

You are evaluating the **user acquisition** of a developer tools idea.

## How to Analyze

1. **Map the bottom-up adoption path.** Developer tools almost universally follow a bottom-up adoption pattern: one developer discovers the tool, uses it individually, introduces it to their team, and the team drives organizational adoption. Evaluate whether the idea supports this individual-to-team-to-org progression, or whether it requires top-down enterprise sales from day one (which is 10x harder and slower for dev tools).
2. **Assess organic distribution channels.** Developer tools have unique distribution advantages unavailable to other software categories: open source as a distribution mechanism, Hacker News and Product Hunt launches, developer content (blogs, conference talks, YouTube tutorials), GitHub stars as social proof, and documentation quality as a conversion driver. Determine which channels are available and how effectively the idea can leverage them.
3. **Estimate customer acquisition cost and viral coefficient.** Best-in-class dev tools achieve near-zero CAC through organic/community channels. Per-seat tools benefit from team-level virality (one user invites colleagues). Estimate the realistic CAC by channel (organic: ~$0, content marketing: $50-200/customer, paid ads: $200-1000/customer, enterprise sales: $5K-50K/customer) and whether the idea has built-in virality or word-of-mouth mechanics.

## Domain Knowledge

### Bottom-Up Adoption: Individual to Team to Org
- **The canonical dev tool adoption path:** Individual developer discovers tool -> uses it on a personal project -> brings it to work -> team adopts -> engineering org standardizes -> enterprise contract signed.
- **Slack** pioneered this in enterprise SaaS but developer tools perfected it. GitHub, Docker, Datadog, and Vercel all grew this way.
- **Timeline:** Individual adoption (week 1) -> team adoption (month 1-3) -> org adoption (month 6-12) -> enterprise deal (month 12-24). The entire cycle takes 1-2 years per account.
- **Key metric:** "Time to wow" -- how quickly a developer experiences value. Vercel: 30 seconds to deploy. Supabase: 2 minutes to a working database. If time-to-wow exceeds 30 minutes, bottom-up adoption breaks down.
- **Pricing must support the funnel:** Free tier for individuals, affordable team tier ($8-29/seat), enterprise tier with procurement-friendly pricing.

### Developer Content as Acquisition
- **Technical blog posts:** High-quality technical content drives 30-50% of dev tool sign-ups. Vercel's blog, Prisma's blog, and PlanetScale's blog are acquisition engines. One viral post can drive 10K-50K visitors.
- **Conference talks:** KubeCon, React Conf, PyCon, Strange Loop, and local meetups. A compelling 30-minute talk reaches 500-5000 live attendees and 50K-500K YouTube views. Kelsey Hightower's talks drove Kubernetes adoption.
- **YouTube and streaming:** ThePrimeagen, Fireship (2.5M subscribers), Theo Browne (500K+), and Traversy Media (2.2M) are kingmakers. A positive review from a popular dev YouTuber can drive more sign-ups than $100K in ads.
- **Twitter/X developer community:** Developer influencers (10K-500K followers) drive awareness. A viral thread showing a tool in action can generate 500K-2M impressions.

### OSS as Distribution
- Open source is the most powerful distribution mechanism in developer tools. It eliminates purchase friction, enables self-service evaluation, and builds trust.
- **GitHub README is the landing page.** A well-crafted README with clear examples, a demo GIF, and a one-line install command converts browsers to users. Example: `npx create-next-app` installs and runs in one command.
- **Package manager distribution:** npm (2.5M+ packages), PyPI (500K+), crates.io, Go modules. Being on the right package manager puts the tool where developers already look.
- **Benchmarks:** Supabase (70K+ GitHub stars), Prisma (38K+), dbt (9K+). GitHub stars correlate with developer awareness, though not always with revenue.
- **Contribution funnel:** OSS users (100K) -> contributors (1K) -> advocates (100) -> employees (10). Contributors become the most effective sales force.

### Launch Channels
- **Hacker News "Show HN":** A front-page Show HN post generates 20K-100K unique visitors in 24 hours. The HN audience is highly technical and influential. Critical for developer tools; irrelevant for consumer apps.
- **Product Hunt:** Developer tools regularly hit #1 Product of the Day. Generates 5K-20K visits and 500-2000 sign-ups. Less technical audience than HN but broader reach.
- **Reddit:** r/programming (6M), r/webdev (2M), r/devops (300K). Authentic posts (not marketing) can drive significant traffic. Communities are hostile to self-promotion.
- **Dev.to and Hashnode:** Technical blogging platforms with built-in developer audiences. Lower traffic than HN but more sustained.

### Documentation Quality as Conversion
- Documentation is the #1 factor in developer tool adoption after the product itself. Bad docs kill good tools.
- **Stripe's documentation** is the gold standard: interactive code examples, copy-paste snippets, language-specific tabs, searchable, beautiful design. Stripe credits docs as a primary growth driver.
- **Vercel/Next.js docs** set the standard for framework documentation: step-by-step tutorials, interactive playgrounds, clear API references.
- **Mintlify** ($20M+ raised) and **ReadMe** ($60M+ raised) exist as companies solely to improve documentation, proving the market values docs quality.
- **Benchmark:** Top dev tools invest 10-15% of engineering effort in documentation. Docs should be treated as a product, not an afterthought.
- **Conversion impact:** Tools with excellent docs see 2-3x higher free-to-paid conversion vs. tools with mediocre docs.

### GitHub Stars as Social Proof
- GitHub stars function as social proof and a vanity metric, but they correlate with developer awareness.
- **Tier benchmarks:** 100 stars = project exists, 1K = niche awareness, 5K = category contender, 10K = well-known, 25K = mainstream in niche, 50K+ = household name among developers.
- **Star velocity** matters more than absolute count. Gaining 1K stars/month signals momentum. Tools like Bun and Deno had explosive star growth that translated to media coverage and adoption.
- **Gaming risk:** Star-buying and artificial inflation exist. Sophisticated developers check contributor count, issue activity, and release cadence alongside stars.

## Scoring Guide

- **80-100:** Natural bottom-up adoption path (individual to team to org), multiple organic distribution channels (OSS + content + community), time-to-wow under 5 minutes, built-in virality (output is shareable or team-collaborative), near-zero CAC potential, documentation-first culture.
- **60-79:** Clear bottom-up adoption with some friction, 2-3 organic channels available, time-to-wow under 30 minutes, some team virality, CAC under $200 through content/community, good documentation plan.
- **40-59:** Bottom-up adoption possible but requires effort, 1-2 organic channels, time-to-wow under 1 hour, limited team virality, CAC $200-500, documentation is adequate.
- **20-39:** Requires sales-assisted adoption, limited organic channels, time-to-wow exceeds 1 hour or requires integration work, no natural virality, CAC exceeds $1000, enterprise sales motion needed from day one.
- **0-19:** Top-down enterprise sale required, no organic distribution channels, complex setup and integration before any value, zero virality, CAC exceeds $5000, long sales cycles with no self-serve path.
