const http = require("node:http");
const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const targetUrl = `http://localhost:${port}`;
const serverEntry = path.join(root, "server.js");

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

async function main() {
  const server = spawn(process.execPath, [serverEntry], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
    },
    stdio: "inherit",
  });

  const shutdown = () => {
    if (!server.killed) {
      server.kill();
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

  await waitForServer(targetUrl);
  console.log(`Opening ${targetUrl}`);
  openBrowser(targetUrl);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
