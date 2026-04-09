#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 3 ]; then
  echo "Usage: ./scripts/start-workstream.sh <feature|integration> <name> <scope> [--owned-path path] [--allow-shared-path path] [--base-dir dir] [--register]" >&2
  exit 1
fi

role="$1"
name="$2"
scope="$3"
shift 3

case "$role" in
  feature|integration) ;;
  *)
    echo "Unsupported role: $role" >&2
    exit 1
    ;;
esac

repo_root="$(git rev-parse --show-toplevel)"
common_dir="$(git rev-parse --git-common-dir)"
session_dir="$common_dir/codex-workstreams"
mkdir -p "$session_dir"

default_base_dir="$(cd "$repo_root/.." && pwd)/yjtexlab-worktrees"
base_dir="$default_base_dir"
register="false"
owned_paths_json="[]"
allowed_shared_json="[]"

append_json_array() {
  local current_json="$1"
  local value="$2"
  node -e 'const current = JSON.parse(process.argv[1]); current.push(process.argv[2]); process.stdout.write(JSON.stringify(current));' "$current_json" "$value"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --owned-path)
      owned_paths_json="$(append_json_array "$owned_paths_json" "$2")"
      shift 2
      ;;
    --allow-shared-path)
      allowed_shared_json="$(append_json_array "$allowed_shared_json" "$2")"
      shift 2
      ;;
    --base-dir)
      base_dir="$2"
      shift 2
      ;;
    --register)
      register="true"
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

mkdir -p "$base_dir"

if [ "$role" = "integration" ]; then
  case "$name" in
    integration-*) branch="codex/$name" ;;
    *) branch="codex/integration-$name" ;;
  esac
else
  branch="codex/$name"
fi

folder="$base_dir/$name"
base_sha="$(git -C "$repo_root" rev-parse HEAD)"

if git -C "$repo_root" rev-parse --verify "$branch" >/dev/null 2>&1; then
  git -C "$repo_root" worktree add "$folder" "$branch"
else
  git -C "$repo_root" worktree add -b "$branch" "$folder"
fi

session_file="$session_dir/$name.json"
node - "$session_file" "$role" "$name" "$scope" "$repo_root" "$folder" "$branch" "$base_sha" "$owned_paths_json" "$allowed_shared_json" <<'NODE'
const fs = require("node:fs");

const [
  sessionFile,
  role,
  name,
  scope,
  canonicalRoot,
  worktreePath,
  branch,
  baseSha,
  ownedPathsJson,
  allowedSharedJson,
] = process.argv.slice(2);

const payload = {
  role,
  name,
  scope,
  canonicalRoot,
  worktreePath,
  branch,
  baseSha: role === "feature" ? baseSha : "",
  ownedPaths: JSON.parse(ownedPathsJson),
  allowedSharedPaths: JSON.parse(allowedSharedJson),
  status: "started",
  startedAt: new Date().toISOString(),
};

fs.writeFileSync(sessionFile, `${JSON.stringify(payload, null, 2)}\n`);
NODE

if [ "$register" = "true" ] && [ -f "$repo_root/.omx/workstreams/active.json" ]; then
  node - "$repo_root/.omx/workstreams/active.json" "$role" "$name" "$folder" "$branch" "$scope" "$owned_paths_json" "$allowed_shared_json" "$base_sha" <<'NODE'
const fs = require("node:fs");

const [
  registryPath,
  role,
  name,
  folder,
  branch,
  scope,
  ownedPathsJson,
  allowedSharedJson,
  baseSha,
] = process.argv.slice(2);

const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
registry.workstreams = Array.isArray(registry.workstreams) ? registry.workstreams : [];
registry.workstreams = registry.workstreams.filter((entry) => entry.name !== name);
registry.workstreams.push({
  role,
  name,
  folder,
  branch,
  scope,
  ownedPaths: JSON.parse(ownedPathsJson),
  allowedSharedPaths: JSON.parse(allowedSharedJson),
  baseSha: role === "feature" ? baseSha : "",
});
fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
NODE
fi

cat <<EOF
Started workstream
- role: $role
- name: $name
- branch: $branch
- folder: $folder
- scope: $scope
- base_sha: $base_sha

Next
1. cd "$folder"
2. Hooks will be installed automatically when available
3. Work inside the declared scope only
4. When complete, run ./scripts/handoff-workstream.sh
EOF

if [ -f "$folder/package.json" ] && node -e 'const fs=require("node:fs"); const pkg=JSON.parse(fs.readFileSync(process.argv[1],"utf8")); process.exit(pkg.scripts && pkg.scripts["hooks:install"] ? 0 : 1)' "$folder/package.json" >/dev/null 2>&1; then
  (
    cd "$folder"
    npm run hooks:install >/dev/null
  )
  echo "Hooks installed in $folder"
fi
