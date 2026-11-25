import type { NextRequest } from "next/server";
import { hasActiveSession } from "../active-session";
import { drivePoster, posterFailure } from "../design/drive-posters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!await hasActiveSession(request)) return posterFailure(401);
  } catch { return posterFailure(503); }
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return posterFailure(403);
  const keys = Array.from(request.nextUrl.searchParams.keys());
  if (keys.length !== 1 || keys[0] !== "sku") return posterFailure(404);
  return drivePoster(request.nextUrl.searchParams.get("sku"));
}
