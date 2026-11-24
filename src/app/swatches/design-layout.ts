export type SwatchesLayout = {
  order: string[];
  covers: Record<string, string>;
  sizes: Record<string, number>;
  rowHeights: Record<string, number>;
  columns?: number;
  columnGap?: number;
  rowGap?: number;
};

export const emptySwatchesLayout: SwatchesLayout = {
  order: [],
  covers: {},
  sizes: {},
  rowHeights: {},
};

function entries(value: unknown): [string, unknown][] {
  return value && typeof value === "object" && !Array.isArray(value) ? Object.entries(value) : [];
}

function isName(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 100 &&
    value === value.trim() && !/[\x00-\x1f\x7f]/.test(value) &&
    !["__proto__", "prototype", "constructor"].includes(value);
}

function inRange(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

export function normalizeSwatchesLayout(input: unknown): SwatchesLayout {
  const value = Object.fromEntries(entries(input));
  const order = Array.isArray(value.order)
    ? Array.from(new Set(value.order.filter(isName))).slice(0, 500)
    : [];
  const covers = Object.fromEntries(entries(value.covers)
    .flatMap(([name, sku]) => isName(name) && isName(sku) ? [[name, sku]] : []).slice(0, 500));
  const sizes = Object.fromEntries(entries(value.sizes)
    .flatMap(([name, size]) => isName(name) && inRange(size, 1, 3) ? [[name, size]] : []).slice(0, 500));
  const rowHeights = Object.fromEntries(entries(value.rowHeights)
    .flatMap(([row, px]) => /^[1-9][0-9]{0,2}$/.test(row) && inRange(px, 130, 620) ? [[row, px]] : [])
    .slice(0, 500));
  return {
    order, covers, sizes, rowHeights,
    ...(inRange(value.columns, 4, 8) && { columns: value.columns }),
    ...(inRange(value.columnGap, 12, 44) && { columnGap: value.columnGap }),
    ...(inRange(value.rowGap, 24, 100) && { rowGap: value.rowGap }),
  };
}

export function swatchesDefaultSpan() {
  return 1;
}

export function packSwatchesRows(names: string[], sizes: Record<string, number>, columns = 5) {
  const rows: { name: string; row: number; span: number }[] = [];
  let row = 1;
  let used = 0;
  names.forEach((name) => {
    const span = sizes[name] ?? swatchesDefaultSpan();
    if (used + span > columns) {
      row++;
      used = 0;
    }
    rows.push({ name, row, span });
    used += span;
  });
  return rows;
}
