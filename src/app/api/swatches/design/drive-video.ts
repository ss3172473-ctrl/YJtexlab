import { readFile } from "node:fs/promises";
import { google } from "googleapis";

type Entry = Readonly<{ fileId: string; bytes: number; md5: string }>;
type Config = Readonly<{ folderId: string; entries: ReadonlyMap<string, Entry> }>;
type RequestOptions = Readonly<{ signal?: AbortSignal; ifRange?: string | null }>;

const MAX_MP4_BYTES = 100 * 1024 * 1024;
const MAX_WEBP_BYTES = 4 * 1024 * 1024;
const TYPES = {
  video: { extension: "mp4", mime: "video/mp4", max: MAX_MP4_BYTES },
  front: { extension: "webp", mime: "image/webp", max: MAX_WEBP_BYTES },
  reverse: { extension: "webp", mime: "image/webp", max: MAX_WEBP_BYTES },
} as const;
type Kind = keyof typeof TYPES;
const isId = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{10,128}$/.test(value);
const isSku = (value: unknown): value is string =>
  typeof value === "string" && /^[ST][1-9][0-9]{0,2}$/.test(value)
  && Number(value.slice(1)) <= (value.startsWith("S") ? 108 : 128);
const isMd5 = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{32}$/.test(value);
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// IDs and hashes are injected as a server-only deployment setting, never in source/catalog responses.
function parseConfig(folderId: unknown, raw: string | undefined, maxBytes: number): Config | undefined {
  if (!isId(folderId) || !raw || raw.length > 80_000) return;
  try {
    const data: unknown = JSON.parse(raw);
    if (!record(data) || Object.keys(data).length !== 2 || data.version !== 1
      || !Array.isArray(data.assets) || data.assets.length < 1 || data.assets.length > 236) return;
    const entries = new Map<string, Entry>();
    const ids = new Set<string>();
    for (const item of data.assets) {
      if (!record(item) || Object.keys(item).length !== 4) return;
      const { sku, fileId, bytes, md5 } = item;
      if (!isSku(sku) || !isId(fileId) || fileId === folderId || !isMd5(md5)
        || typeof bytes !== "number" || !Number.isSafeInteger(bytes) || bytes < 1 || bytes > maxBytes
        || entries.has(sku) || ids.has(fileId)) return;
      entries.set(sku, { fileId, bytes, md5 });
      ids.add(fileId);
    }
    return { folderId, entries };
  } catch { return; }
}

export const parseDriveVideoConfig = (folderId: unknown, raw: string | undefined) => parseConfig(folderId, raw, MAX_MP4_BYTES);
const configs = {
  video: parseDriveVideoConfig(process.env.SWATCHES_DRIVE_VIDEO_FOLDER_ID, process.env.SWATCHES_DRIVE_VIDEO_MANIFEST),
  front: parseConfig(process.env.SWATCHES_DRIVE_FRONT_FOLDER_ID, process.env.SWATCHES_DRIVE_FRONT_MANIFEST, MAX_WEBP_BYTES),
  reverse: parseConfig(process.env.SWATCHES_DRIVE_REVERSE_FOLDER_ID, process.env.SWATCHES_DRIVE_REVERSE_MANIFEST, MAX_WEBP_BYTES),
};
function getConfig(kind: Kind): Config | undefined {
  const current = configs[kind];
  if (!current) return;
  // Each private image/MP4 family must use its own exact folder. Refuse a crossed configuration.
  return (Object.keys(configs) as Kind[]).some(other => other !== kind && configs[other]?.folderId === current.folderId) ? undefined : current;
}
export const hasDriveVideo = Boolean(getConfig("video"));
export const hasDriveVideoForSku = (sku: string) => getConfig("video")?.entries.has(sku) ?? false;
export const hasDriveFrontForSku = (sku: string) => getConfig("front")?.entries.has(sku) ?? false;
export const hasDriveReverseForSku = (sku: string) => getConfig("reverse")?.entries.has(sku) ?? false;

