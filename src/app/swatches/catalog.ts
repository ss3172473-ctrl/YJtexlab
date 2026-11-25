import type { SwatchesLayout } from "./design-layout";

export type Roll = { id: string; yards: number };

export type VisualKind = "plain" | "stripe" | "check" | "other";
export type PhotoVisual = { lab: [number, number, number]; kind: VisualKind };

export type Variant = {
  sku: string;
  productName: string;
  color: string;
  composition: string;
  width: string;
  price?: number | null;
  image: string | null;
  listThumb?: string;
  video?: string | null;
  reverse?: string | null;
  visual?: PhotoVisual;
  rolls: Roll[];
};

export type Pattern = { name: string; patternType?: string; variants: Variant[] };
export type Catalog = { patterns: Pattern[]; canViewPrices?: boolean; updatedAt: string; sampleImages?: boolean; layout?: SwatchesLayout };
export type CartLine = {
  id: string;
  pattern: string;
  sku: string;
  color: string;
  yards: number;
  price?: number | null;
};

const amount = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 });

export function money(won: number) {
  return `₩${amount.format(won)}`;
}

export function yardage(yards: number) {
  return `${amount.format(yards)}y`;
}

export function lineTotal(yards: number, price: number) {
  return Math.round(yards * price);
}

export function selectRolls(patterns: Pattern[]) {
  const rolls = new Map<string, CartLine>();
  for (const { name, variants } of patterns) {
    for (const { sku, color, price, rolls: available } of variants) {
      for (const { id, yards } of available) {
        rolls.set(id, { id, pattern: name, sku, color, yards, price });
      }
    }
  }
  return rolls;
}
