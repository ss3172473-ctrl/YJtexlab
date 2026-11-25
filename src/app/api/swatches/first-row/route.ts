import type { NextRequest } from "next/server";
import { hasActiveSession } from "../active-session";
import { listThumbnailUrl } from "../design/drive-list-thumbnails";
import { hasApprovedMediaForSku, validApprovedSku } from "../design/media";
import { photoStorageAvailable, swatchPhotoUrl } from "../design/photos";
import { readSwatchesLayout } from "../design/store";
import { json } from "../session";
import { welcomeRowCovers } from "@/app/swatches/welcome-covers";

export const dynamic = "force-dynamic";
const privacy = { "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store", "Cross-Origin-Resource-Policy": "same-origin" };

export async function GET(request: NextRequest) {
  // This optional hint never issues Drive/Sheets inventory reads. If not an
  // immutable design or manual photo overrides may exist, the regular grid wins.
  if (!process.env.SWATCHES_LAYOUT_JSON || photoStorageAvailable) return json({}, 404, privacy);
  try {
    if (!await hasActiveSession(request)) return json({}, 401, privacy);
    const site = request.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") return json({}, 403, privacy);
    const width = Number(request.nextUrl.searchParams.get("width"));
    const dpr = Number(request.nextUrl.searchParams.get("dpr"));
    if (!Number.isInteger(width) || width < 280 || width > 5000 || !Number.isFinite(dpr) || dpr < 1 || dpr > 4)
      return json({ images: [] }, 200, privacy);
    const { order, covers, columns, sizes, rowGap, columnGap } = await readSwatchesLayout();
    const desktop = columns || rowGap || columnGap ? columns ?? 5 : 6;
    const count = width <= 460 ? 2 : width <= 700 ? 3 : width <= 900 ? 4 : desktop;
    const images = Array.from(welcomeRowCovers(order.map(name => {
      const span = sizes[name] ?? 1, sku = covers[name];
      if (!validApprovedSku(sku) || !hasApprovedMediaForSku(sku)) return { span, image: null };
      const original = swatchPhotoUrl(sku, false, 1);
      const thumbnail = listThumbnailUrl(sku, original);
      if (!thumbnail) return { span, image: original };
      const upper = width / count * (width > 900 ? span : 1);
      if (Math.ceil(upper * dpr) <= 384) return { span, image: thumbnail };
      // Conservative mobile lower bound (shell padding, scrollbar, grid gaps).
      // Don't guess between original/thumbnail if close to the 384px threshold.
      const lower = (width - 20 - 2 * Math.max(24, width * .05) - 16 * (count - 1)) / count;
      return { span, image: width <= 900 && Math.floor(lower * dpr) > 384 ? original : null };
    }), width, desktop)).slice(0, 5);
    return json({ images }, 200, privacy);
  } catch {
    return json({}, 503, privacy);
  }
}
