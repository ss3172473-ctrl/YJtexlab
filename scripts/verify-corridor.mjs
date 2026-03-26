#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { readRouteMatrix } from "./read-route-matrix.mjs";
import { findOpenPort, launchBuiltServer, stopChild, waitForHttp } from "./verify-utils.mjs";

const root = process.cwd();
const baseDir = path.join(root, "docs/baselines/home/20260326");
const requiredBaselines = [
  path.join(baseDir, "desktop-1440x900.png"),
  path.join(baseDir, "mobile-390x844.png"),
  path.join(baseDir, "route-matrix.json"),
];

for (const filePath of requiredBaselines) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing baseline artifact: ${path.relative(root, filePath)}`);
    process.exit(1);
  }
}

const port = await findOpenPort(4130);
const baseUrl = `http://127.0.0.1:${port}`;
const verifyUrl = `${baseUrl}/?verify=1`;
const server = launchBuiltServer(root, port);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  const response = await waitForHttp(verifyUrl);
  const html = await response.text();
  const orderedSections = ["hero", "categories", "partners", "global-presence", "locations"];

  assert(html.includes('data-home-shell-version="20260326-production-baseline"'), "Missing homepage shell version marker.");
  assert(html.includes('data-verify-mode="true"'), "Verify mode query flag is not reaching the page.");

  let lastIndex = -1;
  for (const section of orderedSections) {
    const index = html.indexOf(`data-home-section="${section}"`);
    assert(index !== -1, `Missing home section: ${section}`);
    assert(index > lastIndex, `Home section order is wrong at ${section}`);
    lastIndex = index;
  }

  const mainMatches = html.match(/<main\b/g) ?? [];
  assert(mainMatches.length === 1, `Expected exactly one <main>, found ${mainMatches.length}`);

  for (const route of readRouteMatrix().filter((entry) => entry.visibleOnHome)) {
    assert(html.includes(`href="${route.href}"`), `Visible home route missing href ${route.href}`);
    assert(html.includes(route.label), `Visible home route missing label ${route.label}`);
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "yjtex-home-verify-"));
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const desktopShot = path.join(tempDir, "desktop.png");
  const mobileShot = path.join(tempDir, "mobile.png");

  execFileSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=1440,900",
    "--virtual-time-budget=2500",
    "--run-all-compositor-stages-before-draw",
    `--screenshot=${desktopShot}`,
    verifyUrl,
  ]);

  execFileSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=390,844",
    "--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "--virtual-time-budget=2500",
    "--run-all-compositor-stages-before-draw",
    `--screenshot=${mobileShot}`,
    verifyUrl,
  ]);

  assert(fs.statSync(desktopShot).size > 0, "Desktop verification screenshot was not created.");
  assert(fs.statSync(mobileShot).size > 0, "Mobile verification screenshot was not created.");

  console.log("Homepage verify corridor passed.");
} finally {
  await stopChild(server);
}
