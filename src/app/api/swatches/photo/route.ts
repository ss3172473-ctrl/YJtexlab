import type { NextRequest } from "next/server";
import { swatchPhotoResponse } from "../design/photos";
import { json } from "../session";
import { hasActiveSession } from "../active-session";

export async function GET(request: NextRequest) {
  try {
    if (!await hasActiveSession(request)) return json({ error: "고객 코드를 입력해 주세요." }, 401);
  } catch {
    return json({ error: "지금은 고객 코드를 확인할 수 없습니다." }, 503);
  }
  return swatchPhotoResponse(request.nextUrl.searchParams.get("sku"));
}
