import { type NextRequest } from "next/server";
import { readCatalog } from "../sheets";
import { withSwatchPhotos } from "../design/photos";
import { listThumbnailUrl } from "../design/drive-list-thumbnails";
import { readSwatchesLayout } from "../design/store";
import { json } from "../session";
import { hasActiveSession } from "../active-session";

export async function GET(request: NextRequest) {
  try {
    if (!await hasActiveSession(request)) return json({ error: "고객 코드를 입력해 주세요." }, 401);
    const [catalog, layout] = await Promise.all([
      readCatalog(),
      readSwatchesLayout().catch(() => undefined),
    ]);
    const patterns = await withSwatchPhotos(catalog.patterns, false).catch(() => catalog.patterns);
    return json({ ...catalog, layout, patterns: patterns.map(pattern => ({
      ...pattern,
      variants: pattern.variants.map(variant => {
        const listThumb = listThumbnailUrl(variant.sku, variant.image);
        return listThumb ? { ...variant, listThumb } : variant;
      }),
    })) });
  } catch {
    console.error("swatches_catalog_source_unavailable");
    return json({ error: "재고를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요." }, 503);
  }
}
