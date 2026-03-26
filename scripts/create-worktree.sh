#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: ./scripts/create-worktree.sh <stream-name> <scope>"
  exit 1
fi

stream_name="$1"
scope="$2"

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
base_dir="$(cd "$repo_root/.." && pwd)/yjtexlab-worktrees"
branch="codex/${stream_name}"
folder="${base_dir}/${stream_name}"

mkdir -p "$base_dir"

if git -C "$repo_root" rev-parse --verify "$branch" >/dev/null 2>&1; then
  git -C "$repo_root" worktree add "$folder" "$branch"
else
  git -C "$repo_root" worktree add -b "$branch" "$folder"
fi

cat <<EOF
Created worktree
- folder: $folder
- branch: $branch
- scope: $scope

Next steps
1. Register this workstream in .omx/workstreams/active.json
2. Limit edits to the declared scope
3. Run npm run verify:parallel before handoff
EOF
