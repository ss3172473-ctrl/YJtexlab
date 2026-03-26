#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const checks = [
  {
    file: "README.md",
    required: ["npm run clean:artifacts", "npm run verify:deploy", "src/components/home", "src/components/site", "src/components/products"],
  },
  {
    file: "DESIGN.md",
    required: ["Header", "Original hero video", "Categories preview", "Partners", "Global Presence", "Locations", "Footer"],
  },
  {
    file: "docs/PROJECT_STRUCTURE.md",
    required: ["src/components/home", "src/components/site", "src/components/products", "docs/baselines/home/20260326", "docs/AI_HANDOFF.md"],
  },
  {
    file: "docs/DEPLOYMENT.md",
    required: ["/Users/leesungjun/Desktop/yjtexlab.com", "npm run verify:deploy", "/privacy", "/terms"],
  },
  {
    file: "docs/RESEARCH_NOTES.md",
    required: ["route-matrix.ts", "production baseline", "https://nextjs.org/docs/app/getting-started/project-structure", "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/", "https://vercel.com/docs/monorepos"],
  },
  {
    file: "docs/AI_HANDOFF.md",
    required: ["homepage media-art owner", "src/components/home/FabricMotionLab.tsx", "verify:corridor", "verify:deploy", "production baseline: 2026-03-26"],
  },
];

for (const check of checks) {
  const filePath = path.join(root, check.file);
  const source = fs.readFileSync(filePath, "utf8");

  for (const token of check.required) {
    if (!source.includes(token)) {
      console.error(`${check.file} is missing required token: ${token}`);
      process.exit(1);
    }
  }
}

console.log("Docs and handoff files match the current contract.");
