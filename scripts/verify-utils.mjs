#!/usr/bin/env node

import net from "node:net";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

export async function findOpenPort(startPort = 4110) {
  let port = startPort;

  while (true) {
    const available = await new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => server.close(() => resolve(true)));
      server.listen(port);
    });

    if (available) {
      return port;
    }

    port += 1;
  }
}

export async function waitForHttp(url, timeoutMs = 120000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        return response;
      }
    } catch {
      // retry until ready
    }

    await delay(400);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

export function launchBuiltServer(cwd, port) {
  return spawn("npm", ["run", "start", "--", "--port", String(port)], {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
    },
  });
}

export function launchDevServer(cwd, port) {
  return spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: String(port),
    },
  });
}

export async function stopChild(child) {
  if (!child || child.exitCode != null) {
    return;
  }

  child.kill("SIGTERM");

  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(4000),
  ]);

  if (child.exitCode == null) {
    child.kill("SIGKILL");
  }
}
