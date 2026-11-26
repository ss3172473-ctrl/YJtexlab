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

const stopButton = soundLayerSource.match(/<button\s[\s\S]*?<\/button>/)?.[0];
assert(stopButton, "Missing shared soundtrack stop button.");
const visualizer = stopButton.indexOf('className="pointer-events-none flex items-end gap-[4px]" aria-hidden="true"');
assert(visualizer > 0, "Visual-only bars must not intercept stop clicks.");
assert(stopButton.slice(0, visualizer).includes('min-h-11 min-w-11'), "Stop soundtrack requires a stable 44px minimum target.");
assert(stopButton.slice(0, visualizer).includes('onClick={stopAudio}'), "Stop must be handled by the persistent button.");
assert(!stopButton.slice(0, visualizer).includes('key='), "Animated levels must not recreate the interactive button.");
assert(stopButton.slice(visualizer).includes('key={`${index}-${level.toFixed(2)}`}'), "Restore the original reactive motion only inside the decorative bars.");
console.log("Soundtrack stop-target regression checks passed.");

assert(/usePathname\(\);\s*if \(!pathname \|\| pathname === "\/admin\/crm" \|\| pathname.startsWith\("\/admin\/crm\/"\)\) \{\s*return null;\s*\}\s*return <Soundtrack \/>;/.test(soundLayerSource), "CRM must not mount the public soundtrack; non-CRM routes still use it.");
console.log("CRM soundtrack exclusion contract passed.");
