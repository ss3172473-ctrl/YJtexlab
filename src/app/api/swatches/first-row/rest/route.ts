import type { NextRequest } from "next/server";
import { matchesVisit } from "../../session";
import { hasActiveSession } from "../../active-session";
import { thumbnailFailure } from "../../design/drive-list-thumbnails";
import { coverResponse, imageSize } from "../lead";
import { rowImages } from "../plan";

export const dynamic = "force-dynamic";

async function readPart(src: string) {
  const response = await coverResponse(src);
  const type = response.headers.get("content-type");
  const size = imageSize(response);
  if (!type || !size) {
    await response.body?.cancel();
    return;
  }
  const reader = response.body?.getReader();
  if (!reader) return;
  const chunks: ArrayBuffer[] = [];
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > size) return;
      chunks.push(new Uint8Array(value).buffer);
    }
    if (received === size) return new Blob(chunks, { type });
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!matchesVisit(request) || !await hasActiveSession(request)) return thumbnailFailure(401);
    const site = request.headers.get("sec-fetch-site");
    if (site && site !== "same-origin" && site !== "none") return thumbnailFailure(403);
    const sources = (await rowImages(request.nextUrl.searchParams)).slice(1);
    if (sources.length < 2) return thumbnailFailure(404);
    // Only server-selected covers, at most four. The lead is never in this group.
    const parts = await Promise.all(sources.map(src => readPart(src).catch(() => undefined)));
    const data = new FormData();
    parts.forEach((blob, i) => { if (blob) data.append(sources[i], blob, "cover"); });
    return new Response(data, { headers: {
      "Cache-Control": "private, no-store, no-transform", "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store", "Cross-Origin-Resource-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow",
    } });
  } catch { return thumbnailFailure(503); }
}
