import type { NextRequest } from "next/server";
import { readCompanies } from "./sheets";
import { codeFingerprint, equal, matchesVisit, readSession } from "./session";

export const SESSION_RECHECK_TTL = 15_000;

export function createActiveCodeCheck(read: () => Promise<string[]>, now = Date.now) {
  let current: { readonly figures: Set<string>; readonly expires: number } | undefined;
  let inflight: Promise<Set<string>> | undefined;
  let retryAfter = 0;
  return async function isActive(fingerprint: string) {
    if (current && now() < current.expires) return current.figures.has(fingerprint);
    if (!inflight && now() < retryAfter) throw new Error("Swatches CRM validation unavailable");
    inflight ??= read().then((fingerprints) => {
      const seen = new Set<string>();
      const duplicates = new Set<string>();
      for (const value of fingerprints) {
        if (seen.has(value)) duplicates.add(value);
        else seen.add(value);
      }
      duplicates.forEach((value) => seen.delete(value));
      current = { figures: seen, expires: now() + SESSION_RECHECK_TTL };
      retryAfter = 0;
      return seen;
    }).catch((error: unknown) => {
      current = undefined;
      retryAfter = now() + 2_000;
      throw error;
    }).finally(() => { inflight = undefined; });
    return (await inflight).has(fingerprint);
  };
}

const check = createActiveCodeCheck(async () => (await readCompanies()).map(({ code }) => codeFingerprint(code)));

export async function hasActiveSession(request: NextRequest) {
  const fingerprint = readSession(request);
  if (process.env.CRM_BACKEND === "supabase") {
    return fingerprint ? Boolean(await (await import("@/lib/crm/companies")).resolveFingerprint(fingerprint)) : false;
  }
  return fingerprint ? check(fingerprint) : false;
}

// Price-bearing operations always resolve the current CRM row. The media-only
// burst cache above never supplies a pricing permission.
export async function readActiveCompany(request: NextRequest) {
  const fingerprint = readSession(request);
  if (!fingerprint || !matchesVisit(request)) return null;
  if (process.env.CRM_BACKEND === "supabase") return (await import("@/lib/crm/companies")).resolveFingerprint(fingerprint);
  const matches = (await readCompanies()).filter(({ code }) => equal(codeFingerprint(code), fingerprint));
  return matches.length === 1 ? matches[0] : null;
}
