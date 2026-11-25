import { createHmac, timingSafeEqual } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

export const cookieName = "yj_swatches";
export const sessionSeconds = 60 * 60 * 8;

function sign(domain: string, value: string) {
  const secret = process.env.SWATCHES_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Swatches session secret is missing or too short");
  return createHmac("sha256", secret).update(`${domain}:${value}`).digest("base64url");
}

export function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function codeFingerprint(code: string) {
  return sign("swatches-code", code);
}

// A second tab may change the shared cookie. Bind catalog and inquiry calls
// to the code entered in this document without exposing the HttpOnly token.
export function visitKey(token: string) {
  return sign("swatches-visit", token);
}

export function matchesVisit(request: NextRequest) {
  const token = request.cookies.get(cookieName)?.value;
  return Boolean(token && equal(request.headers.get("X-Swatches-Visit") ?? "", visitKey(token)));
}

export function createSession(code: string) {
  const payload = `${codeFingerprint(code)}.${Math.floor(Date.now() / 1000) + sessionSeconds}`;
  return `${payload}.${sign("swatches-session", payload)}`;
}

export function readSession(request: NextRequest) {
  const value = request.cookies.get(cookieName)?.value ?? "";
  if (!/^[\w-]{43}\.\d{10}\.[\w-]{43}$/.test(value)) return null;
  const [fingerprint, expires, signature] = value.split(".");
  if (Number(expires) <= Math.floor(Date.now() / 1000)) return null;
  return equal(signature, sign("swatches-session", `${fingerprint}.${expires}`)) ? fingerprint : null;
}

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === (request.headers.get("host") || request.nextUrl.host);
  } catch {
    return false;
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "Vary": "Cookie",
      "X-Robots-Tag": "noindex, nofollow",
      ...headers,
    },
  });
}
