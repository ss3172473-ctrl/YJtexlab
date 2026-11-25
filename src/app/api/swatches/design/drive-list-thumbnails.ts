import "server-only";
import { createHash } from "node:crypto";
import { createInFlightReads } from "./thumbnail-inflight";
import { driveToken } from "./drive-video";

type Locator = { folderId: string; manifestId: string; sha256: string; skus?: ReadonlySet<string> };
type Asset = { fileId: string; bytes: number; sha256: string };
const manifestName = "list-thumbnails.v1.json";
const manifestLimit = 64 * 1024;
const imageLimit = 256 * 1024;
const drive = "https://www.googleapis.com/drive/v3/files/";
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const id = (v: unknown): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{10,128}$/.test(v);
const digest = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const sha256 = (b: Buffer) => createHash("sha256").update(b).digest("hex");
export const validListThumbnailSku = (v: unknown): v is string =>
  typeof v === "string" && /^[ST][1-9][0-9]{0,2}$/.test(v)
  && Number(v.slice(1)) <= (v.startsWith("S") ? 108 : 128);

export function parseListThumbnailLocator(raw?: string, otherFolders: readonly unknown[] = []): Locator | undefined {
  if (!raw || raw.length > 4096) return;
  try {
    const x: unknown = JSON.parse(raw);
    if (!record(x) || Object.keys(x).some(k => !["folderId", "manifestId", "sha256", "skus"].includes(k))
      || !id(x.folderId) || !id(x.manifestId) || x.folderId === x.manifestId
      || otherFolders.includes(x.folderId) || otherFolders.includes(x.manifestId) || !digest(x.sha256)) return;
    let skus: Set<string> | undefined;
    if (x.skus !== undefined) {
      if (!Array.isArray(x.skus) || !x.skus.length || x.skus.length > 236 || !x.skus.every(validListThumbnailSku)) return;
      skus = new Set(x.skus);
      if (skus.size !== x.skus.length) return;
    }
    return { folderId: x.folderId, manifestId: x.manifestId, sha256: x.sha256, skus };
  } catch { return; }
}

function parseManifest(bytes: Buffer, loc: Locator): ReadonlyMap<string, Asset> {
  if (sha256(bytes) !== loc.sha256) throw new Error("List thumbnail registry hash mismatch");
  const x: unknown = JSON.parse(bytes.toString("utf8"));
  if (!record(x) || Object.keys(x).length !== 2 || x.version !== 1
    || !Array.isArray(x.assets) || !x.assets.length || x.assets.length > 236) throw new Error("Invalid list thumbnail registry");
  const items = new Map<string, Asset>();
  const ids = new Set<string>();
  for (const e of x.assets) {
    if (!record(e) || Object.keys(e).length !== 4 || !validListThumbnailSku(e.sku)
      || !id(e.fileId) || e.fileId === loc.folderId || e.fileId === loc.manifestId || ids.has(e.fileId)
      || !digest(e.sha256) || typeof e.bytes !== "number" || !Number.isSafeInteger(e.bytes) || e.bytes < 20
      || e.bytes > imageLimit || items.has(e.sku)) throw new Error("Invalid list thumbnail item");
    items.set(e.sku, { fileId: e.fileId, bytes: e.bytes, sha256: e.sha256 });
    ids.add(e.fileId);
  }
  if (loc.skus && (loc.skus.size !== items.size || Array.from(loc.skus).some(sku => !items.has(sku))))
    throw new Error("List thumbnail registry membership mismatch");
  return items;
}

const locator = parseListThumbnailLocator(process.env.SWATCHES_DRIVE_LIST_THUMB_LOCATOR, [
  process.env.SWATCHES_DRIVE_FRONT_FOLDER_ID,
  process.env.SWATCHES_DRIVE_REVERSE_FOLDER_ID,
  process.env.SWATCHES_DRIVE_VIDEO_FOLDER_ID,
]);
export function listThumbnailUrl(sku: string, original: string | null) {
  // A manual photo override (its version is not 1) must never show an older derivative.
  if (!locator || !validListThumbnailSku(sku) || (locator.skus && !locator.skus.has(sku))
    || original !== "/api/swatches/photo?sku=" + sku + "&v=1") return;
  return "/api/swatches/thumbnail?sku=" + sku;
}

