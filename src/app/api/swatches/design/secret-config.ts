import { TextDecoder } from "node:util";
import { gunzipSync } from "node:zlib";

const packedPrefix = "gzip1:";
const utf8 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });

// Optional wire encoding for server-only settings. Both the encoded input and
// UTF-8 output are bounded before callers parse and validate the JSON schema.
export function decodeSwatchesConfig(raw: string | undefined, maxBytes: number): string | undefined {
  if (!raw || raw.length > maxBytes) return;
  if (!raw.startsWith(packedPrefix)) return Buffer.byteLength(raw) <= maxBytes ? raw : undefined;
  const payload = raw.slice(packedPrefix.length);
  if (!/^[A-Za-z0-9_-]+$/.test(payload)) return;
  const compressed = Buffer.from(payload, "base64url");
  if (compressed.length < 18 || compressed.toString("base64url") !== payload) return;
  try {
    return utf8.decode(gunzipSync(compressed, { maxOutputLength: maxBytes }));
  } catch { return; }
}
