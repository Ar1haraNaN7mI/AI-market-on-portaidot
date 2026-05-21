# PortalProof Market PRD v0.1

## 1. Product Summary

PortalProof Market is a trusted digital delivery marketplace built for the Portaldot ecosystem.

The platform allows sellers to list agents, skills, cybersecurity services, audit reports, automation workflows, deployment packages, and other digital services. Buyers pay with POT into an on-chain escrow. Sellers submit verifiable delivery proofs, and buyers accept delivery to release payment.

The product is not a file hosting platform and does not run agents directly on-chain. Portaldot is used as the trust, payment, escrow, and verification layer.

## 2. Positioning

### English Positioning

A trusted delivery marketplace for agents, cybersecurity services, and verifiable digital work on Portaldot.

### Chinese Positioning

基于 Portaldot 的可信数字交付市场，用 POT 完成托管支付，用链上证明记录交付、验收、信誉和争议。

## 3. Product Goals

1. Let buyers purchase digital services with POT.
2. Let sellers prove delivery through hashes, contract addresses, signed metadata, or commit references.
3. Use Portaldot smart contracts to hold escrow funds and release payment after acceptance.
4. Provide a public delivery explorer for order, payment, delivery, and verification records.
5. Support agent, skill, cybersecurity, audit, and enterprise delivery use cases.

## 4. Non-Goals for MVP

The MVP must not include:

1. Automatic arbitration.
2. Built-in file hosting.
3. Complex subscription billing.
4. Full KYC or enterprise identity verification.
5. Built-in chat.
6. Multi-chain payment.
7. AI agent runtime execution.
8. Malware, phishing, exploit kits, credential theft, or unauthorized offensive tooling.

## 5. Portaldot Alignment

This product should explicitly align with Portaldot's stated ecosystem themes:

1. Layer0 infrastructure.
2. Cross-chain data transmission.
3. Green and trustworthy digital civilization.
4. ZKP and privacy-oriented security.
5. AI-assisted smart contract security monitoring.
6. DAO and collaborative production relations.
7. RWA and verifiable real-world/digital asset flows.
8. POT-native gas and settlement.

Primary references:

1. Portaldot Introduction: https://portaldot-dev.readthedocs.io/en/latest/Introduction.html
2. Portaldot Developer Documentation: https://portaldot-dev.readthedocs.io/en/latest/
3. Portaldot Explorer: https://www.portaldot.io/#/explorer

## 6. Target Users

### Buyers

1. Web3 project teams buying security audits or deployment support.
2. Enterprises buying agent workflows, automation scripts, or private deployment services.
3. Developers buying reusable skills, MCP servers, prompts, templates, or security rules.
4. Hackathon teams buying lightweight reviews, tooling, or delivery support.

### Sellers

1. Agent and skill developers.
2. Cybersecurity researchers.
3. Smart contract auditors.
4. DevOps engineers.
5. Automation consultants.
6. DAO contributors and grant service providers.

## 7. Core Use Cases

### 7.1 Agent and Skill Marketplace

Sellers list reusable agents, Codex skills, MCP servers, automation workflows, prompt packs, or developer tools. Buyers pay in POT and receive access instructions, repository links, metadata, and delivery proofs.

### 7.2 Cybersecurity Delivery Market

Sellers list authorized security services such as smart contract audit, web security assessment, SBOM generation, supply chain scanning, patch recommendations, compliance reports, and defensive monitoring rules.

### 7.3 End-to-End Enterprise Delivery

Sellers deliver private deployment packages, SaaS integrations, API connectors, CI/CD pipelines, internal automation scripts, and operational runbooks. Delivery artifacts are verified through hashes and metadata.

### 7.4 Bounty and Grant Delivery

Organizations publish paid work. Builders submit deliverables. The platform records delivery proof and releases payment after acceptance.

### 7.5 Delivery Proof Explorer

Anyone can search an order, wallet address, transaction hash, artifact hash, or service ID and verify delivery history.

## 8. Information Architecture

The website must include these top-level areas:

1. Home
2. Marketplace
3. Trusted Delivery
4. Cybersecurity
5. Agents & Skills
6. Delivery Explorer
7. Seller Studio
8. Buyer Dashboard
9. Docs
10. Connect Wallet

## 9. Page Requirements

### 9.1 Home Page

Purpose: communicate the product immediately and route users into buying, selling, or verifying delivery.

Required sections:

1. Hero
   - Headline: Trusted digital delivery on Portaldot
   - Subcopy: Buy agents, cybersecurity services, and enterprise deliverables with POT escrow and on-chain proof.
   - Primary CTA: Explore Market
   - Secondary CTA: Verify Delivery

2. Search
   - Placeholder: Search agents, audits, skills, reports, delivery proofs

3. Network Metrics
   - Active Orders
   - Verified Deliveries
   - POT Escrowed
   - Active Sellers

4. Featured Services
   - Show top marketplace listings.

5. Security & Audit Services
   - Show cybersecurity services with compliance labeling.

