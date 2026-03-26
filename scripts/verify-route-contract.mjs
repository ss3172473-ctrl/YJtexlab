#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { readRouteMatrix } from "./read-route-matrix.mjs";

const root = process.cwd();
const routeMatrix = readRouteMatrix();
const snapshotPath = path.join(root, "docs/baselines/home/20260326/route-matrix.json");
const headerPath = path.join(root, "src/components/site/Header.tsx");
const footerPath = path.join(root, "src/components/site/Footer.tsx");
const homePath = path.join(root, "src/app/page.tsx");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(fs.existsSync(snapshotPath), "Missing docs/baselines/home/20260326/route-matrix.json");

const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
assert(
  JSON.stringify(snapshot) === JSON.stringify(routeMatrix),
  "Route snapshot is out of sync with src/lib/route-matrix.ts. Run node scripts/generate-route-snapshot.mjs",
);

const headerSource = fs.readFileSync(headerPath, "utf8");
const footerSource = fs.readFileSync(footerPath, "utf8");
const homeSource = fs.readFileSync(homePath, "utf8");

assert(headerSource.includes('from "@/lib/route-matrix"'), "Header must read from route-matrix.");
assert(footerSource.includes('from "@/lib/route-matrix"'), "Footer must read from route-matrix.");
assert(homeSource.includes('data-home-shell-version="20260326-production-baseline"'), "Home page shell version marker is missing.");
assert(homeSource.includes('data-verify-mode={verifyMode ? "true" : undefined}'), "Home page must expose verify-mode state.");

for (const entry of routeMatrix.filter((item) => item.phase === "baseline")) {
  if (entry.expectedStatus === 307) {
    const redirectPath = path.join(root, "src/app", entry.href.slice(1), "page.tsx");
    assert(fs.existsSync(redirectPath), `Missing redirect route file for ${entry.href}`);
    continue;
  }

  if (entry.href === "/") {
    assert(fs.existsSync(homePath), "Missing src/app/page.tsx");
    continue;
  }

  const routePath = path.join(root, "src/app", entry.href.slice(1), "page.tsx");
  assert(fs.existsSync(routePath), `Missing route file for ${entry.href}`);
}

console.log("Route contract is aligned with the source tree and baseline snapshot.");
