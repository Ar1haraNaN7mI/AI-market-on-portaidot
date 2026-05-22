const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const isWindows = process.platform === "win32";
const setupVersion = "2026-05-22-windows-cargo-contract-soft-fail";

function isCargoContractRequired() {
  return process.env.PORTALPROOF_REQUIRE_CARGO_CONTRACT === "1";
}

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

function addToProcessPath(directory) {
  if (!directory || !fs.existsSync(directory)) return;

  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") || "PATH";
  const currentParts = (process.env[pathKey] || "").split(path.delimiter).filter(Boolean);
  const alreadyPresent = currentParts.some((entry) => entry.toLowerCase() === directory.toLowerCase());

  if (!alreadyPresent) {
    process.env[pathKey] = [directory, ...currentParts].join(path.delimiter);
  }
}

function addKnownMinGwPaths() {
  if (!isWindows) return;

  [
    "C:\\ProgramData\\chocolatey\\lib\\mingw\\tools\\install\\mingw64\\bin",
    "C:\\ProgramData\\chocolatey\\bin",
    "C:\\msys64\\mingw64\\bin",
    "C:\\mingw64\\bin",
    "C:\\Program Files\\CMake\\bin",
  ].forEach(addToProcessPath);
}

function hasCppCompiler() {
  const compilers = isWindows ? ["cl", "clang", "g++"] : ["c++", "clang++", "g++", "gcc"];
  return compilers.some(hasExecutable);
}

function hasGnuCompiler() {
  return hasExecutable("gcc") && (hasExecutable("g++") || hasExecutable("clang++"));
}

function getRustHost() {
  const result = run("rustc", ["-vV"], { quiet: true, timeout: 15000 });
  if (result.status !== 0) return "";

  const match = result.stdout.match(/^host:\s*(.+)$/m);
  return match ? match[1] : "";
}

function findVcVarsAll() {
  const explicitPath = process.env.VCVARSALL;
  if (explicitPath && fs.existsSync(explicitPath)) {
    return explicitPath;
  }

  const programFilesX86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const programFiles = process.env.ProgramFiles || "C:\\Program Files";
  const vswhereCandidates = [
    path.join(programFilesX86, "Microsoft Visual Studio", "Installer", "vswhere.exe"),
    path.join(programFiles, "Microsoft Visual Studio", "Installer", "vswhere.exe"),
  ];

  for (const vswhere of vswhereCandidates) {
    if (!fs.existsSync(vswhere)) continue;

    const result = run(
      vswhere,
      [
        "-latest",
        "-products",
        "*",
        "-requires",
        "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
        "-property",
        "installationPath",
      ],
      { quiet: true, timeout: 30000 },
    );

    const installPath = result.stdout.trim();
    if (result.status === 0 && installPath) {
      const vcvars = path.join(installPath, "VC", "Auxiliary", "Build", "vcvarsall.bat");
      if (fs.existsSync(vcvars)) {
        return vcvars;
      }
    }
  }

  const years = ["2022", "2019", "2017"];
  const editions = ["BuildTools", "Community", "Professional", "Enterprise"];
  for (const year of years) {
    for (const edition of editions) {
      const vcvars = path.join(
        programFilesX86,
        "Microsoft Visual Studio",
        year,
        edition,
        "VC",
        "Auxiliary",
        "Build",
        "vcvarsall.bat",
      );
      if (fs.existsSync(vcvars)) {
        return vcvars;
      }
    }
  }

  return "";
}

