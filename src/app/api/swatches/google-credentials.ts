import "server-only";
import { readFile } from "node:fs/promises";

export async function readContactGoogleCredentials() {
  return process.env.GOOGLE_SERVICE_ACCOUNT_JSON ??
    (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
      ? readFile(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH, "utf8")
      : undefined);
}

export async function readSwatchesGoogleCredentials() {
  const dedicated = process.env.SWATCHES_GOOGLE_SERVICE_ACCOUNT_JSON;
  if (dedicated !== undefined) {
    try {
      const credentials = JSON.parse(dedicated);
      if (credentials?.type === "service_account" &&
        typeof credentials.client_email === "string" && credentials.client_email.includes("@") &&
        typeof credentials.private_key === "string" &&
        credentials.private_key.startsWith("-----BEGIN PRIVATE KEY-----") &&
        credentials.private_key.trimEnd().endsWith("-----END PRIVATE KEY-----")) return dedicated;
    } catch {
      // Never echo provider material (including JSON parser error snippets).
    }
    throw new Error("Swatches dedicated service account is invalid");
  }
  // Hosted runtimes must use the dedicated identity. An unhosted
  // production-mode build may still be run locally with the old preview key.
  if (process.env.VERCEL_ENV || process.env.VERCEL_TARGET_ENV || process.env.VERCEL === "1") {
    throw new Error("Swatches dedicated service account is missing");
  }
  return readContactGoogleCredentials();
}
