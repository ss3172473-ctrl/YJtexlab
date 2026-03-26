#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productsPagePath = path.join(root, "src/app/products/page.tsx");
const showcasePath = path.join(root, "src/components/products/MotionHouseShowcase.tsx");
const preloadGatePath = path.join(root, "src/components/products/PagePreloadGate.tsx");
const preloadAssetsPath = path.join(root, "src/lib/preload-assets.ts");
const manifestPath = path.join(root, "public/new-stage-fabrics/manifest.json");
const orbitalPresetHelperPath = path.join(root, "src/components/products/orbitalInspectionPresets.ts");

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

function read(filePath) {
  if (!fs.existsSync(filePath)) {
    fail(`Required file is missing: ${path.relative(root, filePath)}`);
  }

  return fs.readFileSync(filePath, "utf8");
}

const productsPage = read(productsPagePath);
const showcase = read(showcasePath);
const preloadGate = read(preloadGatePath);
const preloadAssets = read(preloadAssetsPath);
const orbitalPresetHelper = read(orbitalPresetHelperPath);
const manifest = JSON.parse(read(manifestPath));

if (!productsPage.includes('import MotionHouseShowcase from "@/components/products/MotionHouseShowcase"')) {
  fail("Products page must render MotionHouseShowcase.");
}

if (!productsPage.includes('import PagePreloadGate from "@/components/products/PagePreloadGate"')) {
  fail("Products page must gate entry with PagePreloadGate.");
}

if (!productsPage.includes('assets={productsPreloadAssets}')) {
  fail("Products page must pass productsPreloadAssets into PagePreloadGate.");
}

if (!productsPage.includes('title="Preparing The Fabric Board"')) {
  fail("Products page must keep the current preload title.");
}

if (!productsPage.includes('railStudySlug="orbital-inspection-board"')) {
  fail("Products page must keep the orbital inspection board as the active study.");
}

if (!preloadGate.includes("function preloadImage")) {
  fail("PagePreloadGate must preload image assets before revealing the page.");
}

if (!preloadGate.includes("setIsReady(true)")) {
  fail("PagePreloadGate must release the page after assets are ready.");
}

if (!preloadAssets.includes('import manifest from "../../public/new-stage-fabrics/manifest.json"')) {
  fail("productsPreloadAssets must be derived from the new-stage-fabrics manifest.");
}

if (!preloadAssets.includes("export const productsPreloadAssets = productManifestAssets;")) {
  fail("productsPreloadAssets export is missing.");
}

if (!showcase.includes('variantKey: "orbital-inspection-board"')) {
  fail("MotionHouseShowcase must define the orbital inspection board variant.");
}

if (!showcase.includes("orbitalPresetCatalog") || !showcase.includes("resolveOrbitalInspectionConfig")) {
  fail("MotionHouseShowcase must keep orbital preset support wired in.");
}

if (!showcase.includes('aria-label="View more products and contact us"')) {
  fail("MotionHouseShowcase CTA should remain available.");
}

if (!orbitalPresetHelper.includes("createOrbitalResolvedConfig")) {
  fail("Orbital preset helper must expose resolved config creation.");
}

for (const category of ["checks", "stripes", "others"]) {
  const entries = manifest[category];

  if (!Array.isArray(entries) || entries.length === 0) {
    fail(`Manifest category ${category} must contain renderable assets.`);
  }
}

console.log("Products motion showcase contract is intact.");
