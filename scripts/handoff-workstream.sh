#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
common_dir="$(git rev-parse --git-common-dir)"
current_branch="$(git branch --show-current)"
current_root="$(pwd -P)"
session_dir="$common_dir/codex-workstreams"

if [ ! -d "$session_dir" ]; then
  echo "No codex-workstreams metadata found in $session_dir" >&2
  exit 1
fi

node - "$session_dir" "$current_branch" "$current_root" "$repo_root" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const [sessionDir, currentBranch, currentRoot, repoRoot] = process.argv.slice(2);

function run(command) {
  try {
    return execSync(command, {
      cwd: currentRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const sessions = fs.readdirSync(sessionDir)
  .filter((file) => file.endsWith(".json"))
  .map((file) => {
    const fullPath = path.join(sessionDir, file);
    const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    return {
      ...data,
      sessionFile: fullPath,
    };
  });

const session = sessions.find((entry) => entry.branch === currentBranch)
  ?? sessions.find((entry) => entry.worktreePath && fs.existsSync(entry.worktreePath) && fs.realpathSync(entry.worktreePath) === currentRoot);

if (!session) {
  console.error("No matching workstream session found for this branch/worktree.");
  process.exit(1);
}

const baseSha = session.baseSha || "";
const diffRange = baseSha ? `${baseSha}...HEAD` : "HEAD";
const changedFiles = baseSha ? run(`git diff --name-only ${diffRange}`) : run("git status --short");
const diffStat = baseSha ? run(`git diff --stat ${diffRange}`) : run("git diff --stat");
const commits = baseSha ? run(`git log --oneline ${baseSha}..HEAD`) : run("git log --oneline -5");

console.log("Workstream handoff");
console.log(`- role: ${session.role}`);
console.log(`- name: ${session.name}`);
console.log(`- branch: ${currentBranch}`);
console.log(`- canonical_root: ${repoRoot}`);
console.log(`- worktree: ${currentRoot}`);
console.log(`- base_sha: ${baseSha || "n/a"}`);
console.log("");
console.log("Promotable scope");
if (changedFiles) {
  changedFiles.split("\n").filter(Boolean).forEach((file) => console.log(`- ${file}`));
} else {
  console.log("- No changed files detected.");
}

console.log("");
console.log("Diff stat");
console.log(diffStat || "(no diff stat)");

console.log("");
console.log("Commit log");
console.log(commits || "(no commits since BASE_SHA)");

console.log("");
console.log("Next");
console.log("- Ask whether to promote this workstream to main now");
console.log("- Cherry-pick or patch only the approved diff onto clean main");
console.log("- Run npm run verify:deploy from the canonical integration root before deploy");
NODE
