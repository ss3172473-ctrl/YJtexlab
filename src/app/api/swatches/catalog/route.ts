import { type NextRequest } from "next/server";
import { readCatalog } from "../sheets";
import { withSwatchPhotos } from "../design/photos";
import { listThumbnailUrl } from "../design/drive-list-thumbnails";
import { readSwatchesLayout } from "../design/store";
import { json } from "../session";
import { customerPatterns } from "../price-visibility";
import { readActiveCompany } from "../active-session";

function elapsed(started: number, ended: number) {
  return Math.round(Math.min(60_000, Math.max(0, ended - started)));
}

export async function GET(request: NextRequest) {
  try {
    const started = performance.now();
    const company = await readActiveCompany(request);
    if (!company) return json({ error: "고객 코드를 입력해 주세요." }, 401);
    const authenticated = performance.now();
    const [catalog, layout] = await Promise.all([
      readCatalog(),
      readSwatchesLayout().catch(() => undefined),
    ]);
    const dataReady = performance.now();
    const patterns = await withSwatchPhotos(catalog.patterns, false).catch(() => catalog.patterns);
    const withThumbnails = patterns.map(pattern => ({
      ...pattern,
      variants: pattern.variants.map(variant => ({
        ...variant,
        listThumb: listThumbnailUrl(variant.sku, variant.image),
      })),
    }));
    const body = {
      updatedAt: catalog.updatedAt,
      canViewPrices: company.canViewPrices,
      layout,
      patterns: customerPatterns(withThumbnails, company.canViewPrices),
    };
    const projected = performance.now();
    const response = json(body);
    const serialized = performance.now();
    // Authorized success only. The data stage includes the Sheets client,
    // credentials as needed, the inventory snapshot, and parallel layout read.
    response.headers.set("Server-Timing", [
      `crm;dur=${elapsed(started, authenticated)}`,
      `data;dur=${elapsed(authenticated, dataReady)}`,
      `project;dur=${elapsed(dataReady, projected)}`,
      `serialize;dur=${elapsed(projected, serialized)}`,
    ].join(", "));
    return response;
  } catch {
    console.error("swatches_catalog_source_unavailable");
    return json({ error: "재고를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요." }, 503);
  }
}
