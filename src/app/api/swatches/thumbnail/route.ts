import type { NextRequest } from "next/server";
import { hasActiveSession } from "../active-session";
import { driveListThumbnail, thumbnailFailure } from "../design/drive-list-thumbnails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!await hasActiveSession(request)) return thumbnailFailure(401);
  } catch { return thumbnailFailure(503); }
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return thumbnailFailure(403);
  return driveListThumbnail(request.nextUrl.searchParams.get("sku"));
}
