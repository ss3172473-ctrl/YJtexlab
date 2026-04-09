#!/usr/bin/env node

import fs from "node:fs";
import { execSync, spawnSync } from "node:child_process";

const root = fs.realpathSync(process.cwd());

function run(command) {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const stdin = fs.readFileSync(0, "utf8");
const refLines = stdin
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const pushesToMain = refLines.some((line) => {
  const parts = line.split(/\s+/);
  return parts[2] === "refs/heads/main";
});

const currentBranch = run("git branch --show-current");
const dirty = run("git status --short");

const safety = spawnSync("node", ["scripts/verify-parallel-safety.mjs"], {
  cwd: root,
  encoding: "utf8",
});

if (safety.status !== 0) {
  process.stderr.write(safety.stderr || safety.stdout || "");
  fail("Push blocked by parallel safety guard.");
}

if (!pushesToMain) {
  if (currentBranch && currentBranch !== "main") {
    console.error(`[pre-push] feature branch "${currentBranch}" push allowed.`);
    console.error('[pre-push] If the task is complete, run "./scripts/handoff-workstream.sh" and ask whether to promote to main.');
  }
  process.exit(0);
}

if (currentBranch !== "main") {
  fail(`Refusing to push to main from non-main branch "${currentBranch}". Promote through clean main only.`);
}

if (dirty) {
  fail("Refusing to push main from a dirty worktree. Clean and verify the candidate first.");
}

console.error("[pre-push] main push detected from clean main.");
console.error("[pre-push] Expected path: npm run verify:deploy or ./scripts/deploy-production.sh before push.");