function cmdQuote(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function runWithVcVars(vcvarsPath, file, args, options = {}) {
  const command = `call ${cmdQuote(vcvarsPath)} x64 && ${[file, ...args].map(cmdQuote).join(" ")}`;
  return run("cmd", ["/d", "/s", "/c", command], options);
}

function tryInstallWindowsBuildTools() {
  if (commandWorks("winget", ["--version"])) {
    console.log("MSVC Build Tools not found. Trying winget install for Visual Studio Build Tools...");
    const result = run(
      "winget",
      [
        "install",
        "--id",
        "Microsoft.VisualStudio.2022.BuildTools",
        "-e",
        "--silent",
        "--accept-package-agreements",
        "--accept-source-agreements",
        "--override",
        "--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended",
      ],
      { timeout: 3600000 },
    );
    if (result.status === 0) return true;
  }

  if (commandWorks("choco", ["--version"])) {
    console.log("MSVC Build Tools not found. Trying Chocolatey install for Visual Studio Build Tools...");
    const result = run(
      "choco",
      ["install", "visualstudio2022buildtools", "visualstudio2022-workload-vctools", "-y", "--no-progress"],
      { timeout: 3600000 },
    );
    if (result.status === 0) return true;
  }

  return false;
}

function tryInstallMinGw() {
  if (commandWorks("choco", ["--version"])) {
    console.log("MinGW not found. Trying Chocolatey install for mingw...");
    const result = run("choco", ["install", "mingw", "-y", "--no-progress"], { timeout: 1800000 });
    if (result.status === 0) return true;
  }

  return false;
}

function tryInstallChocoPackage(packageName, reason) {
  if (!commandWorks("choco", ["--version"])) {
    return false;
  }

  console.log(`${reason} Trying Chocolatey install for ${packageName}...`);
  const result = run("choco", ["install", packageName, "-y", "--no-progress"], { timeout: 1800000 });
  return result.status === 0;
}

function ensureWindowsBuildExecutable(commandName, chocoPackage, manualInstallHint, required) {
  addKnownMinGwPaths();
  if (hasExecutable(commandName)) return true;

  tryInstallChocoPackage(chocoPackage, `${commandName} not found.`);
  addKnownMinGwPaths();

  if (!hasExecutable(commandName)) {
    if (required) {
      throw new Error(manualInstallHint);
    }

    console.warn(`Warning: ${manualInstallHint} Skipping local cargo-contract installation.`);
    return false;
  }

  return true;
}

function ensureWindowsGnuToolchain() {
  const requireCargoContract = isCargoContractRequired();

  addKnownMinGwPaths();

  if (!hasGnuCompiler()) {
    tryInstallMinGw();
    addKnownMinGwPaths();
  }

  if (!hasGnuCompiler()) {
    const message =
      "MinGW/GCC was not found. Install MinGW-w64 or WinLibs and add its bin directory to PATH, or install Chocolatey and rerun npm run setup.";
    if (requireCargoContract) {
      throw new Error(message);
    }

    console.warn(`Warning: ${message} Skipping local cargo-contract installation.`);
    return {
      cargoPrefixArgs: ["+stable-x86_64-pc-windows-gnu"],
      vcvarsPath: "",
      canInstallCargoContract: false,
    };
  }

  const hasCmake = ensureWindowsBuildExecutable(
    "cmake",
    "cmake",
    "CMake was not found. Install CMake and add its bin directory to PATH, or install Chocolatey and rerun npm run setup.",
    requireCargoContract,
  );
  const hasNinja = ensureWindowsBuildExecutable(
    "ninja",
    "ninja",
    "Ninja was not found. Install Ninja and add it to PATH, or install Chocolatey and rerun npm run setup.",
    requireCargoContract,
  );

  process.env.CC = process.env.CC || "gcc";
  process.env.CXX = process.env.CXX || "g++";
  if (hasNinja) {
    process.env.CMAKE_GENERATOR = process.env.CMAKE_GENERATOR || "Ninja";
  }
  process.env.CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER =
    process.env.CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER || "gcc";

  const toolchain = run("rustup", ["toolchain", "install", "stable-x86_64-pc-windows-gnu"], {
    timeout: 600000,
  });
  if (toolchain.status !== 0) {
    throw new Error("Failed to install Rust GNU toolchain stable-x86_64-pc-windows-gnu.");
  }

  const rustSrc = run("rustup", ["component", "add", "rust-src", "--toolchain", "stable-x86_64-pc-windows-gnu"], {
    timeout: 240000,
  });
  if (rustSrc.status !== 0) {
    throw new Error("Failed to add rust-src component for Rust GNU toolchain.");
  }

  const wasmTarget = run(
    "rustup",
    ["target", "add", "wasm32-unknown-unknown", "--toolchain", "stable-x86_64-pc-windows-gnu"],
    { timeout: 240000 },
  );
  if (wasmTarget.status !== 0) {
    throw new Error("Failed to add wasm32-unknown-unknown target for Rust GNU toolchain.");
  }

  return {
    cargoPrefixArgs: ["+stable-x86_64-pc-windows-gnu"],
    vcvarsPath: "",
    canInstallCargoContract: hasCmake && hasNinja,
  };
}

function ensureCppBuildEnvironment() {
  const windowsCppPreference = (process.env.PORTALPROOF_WINDOWS_CPP || "gnu").toLowerCase();
  if (isWindows && windowsCppPreference !== "msvc") {
    console.log("Windows C++ mode: GNU/MinGW. Set PORTALPROOF_WINDOWS_CPP=msvc to force MSVC.");
    return ensureWindowsGnuToolchain();
  }

  const rustHost = getRustHost();
  const usesMsvc = isWindows && rustHost.includes("msvc");

  if (!usesMsvc) {
    if (!hasCppCompiler()) {
      throw new Error("cargo-contract requires a C++17 compiler. Install gcc/clang on Linux/macOS or C++ tools on Windows.");
    }
    return { cargoPrefixArgs: [], vcvarsPath: "" };
  }

  if (hasExecutable("link")) {
    return { cargoPrefixArgs: [], vcvarsPath: "" };
  }

  let vcvarsPath = findVcVarsAll();
  if (vcvarsPath) {
    console.log(`Using Visual Studio C++ environment from ${vcvarsPath}`);
    return { cargoPrefixArgs: [], vcvarsPath };
  }

  if (tryInstallWindowsBuildTools()) {
    vcvarsPath = findVcVarsAll();
    if (vcvarsPath) {
      console.log(`Using Visual Studio C++ environment from ${vcvarsPath}`);
      return { cargoPrefixArgs: [], vcvarsPath };
    }
    if (hasExecutable("link")) {
      return { cargoPrefixArgs: [], vcvarsPath: "" };
    }
  }

  throw new Error(
    "MSVC linker link.exe was not found. Install Visual Studio Build Tools 2022 with the C++ workload, then rerun npm run setup. Winget command: winget install --id Microsoft.VisualStudio.2022.BuildTools -e --silent --override \"--quiet --wait --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended\"",
  );
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

  const cppBuildEnvironment = ensureCppBuildEnvironment();

  if (cppBuildEnvironment.canInstallCargoContract === false && isWindows && !isCargoContractRequired()) {
    console.warn(
      "Warning: Skipping local cargo-contract installation on Windows because required native build tools are missing. Local demo can continue; CI/Linux builds contract artifacts.",
    );
    return;
  }

  console.log("Installing cargo-contract with cargo install --force --locked cargo-contract");
  const installArgs = [...(cppBuildEnvironment.cargoPrefixArgs || []), "install", "--force", "--locked", "cargo-contract"];
  const installed = cppBuildEnvironment.vcvarsPath
    ? runWithVcVars(cppBuildEnvironment.vcvarsPath, "cargo", installArgs, { timeout: 1800000 })
    : run("cargo", installArgs, { timeout: 1800000 });
  if (installed.status !== 0) {
    if (isWindows && !isCargoContractRequired()) {
      console.warn(
        "Warning: Failed to install cargo-contract on Windows. Local demo can continue; build contract artifacts in CI/Linux, or install MinGW + CMake + Ninja and rerun setup with PORTALPROOF_REQUIRE_CARGO_CONTRACT=1.",
      );
      return;
    }

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
  console.log(`Checking PortalProof demo environment... (${setupVersion})`);
  ensurePythonSdk();
  ensureRustToolchain();
  ensureCargoContract();
  checkDocker();
  console.log("Environment check completed.");
}

main();
