const http = require("node:http");
const fs = require("node:fs");
const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const targetUrl = `http://localhost:${port}`;
const serverEntry = path.join(root, "server.js");
const ensureEnvEntry = path.join(root, "scripts", "ensure-env.js");
const pythonServiceEntry = path.join(root, "scripts", "portaldot-sdk-service.py");
const pythonServicePort = Number(process.env.PORTALDOT_SDK_PORT || 8787);
const pythonServiceUrl = `http://localhost:${pythonServicePort}/health`;

function waitForServer(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const tryRequest = () => {
      const request = http.get(url, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode >= 200 && response.statusCode < 500) {
          resolve();
          return;
        }

        retry();
      });

      request.on("error", retry);
      request.setTimeout(1000, () => {
        request.destroy();
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - startedAt >= timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }

      setTimeout(tryRequest, 250);
    };

    tryRequest();
  });
}

function openBrowser(url) {
  const command =
    process.platform === "win32"
      ? { file: "cmd", args: ["/c", "start", "", url] }
      : process.platform === "darwin"
        ? { file: "open", args: [url] }
        : { file: "xdg-open", args: [url] };

  const child = spawn(command.file, command.args, {
    stdio: "ignore",
    detached: true,
  });

  child.unref();
}

function ensureEnvironment() {
  if (process.env.PORTALPROOF_SKIP_ENV_SETUP === "1") {
    console.log("Skipping environment setup because PORTALPROOF_SKIP_ENV_SETUP=1.");
    return;
  }

  const result = spawnSync(process.execPath, [ensureEnvEntry], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
    timeout: 1800000,
  });

  if (result.status !== 0) {
    throw new Error("Environment setup failed.");
  }
}

function readConfigString(source, key, fallback = "") {
  const match = source.match(new RegExp(`${key}:\\s*"([^"]*)"`));
  return match ? match[1] : fallback;
}

function readConfigNumber(source, key, fallback = 0) {
  const match = source.match(new RegExp(`${key}:\\s*([0-9]+)`));
  return match ? Number(match[1]) : fallback;
}

function loadPortalproofConfig() {
  const source = fs.readFileSync(path.join(root, "config.js"), "utf8");
  return {
    rpcEndpoint: readConfigString(source, "rpcEndpoint", "wss://mainnet.portaldot.io"),
    ss58Format: readConfigNumber(source, "ss58Format", 42),
    genesisHash: readConfigString(source, "genesisHash"),
    queryAccount: readConfigString(source, "queryAccount"),
    contractAddress: readConfigString(source, "contractAddress"),
    contractMetadataUrl: readConfigString(
      source,
      "contractMetadataUrl",
      "./contracts/portalproof_escrow/target/ink/portalproof_escrow.json",
    ),
  };
}

function findPythonWithSubstrateInterface() {
  const candidates = [
    { file: "python", args: ["-c", "import substrateinterface"] },
    { file: "py", args: ["-3", "-c", "import substrateinterface"] },
  ];

  for (const candidate of candidates) {
    const result = spawnSync(candidate.file, candidate.args, {
      cwd: root,
      encoding: "utf8",
      timeout: 5000,
    });

    if (result.status === 0) {
      return candidate;
    }
  }

  return null;
}

function startPythonSdkService(config) {
  const python = findPythonWithSubstrateInterface();
  if (!python) {
    console.warn("Portaldot Python SDK service skipped: substrateinterface is not available.");
    return null;
  }

  const args = python.file === "py" ? ["-3", pythonServiceEntry] : [pythonServiceEntry];
  return spawn(python.file, args, {
    cwd: root,
    env: {
      ...process.env,
      PORTALDOT_RPC_ENDPOINT: config.rpcEndpoint,
      PORTALDOT_SS58_FORMAT: String(config.ss58Format),
      PORTALDOT_GENESIS_HASH: config.genesisHash || "",
      PORTALDOT_QUERY_ACCOUNT: config.queryAccount || "",
      PORTALDOT_CONTRACT_ADDRESS: config.contractAddress || "",
      PORTALDOT_CONTRACT_METADATA: path.resolve(root, config.contractMetadataUrl),
      PORTALDOT_SDK_PORT: String(pythonServicePort),
    },
    stdio: "inherit",
  });
}

async function main() {
  ensureEnvironment();
  const config = loadPortalproofConfig();
  const server = spawn(process.execPath, [serverEntry], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: "inherit",
  });
  const pythonService = startPythonSdkService(config);

  const shutdown = () => {
    if (!server.killed) {
      server.kill();
    }
    if (pythonService && !pythonService.killed) {
      pythonService.kill();
    }
  };

  process.on("SIGINT", () => {
    shutdown();
    process.exit(130);
  });

  process.on("SIGTERM", () => {
    shutdown();
    process.exit(143);
  });

  server.on("exit", (code, signal) => {
    if (code === 0 || signal) {
      process.exit(code ?? 0);
      return;
    }

    console.error(`Server exited with code ${code}`);
    process.exit(code ?? 1);
  });

  if (pythonService) {
    pythonService.on("exit", (code, signal) => {
      if (!signal && code !== 0) {
        console.error(`Portaldot Python SDK service exited with code ${code}`);
      }
    });
  }

  const pythonServiceReady = pythonService
    ? waitForServer(pythonServiceUrl)
        .then(() => {
          console.log(`Portaldot Python SDK service ready at ${pythonServiceUrl}`);
        })
        .catch((error) => {
          console.warn(`Portaldot Python SDK service did not become ready: ${error.message}`);
        })
    : Promise.resolve();

  await Promise.all([waitForServer(targetUrl), pythonServiceReady]);
  console.log(`Opening ${targetUrl}`);
  openBrowser(targetUrl);
  console.log(`Demo is running at ${targetUrl}. Press Ctrl+C to stop the web server and SDK sidecar.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
