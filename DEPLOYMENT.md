# PortalProof Deployment Notes

This project currently has:

- Static frontend with mock fallback.
- Portaldot/Polkadot contract adapter.
- Tested ink! escrow contract.

## 1. Build Contract Artifacts

From the repository root:

```powershell
.\scripts\build-contract.ps1
```

If the script says `cargo-contract` is missing:

```powershell
cargo install cargo-contract --locked
```

Known Windows blocker:

On this machine, installing `cargo-contract v5.0.3` failed while compiling `wasm-opt-sys` / Binaryen with MSVC. The contract itself still passes unit tests, and the `wasm32-unknown-unknown` target is installed, but artifact packaging requires `cargo-contract`.

Recommended workaround:

1. Build the contract artifacts from WSL/Linux.
2. Or install a prebuilt `cargo-contract` binary if available for your environment.
3. Or use another machine/CI runner with `cargo-contract` already installed.

This repository includes `.github/workflows/ci.yml` with a Linux artifact build job. If pushed to GitHub, download the `portalproof-escrow-contract` artifact from that workflow run.

Then rerun:

```powershell
.\scripts\build-contract.ps1
```

Expected artifacts:

```text
contracts/portalproof_escrow/target/ink/portalproof_escrow.json
contracts/portalproof_escrow/target/ink/portalproof_escrow.wasm
```

## 2. Deploy to Portaldot-Compatible Contracts Runtime

Use the generated `.contract` / metadata / wasm artifacts with a contracts UI or deployment script targeting:

```text
wss://mainnet.portaldot.io
```

The contract constructor is:

```text
new()
```

## 3. Configure Frontend

After deployment, update `config.js`:

```js
contractAddress: "DEPLOYED_CONTRACT_ADDRESS",
mockFallback: false,
```

Optional read-only account for chain queries before wallet connection:

```js
queryAccount: "ANY_VALID_PORTALDOT_ACCOUNT_ADDRESS",
```

Keep:

```js
contractMetadataUrl: "./contracts/portalproof_escrow/target/ink/portalproof_escrow.json",
```

## 4. Run Frontend

```powershell
node server.js
```

Open:

```text
http://localhost:3000
```

## 5. Live Test Order

1. Connect wallet.
2. Publish a service.
3. Create order.
4. Fund escrow.
5. Accept order as seller.
6. Submit delivery proof.
7. Accept delivery as buyer.
8. Release POT.
9. Use `Refresh chain` in Delivery Explorer to load `get_service`, `get_order`, and `get_owner`.

For a real demo, use separate buyer and seller wallets.
