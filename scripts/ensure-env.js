const { spawnSync } = require("node:child_process");

const isWindows = process.platform === "win32";

function run(file, args, options = {}) {
  const result = spawnSync(file, args, {
    stdio: options.quiet ? "pipe" : "inherit",
    encoding: "utf8",
    timeout: options.timeout ?? 120000,
  });

  return result;
}

function commandWorks(file, args = []) {
  const result = run(file, args, { quiet: true, timeout: 15000 });
  return result.status === 0;
}

function findPython() {
  const candidates = [
    { file: "python", prefixArgs: [] },
    { file: "python3", prefixArgs: [] },
    { file: "py", prefixArgs: ["-3"] },
  ];

  return candidates.find((candidate) => commandWorks(candidate.file, [...candidate.prefixArgs, "--version"]));
}

function runPython(python, args, options = {}) {
  return run(python.file, [...python.prefixArgs, ...args], options);
}

function installPythonPackage(python, packageName) {
  const first = runPython(python, ["-m", "pip", "install", packageName], { timeout: 240000 });
  if (first.status === 0) return;

  const second = runPython(python, ["-m", "pip", "install", "--user", packageName], { timeout: 240000 });
  if (second.status !== 0) {
    throw new Error(`Failed to install Python package ${packageName}`);
  }
}

function hasExecutable(name) {
  const finder = isWindows ? "where" : "which";
  return commandWorks(finder, [name]);
}

function hasCppCompiler() {
  const compilers = isWindows ? ["cl", "clang", "g++"] : ["c++", "clang++", "g++", "gcc"];
  return compilers.some(hasExecutable);
}

function ensurePythonSdk() {
  const python = findPython();
  if (!python) {
    throw new Error("Python 3 is required for the Portaldot SDK sidecar.");
  }

  const hasSdk = runPython(python, ["-c", "import substrateinterface"], { quiet: true }).status === 0;
  if (!hasSdk) {
    console.log("Installing Portaldot Python SDK dependency: substrate-interface");
    installPythonPackage(python, "substrate-interface");
  }

  return python;
}

function ensureRustToolchain() {
  if (!commandWorks("cargo", ["--version"])) {
    throw new Error("Rust/Cargo is required. Install Rust via rustup before running the full demo.");
  }

  if (!commandWorks("rustup", ["--version"])) {
    throw new Error("rustup is required to add rust-src and wasm32-unknown-unknown.");
  }

  const rustSrc = run("rustup", ["component", "add", "rust-src"], { timeout: 240000 });
  if (rustSrc.status !== 0) {
    throw new Error("Failed to add rust-src component.");
  }

  const wasmTarget = run("rustup", ["target", "add", "wasm32-unknown-unknown"], { timeout: 240000 });
  if (wasmTarget.status !== 0) {
    throw new Error("Failed to add wasm32-unknown-unknown target.");
  }
}

function ensureCargoContract() {
  if (commandWorks("cargo", ["contract", "--version"])) {
    return;
  }

  if (!hasCppCompiler()) {
    throw new Error(
      "cargo-contract requires a C++17 compiler. Install Visual Studio Build Tools 2019+ on Windows or gcc/clang on Linux/macOS.",
    );
  }

  console.log("Installing cargo-contract with cargo install --force --locked cargo-contract");
  const installed = run("cargo", ["install", "--force", "--locked", "cargo-contract"], { timeout: 1800000 });
  if (installed.status !== 0) {
    throw new Error("Failed to install cargo-contract.");
  }
}

function checkDocker() {
  if (commandWorks("docker", ["--version"])) {
    console.log("Docker detected for optional verifiable builds.");
    return;
  }

  console.log("Docker not detected. This is only required for optional verifiable builds.");
}

function main() {
  console.log("Checking PortalProof demo environment...");
  ensurePythonSdk();
  ensureRustToolchain();
  ensureCargoContract();
  checkDocker();
  console.log("Environment check completed.");
}

main();
