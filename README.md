# PortalProof Market

Static MVP shell for the Portaldot hackathon concept in `PRD.md`.

This repo is being shaped for the Portaldot Mini Hackathon requirements:

- Built around Portaldot-native escrow and POT settlement
- Runnable MVP with mock fallback for local demo rehearsal
- Open-source ink! escrow contract in `contracts/portalproof_escrow`
- Delivery Explorer and demo script for a judge-friendly walkthrough

## What is in this scaffold

- Home / marketplace / delivery / security / explorer / seller / buyer / docs sections
- Mock data for services, orders, and explorer rows
- Local order flow for demoing escrow, proof, acceptance, and release
- PRD-mapped layout that can be wired to Portaldot contracts later
- `contracts/portalproof_escrow` ink! escrow contract scaffold matching the MVP state machine

## Run

Use the local HTTP server so browser modules and future contract metadata fetches work correctly:

```powershell
npm start
```

For the integrated demo launcher that starts the server and opens the browser:

```powershell
npm run demo
```

Then open:

```text
http://localhost:3000
```

The app currently runs in mock mode until `config.js` has a deployed contract address and metadata path.

## Frontend Chain Adapter

The chain adapter is in `portalproof-contract.js`.

It exposes:

- `connectWallet`
- `createService`
- `createOrder`
- `fundEscrow`
- `acceptOrder`
- `submitDelivery`
- `acceptDelivery`
- `releasePayment`
- `getService`
- `getOrder`
- `getOwner`

Configuration lives in `config.js`.

Local UI IDs such as `SVC-001` and `ORD-001` are converted to numeric contract IDs before live contract calls.

When `mockFallback` is `false`, the Explorer refresh button can read `get_service`, `get_order`, and `get_owner` from the deployed contract. `config.js` includes the Portaldot genesis hash and a public `queryAccount` for read calls before a wallet is connected.

Write transactions also surface decoded `contractEvents` into the Delivery Explorer feed when the live adapter is active.

Mock-mode demo state is stored through the local server in `.portalproof/portalproof.db`, with `localStorage` as a browser-only fallback. Marketplace drafts, order actions, and explorer rows survive refreshes when you run `npm start`. Use `Reset demo` in Delivery Explorer to clear the saved state and restore the baseline data.

The local server also exposes `GET /api/events` as a lightweight Delivery Explorer event index. It reads saved explorer rows from SQLite and supports `order`, `q`, and `limit` query parameters. In live mode, this is the local equivalent of indexing Portaldot contract events.

## Contract

The escrow contract is in `contracts/portalproof_escrow`.

The local machine now has a stable Rust toolchain installed. Run contract tests with:

```powershell
cd contracts/portalproof_escrow
cargo test
```

If Cargo has trouble reaching crates.io on this Windows machine, use the local proxy:

```powershell
$env:HTTP_PROXY='http://127.0.0.1:7890'
$env:HTTPS_PROXY='http://127.0.0.1:7890'
cargo test
```

For deployment artifacts, install the wasm target and ink! contract tooling, then build:

```powershell
rustup target add wasm32-unknown-unknown
cargo contract build
```

On this Windows machine, `cargo install cargo-contract --locked` currently fails inside `wasm-opt-sys` / Binaryen C++ compilation. The contract tests pass; artifact packaging should be done through WSL/Linux, CI, or a prebuilt `cargo-contract` binary.

## Next implementation step

Compile and test the contract, then replace the mock order and explorer flow with Portaldot contract reads and writes while keeping the same UI surface.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the contract artifact and frontend configuration flow.

## Checks

Run all local checks:

```powershell
npm test
```

Individual checks:

```powershell
npm run check:js
npm run test:smoke
npm run test:contract
```

CI is defined in `.github/workflows/ci.yml`. It runs frontend smoke checks, contract tests, and a Linux artifact build job for `cargo contract build`.

## Demo

Use [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for the 3-minute hackathon walkthrough.

## Submission checklist

Before submitting, make sure you have:

1. A GitHub repo with the frontend, contract, and README.
2. A deployed contract address in `config.js`.
3. `mockFallback` switched to `false` for live mode.
4. A short demo video that shows create order, fund escrow, submit proof, accept delivery, and release payment.
5. Core contract source kept open and easy to review.
