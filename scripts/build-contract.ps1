$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$ContractDir = Join-Path $Root "contracts\portalproof_escrow"

Set-Location $ContractDir

Write-Host "Installing wasm32 target if needed..."
rustup target add wasm32-unknown-unknown

Write-Host "Running contract tests..."
cargo test

Write-Host "Checking cargo-contract..."
if (-not (Get-Command cargo-contract -ErrorAction SilentlyContinue)) {
  Write-Host "cargo-contract not found. Install it with:"
  Write-Host "cargo install cargo-contract --locked"
  Write-Host ""
  Write-Host "If this fails on Windows while compiling wasm-opt-sys/Binaryen, build artifacts in WSL/Linux or use a prebuilt cargo-contract release."
  exit 1
}

Write-Host "Building ink! contract artifacts..."
cargo contract build

Write-Host "Artifacts should be under:"
Write-Host (Join-Path $ContractDir "target\ink")
