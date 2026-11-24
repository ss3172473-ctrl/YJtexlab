import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const designCookie = "yj_swatches_design";
export const designSessionSeconds = 60 * 60 * 8;

function adminKey() {
  const key = process.env.SWATCHES_ADMIN_KEY;
  return key && key.length >= 32 ? key : undefined;
}

export function hasAdminKey() {
  return Boolean(adminKey());
}

function hash(value: string) {
  return createHash("sha256").update(value).digest();
}

export function isAdminKey(value: unknown) {
  const key = adminKey();
  return Boolean(key && typeof value === "string" && value.length <= 512 &&
    timingSafeEqual(hash(value), hash(key)));
}

function sign(key: string, expires: string) {
  return createHmac("sha256", key).update(`swatches-design-session:${expires}`).digest("base64url");
}

export function createDesignSession() {
  const key = adminKey();
  if (!key) throw new Error("Swatches design key is not configured");
  const expires = String(Math.floor(Date.now() / 1000) + designSessionSeconds);
  return `${expires}.${sign(key, expires)}`;
}

export function hasDesignSession(request: NextRequest) {
  const key = adminKey();
  const value = request.cookies.get(designCookie)?.value;
  if (!key || !value || !/^\d{10}\.[\w-]{43}$/.test(value)) return false;
  const [expires, signature] = value.split(".");
  return Number(expires) > Math.floor(Date.now() / 1000) &&
    timingSafeEqual(hash(signature), hash(sign(key, expires)));
}

export function secureDesignCookie(request: NextRequest) {
  return !(process.env.SWATCHES_LAYOUT_FILE &&
    /^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(request.headers.get("host") ?? ""));
}
