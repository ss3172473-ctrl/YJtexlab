#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const patterns = [
  /^\.next($|.*)/,
  /^\.artifacts$/,
  /^\.git .+/,
  /^\.omx .+/,
  /^public .+/,
  /^scripts .+/,
  /^tsconfig .+\.json$/,
  /^원단($|.*)/,
  /^new 원단 사진($|.*)/,
  /^_fabric_processing_report_.+/,
];

const removed = [];

for (const entry of fs.readdirSync(root)) {
  if (!patterns.some((pattern) => pattern.test(entry))) {
    continue;
  }

  fs.rmSync(path.join(root, entry), { recursive: true, force: true });
  removed.push(entry);
}

if (removed.length === 0) {
  console.log("No local artifact directories needed cleanup.");
} else {
  console.log(`Removed ${removed.length} local artifact entries.`);
  for (const entry of removed) {
    console.log(`- ${entry}`);
  }
}