let auth: InstanceType<typeof google.auth.GoogleAuth> | undefined;
async function driveToken() {
  if (!auth) {
    const key = process.env.GOOGLE_SERVICE_ACCOUNT_JSON ??
      (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
        ? await readFile(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH, "utf8")
        : undefined);
    const credentials: unknown = key ? JSON.parse(key) : undefined;
    // Do not fall back to a developer's ADC/user refresh token.
    if (!record(credentials) || credentials.type !== "service_account"
      || typeof credentials.client_email !== "string" || typeof credentials.private_key !== "string")
      throw new Error("Drive media requires a configured service account");
    auth = new google.auth.GoogleAuth({
      credentials: { client_email: credentials.client_email, private_key: credentials.private_key },
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
  }
  const token = await auth.getAccessToken();
  if (!token) throw new Error("Drive media access unavailable");
  return token;
}

function parseRange(raw: string, size: number) {
  const match = /^bytes=([0-9]{0,16})-([0-9]{0,16})$/.exec(raw);
  if (!match || (!match[1] && !match[2])) return;
  const startNumber = Number(match[1]);
  const endNumber = Number(match[2]);
  if (!Number.isSafeInteger(startNumber) || !Number.isSafeInteger(endNumber)) return;
  const start = match[1] ? startNumber : Math.max(0, size - endNumber);
  const end = match[1] && match[2] ? Math.min(endNumber, size - 1) : size - 1;
  if (start >= size || end < start) return;
  return { start, end };
}

function validMetadata(data: unknown, asset: Entry, sku: string, folderId: string, kind: Kind): boolean {
  return record(data) && data.id === asset.fileId && data.name === `${sku}.${TYPES[kind].extension}`
    && data.mimeType === TYPES[kind].mime && data.trashed === false
    && Array.isArray(data.parents) && data.parents.length === 1 && data.parents[0] === folderId
    && data.size === String(asset.bytes) && data.md5Checksum === asset.md5
    && record(data.capabilities) && data.capabilities.canDownload === true;
}

async function driveAsset(kind: Kind, sku: string, rawRange: string | null, options: RequestOptions = {}) {
  const config = getConfig(kind);
  const asset = config?.entries.get(sku);
  const headers = new Headers({
    "Content-Type": TYPES[kind].mime,
    "Cache-Control": "private, no-store, no-transform",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    ...(kind === "video" ? { "Accept-Ranges": "bytes" } : {}),
  });
  if (!asset || !config) return new Response(null, { status: 404, headers });
  // Avoid exposing internal Drive IDs, and tie the ETag to the approved bytes.
  const etag = `"${TYPES[kind].extension}-${sku}-${asset.md5}"`;
  headers.set("ETag", etag);
  const range = !options.ifRange || options.ifRange === etag ? rawRange : null;
  const part = range !== null ? parseRange(range, asset.bytes) : undefined;
  if (range !== null && !part) {
    headers.set("Content-Range", `bytes */${asset.bytes}`);
    return new Response(null, { status: 416, headers });
  }

  try {
    const authorization = `Bearer ${await driveToken()}`;
    const origin = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(asset.fileId)}`;
    const verify = new URL(origin);
    verify.searchParams.set("supportsAllDrives", "true");
    verify.searchParams.set("fields", "id,name,mimeType,parents,size,md5Checksum,trashed,capabilities(canDownload)");
    const request = { cache: "no-store", redirect: "error", signal: options.signal } as const;
    const metadata = await fetch(verify, { ...request, headers: { Authorization: authorization } });
    if (!metadata.ok) {
      await metadata.body?.cancel();
      return new Response(null, { status: metadata.status === 404 ? 404 : 503, headers });
    }
    if (!validMetadata(await metadata.json(), asset, sku, config.folderId, kind))
      return new Response(null, { status: 404, headers });

    const media = new URL(origin);
    media.searchParams.set("supportsAllDrives", "true");
    media.searchParams.set("alt", "media");
    const upstream = await fetch(media, {
      ...request,
      headers: {
        Authorization: authorization,
        "Accept-Encoding": "identity",
        ...(part ? { Range: `bytes=${part.start}-${part.end}` } : {}),
      },
    });
    const expectedStatus = part ? 206 : 200;
    const expectedRange = part ? `bytes ${part.start}-${part.end}/${asset.bytes}` : null;
    const expectedLength = String(part ? part.end - part.start + 1 : asset.bytes);
    const upstreamLength = upstream.headers.get("Content-Length");
    const upstreamEncoding = upstream.headers.get("Content-Encoding");
    if (!upstream.body || upstream.status !== expectedStatus
      || upstream.headers.get("Content-Range") !== expectedRange
      || (upstreamLength !== null && upstreamLength !== expectedLength)
      || (upstreamEncoding !== null && upstreamEncoding !== "identity")) {
      await upstream.body?.cancel();
      return new Response(null, { status: upstream.status === 404 ? 404 : 503, headers });
    }
    if (expectedRange) headers.set("Content-Range", expectedRange);
    headers.set("Content-Length", expectedLength);
    return new Response(upstream.body, { status: expectedStatus, headers });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}

export const driveVideo = (sku: string, range: string | null, options?: RequestOptions) => driveAsset("video", sku, range, options);
export const driveFront = (sku: string, options?: RequestOptions) => driveAsset("front", sku, null, options);
export const driveReverse = (sku: string, options?: RequestOptions) => driveAsset("reverse", sku, null, options);
