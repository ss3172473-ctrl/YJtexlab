import {
  CANONICAL_CATEGORY_ORDER,
  EXPECTED_COVERAGE_COUNTS,
  type CategoryId,
  type NormalizedFabricItem,
} from "./contract";

export type CoverageAuditResult = {
  pass: boolean;
  categories: Record<
    CategoryId,
    {
      count: number;
      uniqueCount: number;
      expectedCount: number;
      missingCount: number;
      duplicateCount: number;
      pass: boolean;
    }
  >;
};

export function auditCoverage(
  itemsByCategory: Record<CategoryId, readonly NormalizedFabricItem[]>,
): CoverageAuditResult {
  const categories = CANONICAL_CATEGORY_ORDER.reduce(
    (acc, categoryId) => {
      const items = itemsByCategory[categoryId] ?? [];
      const uniqueKeys = new Set(items.map((item) => item.manifestKey));
      const expectedCount = EXPECTED_COVERAGE_COUNTS[categoryId];
      const count = items.length;
      const uniqueCount = uniqueKeys.size;
      const missingCount = Math.max(expectedCount - count, 0);
      const duplicateCount = Math.max(count - uniqueCount, 0);

      acc[categoryId] = {
        count,
        uniqueCount,
        expectedCount,
        missingCount,
        duplicateCount,
        pass:
          count === expectedCount &&
          uniqueCount === expectedCount &&
          missingCount === 0 &&
          duplicateCount === 0,
      };

      return acc;
    },
    {} as CoverageAuditResult["categories"],
  );

  return {
    pass: CANONICAL_CATEGORY_ORDER.every((categoryId) => categories[categoryId].pass),
    categories,
  };
}
