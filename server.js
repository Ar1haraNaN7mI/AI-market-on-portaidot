const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const dataDir = process.env.PORTALPROOF_DATA_DIR
  ? path.resolve(process.env.PORTALPROOF_DATA_DIR)
  : path.join(root, ".portalproof");
const dbPath = path.join(dataDir, "portalproof.db");
const legacyStatePath = path.join(dataDir, "state.json");
let database;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".md": "text/markdown; charset=utf-8",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy(new Error("Request body too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function initDatabase() {
  ensureDataDir();
  database = new DatabaseSync(dbPath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS demo_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS explorer_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      type TEXT NOT NULL,
      order_id TEXT NOT NULL,
      from_addr TEXT NOT NULL,
      to_addr TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      tx TEXT NOT NULL,
      service_id TEXT NOT NULL,
      hash TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_explorer_events_order_id ON explorer_events(order_id);
    CREATE INDEX IF NOT EXISTS idx_explorer_events_type ON explorer_events(type);
  `);
}

function readStoredState() {
  const row = database.prepare("SELECT payload FROM demo_state WHERE id = 1").get();
  if (!row?.payload) return null;

  try {
    return JSON.parse(row.payload);
  } catch {
    return null;
  }
}

function loadLegacyStateIfPresent() {
  if (!fs.existsSync(legacyStatePath)) return null;
  if (readStoredState()) return readStoredState();

  try {
    const payload = JSON.parse(fs.readFileSync(legacyStatePath, "utf8"));
    saveState(payload);
    return payload;
  } catch {
    return null;
  }
}

function saveState(payload) {
  const now = new Date().toISOString();
  const rows = Array.isArray(payload?.explorerRows) ? payload.explorerRows : [];

  database.exec("BEGIN");
  try {
    database
      .prepare(
        `
          INSERT INTO demo_state (id, payload, updated_at)
          VALUES (1, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            payload = excluded.payload,
            updated_at = excluded.updated_at
        `,
      )
      .run(JSON.stringify(payload), now);

    database.prepare("DELETE FROM explorer_events").run();
    const insertEvent = database.prepare(`
      INSERT INTO explorer_events (
        time, type, order_id, from_addr, to_addr, amount, status, tx, service_id, hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const row of rows) {
      insertEvent.run(
        row.time ?? "",
        row.type ?? "",
        row.order ?? "",
        row.from ?? "",
        row.to ?? "",
        Number(row.amount) || 0,
        row.status ?? "",
        row.tx ?? "",
        row.serviceId ?? "",
        row.hash ?? "",
      );
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function resetState() {
  database.exec("BEGIN");
  try {
    database.prepare("DELETE FROM demo_state").run();
    database.prepare("DELETE FROM explorer_events").run();
    database.exec("COMMIT");
    fs.rmSync(legacyStatePath, { force: true });
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function getExplorerEvents(url) {
  const rows = database
    .prepare(
      `
        SELECT time, type, order_id AS "order", from_addr AS "from", to_addr AS "to",
               amount, status, tx, service_id AS "serviceId", hash
        FROM explorer_events
        ORDER BY id DESC
      `,
    )
    .all();

  const query = (url.searchParams.get("q") || "").toLowerCase();
  const order = (url.searchParams.get("order") || "").toLowerCase();
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

  return rows
    .filter((row) => {
      const orderMatches = !order || String(row.order || "").toLowerCase() === order;
      const queryMatches =
        !query ||
        [
          row.time,
          row.type,
          row.order,
          row.from,
          row.to,
          row.amount,
          row.status,
          row.tx,
          row.serviceId,
          row.hash,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return orderMatches && queryMatches;
    })
    .slice(0, Number.isFinite(limit) && limit > 0 ? limit : 50);
}

async function handleApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/state") {
    const state = readStoredState() || loadLegacyStateIfPresent();
    if (!state) {
      sendJson(response, 200, { exists: false, state: null });
      return true;
    }

    sendJson(response, 200, { exists: true, state });
    return true;
  }

  if (request.method === "GET" && url.pathname === "/api/events") {
    const events = getExplorerEvents(url);
    sendJson(response, 200, {
      events,
      total: events.length,
    });
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/state") {
    try {
      const body = await readBody(request);
      const state = JSON.parse(body || "{}");
      saveState(state);
      sendJson(response, 200, { ok: true });
    } catch (error) {
      sendJson(response, 400, { ok: false, error: error.message });
    }
    return true;
  }

  if (request.method === "POST" && url.pathname === "/api/reset") {
    try {
      resetState();
      sendJson(response, 200, { ok: true });
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message });
    }
    return true;
  }

  return false;
}

initDatabase();

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);

  handleApi(request, response, url)
    .then((handled) => {
      if (handled) return;

      serveStatic(url, response);
    })
    .catch((error) => {
      sendJson(response, 500, { ok: false, error: error.message });
    });
});

function serveStatic(url, response) {
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.normalize(path.join(root, requestedPath));

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(data);
  });
}

server.listen(port, () => {
  console.log(`PortalProof Market running at http://localhost:${port}`);
});
