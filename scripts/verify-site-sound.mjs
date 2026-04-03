#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const layoutPath = path.join(root, "src/app/layout.tsx");
const soundLayerPath = path.join(root, "src/components/site/SiteSoundLayer.tsx");
const soundtrackPath = path.join(root, "public/audio/home-soundtrack.mp3");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(fs.existsSync(layoutPath), "Missing src/app/layout.tsx");
assert(fs.existsSync(soundLayerPath), "Missing src/components/site/SiteSoundLayer.tsx");

const layoutSource = fs.readFileSync(layoutPath, "utf8");
const soundLayerSource = fs.readFileSync(soundLayerPath, "utf8");

assert(
  layoutSource.includes('import SiteSoundLayer from "@/components/site/SiteSoundLayer"'),
  "Root layout must import SiteSoundLayer.",
);
assert(
  layoutSource.includes("<SiteSoundLayer />"),
  "Root layout must render SiteSoundLayer.",
);
assert(
  soundLayerSource.includes('const SOUNDTRACK_SRC = "/audio/home-soundtrack.mp3";'),
  "SiteSoundLayer soundtrack path drifted.",
);
assert(
  fs.existsSync(soundtrackPath),
  "Missing soundtrack asset: public/audio/home-soundtrack.mp3",
);

const soundtrackStat = fs.statSync(soundtrackPath);
assert(soundtrackStat.size > 0, "Soundtrack asset is empty.");

console.log("Site soundtrack contract is intact.");
