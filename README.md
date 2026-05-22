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
- Portaldot Python SDK sidecar service in `scripts/portaldot-sdk-service.py`

## Run

Use the local HTTP server so browser modules and future contract metadata fetches work correctly:

```powershell
npm start
```

For the integrated demo launcher that starts the web server, starts the Portaldot Python SDK sidecar when `substrateinterface` is available, and opens the browser:

```powershell
npm run demo
```

`npm run demo` runs the environment setup first. To run that step without launching the app:

```powershell
npm run setup
```

The setup step checks Python 3, installs `substrate-interface` when missing, adds Rust `rust-src`, adds the `wasm32-unknown-unknown` target, installs `cargo-contract` when missing, and checks for a C++ compiler required by `cargo-contract`.

On Windows, setup defaults to the lighter GNU/MinGW path so a small cloud server does not need Visual Studio Build Tools. It checks for `gcc`, `g++`, `cmake`, and `ninja`, tries Chocolatey installation for missing tools when Chocolatey is available, installs `stable-x86_64-pc-windows-gnu`, and installs `cargo-contract` through that Rust GNU toolchain. If Chocolatey is not installed, install MinGW-w64 or WinLibs, CMake, and Ninja manually and add their `bin` directories to `PATH`, then rerun `npm run setup`.

`cargo-contract` compiles `wasm-opt-sys`/Binaryen during installation and can still fail on constrained Windows Server machines. On Windows, setup treats missing native build tools or `cargo-contract` installation failure as non-blocking so the local demo can still start. CI/Linux remains the recommended path for producing contract artifacts. Set `PORTALPROOF_REQUIRE_CARGO_CONTRACT=1` if you want setup to fail hard until `cargo-contract` is installed locally.

If you intentionally want to use Visual Studio Build Tools instead, set `PORTALPROOF_WINDOWS_CPP=msvc` before running setup. Set `PORTALPROOF_SKIP_ENV_SETUP=1` if you need to bypass setup in a preconfigured environment.

Then open:

```text
http://localhost:3000
```

The app currently runs in mock mode until `config.js` has a deployed contract address and metadata path.

The Python SDK sidecar listens on `http://localhost:8787` by default. It follows the official Portaldot Python SDK example style with `SubstrateInterface`, read-only account queries, fee preview, optional signed transfer submission through `PORTALDOT_SIGNER_URI`, and optional contract reads once `contractAddress` is configured. On constrained Windows servers it will retry the RPC connection with TLS verification disabled if the certificate chain is rejected, so the demo can still start. If your chain needs a custom type registry, set `PORTALDOT_TYPE_REGISTRY_PRESET` explicitly; otherwise the sidecar uses automatic discovery.

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

On Windows servers without Visual Studio Build Tools, run the build through the GNU toolchain installed by `npm run setup`:

```powershell
cargo +stable-x86_64-pc-windows-gnu contract build
```

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
