# PortalProof Market Demo Script

Target length: under 3 minutes.

## Setup

Run:

```powershell
npm run demo
```

The launcher first checks and completes the Python SDK, Rust, wasm target, and `cargo-contract` environment. Use `npm run setup` to run only the environment check.

Open:

```text
http://localhost:3000
```

The current demo runs in mock mode until a deployed Portaldot contract address is added to `config.js`.
Running through `npm start` also enables local SQLite state at `.portalproof/portalproof.db`, so service drafts, order actions, and explorer rows survive refreshes during rehearsal.
Running through `npm run demo` also starts the Portaldot Python SDK sidecar on `http://localhost:8787` when `substrateinterface` is installed.

## Narration

PortalProof Market is a trusted digital delivery marketplace built on Portaldot. It lets buyers purchase agents, cybersecurity services, and enterprise deliverables with POT escrow and verifiable delivery proofs.

The key problem is that digital delivery can be disputed or tampered with. PortalProof records the order, escrow status, delivery hash, acceptance, and release history so both sides have a verifiable trail.

## Demo Flow

1. Open the home page.
   - Show network snapshot.
   - Mention Portaldot, POT, escrow, and proof-based delivery.

2. Open Marketplace.
   - Filter by `Cybersecurity`.
   - Select `Portaldot Smart Contract Security Review`.

3. Open Trusted Delivery.
   - Create a sample order.
   - Show the buyer wallet, seller wallet, and delivery requirements fields.
   - Keep `Fund escrow immediately` checked.
   - Submit the order.

4. Show the sample order timeline.
   - Click `Accept Order`.
   - Click `Submit Proof`.
   - Click `Accept Delivery`.
   - Click `Release POT`.

5. Open Delivery Explorer.
   - Search for `ORD-001`.
   - Show order events and transaction-like rows.
   - Mention the local server exposes the same saved rows through `GET /api/events`, which acts as the MVP event indexer.
   - Click `Refresh chain`.
   - Explain that in live mode the app reads `get_service`, `get_order`, and `get_owner` from the deployed contract and also surfaces decoded `contractEvents`.
   - Mention `Reset demo` clears the SQLite-backed demo state and restores the baseline mock data before recording or rehearsing again.

6. Open Cybersecurity.
   - Show allowed services and prohibited services.
   - Explain that the marketplace is for authorized defensive work only.

7. Open Seller Studio.
   - Show how a seller can publish a service with price, category, delivery type, and verification method.

8. Close on the PRD scope.
   - Discover service.
   - Create order.
   - Fund escrow with POT.
   - Submit delivery proof.
   - Accept delivery.
   - Release payment.
   - Verify delivery record.

## Live Contract Upgrade

After contract deployment:

1. Put the deployed address in `config.js`.
2. Set `mockFallback` to `false`.
3. Use wallet extension accounts for buyer and seller.
4. Repeat the same demo flow with real Portaldot transactions.