6. Agent & Skill Marketplace
   - Show agent, skill, MCP, and automation listings.

7. How Escrow Works
   - Buyer funds escrow.
   - Seller submits delivery proof.
   - Buyer verifies and accepts.
   - Contract releases POT.

8. Recent Verified Deliveries
   - Show recent order IDs, service names, seller addresses, artifact hashes, and status.

9. Why Portaldot
   - Explain Portaldot fit through Layer0, POT, smart contracts, cross-chain data, privacy/security, and ecosystem alignment.

### 9.2 Marketplace Page

Purpose: allow buyers to discover services.

Required filters:

1. Category
   - Agent
   - Skill
   - MCP Server
   - Cybersecurity
   - Smart Contract Audit
   - DevOps
   - Enterprise Delivery
   - RWA
   - DAO Tool

2. Delivery Type
   - File
   - Report
   - API
   - Private Deployment
   - Code Repository
   - On-chain Contract
   - Security Rule Pack

3. Payment Type
   - Fixed Price
   - Milestone
   - Bounty

4. Verification Method
   - Hash Proof
   - Contract Address
   - Git Commit
   - Signed Report
   - Metadata JSON

5. Seller Status
   - New Seller
   - Verified Seller
   - Enterprise Ready

Service card fields:

1. Service title
2. Category
3. Seller address
4. Seller badge
5. Price in POT
6. Delivery time
7. Completed orders
8. Rating
9. Verification method
10. CTA: View Details

### 9.3 Service Detail Page

Purpose: explain exactly what the buyer receives and how acceptance works.

Required sections:

1. Service Overview
2. What You Receive
3. Required Buyer Inputs
4. Delivery Proof Method
5. Escrow Terms
6. Refund Terms
7. Seller Reputation
8. Previous Verified Deliveries
9. Compliance and Allowed Use
10. Buy with POT

For cybersecurity services, show this notice:

Only authorized testing, defensive security, audit, and remediation services are allowed. Unauthorized access, credential theft, malware, phishing, exploit kits, and data exfiltration tooling are prohibited.

### 9.4 Create Order Page

Purpose: let buyer create and fund an order.

Required fields:

1. Service ID
2. Buyer wallet address
3. Seller wallet address
4. Price in POT
5. Delivery requirements
6. Required proof type
7. Expected delivery date
8. Acceptance terms checkbox

Required actions:

1. Create Order
2. Fund Escrow with POT
3. View Order

### 9.5 Order Detail Page

Purpose: become the single source of truth for one delivery.

Order statuses:

1. Created
2. Funded
3. Accepted by Seller
4. Delivered
5. Accepted by Buyer
6. Released
7. Disputed
8. Refunded
9. Cancelled

Required fields:

1. Order ID
2. Service ID
3. Service title
4. Buyer address
5. Seller address
6. Escrow amount in POT
7. Escrow contract address
8. Current status
9. Created timestamp
10. Funded transaction hash
11. Delivery artifact hash
12. Delivery metadata URL
13. Release transaction hash

Buyer actions:

1. Fund Escrow
2. Accept Delivery
3. Raise Dispute

Seller actions:

1. Accept Order
2. Submit Delivery Proof
3. Cancel if not funded

### 9.6 Submit Delivery Page

Purpose: let sellers submit a verifiable delivery proof.

Required fields:

1. Order ID
2. Artifact type
3. Artifact hash
4. Metadata URL
5. Optional Git commit
6. Optional contract address
7. Optional signed report hash
8. Seller confirmation checkbox

Required action:

1. Submit Delivery Proof

### 9.7 Delivery Explorer Page

Purpose: provide public verification similar to a lightweight product-specific block explorer.

Required search targets:

1. Order ID
2. Wallet address
3. Transaction hash
4. Service ID
5. Artifact hash
6. Contract address

Required sections:

1. Global search bar
2. Network status summary
3. Recent escrow transactions
4. Recent verified deliveries
5. Recent disputes
6. Top sellers
7. Contract activity

Explorer table fields:

1. Time
2. Type
3. Order ID
4. From
5. To
6. Amount
7. Status
8. Transaction hash

### 9.8 Seller Studio

Purpose: allow sellers to list and manage services.

Required sections:

1. Overview
2. Create Service
3. Manage Listings
4. Incoming Orders
5. Submit Delivery
6. Escrow Balance
7. Reputation
8. Payout History

Create service fields:

1. Title
2. Category
3. Description
4. Price in POT
5. Delivery days
6. Allowed use
7. What buyer receives
8. Verification method
9. Refund policy
10. Required buyer inputs

### 9.9 Buyer Dashboard

Purpose: allow buyers to manage purchases and verification.

Required sections:

1. My Orders
2. Escrowed POT
3. Pending Deliveries
4. Accepted Deliveries
5. Disputes
6. Saved Services

### 9.10 Docs Page

Purpose: explain how to use the product and why Portaldot is used.

Required sections:

