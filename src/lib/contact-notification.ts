/** Server-only contact mail handoff. No customer content or credentials are returned. */
export type ContactNotificationStatus = "sent" | "already_sent" | "uncertain" | "not_configured";

const WEBHOOK_BUCKETS = new Set(["unauthorized", "invalid_row", "not_initialized", "pending", "uncertain", "busy", "quota"]);
const logNotificationBucket = (bucket: string) => console.info("contact_notification_result", { bucket });

export function contactRowNumber(updatedRange: string | null | undefined): number | null {
  const match = updatedRange?.match(/!\$?A\$?(\d+):\$?F\$?(\d+)$/);
  if (!match || match[1] !== match[2]) return null;
  const row = Number(match[1]);
  return Number.isSafeInteger(row) && row >= 2 ? row : null;
}

export async function notifyContactRow(
  rowNumber: number,
  config: { url?: string; secret?: string } = {
    url: process.env.CONTACT_EMAIL_WEBHOOK_URL,
    secret: process.env.CONTACT_EMAIL_WEBHOOK_SECRET,
  },
  fetcher: typeof fetch = fetch,
  logBucket: (bucket: string) => void = logNotificationBucket,
): Promise<ContactNotificationStatus> {
  const resultFor = (bucket: string, status: ContactNotificationStatus) => {
    // Log finite literals only; telemetry errors cannot change a completed send.
    try { logBucket(bucket); } catch { /* ignore diagnostic sink errors */ }
    return status;
  };
  if (!config.url || !config.secret) return resultFor("config_missing", "not_configured");
  let url: URL;
  try { url = new URL(config.url); } catch { return resultFor("config_invalid", "not_configured"); }
  // Do not transmit a credential to an arbitrary or accidentally misconfigured host.
  if (url.protocol !== "https:" || url.hostname !== "script.google.com" ||
      !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname) || url.search || url.username || url.password) {
    return resultFor("config_invalid", "not_configured");
  }
  if (!Number.isSafeInteger(rowNumber) || rowNumber < 2) return resultFor("invalid_local_row", "uncertain");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetcher(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: config.secret, rowNumber }),
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
    });
    if (!response.ok) return resultFor("http_error", "uncertain");
    let result: unknown;
    try { result = await response.json(); } catch {
      return resultFor(controller.signal.aborted ? "timeout" : "response_not_json", "uncertain");
    }
    if (!result || typeof result !== "object") return resultFor("unexpected_response", "uncertain");
    const message = result as { ok?: unknown; status?: unknown };
    if (message.ok === true && (message.status === "sent" || message.status === "already_sent")) {
      return resultFor(message.status, message.status);
    }
    if (message.ok === false && typeof message.status === "string" && WEBHOOK_BUCKETS.has(message.status)) {
      return resultFor(message.status, "uncertain");
    }
    return resultFor("unexpected_response", "uncertain");
  } catch {
    // A timeout is not proof that Apps Script did not send. Do not automatically retry.
    return resultFor(controller.signal.aborted ? "timeout" : "transport_error", "uncertain");
  } finally { clearTimeout(timeout); }
}
