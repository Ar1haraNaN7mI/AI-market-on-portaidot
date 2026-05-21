# PortalProof Escrow Contract

ink! escrow contract for the MVP scope in `../../PRD.md`.

## MVP Flow

1. Seller creates a service listing reference with `create_service`.
2. Buyer creates an order with `create_order`.
3. Buyer funds escrow with `fund_escrow`.
4. Seller accepts the order with `accept_order`.
5. Seller submits delivery proof with `submit_delivery`.
6. Buyer accepts delivery with `accept_delivery`.
7. Buyer releases payment with `release_payment`.

## Data Stored On-Chain

- Service ID
- Seller address
- Category
- Price in POT
- Metadata hash
- Order ID
- Buyer address
- Delivery hash
- Metadata URI hash
- Status timestamps

Files, reports, and agent packages stay off-chain. The contract stores only verifiable references and state.

## Test

From this directory:

```powershell
cargo test
```

If Cargo cannot reach crates.io, use the local proxy:

```powershell
$env:HTTP_PROXY='http://127.0.0.1:7890'
$env:HTTPS_PROXY='http://127.0.0.1:7890'
cargo test
```

## Build Deployment Artifacts

After installing ink! contract tooling:

```powershell
rustup target add wasm32-unknown-unknown
cargo contract build
```

Run those commands from this directory.
