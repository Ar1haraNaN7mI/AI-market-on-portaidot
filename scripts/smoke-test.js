const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const port = Number(process.env.PORT || 3100);
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "portalproof-smoke-"));
const requiredMarkers = [
  "PortalProof Market",
  "Escrow AI",
  "Marketplace",
  "Delivery Explorer",
  "Open Explorer",
  "Chain info",
  "Python SDK sidecar",
  "Environment setup",
  "Explorer access",
  "wss://mainnet.portaldot.io",
  "Seller Studio",
  "Buyer Dashboard",
  "Reset demo",
];

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error("Request timed out"));
    });
  });
}

function requestJson(path, payload) {
  return new Promise((resolve, reject) => {
    const body = payload ? JSON.stringify(payload) : "";
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let responseBody = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, body: responseBody });
        });
      },
    );

    req.on("error", reject);
    req.setTimeout(5000, () => {
      req.destroy(new Error("Request timed out"));
    });
    req.end(body);
  });
}

async function main() {
  let child;
  try {
    child = spawn(process.execPath, ["server.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        PORTALPROOF_DATA_DIR: dataDir,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });

    await new Promise((resolve) => setTimeout(resolve, 800));
    const response = await request("/");

    if (response.statusCode !== 200) {
      throw new Error(`Expected HTTP 200, got ${response.statusCode}`);
    }

    for (const marker of requiredMarkers) {
      if (!response.body.includes(marker)) {
        throw new Error(`Missing marker: ${marker}`);
      }
    }

    const config = await request("/config.js");
    if (config.statusCode !== 200 || !config.body.includes("wss://mainnet.portaldot.io")) {
      throw new Error("Config endpoint did not expose the Portaldot RPC endpoint");
    }

    const statePayload = {
      services: [{ id: "SVC-999", title: "Smoke Test Service" }],
      buyerOrderState: [],
      incomingOrderState: [],
      explorerRows: [
        {
          time: "12:00",
          type: "DeliverySubmitted",
          order: "ORD-999",
          from: "0xBuyer",
          to: "0xSeller",
          amount: 9,
          status: "Delivered",
          tx: "0xabc",
          serviceId: "SVC-999",
          hash: "0xproof",
        },
      ],
      sampleOrder: { id: "ORD-999", status: "Created" },
    };
    const saveState = await requestJson("/api/state", statePayload);
    if (saveState.statusCode !== 200) {
      throw new Error(`State save failed with HTTP ${saveState.statusCode}`);
    }

    const readState = await request("/api/state");
    const parsedState = JSON.parse(readState.body);
    if (readState.statusCode !== 200 || parsedState.state?.sampleOrder?.id !== "ORD-999") {
      throw new Error("State API did not return saved demo state");
    }

    const events = await request("/api/events?order=ORD-999&q=proof");
    const parsedEvents = JSON.parse(events.body);
    if (events.statusCode !== 200 || parsedEvents.total !== 1 || parsedEvents.events[0]?.tx !== "0xabc") {
      throw new Error("Events API did not return the saved explorer row");
    }

    child.kill();
    await new Promise((resolve) => setTimeout(resolve, 500));

    child = spawn(process.execPath, ["server.js"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        PORTALPROOF_DATA_DIR: dataDir,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let restartOutput = "";
    child.stdout.on("data", (chunk) => {
      restartOutput += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      restartOutput += chunk.toString();
    });

    await new Promise((resolve) => setTimeout(resolve, 800));

    const restoredState = await request("/api/state");
    const parsedRestoredState = JSON.parse(restoredState.body);
    if (restoredState.statusCode !== 200 || parsedRestoredState.state?.sampleOrder?.id !== "ORD-999") {
      throw new Error("SQLite restart did not restore saved demo state");
    }

    const restoredEvents = await request("/api/events?order=ORD-999&q=proof");
    const parsedRestoredEvents = JSON.parse(restoredEvents.body);
    if (
      restoredEvents.statusCode !== 200 ||
      parsedRestoredEvents.total !== 1 ||
      parsedRestoredEvents.events[0]?.tx !== "0xabc"
    ) {
      throw new Error("SQLite restart did not restore event rows");
    }

    const resetState = await requestJson("/api/reset");
    if (resetState.statusCode !== 200) {
      throw new Error(`State reset failed with HTTP ${resetState.statusCode}`);
    }

    const emptyState = await request("/api/state");
    const parsedEmptyState = JSON.parse(emptyState.body);
    if (emptyState.statusCode !== 200 || parsedEmptyState.exists !== false) {
      throw new Error("State reset did not clear saved demo state");
    }

    console.log("Smoke test passed");
  } finally {
    if (child && !child.killed) {
      child.kill();
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
