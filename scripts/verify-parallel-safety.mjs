#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const registryPath = path.join(root, ".omx", "workstreams", "active.json");
const requireIntegration = process.argv.includes("--require-integration");
const requireMain = process.argv.includes("--require-main");
const requireClean = process.argv.includes("--require-clean");

function run(command) {
  try {
    return execSync(command, { cwd: root, encoding: "utf8" }).trim();
  } catch (error) {
    return "";
  }
}

function normalize(inputPath) {
  return inputPath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function getChangedFiles(command) {
  return run(command)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalize);
}

function matchesPath(filePath, pattern) {
  const file = normalize(filePath);
  const target = normalize(pattern);

  return file === target || file.startsWith(`${target}/`);
}

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => matchesPath(filePath, pattern));
}

const currentBranch = run("git branch --show-current");
const changedTracked = getChangedFiles("git diff --name-only --diff-filter=ACMRTUXB HEAD --");
const changedStaged = getChangedFiles("git diff --cached --name-only --diff-filter=ACMRTUXB --");
const changedUntracked = getChangedFiles("git ls-files --others --exclude-standard");
const changedFiles = [...new Set([...changedTracked, ...changedStaged, ...changedUntracked])];

if (requireMain && currentBranch !== "main") {
  console.error(`Production verification requires the main branch. Current branch: "${currentBranch}".`);
  process.exit(1);
}

if (requireClean && changedFiles.length > 0) {
  console.error("Production verification requires a clean worktree. Dirty files:");
  changedFiles.forEach((filePath) => console.error(`- ${filePath}`));
  process.exit(1);
}

let registry = null;
if (fs.existsSync(registryPath)) {
  registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
}

if (!registry) {
  if (requireIntegration) {
    console.error("Integration verification requires .omx/workstreams/active.json.");
    process.exit(1);
  }

  console.log("No parallel workstream registry found. Clean-tree and branch checks passed.");
  process.exit(0);
}

if (!registry.enabled) {
  if (requireIntegration) {
    console.error("Integration verification requires an enabled parallel workstream registry.");
    process.exit(1);
  }

  console.log("Parallel workstream registry is disabled. Clean-tree and branch checks passed.");
  process.exit(0);
}

const currentFolder = normalize(fs.realpathSync(root));
const workstreams = toArray(registry.workstreams);

const currentStream = workstreams.find((stream) => {
  const branchMatches = stream.branch === currentBranch;
  const folderMatches = stream.folder
    ? normalize(path.resolve(stream.folder)) === currentFolder
    : false;

  return branchMatches || folderMatches;
});

if (!currentStream) {
  console.error("Parallel mode is enabled, but the current worktree is not declared in .omx/workstreams/active.json.");
  process.exit(1);
}

if (currentStream.branch && currentStream.branch !== currentBranch) {
  console.error(`Current branch "${currentBranch}" does not match declared workstream branch "${currentStream.branch}".`);
  process.exit(1);
}

const ownedPaths = toArray(currentStream.ownedPaths);
const allowedSharedPaths = toArray(currentStream.allowedSharedPaths);
const guardedSharedPaths = toArray(registry.guardedSharedPaths);

if (currentStream.role !== "integration") {
  if (currentBranch === "main") {
    console.error("Feature workstreams must not use the main branch directly.");
    process.exit(1);
  }

  const guardedViolations = changedFiles.filter(
    (filePath) =>
      matchesAny(filePath, guardedSharedPaths) && !matchesAny(filePath, allowedSharedPaths),
  );

  if (guardedViolations.length > 0) {
    console.error("Feature workstream touched guarded shared files:");
    guardedViolations.forEach((filePath) => console.error(`- ${filePath}`));
    process.exit(1);
  }

  const outsideOwnedScope = changedFiles.filter(
    (filePath) =>
      !matchesAny(filePath, ownedPaths) && !matchesAny(filePath, allowedSharedPaths),
  );

  if (outsideOwnedScope.length > 0) {
    console.error("Feature workstream touched files outside its declared scope:");
    outsideOwnedScope.forEach((filePath) => console.error(`- ${filePath}`));
    process.exit(1);
  }
}

if (requireIntegration) {
  const integrationPattern = new RegExp(
    registry.integrationBranchPattern ?? "^codex/integration-",
  );

  if (currentStream.role !== "integration") {
    console.error("Production deploy authority belongs to the integration workstream only.");
    process.exit(1);
  }

  if (!integrationPattern.test(currentBranch)) {
    console.error(`Current branch "${currentBranch}" does not match the integration branch pattern.`);
    process.exit(1);
  }
}

if (requireMain && currentStream.role !== "integration" && currentBranch !== "main") {
  console.error("Production verification must run from main after integration promotion.");
  process.exit(1);
}

console.log(
  `Parallel safety check passed for "${currentStream.name}" on branch "${currentBranch}".`,
);
