#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

mkdir -p .githooks
chmod +x .githooks/pre-push .githooks/post-commit 2>/dev/null || true

git config core.hooksPath .githooks

echo "Configured git hooks path: .githooks"
echo "Installed hooks:"
find .githooks -maxdepth 1 -type f -exec basename {} \; | sort | sed 's/^/- /'
