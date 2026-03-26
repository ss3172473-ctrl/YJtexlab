#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const duplicatePatterns = [
  /^\.artifacts$/,
  /^\.git .+/,
  /^\.next 2$/,
  /^\.next 3$/,
  /^\.omx .+/,
  /^public .+/,
  /^scripts .+/,
  /^tsconfig .+\.json$/,
  /^원단($|.*)/,
  /^new 원단 사진($|.*)/,
  /^_fabric_processing_report_.+/,
];

const trackedOffenderPatterns = [
  /^\.artifacts\//,
  /^\.git .+\//,
  /^\.next 2\//,
  /^\.next 3\//,
  /^\.omx .+\//,
  /^public .+\//,
  /^scripts .+\//,
  /^tsconfig .+\.json$/,
  /^원단($|\/)/,
  /^원단 .+/,
  /^new 원단 사진($|\/)/,
  /^_fabric_processing_report_.+/,
];

const duplicateRoots = fs
  .readdirSync(root)
  .filter((entry) => duplicatePatterns.some((pattern) => pattern.test(entry)));

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
}).split("\0").filter(Boolean);

const trackedOffenders = trackedFiles.filter((entry) =>
  trackedOffenderPatterns.some((pattern) => pattern.test(entry)),
);

if (duplicateRoots.length > 0 || trackedOffenders.length > 0) {
  console.error("Repository hygiene failed.");

  for (const offender of duplicateRoots) {
    console.error(`- duplicate root: ${path.join(root, offender)}`);
  }

  for (const offender of trackedOffenders) {
    console.error(`- tracked offender: ${offender}`);
  }

  process.exit(1);
}

console.log("Repository hygiene is clean.");
