#!/usr/bin/env node

import { execSync } from "node:child_process";

const groups = [
  {
    label: "Workflow guard and docs",
    action: "Keep in canonical root and review for promotion",
    patterns: [
      /^AGENTS\.md$/,
      /^\.gitignore$/,
      /^package\.json$/,
      /^docs\/(THREAD_START|PARALLEL_WORKFLOW|DEPLOYMENT|AI_HANDOFF)\.md$/,
      /^\.githooks\//,
      /^githooks\//,
      /^scripts\/(guard-pre-push|workstream-next-step|install-git-hooks|start-workstream|handoff-workstream|remove-worktree|audit-canonical-root)\.(mjs|sh)$/,
    ],
  },
  {
    label: "About route scope",
    action: "Move to an /about feature worktree or promote as a dedicated about candidate",
    patterns: [
      /^src\/components\/about\//,
      /^src\/content\/about\.ts$/,
      /^public\/about\//,
    ],
  },
  {
    label: "Contact route scope",
    action: "Move to a /contact feature worktree or promote as a dedicated contact candidate",
    patterns: [
      /^src\/app\/contact\//,
      /^src\/components\/contact\//,
      /^src\/content\/contact\.ts$/,
      /^src\/lib\/contact\.ts$/,
    ],
  },
  {
    label: "SEO, route, and app-surface changes",
    action: "Review in integration thread only",
    patterns: [
      /^src\/app\/(manifest|opengraph-image|robots|sitemap|twitter-image)\.(ts|tsx)$/,
      /^src\/app\/(link|local-preview)\//,
      /^public\/(link|seo)\//,
      /^public\/(robots\.txt|site\.webmanifest|sitemap\.xml)$/,
      /^src\/lib\/(route-matrix|seo|hero-media|preload-assets)\.ts$/,
    ],
  },
  {
    label: "Duplicate or accidental copy files",
    action: "Remove or relocate after manual confirmation",
    patterns: [
      /(^|\/)[^/]+ 2(\.[^/]+)?$/,
    ],
  },
  {
    label: "Local state and throwaway artifacts",
    action: "Ignore or delete locally; do not promote",
    patterns: [
      /^\.omc\//,
      /^\.tmp-playwright\//,
      /^\.next/,
    ],
  },
];

function run(command) {
  try {
    return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function getDirtyFiles() {
  return run("git status --short")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

const dirtyFiles = getDirtyFiles();
const buckets = groups.map((group) => ({
  ...group,
  files: [],
}));
const uncategorized = [];

for (const file of dirtyFiles) {
  const group = buckets.find((entry) => entry.patterns.some((pattern) => pattern.test(file)));
  if (group) {
    group.files.push(file);
  } else {
    uncategorized.push(file);
  }
}

console.log("Canonical root audit");
console.log(`- branch: ${run("git branch --show-current") || "detached"}`);
console.log(`- status: ${run("git status --short --branch").split("\n")[0] || "unknown"}`);
console.log(`- dirty_file_count: ${dirtyFiles.length}`);
console.log("");

for (const group of buckets) {
  if (group.files.length === 0) continue;

  console.log(`${group.label} (${group.files.length})`);
  console.log(`Action: ${group.action}`);
  group.files.forEach((file) => console.log(`- ${file}`));
  console.log("");
}

if (uncategorized.length > 0) {
  console.log(`Uncategorized (${uncategorized.length})`);
  console.log("Action: Inspect manually before promotion or cleanup");
  uncategorized.forEach((file) => console.log(`- ${file}`));
  console.log("");
}

if (dirtyFiles.length === 0) {
  console.log("Canonical root is clean.");
}
