import {
  CANONICAL_CATEGORY_ORDER,
  EXPECTED_COVERAGE_COUNTS,
  VARIANT_IDS,
  getManifestKey,
  normalizeFabricManifest,
  type CategoryId,
  type FabricManifestItem,
  type NormalizedFabricItem,
  type VariantId,
} from "../contract";
import type { CorridorMode, CorridorRuntimeConfig } from "../runtime-config";

export const CATEGORY_ORDER = CANONICAL_CATEGORY_ORDER;
export const VARIANT_ORDER = VARIANT_IDS;

export const CATEGORY_META: Record<
  FabricCategoryId,
  { title: string; eyebrow: string; summary: string }
> = {
  checks: {
    title: "Checks",
    eyebrow: "Grid relations",
    summary: "Structured weaves with measured contrast and quiet depth.",
  },
  stripes: {
    title: "Stripes",
    eyebrow: "Linear rhythm",
    summary: "Directional repeats that read as movement instead of inventory.",
  },
  others: {
    title: "Others",
    eyebrow: "Archive nuances",
    summary: "Texture-led cloths and subtle solids that close the sequence.",
  },
};

export const VARIANT_META: Record<
  FabricVariantId,
  {
    name: string;
    label: string;
    accent: string;
  }
> = {
  A: {
    name: "Minimal Luxury",
    label: "A",
    accent: "rgba(17, 24, 39, 0.08)",
  },
  B: {
    name: "Gallery Archive",
    label: "B",
    accent: "rgba(17, 24, 39, 0.12)",
  },
  C: {
    name: "Runway Kinetic",
    label: "C",
    accent: "rgba(17, 24, 39, 0.1)",
  },
};

export const EXPECTED_COUNTS = EXPECTED_COVERAGE_COUNTS;

export type FabricCategoryId = CategoryId;
export type FabricVariantId = VariantId;
export type CorridorRuntimeMode = CorridorMode;
export type FabricCoverageCard = NormalizedFabricItem;
export type SharedCorridorRuntimeConfig = CorridorRuntimeConfig;

export const COVERAGE_CARDS = normalizeFabricManifest();

export function getCoverageAuditAttributes({
  variantId,
  categoryId,
  manifestIndex,
  manifestKey,
  mode,
}: {
  variantId: FabricVariantId;
  categoryId: FabricCategoryId;
  manifestIndex: number;
  manifestKey: string;
  mode: CorridorRuntimeMode;
}) {
  return {
    "data-fabric-card": "true",
    "data-variant-id": variantId,
    "data-category": categoryId,
    "data-manifest-index": String(manifestIndex),
    "data-manifest-key": manifestKey,
    "data-corridor-mode": mode,
  } as const;
}

export function getVariantLabel(variantId: FabricVariantId) {
  return `${VARIANT_META[variantId].label} / ${VARIANT_META[variantId].name}`;
}

export { getManifestKey };
export type { FabricManifestItem };
