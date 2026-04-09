#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: ./scripts/remove-worktree.sh <name-or-path> [--delete-branch]" >&2
  exit 1
fi

target="$1"
shift

delete_branch="false"
while [ "$#" -gt 0 ]; do
  case "$1" in
    --delete-branch)
      delete_branch="true"
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

repo_root="$(git rev-parse --show-toplevel)"
common_dir="$(git rev-parse --git-common-dir)"
session_dir="$common_dir/codex-workstreams"
current_root="$(pwd -P)"

node - "$target" "$delete_branch" "$repo_root" "$current_root" "$session_dir" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const [target, deleteBranchFlag, repoRoot, currentRoot, sessionDir] = process.argv.slice(2);

function run(command, cwd = repoRoot) {
  return execSync(command, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

let session = null;
if (fs.existsSync(sessionDir)) {
  const sessions = fs.readdirSync(sessionDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(sessionDir, file);
      return {
        ...JSON.parse(fs.readFileSync(fullPath, "utf8")),
        sessionFile: fullPath,
      };
    });

  session = sessions.find((entry) => entry.name === target)
    ?? sessions.find((entry) => entry.worktreePath === target);
}

const worktreePath = session?.worktreePath || path.resolve(repoRoot, target);
const branch = session?.branch || "";

if (currentRoot === worktreePath) {
  console.error("Refusing to remove the worktree you are currently inside.");
  process.exit(1);
}

run(`git worktree remove "${worktreePath}"`, repoRoot);

if (deleteBranchFlag === "true" && branch && branch !== "main") {
  run(`git branch -D "${branch}"`, repoRoot);
}

if (session?.sessionFile) {
  session.status = "removed";
  session.removedAt = new Date().toISOString();
  fs.writeFileSync(session.sessionFile, `${JSON.stringify(session, null, 2)}\n`);
}

const registryPath = path.join(repoRoot, ".omx", "workstreams", "active.json");
if (fs.existsSync(registryPath)) {
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  if (Array.isArray(registry.workstreams)) {
    registry.workstreams = registry.workstreams.filter((entry) => entry.name !== session?.name);
    fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  }
}

console.log("Removed worktree");
console.log(`- folder: ${worktreePath}`);
if (branch) {
  console.log(`- branch: ${branch}`);
}
if (deleteBranchFlag === "true" && branch) {
  console.log("- branch_deleted: yes");
}
NODE
