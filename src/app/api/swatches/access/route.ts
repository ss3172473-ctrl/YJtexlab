import { NextResponse, type NextRequest } from "next/server";
import { customerCode } from "@/app/swatches/customer-code";
import { leadStream } from "../first-row/lead";
import { rowImages } from "../first-row/plan";
import { logAccess, readCompanies } from "../sheets";
import { cookieName, createSession, equal, json, sameOrigin, sessionSeconds, visitKey } from "../session";
import { accessAttemptSource, createAccessAttemptLimiter, readAccessJson } from "./attempt-guard";

const consumeAttempt = createAccessAttemptLimiter();
const hostedByVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV || process.env.VERCEL_TARGET_ENV);

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "접근할 수 없습니다." }, 403);
  const wait = consumeAttempt(accessAttemptSource(request.headers, hostedByVercel));
  if (wait) {
    return json({ error: "입력 시도가 많습니다. 잠시 후 다시 시도해 주세요." }, 429, { "Retry-After": String(wait) });
  }
  const body = await readAccessJson(request);
  const code = customerCode(body?.code);
  if (!code) return json({ error: "메일로 받은 고객 코드를 확인해 주세요." }, 401);
  const campaign = typeof body?.campaign === "string" && /^[a-zA-Z0-9_.-]{1,80}$/.test(body.campaign)
    ? body.campaign : "";

  try {
    const matches = (await readCompanies()).filter((company) => equal(company.code, code));
    if (matches.length !== 1) return json({ error: "메일로 받은 고객 코드를 확인해 주세요." }, 401);
    const token = createSession(matches[0].code);
    await logAccess(matches[0], campaign);
    const key = visitKey(token);
    const welcomeName = matches[0].name.slice(0, 100);
    const images = request.headers.get("accept") === "application/x-swatch-cover"
      ? await rowImages(request.nextUrl.searchParams).catch(() => []) : [];
    const response = images.length
      ? new NextResponse(leadStream({ welcomeName, visitKey: key, images }), { headers: {
        "Content-Type": "application/x-swatch-cover",
        "Cache-Control": "private, no-store, no-transform", "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store", "Cross-Origin-Resource-Policy": "same-origin",
        "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow",
      } })
      : json({ ok: true, visitKey: key, welcomeName });
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