1. How to buy a service
2. How to sell a service
3. How escrow works
4. How delivery proof works
5. How to verify a hash
6. Cybersecurity allowed-use policy
7. Portaldot integration overview

## 10. Cybersecurity Policy

### Allowed

1. Authorized penetration testing.
2. Smart contract audit.
3. Vulnerability reporting.
4. Security baseline checks.
5. SBOM generation.
6. Supply chain scanning.
7. Patch recommendations.
8. Defensive monitoring rules.
9. Compliance reports.
10. Security hardening guides.

### Prohibited

1. Credential theft.
2. Malware creation or distribution.
3. Exploit kits for unauthorized use.
4. Phishing kits.
5. Botnets.
6. Bypass tools for unauthorized access.
7. Data exfiltration tooling.
8. Instructions for unauthorized intrusion.
9. Sale of stolen data or accounts.

Any cybersecurity listing must state the authorization requirement clearly.

## 11. On-Chain Contract Scope

The MVP contract should support:

1. Create service listing reference.
2. Create order.
3. Fund escrow with POT.
4. Seller accepts order.
5. Seller submits delivery proof.
6. Buyer accepts delivery.
7. Release payment to seller.
8. Refund buyer when allowed.
9. Read order state.
10. Emit events for explorer indexing.

## 12. Suggested Contract Data Model

### Service

1. service_id
2. seller
3. metadata_hash
4. price
5. category
6. active

### Order

1. order_id
2. service_id
3. buyer
4. seller
5. amount
6. status
7. requirement_hash
8. delivery_hash
9. metadata_uri_hash
10. created_at
11. funded_at
12. delivered_at
13. accepted_at
14. released_at

### Status Enum

1. Created
2. Funded
3. SellerAccepted
4. Delivered
5. BuyerAccepted
6. Released
7. Disputed
8. Refunded
9. Cancelled

## 13. Required Contract Events

1. ServiceCreated
2. ServiceUpdated
3. OrderCreated
4. EscrowFunded
5. OrderAcceptedBySeller
6. DeliverySubmitted
7. DeliveryAccepted
8. PaymentReleased
9. OrderDisputed
10. OrderRefunded
11. OrderCancelled

## 14. Frontend Requirements

The frontend should be a dashboard-first product, not a marketing-only site.

Required technical capabilities:

1. Connect wallet.
2. Detect Portaldot network.
3. Display POT balances.
4. Call escrow contract methods.
5. Read contract state.
6. Display transaction status.
7. Link to Portaldot Explorer.
8. Verify user-entered artifact hashes.
9. Show role-aware actions for buyer and seller.

## 15. Visual Design Direction

The design should feel like a professional Web3 infrastructure product, not a meme marketplace.

### Style Keywords

1. Trustworthy
2. Technical
3. Enterprise-ready
4. Security-aware
5. Blockchain-native
6. Clear and compact

### Color Direction

1. Primary: emerald or green, reflecting Portaldot's green and trustworthy digital civilization theme.
2. Secondary: cyan or blue for verification and network activity.
3. Warning: amber.
4. Risk: red.
5. Neutral: dark slate or clean light SaaS neutral tones.

### Component Style

1. Explorer-style tables.
2. Compact service cards.
3. Status chips.
4. Verification badges.
5. Address and hash short display.
6. Dense dashboards.
7. Clear transaction timelines.

## 16. MVP Demo Script

The hackathon demo should use a cybersecurity delivery scenario.

1. Seller lists "Portaldot Smart Contract Security Review".
2. Buyer opens the listing.
3. Buyer creates an order for 50 POT.
4. Buyer funds escrow with POT.
5. Seller accepts the order.
6. Seller submits an audit report hash.
7. Buyer verifies that the report hash matches.
8. Buyer accepts delivery.
9. Escrow contract releases POT to seller.
10. Delivery Explorer shows the permanent delivery proof.

The demo should take less than 3 minutes.

## 17. Success Metrics

MVP success requires:

1. A buyer can create and fund an order.
2. A seller can submit delivery proof.
3. A buyer can accept delivery.
4. POT escrow can be released to the seller.
5. The order can be found in Delivery Explorer.
6. The UI clearly explains what was delivered and how it was verified.
7. Cybersecurity listings include allowed-use boundaries.

## 18. Implementation Order

1. Build PRD-accurate static UI screens.
2. Build ink! escrow contract.
3. Add contract unit tests.
4. Connect frontend wallet.
5. Connect contract read methods.
6. Connect write transactions.
7. Add Delivery Explorer views from contract events or mocked event data.
8. Deploy contract to Portaldot-compatible environment.
9. Record demo video.
10. Finalize README and submission materials.

## 19. Strict Scope Rule

All implementation after this PRD must stay inside the MVP scope unless a new PRD version is created.

Any proposed feature must be rejected or deferred if it does not directly support one of these MVP flows:

1. Discover service.
2. Create order.
3. Fund escrow with POT.
4. Submit delivery proof.
5. Accept delivery.
6. Release payment.
7. Verify delivery record.

