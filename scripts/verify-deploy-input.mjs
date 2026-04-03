#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();

const forbiddenRootPatterns = [
  /^\.next$/,
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

const forbiddenTrackedPatterns = [
  /^\.artifacts\//,
  /^\.git .+\//,
  /^\.next\//,
  /^\.next 2\//,
  /^\.next 3\//,
  /^\.omx .+\//,
  /^public .+\//,
  /^scripts .+\//,
  /^tsconfig .+\.json$/,
  /^원단($|\/)/,
  /^원단 .+/,
  /^new 원단 사진($|\/)/,
  /^_backup_original_heic_/,
  /^_fabric_processing_report_.+/,
  /(?:^|\/)[^/]+ [23]\.(?:css|html|js|jsx|json|md|mjs|png|svg|ts|tsx)$/,
];

const duplicateFilePatterns = [
  /(?:^|\/)[^/]+ [23]\.(?:css|html|js|jsx|json|md|mjs|png|svg|ts|tsx)$/,
];

const rootOffenders = fs
  .readdirSync(root)
  .filter((entry) => forbiddenRootPatterns.some((pattern) => pattern.test(entry)));

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
}).split("\0").filter(Boolean);

const trackedOffenders = trackedFiles.filter((entry) =>
  forbiddenTrackedPatterns.some((pattern) => pattern.test(entry)),
);

const untrackedFiles = execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], {
  cwd: root,
  encoding: "utf8",
}).split("\0").filter(Boolean);

const duplicateNameOffenders = [...trackedFiles, ...untrackedFiles].filter((entry) =>
  duplicateFilePatterns.some((pattern) => pattern.test(entry)),
);

if (rootOffenders.length > 0 || trackedOffenders.length > 0 || duplicateNameOffenders.length > 0) {
  console.error("Deploy input is polluted by forbidden local artifacts or tracked duplicates.");

  if (rootOffenders.length > 0) {
    console.error("\nRoot offenders:");
    for (const offender of rootOffenders) {
      console.error(`- ${path.join(root, offender)}`);
    }
  }

  if (trackedOffenders.length > 0) {
    console.error("\nTracked offenders:");
    for (const offender of trackedOffenders.slice(0, 200)) {
      console.error(`- ${offender}`);
    }

    if (trackedOffenders.length > 200) {
      console.error(`- ... ${trackedOffenders.length - 200} more`);
    }
  }

  if (duplicateNameOffenders.length > 0) {
    console.error("\nDuplicate-style file offenders:");
    for (const offender of duplicateNameOffenders.slice(0, 200)) {
      console.error(`- ${offender}`);
    }

    if (duplicateNameOffenders.length > 200) {
      console.error(`- ... ${duplicateNameOffenders.length - 200} more`);
    }
  }

  process.exit(1);
}

console.log("Deploy input is clean.");
