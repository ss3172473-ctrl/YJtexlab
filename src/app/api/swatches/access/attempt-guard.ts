import { isIP } from "node:net";

const fallbackSource = "unknown";
const bodyLimit = 1024;
type Attempt = { count: number; expires: number };

// Only use Vercel's provider header on Vercel, never an arbitrary forwarding list.
export function accessAttemptSource(headers: Headers, hosted: boolean) {
  const raw = headers.get(hosted ? "x-vercel-forwarded-for" : "x-real-ip")?.trim();
  if (!raw || raw.length > 64) return fallbackSource;
  const family = isIP(raw);
  if (family === 4) return raw;
  if (family === 6) {
    try { return new URL("http://[" + raw + "]/").hostname.slice(1, -1); }
    catch { return fallbackSource; }
  }
  return fallbackSource;
}

/** Per-instance backstop. Global defense belongs at the managed firewall. */
export function createAccessAttemptLimiter({
  limit = 5, windowMs = 15 * 60 * 1000, capacity = 4096, now = Date.now,
} = {}) {
  const attempts = new Map<string, Attempt>();
  const sweepEvery = Math.min(windowMs, 30_000);
  let nextSweep = 0;
  return (source: string): number => {
    const time = now();
    if (time >= nextSweep) {
      nextSweep = time + sweepEvery;
      attempts.forEach((entry, key) => { if (entry.expires <= time) attempts.delete(key); });
    }
    const current = attempts.get(source);
    if (current && current.expires > time) {
      if (current.count >= limit) return Math.ceil((current.expires - time) / 1000);
      current.count++;
      return 0;
    }
    if (current) attempts.delete(source);
    if (attempts.size >= capacity) return Math.max(1, Math.ceil((nextSweep - time) / 1000));
    attempts.set(source, { count: 1, expires: time + windowMs });
    return 0;
  };
}

export async function readAccessJson(request: Pick<Request, "headers" | "body">): Promise<{
  code?: unknown; campaign?: unknown;
} | null> {
  const declared = request.headers.get("content-length");
  if (declared !== null && (!/^\d{1,8}$/.test(declared) || Number(declared) > bodyLimit)) return null;
  const reader = request.body?.getReader();
  if (!reader) return null;
  let size = 0;
  let input = "";
  const decoder = new TextDecoder("utf-8", { fatal: true });
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > bodyLimit) return null;
      input += decoder.decode(value, { stream: true });
    }
    if (declared !== null && size !== Number(declared)) return null;
    const parsed: unknown = JSON.parse(input + decoder.decode());
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed;
  } catch { return null; }
  finally {
    // Cancellation is best effort on a refused or disconnected request.
    void reader.cancel().catch(() => undefined);
  }
}
