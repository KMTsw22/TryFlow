# Hardware / IoT — Regulation Analysis

You are evaluating the **regulatory environment** of a hardware/IoT idea.

## How to Analyze

1. **Identify mandatory certifications based on product type and target markets**. Every hardware product sold commercially must meet safety and electromagnetic compatibility standards. At minimum: FCC (US), CE (EU), and product-specific safety standards. Radio-emitting devices (WiFi, Bluetooth, cellular) have additional requirements. Map all required certifications and estimate cost and timeline.

2. **Assess product liability and safety requirements**. Hardware startups carry physical product liability risk that software companies don't. If a device causes injury, property damage, or fire, the manufacturer is liable. Product liability insurance, safety testing, and quality control are mandatory, not optional. Evaluate the liability risk profile and insurance requirements.

3. **Check for category-specific regulations**. Certain product categories trigger additional regulatory requirements: medical devices (FDA), children's products (CPSC/CPSIA), food-contact devices (FDA), drones (FAA), automotive (NHTSA/DOT), and battery-powered products (transport regulations). Determine which category-specific regulations apply and their impact.

## Domain Knowledge

### Universal Hardware Certifications

| Certification | Applies To | Cost | Timeline | Required For |
|---|---|---|---|---|
| FCC Part 15 (unintentional) | All electronic devices | $3K-10K | 2-4 weeks | US market |
| FCC Part 15 (intentional radiator) | WiFi, Bluetooth, Zigbee | $5K-20K | 4-8 weeks | US market (radio devices) |
| FCC Part 22/24/27 (cellular) | Cellular IoT devices | $10K-30K | 6-12 weeks | US market (cellular) |
| CE Marking (EU) | All products sold in EU | $5K-25K | 4-12 weeks | EU market |
| RED (Radio Equipment Directive) | Radio devices in EU | $5K-15K | 4-8 weeks | EU radio devices |
| UL/ETL Safety | Products with AC power | $5K-30K | 4-12 weeks | US retail (often required by retailers) |
| RoHS | All electronics in EU | $1K-5K | 2-4 weeks | EU market (hazardous substances) |
| WEEE | All electronics in EU | Registration + fees | Ongoing | EU market (e-waste) |
| KC (Korea) | All electronics in Korea | $3K-15K | 4-8 weeks | Korean market |

### Category-Specific Regulations

#### Medical / Health Devices
- **FDA 510(k)**: "substantially equivalent" to predicate device. $5K-100K+ in testing, 3-12 months. Required for devices making health claims.
- **FDA De Novo**: new device category without predicate. $50K-500K+, 6-18 months.
- **FDA PMA**: highest risk (Class III). $1M+, 1-3 years. Implantables, life-sustaining devices.
- **MDR (EU)**: Medical Device Regulation. More stringent than predecessor MDD. Notified Body approval required.
- **Wellness exemption**: devices that only track "general wellness" (steps, sleep quality) without medical claims can avoid FDA classification. But making any medical claim triggers regulation.

#### Children's Products
- **CPSIA**: mandatory testing for lead, phthalates, and small parts for products intended for children under 12. Third-party testing required.
- **ASTM F963**: toy safety standard. Mechanical/physical testing, flammability, chemical.
- **CPC (Children's Product Certificate)**: required for import/sale of children's products in US.
- **EN 71** (EU): toy safety. Mechanical, flammability, chemical migration.
- Cost: $5K-20K for full children's product compliance.

#### Drones / UAV
- **FAA Part 107**: commercial drone operation license (US). Pilot certification required.
- **Remote ID**: required for all drones in US (broadcasting identification during flight).
- **EU Drone Regulation**: EASA categories (Open, Specific, Certified) based on risk.
- **Restricted airspace**: geofencing requirements, no-fly zones.

#### Battery & Transport
- **UN 38.3**: mandatory testing for lithium-ion/lithium-polymer batteries. Required for transport.
- **IEC 62133**: battery safety standard for portable devices.
- **Shipping restrictions**: lithium batteries have strict air shipping regulations (IATA DGR). Affects fulfillment options and cost.
- **UL 2054 / IEC 62368**: battery-powered device safety.

### Product Liability & Insurance

- **Product liability insurance**: required before selling hardware. $1-5M coverage costs $2K-15K/year for startups, more for higher-risk products.
- **Recall risk**: average product recall costs $10M+ for large companies. Even small recalls can bankrupt a startup.
- **Safety margins**: design with safety margins exceeding minimum requirements. "Barely passing" certification invites problems.
- **Documentation**: maintain design records, test results, and quality control documentation. Required for liability defense.

### Environmental & Sustainability Regulations

- **RoHS** (EU): restricts hazardous substances (lead, mercury, cadmium). Applies to all electronics.
- **REACH** (EU): registration of chemicals used in products. Ongoing compliance.
- **Extended Producer Responsibility (EPR)**: growing requirements for manufacturers to fund end-of-life recycling. Active in EU, expanding to US states.
- **California Prop 65**: warning requirements for products containing listed chemicals. Nearly unavoidable for electronics.
- **Right to repair**: EU and several US states passing laws requiring repair access, spare parts, and documentation.

### Regulatory Tailwinds

- Right-to-repair laws creating opportunity for modular, repairable hardware design
- Energy efficiency mandates (EU EcoDesign) creating demand for efficient IoT devices
- Smart building regulations requiring connected building systems
- Agricultural IoT requirements for food safety traceability

## Scoring Guide (Higher = Easier)

- **80-100**: Minimal regulation — basic FCC/CE for a simple electronic device with no radio, no batteries, no medical claims, not for children. Standard product liability. Example: a USB-powered desk accessory with no wireless connectivity.

- **60-79**: Standard hardware compliance — FCC/CE for WiFi/Bluetooth device, basic safety certifications. Manageable cost ($10-30K) and timeline (2-4 months). Example: a smart home sensor with Bluetooth connectivity and standard battery.

- **40-59**: Moderate regulation — multiple certifications required, category-specific testing, or multi-market compliance. $30-75K compliance cost, 3-6 months. Example: a WiFi-connected consumer device with lithium battery requiring FCC, CE, UL, and UN 38.3 certifications.

- **20-39**: Heavy regulation — medical device FDA pathway, children's product compliance (CPSIA), drone FAA requirements, or automotive standards. $75K-500K+ compliance, 6-18+ months. Example: a health wearable making medical claims requiring FDA 510(k) clearance.

- **0-19**: Prohibitive — FDA PMA (Class III medical device), autonomous vehicle certification, or novel technology with unclear regulatory pathway. $500K-5M+ compliance, 1-3+ years. Example: an implantable medical device or autonomous drone for commercial delivery.
