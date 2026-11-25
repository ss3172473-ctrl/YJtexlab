#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

import { readRouteMatrix } from "./read-route-matrix.mjs";
import { findOpenPort, launchBuiltServer, stopChild, waitForHttp } from "./verify-utils.mjs";

const root = process.cwd();
const baseDir = path.join(root, "docs/baselines/home/20260326");
const requiredBaselines = [
  path.join(baseDir, "desktop-1440x900.png"),
  path.join(baseDir, "mobile-390x844.png"),
  path.join(baseDir, "route-matrix.json"),
];

if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) {
  execFileSync("npm", ["run", "build"], {
    cwd: root,
    stdio: "inherit",
  });
}

for (const filePath of requiredBaselines) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing baseline artifact: ${path.relative(root, filePath)}`);
    process.exit(1);
  }
}

const port = await findOpenPort(4130);
const baseUrl = `http://127.0.0.1:${port}`;
const verifyUrl = `${baseUrl}/`;
const server = launchBuiltServer(root, port);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function ego(script) {
  const result = spawnSync("ego-browser", ["nodejs", "-e", script], {
    encoding: "utf8",
    timeout: 90000,
  });
  if (result.error) throw result.error;
  const output = (result.stdout ?? "") + "\n" + (result.stderr ?? "");
  assert(result.status === 0, `Ego screenshot verification failed: ${output.trim()}`);
  return output;
}

function captureHomeScreenshots(verifyUrl, tempDir) {
  let spaceId;
  try {
    const setup = ego(`
      const task = await taskSpace("YJTEXLAB local deployment corridor");
      console.log("YJTEX_CORRIDOR_SPACE=" + task.spaceId);
    `);
    spaceId = Number(setup.match(/YJTEX_CORRIDOR_SPACE=(\d+)/)?.[1]);
    assert(Number.isSafeInteger(spaceId) && spaceId > 0, "Ego did not identify the verification space.");
    const dimensions = [[1440, 900, false, "desktop.png"], [390, 844, true, "mobile.png"]];
    for (const [width, height, mobile, filename] of dimensions) {
      const outputPath = path.join(tempDir, filename);
      ego(`
        const task = await taskSpace(${spaceId});
        const page = task.page("p1");
        await page.cdp("Emulation.setDeviceMetricsOverride", {width:${width}, height:${height}, deviceScaleFactor:1, mobile:${mobile}});
        await page.goto(${JSON.stringify(verifyUrl)});
        await page.waitForFunction(() => {
          const hero = document.querySelector('[data-home-section="hero"]');
          return Boolean(hero?.getBoundingClientRect().height);
        }, undefined, {timeout:20000});
        if (!await page.evaluate(() => document.querySelectorAll("main").length === 1)) {
          throw new Error("Ego rendered an unexpected home structure.");
        }
        await page.screenshot({path:${JSON.stringify(outputPath)}});
      `);
      const png = fs.readFileSync(outputPath);
      assert(png.length > 1024 && png.readUInt32BE(16) === width && png.readUInt32BE(20) === height,
        `Ego screenshot did not match ${width}×${height}.`);
    }
  } finally {
    if (Number.isSafeInteger(spaceId) && spaceId > 0) {
      ego(`const task = await taskSpace(${spaceId}); await task.finish({keep: []});`);
    }
  }
}

try {
  const response = await waitForHttp(verifyUrl);
  const html = await response.text();
  const orderedSections = ["hero", "categories", "folder-hub"];

  assert(html.includes('data-home-shell-version="20260326-production-baseline"'), "Missing homepage shell version marker.");
  assert(html.includes('data-home-media-art="fabric-motion-lab"'), "Homepage media-art marker is missing.");
  assert(html.includes('data-home-media-art-version="20260325-production"'), "Homepage media-art version drifted.");
  assert(html.includes('data-debug-signature="embedded-slow-field-20260324-v8|tvh334|ch220|shift-8.6|gain0.92|speed0.72|drift0.88|wave1.52|pulse0.0015|cko2.78"'), "FabricMotionLab debug signature drifted.");
  assert(!html.includes('data-products-preview="true"'), "Homepage is still rendering the product preview implementation.");
  assert(html.includes("Open Footer"), "Footer rail toggle marker is missing.");
  assert(html.includes("CLIENTS"), "Folder hub clients rail is missing.");
  assert(html.includes("GLOBAL"), "Folder hub global rail is missing.");
  assert(html.includes("FACILITIES"), "Folder hub facilities rail is missing.");
  assert(html.includes("View more products"), "Folder hub product rail is missing.");

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
  captureHomeScreenshots(verifyUrl, tempDir);
  console.log(`Homepage verify corridor passed (Ego desktop and mobile: ${tempDir}).`);
} finally {
  await stopChild(server);
}
