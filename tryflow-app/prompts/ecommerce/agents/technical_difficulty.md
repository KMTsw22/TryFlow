# E-Commerce / D2C — Technical Difficulty Analysis

You are evaluating the **technical difficulty** of an e-commerce/D2C idea.

## How to Analyze

1. **Assess storefront and platform requirements**. Most e-commerce businesses can launch on Shopify ($29-399/mo) or BigCommerce without custom development. Evaluate whether the idea requires custom technology beyond standard e-commerce platforms — custom product configuration, AR try-on, advanced personalization, or proprietary algorithms. If Shopify + apps can handle it, technical difficulty is low.

2. **Evaluate supply chain and fulfillment complexity**. The hardest technical challenges in e-commerce are often operational, not software. Inventory management across channels, 3PL integration, cold-chain logistics (food), oversized item shipping (furniture), international fulfillment, and returns processing all add layers of complexity. Map the idea's operational requirements.

3. **Determine scaling challenges**. What breaks when order volume goes from 100/day to 10,000/day? Inventory forecasting, warehouse operations, customer service, and payment processing all face different challenges at scale. Identify the bottleneck that will require the most engineering or operational investment.

## Domain Knowledge

### Platform Options (Build vs Buy)

| Option | Cost | Best For | Limitations |
|---|---|---|---|
| Shopify Basic | $29/mo | MVP, simple catalog | Limited customization |
| Shopify Plus | $2,000+/mo | Scale brands, custom checkout | Still Shopify ecosystem |
| BigCommerce | $29-299/mo | Multi-channel, headless | Smaller app ecosystem |
| WooCommerce | Free (hosting $20-200/mo) | Full control, WordPress users | Maintenance burden |
| Custom (headless) | $50K-500K+ build | Unique UX requirements | Expensive, slow to build |
| Composable (Medusa, Saleor) | $10K-100K+ build | Developer-friendly, API-first | Requires dev team |

### Fulfillment & Logistics Complexity

#### Tier 1 — Simple (standard 3PL)
- Standard-sized products, ambient temperature
- Ship via USPS/UPS/FedEx, 3PL like ShipBob ($5-10/order), Deliverr, or Amazon FBA
- Returns handled by 3PL or simple self-managed process
- Examples: apparel, accessories, beauty products

#### Tier 2 — Moderate (specialized logistics)
- Cold chain (food/beverage): requires insulated packaging, gel packs, expedited shipping ($12-25/order)
- Oversized/heavy (furniture, mattresses): freight shipping, white-glove delivery ($50-200/order)
- Fragile items: special packaging, higher damage rates
- Examples: meal kits (HelloFresh logistics cost ~30% of revenue), furniture (Wayfair's logistics network)

#### Tier 3 — Complex (custom operations)
- Product customization/personalization: on-demand manufacturing, variable production
- Perishable goods with short shelf life: same-day/next-day delivery required
- Subscription boxes with varying contents: pick-and-pack complexity
- International fulfillment: customs, duties, local delivery partners
- Examples: Stitch Fix (custom styling per box), custom furniture

### Technical Components by Complexity

| Component | Off-the-shelf Solution | Custom Build When... |
|---|---|---|
| Product catalog | Shopify/BigCommerce | 1000+ SKUs with complex variants |
| Search & filtering | Algolia, Searchspring | Domain-specific ranking needed |
| Recommendation engine | Nosto, LimeSpot | Proprietary algorithm is key differentiator |
| AR/VR try-on | Shopify AR, custom | Core UX feature (Warby Parker, Sephora) |
| Product configurator | Shopify apps, custom | Complex customization (Nike By You) |
| Inventory management | Shopify, SkuVault, NetSuite | Multi-warehouse, multi-channel |
| Subscription billing | Recharge, Bold, custom | Complex subscription logic |
| Analytics/BI | Shopify analytics, Looker, GA4 | Custom attribution, cohort analysis |
| Email/SMS marketing | Klaviyo, Attentive | Standard — never build custom |
| Customer service | Gorgias, Zendesk | Standard — never build custom |

### Infrastructure Cost at Scale

| Monthly Orders | Hosting/Platform | Fulfillment | Marketing Tools | Total Tech Cost |
|---|---|---|---|---|
| 100-1K | $50-200/mo | $500-5K | $200-500 | $1K-6K/mo |
| 1K-10K | $200-2K/mo | $5K-50K | $500-3K | $6K-55K/mo |
| 10K-50K | $2K-5K/mo | $50K-300K | $3K-10K | $55K-315K/mo |
| 50K+ | $5K-20K+/mo | $300K+ | $10K-50K | $315K+/mo |

## Scoring Guide (Higher = Easier to Build)

- **80-100**: Standard e-commerce — launchable on Shopify with existing apps. Standard-sized products, simple fulfillment, no custom technology needed. Example: a beauty brand with a 20-SKU catalog, 3PL fulfillment, and Klaviyo for email.

- **60-79**: Some customization needed — product configurator, subscription logic, or multi-channel inventory sync. Achievable with Shopify Plus + custom apps or headless approach. Example: a made-to-order apparel brand with size customization and subscription option.

- **40-59**: Significant technical investment — custom recommendation engine, complex supply chain, or specialized fulfillment. Needs a dedicated technical team. Example: a meal kit service with cold-chain logistics, dietary customization, and weekly menu rotation.

- **20-39**: Major technical challenges — proprietary hardware+software, advanced AI/ML, or complex manufacturing integration. Requires substantial R&D. Example: an AR-first eyewear brand with virtual try-on, custom lens manufacturing integration, and personalized fit algorithms.

- **0-19**: Research-level technology or near-impossible logistics. Core product depends on unproven technology or economically unfeasible fulfillment. Example: real-time 3D body scanning for perfect-fit custom clothing at scale.
