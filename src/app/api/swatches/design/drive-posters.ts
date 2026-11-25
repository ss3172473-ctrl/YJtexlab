import "server-only";
import { createHash } from "node:crypto";
import { driveToken } from "./drive-video";
import { parseListThumbnailLocator, readDriveFile, thumbnailFailure, validListThumbnailSku } from "./drive-list-thumbnails";

const otherFolders = [
  process.env.SWATCHES_DRIVE_FRONT_FOLDER_ID, process.env.SWATCHES_DRIVE_REVERSE_FOLDER_ID,
  process.env.SWATCHES_DRIVE_VIDEO_FOLDER_ID,
  parseListThumbnailLocator(process.env.SWATCHES_DRIVE_LIST_THUMB_LOCATOR)?.folderId,
];
const locator = parseListThumbnailLocator(process.env.SWATCHES_DRIVE_POSTER_LOCATOR, otherFolders);
const maxPoster = 640 * 1024;
const maxRegistry = 64 * 1024;
const skuCount = 236;
type Asset = { fileId: string; bytes: number; sha256: string };
const plain = (v: unknown): v is Record<string, unknown> => Boolean(v && typeof v === "object" && !Array.isArray(v));
export const postersEnabled = Boolean(locator && !locator.skus);

export function parsePosterRegistry(bytes: Buffer, sha: string, disallowedIds: readonly string[]) {
  if (bytes.length > maxRegistry || createHash("sha256").update(bytes).digest("hex") !== sha) throw new Error("Invalid poster registry digest");
  const value: unknown = JSON.parse(bytes.toString("utf8"));
  if (!plain(value) || Object.keys(value).length !== 2 || value.version !== 1 || !Array.isArray(value.assets) || value.assets.length !== skuCount)
    throw new Error("All 236 poster assets are required");
  const out = new Map<string, Asset>();
  const ids = new Set(disallowedIds);
  for (const row of value.assets) {
    if (!plain(row) || Object.keys(row).length !== 4 || !validListThumbnailSku(row.sku) || out.has(row.sku)
      || typeof row.fileId !== "string" || !/^[A-Za-z0-9_-]{10,128}$/.test(row.fileId) || ids.has(row.fileId)
      || typeof row.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(row.sha256)
      || typeof row.bytes !== "number" || !Number.isSafeInteger(row.bytes) || row.bytes < 20 || row.bytes > maxPoster)
      throw new Error("Invalid or duplicate poster asset");
    ids.add(row.fileId);
    out.set(row.sku, { fileId: row.fileId, bytes: row.bytes, sha256: row.sha256 });
  }
  return out;
}

let registry: Promise<Map<string, Asset>> | undefined;
let retryAfter = 0;
async function getRegistry(l: NonNullable<typeof locator>) {
  if (!registry && Date.now() < retryAfter) throw new Error("Poster registry retry pending");
  registry ??= driveToken()
    .then(token => readDriveFile(token, l.folderId, l.manifestId, "detail-posters.v1.json", "application/json", l.sha256, maxRegistry))
    .then(bytes => parsePosterRegistry(bytes, l.sha256, [l.folderId, l.manifestId]))
    .catch((error: unknown) => { registry = undefined; retryAfter = Date.now() + 4000; throw error; });
  return registry;
}

export const posterFailure = thumbnailFailure;
export async function drivePoster(sku: unknown) {
  if (!locator || !postersEnabled || !validListThumbnailSku(sku)) return posterFailure(404);
  try {
    const asset = (await getRegistry(locator)).get(sku);
    if (!asset) return posterFailure(404);
    const bytes = await readDriveFile(await driveToken(), locator.folderId, asset.fileId, sku + ".webp",
      "image/webp", asset.sha256, maxPoster, asset.bytes);
    if (bytes.length < 20 || bytes.toString("ascii", 0, 4) !== "RIFF" || bytes.toString("ascii", 8, 12) !== "WEBP"
      || bytes.readUInt32LE(4) + 8 !== bytes.length) return posterFailure(503);
    return new Response(new Uint8Array(bytes), { headers: {
      ...Object.fromEntries(posterFailure(404).headers), "Content-Type": "image/webp", "Content-Length": String(bytes.length),
    } });
  } catch { return posterFailure(503); }
}
