#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = fs.realpathSync(process.cwd());
const hookMode = process.argv.includes("--hook");

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

function log(line = "") {
  process.stdout.write(`${line}\n`);
}

function getCanonicalRoot() {
  const registryPath = path.join(root, ".omx", "workstreams", "active.json");
  if (!fs.existsSync(registryPath)) {
    return run("git rev-parse --show-toplevel") || root;
  }

  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
    return registry.canonicalRoot ? fs.realpathSync(registry.canonicalRoot) : root;
  } catch {
    return run("git rev-parse --show-toplevel") || root;
  }
}

function loadSessions() {
  const commonDir = run("git rev-parse --git-common-dir");
  if (!commonDir) return [];

  const sessionDir = path.join(fs.realpathSync(commonDir), "codex-workstreams");
  if (!fs.existsSync(sessionDir)) return [];

  return fs.readdirSync(sessionDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(sessionDir, file);
      const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      const sessionRoot = data.worktreePath && fs.existsSync(data.worktreePath)
        ? fs.realpathSync(data.worktreePath)
        : null;

      return {
        ...data,
        sessionFile: fullPath,
        matchesBranch: Boolean(data.branch) && data.branch === currentBranch,
        matchesFolder: sessionRoot === root,
      };
    });
}

function findSession(sessions) {
  const sameBranch = sessions.filter((session) => session.matchesBranch);
  const sameFolder = sessions.filter((session) => session.matchesFolder);

  return sameBranch.find((session) => session.status !== "handed-off")
    ?? sameFolder.find((session) => session.status !== "handed-off" && session.branch === currentBranch)
    ?? sameBranch.find((session) => session.status === "started")
    ?? sameBranch[0]
    ?? sameFolder.find((session) => session.status === "started" && session.branch === currentBranch)
    ?? null;
}

const currentBranch = run("git branch --show-current") || "detached";
const dirtyFiles = run("git status --short");
const isDirty = dirtyFiles.length > 0;
const canonicalRoot = getCanonicalRoot();
const isCanonicalRoot = root === canonicalRoot;
const sessions = loadSessions();
const session = findSession(sessions);

if (!session && isCanonicalRoot && currentBranch === "main") {
  if (!hookMode) {
    log("Workstream next step");
    log("- role: integration");
    log("- name: canonical-main");
    log(`- branch: ${currentBranch}`);
    log(`- dirty: ${isDirty ? "yes" : "no"}`);
    log("");
    log("Canonical root is reserved for integration/deploy work.");
    log("Next:");
    log("- Keep feature edits in dedicated worktrees");
    log("- If main should become deploy-ready, run: npm run workstream:audit");
    log("- Then verify from clean main with: npm run verify:deploy");
  }
  process.exit(0);
}

if (!session) {
  if (!hookMode) {
    log("No workstream session found for the current branch/worktree.");
    log("Next:");
    log("- Start feature/integration work with ./scripts/start-workstream.sh");
    log("- Or continue as a read-only analysis thread");
  }
  process.exit(0);
}

if (session.role === "feature") {
  const baseSha = session.baseSha || "";
  const commitCount = baseSha ? run(`git rev-list --count ${baseSha}..HEAD`) : "";
  const changedFiles = baseSha ? run(`git diff --name-only ${baseSha}...HEAD`) : "";

  if (hookMode) {
    if (commitCount && Number(commitCount) > 0) {
      log("");
      log("[workstream-next]");
      log(`feature "${session.name}" has ${commitCount} commit(s) since BASE_SHA.`);
      log("If this task feels complete, stop and ask:");
      log('- "Promote this workstream to main now?"');
      log("Then run: ./scripts/handoff-workstream.sh");
    }
    process.exit(0);
  }

  log("Workstream next step");
  log("- role: feature");
  log(`- name: ${session.name}`);
  log(`- branch: ${currentBranch}`);
  log(`- base_sha: ${baseSha || "n/a"}`);
  log(`- dirty: ${isDirty ? "yes" : "no"}`);
  log(`- commit_count_since_base: ${commitCount || "0"}`);
  log("");
  log("If the requested work looks complete, do not keep editing by default.");
  log('Ask first: "Promote this workstream to main now?"');
  log("");
  log("Next:");
  log("- Review changed scope against BASE_SHA");
  log("- Run: ./scripts/handoff-workstream.sh");
  if (changedFiles) {
    log("- Changed files:");
    changedFiles.split("\n").filter(Boolean).forEach((file) => log(`  - ${file}`));
  }
  process.exit(0);
}

if (session.role === "integration") {
  if (hookMode) {
    process.exit(0);
  }

  log("Workstream next step");
  log("- role: integration");
  log(`- name: ${session.name}`);
  log(`- branch: ${currentBranch}`);
  log(`- dirty: ${isDirty ? "yes" : "no"}`);
  log("");
  log("Next:");
  log("- Promote approved feature diffs onto clean main");
  log("- Run: npm run verify:deploy");
  log("- Then deploy from clean main only");
  process.exit(0);
}

if (!hookMode) {
  log("Workstream next step");
  log(`- role: ${session.role || "analysis"}`);
  log(`- name: ${session.name}`);
  log(`- branch: ${currentBranch}`);
  log("");
  log("This session is read-only.");
  log("Next:");
  log("- Start a feature/integration workstream if you need to change files");
  log("- Or keep this thread in analysis/review mode");
}
