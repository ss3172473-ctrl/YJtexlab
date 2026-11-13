/** Server-only contact mail handoff. No customer content or credentials are returned. */
export type ContactNotificationStatus = "sent" | "already_sent" | "uncertain" | "not_configured";

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
): Promise<ContactNotificationStatus> {
  if (!config.url || !config.secret) return "not_configured";
  let url: URL;
  try { url = new URL(config.url); } catch { return "not_configured"; }
  // Do not transmit a credential to an arbitrary or accidentally misconfigured host.
  if (url.protocol !== "https:" || url.hostname !== "script.google.com" ||
      !/^\/macros\/s\/[^/]+\/exec$/.test(url.pathname) || url.search || url.username || url.password) {
    return "not_configured";
  }
  if (!Number.isSafeInteger(rowNumber) || rowNumber < 2) return "uncertain";
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
    if (!response.ok) return "uncertain";
    const result: unknown = await response.json();
    if (!result || typeof result !== "object") return "uncertain";
    const message = result as { ok?: unknown; status?: unknown };
    if (message.ok === true && (message.status === "sent" || message.status === "already_sent")) {
      return message.status;
    }
    return "uncertain";
  } catch {
    // A timeout is not proof that Apps Script did not send. Do not automatically retry.
    return "uncertain";
  } finally { clearTimeout(timeout); }
}
