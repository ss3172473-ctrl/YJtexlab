#!/usr/bin/env node

import { readRouteMatrix } from "./read-route-matrix.mjs";
import { findOpenPort, launchBuiltServer, stopChild, waitForHttp } from "./verify-utils.mjs";

const root = process.cwd();
const smokeRoutes = readRouteMatrix().filter((entry) => entry.phase === "baseline");

const port = await findOpenPort(4120);
const baseUrl = `http://127.0.0.1:${port}`;
const server = launchBuiltServer(root, port);

try {
  await waitForHttp(baseUrl);

  for (const route of smokeRoutes) {
    const response = await fetch(`${baseUrl}${route.href}`, {
      cache: "no-store",
      redirect: route.expectedStatus === 307 ? "manual" : "follow",
    });

    if (response.status !== route.expectedStatus) {
      throw new Error(`Expected ${route.href} to return ${route.expectedStatus}, got ${response.status}`);
    }
  }

  console.log("Smoke routes returned the expected statuses.");
} finally {
  await stopChild(server);
}
