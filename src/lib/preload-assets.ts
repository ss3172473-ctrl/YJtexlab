import manifest from "../../public/new-stage-fabrics/manifest.json";
import {
  homeCategoriesStartupFrameEntries,
  homeCategoriesStartupZoneKeys,
  toResponsivePreloadAsset,
  type ResponsivePreloadAsset,
} from "@/lib/home-categories-startup";

type ManifestEntry = {
  src?: string;
  name?: string;
};

type FabricManifestLike = {
  checks?: ManifestEntry[];
  stripes?: ManifestEntry[];
  others?: ManifestEntry[];
};

export type PreloadAssetSource = string | ResponsivePreloadAsset;

const typedManifest = manifest as FabricManifestLike;
const PRODUCTS_ORBITAL_LANE_COUNT = 8;
const PRODUCTS_CRITICAL_ASSETS_PER_LANE = 1;

function uniqueAssets(entries: Array<string | null | undefined>) {
  return Array.from(
    new Set(entries.filter((entry): entry is string => typeof entry === "string" && entry.length > 0)),
  );
}

function splitSequentially<T>(items: T[], segmentCount: number) {
  const segments: T[][] = [];
  let cursor = 0;

  for (let index = 0; index < segmentCount; index += 1) {
    const remainingItems = items.length - cursor;
    const remainingSegments = segmentCount - index;
    const takeCount =
      remainingSegments <= 1 ? remainingItems : Math.ceil(remainingItems / remainingSegments);

    segments.push(items.slice(cursor, cursor + takeCount));
    cursor += takeCount;
  }

  return segments;
}

function uniqueResponsiveAssets(entries: ResponsivePreloadAsset[]) {
  const seen = new Set<string>();
  const unique: ResponsivePreloadAsset[] = [];

  entries.forEach((entry) => {
    const key = `${entry.desktopSrc}|${entry.mobileSrc}|${entry.breakpointPx ?? 720}`;
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    unique.push(entry);
  });

  return unique;
}

function familyKey(name: string) {
  const match = name.match(/^([A-Z]+)_([A-Z]+)\d+$/);
  return match ? `${match[1]}_${match[2]}` : name;
}

const excludedExact = new Set(["ETC_A01", "ST_M02", "ETC_C01"]);
const excludedFamilies = new Set(["ETC_C", "ST_M"]);

const manifestEntries = [typedManifest.checks, typedManifest.stripes, typedManifest.others]
  .flat()
  .filter((entry): entry is ManifestEntry => Boolean(entry?.src && entry?.name));

const filteredManifestAssets = uniqueAssets(
  manifestEntries
    .filter((entry) => !excludedExact.has(entry.name!))
    .filter((entry) => !excludedFamilies.has(familyKey(entry.name!)))
    .map((entry) => entry.src),
);

const productManifestEntries = [typedManifest.checks, typedManifest.stripes, typedManifest.others]
  .flat()
  .filter((entry): entry is ManifestEntry => Boolean(entry?.src && entry?.name))
  .filter((entry) => entry.name !== "ETC_A01")
  .sort((left, right) => left.name!.localeCompare(right.name!));

const productManifestLanes = splitSequentially(productManifestEntries, PRODUCTS_ORBITAL_LANE_COUNT);

export const productsCriticalPreloadAssets = uniqueAssets(
  productManifestLanes.flatMap((laneEntries) =>
    laneEntries.slice(0, PRODUCTS_CRITICAL_ASSETS_PER_LANE).map((entry) => entry.src),
  ),
);

export const productsPreloadAssets = uniqueAssets(
  productManifestLanes.flatMap((laneEntries) => laneEntries.map((entry) => entry.src)),
);

export const homeCategoriesCriticalZoneKeys = [...homeCategoriesStartupZoneKeys];

export const homeCategoriesCriticalDomImageCount = homeCategoriesCriticalZoneKeys.length;

export const homeCategoriesBlockingPreloadAssets: PreloadAssetSource[] = uniqueResponsiveAssets(
  homeCategoriesStartupFrameEntries.map((entry) => toResponsivePreloadAsset(entry.responsive)),
);

export const homeCategoriesPreloadAssets: PreloadAssetSource[] = filteredManifestAssets;
