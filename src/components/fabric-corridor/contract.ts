import manifest from "../../../public/stage-fabrics/manifest.json";

export const CANONICAL_CATEGORY_ORDER = ["checks", "stripes", "others"] as const;
export const VARIANT_IDS = ["A", "B", "C"] as const;

export type CategoryId = (typeof CANONICAL_CATEGORY_ORDER)[number];
export type VariantId = (typeof VARIANT_IDS)[number];

export const EXPECTED_COVERAGE_COUNTS = {
  checks: 20,
  stripes: 20,
  others: 18,
} as const satisfies Record<CategoryId, number>;

export type FabricManifestItem = {
  src: string;
  name: string;
  category: CategoryId;
};

export type FabricManifest = Record<CategoryId, FabricManifestItem[]>;

export type NormalizedFabricItem = FabricManifestItem & {
  manifestIndex: number;
  manifestKey: string;
};

export function getManifestKey(
  categoryId: CategoryId,
  manifestIndex: number,
  src: string,
) {
  return `${categoryId}:${manifestIndex}:${src}`;
}

export function normalizeFabricManifest(
  source: FabricManifest = manifest as FabricManifest,
): Record<CategoryId, NormalizedFabricItem[]> {
  return CANONICAL_CATEGORY_ORDER.reduce(
    (acc, categoryId) => {
      acc[categoryId] = (source[categoryId] ?? []).map((item, manifestIndex) => ({
        ...item,
        manifestIndex,
        manifestKey: getManifestKey(categoryId, manifestIndex, item.src),
      }));

      return acc;
    },
    {} as Record<CategoryId, NormalizedFabricItem[]>,
  );
}
