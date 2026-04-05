# Fintech — Technical Difficulty Analysis

You are evaluating the **technical difficulty** of a fintech idea.

## How to Analyze

1. **Assess the core financial infrastructure requirements**. Financial systems have unique technical demands: exact decimal arithmetic (never floating point for money), double-entry ledger systems, idempotent transaction processing, and audit trails for every operation. Determine whether the idea requires building core financial infrastructure from scratch or can use existing rails (Stripe, Plaid, Unit).

2. **Evaluate security and compliance engineering burden**. Fintech has the highest security requirements of any software category. PCI-DSS, SOC 2, encryption at rest and in transit, tokenization, and penetration testing are table stakes. A security breach in fintech can result in regulatory action, lawsuits, and loss of banking partnerships. Assess the security engineering investment required.

3. **Determine integration complexity with financial systems**. Financial products must connect to legacy banking systems (ACH, SWIFT, FedWire), card networks (Visa, Mastercard), credit bureaus (Experian, Equifax, TransUnion), and regulatory reporting systems. These integrations are often poorly documented, require partnership agreements, and have long testing cycles.

## Domain Knowledge

### Architecture Components by Fintech Type

#### Core Banking / Neobank
- **Ledger system**: double-entry, event-sourced ledger. Must handle concurrent transactions, maintain exact balances, and provide audit trails. The hardest component to build correctly.
- **Account management**: KYC/identity verification (Alloy, Socure, $0.50-5.00/verification), account opening, status management.
- **Payment rails**: ACH (2-3 days, $0.20-1.00/transfer), wire (same-day, $15-30), RTP/FedNow (instant, $0.01-0.50), card networks.
- **Core banking provider option**: Thought Machine, Mambu, Temenos — $50K-500K+/year. Avoids building from scratch.

#### Payment Processing
- **Payment gateway**: API for accepting payments, handling 3DS authentication, managing payment methods.
- **Split payments**: marketplace payments where platform takes a cut (Stripe Connect model).
- **Recurring billing**: subscription management with retry logic, dunning, proration.
- **Fraud detection**: ML models for transaction risk scoring. Rule engines + ML hybrid. False positive rate must be <1% to avoid customer friction.

#### Lending Platform
- **Underwriting engine**: credit decision logic using bureau data + alternative data. Must be explainable (regulatory requirement).
- **Loan management system**: origination, servicing, payments, collections, charge-offs. Complex state machine.
- **Securitization/funding**: connecting to capital markets for loan funding. Warehouse facilities, whole loan sales.
- **Regulatory reporting**: HMDA, TILA, state-specific reporting. Automated compliance.

### Infrastructure / API Options (Build vs. Buy)

| Component | Build | Buy (Provider) | Buy Cost |
|---|---|---|---|
| Ledger | 6-12 months, high risk | Modern Treasury, Custom | $1K-10K/mo |
| KYC/Identity | Don't build — liability risk | Alloy, Socure, Persona | $0.50-5/verification |
| Payment processing | Don't build | Stripe, Adyen, Square | 2.9% + $0.30 |
| Banking-as-a-Service | 1-3 years (charter) | Unit, Treasury Prime | $3-10/account/mo |
| Card issuing | Don't build | Marqeta, Lithic | $0.10-1.00/transaction |
| Credit bureau access | Requires agreement | Experian, Equifax, TransUnion | $0.50-5/pull |
| ACH processing | Partner bank needed | Dwolla, Plaid Transfer | $0.20-1.00/transfer |
| Fraud detection | 3-6 months + data | Sardine, Unit21, Sift | $0.01-0.10/transaction |

### Security Requirements (Non-negotiable)

- **Encryption**: AES-256 at rest, TLS 1.3 in transit. All PII and financial data encrypted.
- **Tokenization**: card numbers and SSNs must be tokenized. Use vault providers (Very Good Security, Basis Theory) or build compliant vault.
- **Access controls**: RBAC, MFA for all internal access, privileged access management.
- **Audit logging**: immutable audit trail for every transaction and data access. Required by regulators.
- **Penetration testing**: annual third-party pentest required for most financial compliance.
- **Incident response**: documented plan required for regulatory compliance.
- **SOC 2 Type II**: 6-12 months to achieve, required for enterprise and bank partnerships.

### Real-Time Processing Challenges

| Requirement | Challenge | Solution |
|---|---|---|
| Payment authorization (<500ms) | Latency-sensitive, must handle spikes | Event-driven architecture, in-memory processing |
| Fraud scoring (real-time) | Must evaluate before payment completes | Pre-computed features, streaming ML |
| Balance updates | Must be exactly consistent | Serialized transactions, database transactions |
| Multi-currency | FX rates change constantly | Rate caching, spread management |
| Idempotency | Network failures cause retries | Idempotency keys, exactly-once processing |

### Technical Debt Risks

- Financial systems are extremely hard to refactor. A ledger mistake can cause regulatory issues.
- "Move fast and break things" doesn't work in fintech — broken things cost real money.
- Technical debt in security is especially dangerous — a shortcut today becomes a breach tomorrow.

## Scoring Guide (Higher = Easier to Build)

- **80-100**: Standard web/mobile app using existing financial APIs. Stripe for payments, Plaid for data, no custom ledger needed. Example: a financial dashboard that aggregates data from Plaid without holding customer funds.

- **60-79**: Moderate complexity — integrations with payment processors, basic KYC, subscription billing. Existing BaaS providers handle most infrastructure. 3-6 months with experienced team. Example: a payment tool built on Stripe Connect with KYC via Alloy.

- **40-59**: Significant engineering — custom ledger system, lending underwriting engine, or multi-rail payment processing. Requires fintech-experienced engineers and 6-12 months. Example: a lending platform with custom credit scoring and loan servicing.

- **20-39**: Deep technical challenges — core banking system, real-time payment processing, multi-currency ledger, or complex fraud detection ML. 12-18+ months with senior fintech engineers. Example: a neobank building core banking infrastructure with real-time payments and card issuing.

- **0-19**: Requires building fundamental financial infrastructure or solving unsolved technical problems. Core banking from scratch, novel cryptographic systems, or real-time risk engines at massive scale. Example: a new payment network or core banking platform competing with Thought Machine/Mambu.
