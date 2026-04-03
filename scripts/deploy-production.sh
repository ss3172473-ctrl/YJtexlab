#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/leesungjun/Desktop/yjtexlab.com"

if [[ "$(pwd)" != "$ROOT" ]]; then
  echo "Run deploys from $ROOT" >&2
  exit 1
fi

branch="$(git branch --show-current)"
if [[ "$branch" != "main" ]]; then
  echo "Production deploys must start from main. Current branch: $branch" >&2
  exit 1
fi

npm run verify:deploy
git push origin main

echo "Pushed main to origin. Vercel Git integration should create the production deployment from main."
