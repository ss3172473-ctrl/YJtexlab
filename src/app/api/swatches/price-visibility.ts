import type { Pattern } from "@/app/swatches/catalog";

// Project each browser-visible field explicitly so future financial columns
// cannot become part of the quote-only response by accident.
export function customerPatterns(patterns: Pattern[], canViewPrices: boolean): Pattern[] {
  return patterns.map(({ name, patternType, variants }) => ({
    name, patternType,
    variants: variants.map(({ sku, productName, color, composition, width, price, image,
      listThumb, video, reverse, visual, rolls }) => ({
      sku, productName, color, composition, width, image, listThumb, video, reverse, visual,
      rolls: rolls.map(({ id, yards }) => ({ id, yards })),
      ...(canViewPrices ? { price } : {}),
    })),
  }));
}
