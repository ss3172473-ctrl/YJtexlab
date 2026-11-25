#!/usr/bin/env bash
set -euo pipefail

# This helper pushes to GitHub; it never makes a direct Vercel deployment.
die() { printf '%s\n' "$1" >&2; exit 1; }
ROOT="$HOME/Projects/YJTEXLAB/yjtexlab.com"
[[ "$(pwd -P)" == "$ROOT" ]] || die "Start in the canonical integration clone: $ROOT"
[[ -d .git && ! -L .git ]] || die "Use the independent integration clone, not a linked worktree."
[[ "$(git rev-parse --show-toplevel)" == "$ROOT" ]] || die "Unexpected Git worktree root."
[[ "$(git branch --show-current)" == "main" ]] || die "Production deploys require main."
[[ -z "$(git status --porcelain --untracked-files=normal)" ]] || die "Production deploys require a clean worktree."

valid_origin() {
  case "$1" in
    https://github.com/ss3172473-ctrl/YJtexlab|https://github.com/ss3172473-ctrl/YJtexlab.git|git@github.com:ss3172473-ctrl/YJtexlab|git@github.com:ss3172473-ctrl/YJtexlab.git|ssh://git@github.com/ss3172473-ctrl/YJtexlab|ssh://git@github.com/ss3172473-ctrl/YJtexlab.git) return 0;;
    *) return 1;;
  esac
}
# Reject multiple origins or redirected push targets; never echo remote URLs.
valid_origin "$(git remote get-url --all origin)" || die "Unexpected fetch origin."
valid_origin "$(git remote get-url --push --all origin)" || die "Unexpected push origin."
if [[ -e .vercel/project.json || -L .vercel/project.json ]]; then
  [[ -f .vercel/project.json && ! -L .vercel/project.json ]] || die "Invalid local Vercel project file."
  node -e 'const p=JSON.parse(require("node:fs").readFileSync(".vercel/project.json","utf8"));process.exit(p.projectId==="prj_OsXUaLMXMpD9syk6enT3ON0Zvumi"?0:1)' || die "Wrong Vercel project for yjtexlab.com."
fi

case "${1:-}" in
  --check-only) echo "Canonical GitHub integration clone verified. No push."; exit 0;;
  "") ;;
  *) die "Usage: scripts/deploy-production.sh [--check-only]";;
esac
npm run verify:deploy
[[ -z "$(git status --porcelain --untracked-files=normal)" ]] || die "Verification changed the checkout; nothing pushed."
git push origin refs/heads/main:refs/heads/main
echo "Pushed verified main to GitHub for Vercel auto deployment."