async function bytesWithin(response: Response, limit: number): Promise<Buffer> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("List thumbnail response has no bytes");
  const chunks: Buffer[] = [];
  let count = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > limit) throw new Error("List thumbnail response exceeds bound");
      chunks.push(Buffer.from(value));
    }
    return Buffer.concat(chunks, count);
  } finally { await reader.cancel().catch(() => undefined); }
}

async function readDriveFile(
  token: string, folderId: string, fileId: string, name: string, mimeType: string,
  checksum: string, limit: number, exact?: number,
): Promise<Buffer> {
  const metadata = new URL(drive + fileId);
  metadata.searchParams.set("supportsAllDrives", "true");
  metadata.searchParams.set("fields", "id,name,mimeType,parents,size,sha256Checksum,trashed,capabilities(canDownload)");
  const media = new URL(drive + fileId);
  media.searchParams.set("supportsAllDrives", "true");
  media.searchParams.set("alt", "media");
  const config: RequestInit = {
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(4500),
    headers: { Authorization: "Bearer " + token, "Accept-Encoding": "identity" },
  };
  const [meta, payload] = await Promise.all([fetch(metadata, config), fetch(media, config)]);
  let bytes: Buffer;
  try {
    if (!meta.ok || !payload.ok) throw new Error("List thumbnail object unavailable");
    const data: unknown = JSON.parse((await bytesWithin(meta, 4096)).toString("utf8"));
    if (!record(data) || data.id !== fileId || data.name !== name || data.mimeType !== mimeType || data.trashed !== false
      || !Array.isArray(data.parents) || data.parents.length !== 1 || data.parents[0] !== folderId
      || !record(data.capabilities) || data.capabilities.canDownload !== true || typeof data.size !== "string"
      || !/^\d{1,7}$/.test(data.size) || Number(data.size) < 1 || Number(data.size) > limit
      || (exact !== undefined && Number(data.size) !== exact)
      || (data.sha256Checksum !== undefined && data.sha256Checksum !== checksum)) throw new Error("Unexpected list thumbnail object");
    bytes = await bytesWithin(payload, Number(data.size));
    if (bytes.length !== Number(data.size) || sha256(bytes) !== checksum) throw new Error("List thumbnail bytes mismatch");
  } finally {
    // Cancellation is best effort: bytesWithin already consumes or cancels its locked stream.
    void meta.body?.cancel().catch(() => undefined);
    void payload.body?.cancel().catch(() => undefined);
  }
  return bytes;
}

let registry: Promise<ReadonlyMap<string, Asset>> | undefined;
let retryAfter = 0;
function getRegistry(loc: Locator) {
  if (!registry && Date.now() < retryAfter) return Promise.reject(new Error("List thumbnail registry retry pending"));
  registry ??= driveToken()
    .then(token => readDriveFile(token, loc.folderId, loc.manifestId, manifestName, "application/json", loc.sha256, manifestLimit))
    .then(bytes => parseManifest(bytes, loc))
    .catch((error: unknown) => {
      registry = undefined;
      retryAfter = Date.now() + 4000;
      throw error;
    });
  return registry;
}

const headers = {
  "Cache-Control": "private, no-store, no-transform",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow, noimageindex",
};
export function thumbnailFailure(status: number) { return new Response(null, { status, headers }); }

const verifiedRead = createInFlightReads<string, Buffer>();

export async function driveListThumbnail(sku: unknown) {
  if (!locator || !validListThumbnailSku(sku) || (locator.skus && !locator.skus.has(sku))) return thumbnailFailure(404);
  try {
    const e = (await getRegistry(locator)).get(sku);
    if (!e) return thumbnailFailure(404);
    const folderId = locator.folderId;
    const bytes = await verifiedRead(sku, async () => readDriveFile(await driveToken(), folderId, e.fileId, sku + ".webp",
      "image/webp", e.sha256, imageLimit, e.bytes));
    if (bytes.length < 20 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP"
      || bytes.readUInt32LE(4) + 8 !== bytes.length) return thumbnailFailure(503);
    return new Response(new Uint8Array(bytes), { headers: {
      ...headers, "Content-Type": "image/webp", "Content-Length": String(bytes.length),
    } });
  } catch { return thumbnailFailure(503); }
}
