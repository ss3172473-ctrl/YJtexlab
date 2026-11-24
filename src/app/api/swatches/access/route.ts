import { type NextRequest } from "next/server";
import { customerCode } from "@/app/swatches/customer-code";
import { logAccess, readCompanies } from "../sheets";
import { cookieName, createSession, equal, json, sameOrigin, sessionSeconds } from "../session";

const limit = 5;
const windowMs = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; expires: number }>();

function retryAfter(request: NextRequest) {
  const key = request.headers.get("x-real-ip")?.trim() || "unknown";
  const now = Date.now();
  const current = attempts.get(key);
  if (current && current.expires > now) {
    if (current.count >= limit) return Math.ceil((current.expires - now) / 1000);
    current.count++;
    return 0;
  }
  if (attempts.size >= 4096) {
    attempts.forEach((entry, address) => { if (entry.expires <= now) attempts.delete(address); });
    if (attempts.size >= 4096) return Math.ceil(windowMs / 1000);
  }
  attempts.set(key, { count: 1, expires: now + windowMs });
  return 0;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "접근할 수 없습니다." }, 403);
  const body = await request.json().catch(() => null);
  const code = customerCode(body?.code);
  if (!code) return json({ error: "메일로 받은 숫자 고객 코드를 확인해 주세요." }, 401);
  const wait = retryAfter(request);
  if (wait) {
    return json({ error: "입력 시도가 많습니다. 잠시 후 다시 시도해 주세요." }, 429, { "Retry-After": String(wait) });
  }
  const campaign = typeof body?.campaign === "string" && /^[a-zA-Z0-9_.-]{1,80}$/.test(body.campaign)
    ? body.campaign : "";

  try {
    const matches = (await readCompanies()).filter((company) => equal(company.code, code));
    if (matches.length !== 1) return json({ error: "메일로 받은 고객 코드를 확인해 주세요." }, 401);
    const token = createSession(matches[0].code);
    await logAccess(matches[0], campaign);
    const response = json({ ok: true, welcomeName: matches[0].name.slice(0, 100) });
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionSeconds,
      path: "/api/swatches",
    });
    return response;
  } catch {
    console.error("swatches_access_source_unavailable");
    return json({ error: "지금은 고객 코드를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요." }, 503);
  }
}
