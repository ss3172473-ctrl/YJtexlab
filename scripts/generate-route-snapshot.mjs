#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { readRouteMatrix } from "./read-route-matrix.mjs";

const root = process.cwd();
const snapshotPath = path.join(root, "docs/baselines/home/20260326/route-matrix.json");
const routeMatrix = readRouteMatrix().map((entry) => ({
  id: entry.id,
  label: entry.label,
  href: entry.href,
  region: entry.region,
  visibleOnHome: entry.visibleOnHome,
  expectedStatus: entry.expectedStatus,
  phase: entry.phase,
}));

fs.writeFileSync(snapshotPath, `${JSON.stringify(routeMatrix, null, 2)}\n`, "utf8");
console.log(`Wrote ${path.relative(root, snapshotPath)}`);
