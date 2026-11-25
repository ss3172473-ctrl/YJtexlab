import type { NextRequest } from "next/server";
import { hasActiveSession } from "../active-session";
import { canPredictRow, rowImages } from "./plan";
import { json } from "../session";

export const dynamic = "force-dynamic";
const privacy = { "CDN-Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "no-store", "Cross-Origin-Resource-Policy": "same-origin" };

export async function GET(request: NextRequest) {
  // This optional hint never issues Drive/Sheets inventory reads. If not an
  // immutable design or manual photo overrides may exist, the regular grid wins.
  if (!canPredictRow()) return json({}, 404, privacy);
  try {
    if (!await hasActiveSession(request)) return json({}, 401, privacy);
    const site = request.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") return json({}, 403, privacy);
    return json({ images: await rowImages(request.nextUrl.searchParams) }, 200, privacy);
  } catch {
    return json({}, 503, privacy);
  }
}
