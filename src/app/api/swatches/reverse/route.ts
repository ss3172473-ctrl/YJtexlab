import type { NextRequest } from "next/server";
import { hasActiveSession } from "../active-session";
import { readReverseTexture } from "../design/reverse-textures";
import { json } from "../session";

export async function GET(request: NextRequest) {
  try {
    if (!await hasActiveSession(request)) return json({ error: "고객 코드를 입력해 주세요." }, 401);
    return readReverseTexture(request.nextUrl.searchParams.get("sku"), request.signal);
  } catch { return json({ error: "지금은 고객 코드를 확인할 수 없습니다." }, 503); }
}
