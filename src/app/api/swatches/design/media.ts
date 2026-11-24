import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { readSwatchesGoogleCredentials } from "../google-credentials";
import { join } from "node:path";
import { Readable } from "node:stream";
import { google } from "googleapis";
import { driveFront, driveVideo, hasDriveFrontForSku, hasDriveVideo, hasDriveVideoForSku } from "./drive-video";

type Kind = "png" | "mp4";
const local = process.env.SWATCHES_APPROVED_MEDIA_DIRECTORY;
const originalVideo = process.env.SWATCHES_ORIGINAL_VIDEO_DIRECTORY || local;
const files = local;
const bucket = process.env.SWATCHES_MEDIA_BUCKET;
const revision = process.env.SWATCHES_MEDIA_REVISION || "approved-236-v1";
const type = { png: "image/png", mp4: "video/mp4" };
export const hasApprovedMediaForSku = (sku: string) => Boolean(files || bucket || hasDriveFrontForSku(sku));
export const hasOriginalSwatchVideo = Boolean(originalVideo || bucket || hasDriveVideo);
export const hasOriginalSwatchVideoForSku = (sku: string) =>
  Boolean(originalVideo || bucket || hasDriveVideoForSku(sku));

export function validApprovedSku(sku: string | null): sku is string {
  if (!sku || !/^[ST][1-9][0-9]{0,2}$/.test(sku)) return false;
  const id = Number(sku.slice(1));
  return id <= (sku[0] === "S" ? 108 : 128);
}

let auth: InstanceType<typeof google.auth.GoogleAuth> | undefined;
async function cloudToken() {
  if (!auth) {
    const key = await readSwatchesGoogleCredentials();
    if (!key) throw new Error("Swatches service account is missing");
    auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(key),
      scopes: ["https://www.googleapis.com/auth/devstorage.read_only"],
    });
  }
  const token = await auth.getAccessToken();
  if (!token) throw new Error("Swatch media access token unavailable");
  return token;
}

export async function approvedMedia(kind: Kind, sku: string | null, range: string | null, options?: { signal?: AbortSignal; ifRange?: string | null }) {
  if (!validApprovedSku(sku) || !(kind === "mp4" ? hasOriginalSwatchVideoForSku(sku) : hasApprovedMediaForSku(sku))) return new Response(null, { status: 404 });
  if (kind === "mp4" && !originalVideo && hasDriveVideoForSku(sku)) return driveVideo(sku, range, options);
  if (kind === "png" && !files && hasDriveFrontForSku(sku)) return driveFront(sku, options);
  const object = `${kind}/${sku}.${kind}`;
  const headers = new Headers({
    "Content-Type": type[kind], "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow",
    "Accept-Ranges": "bytes", ETag: `"${revision}-${sku}-${kind}"`,
  });
  try {
    const directory = kind === "mp4" ? originalVideo : files;
    if (directory) {
      const path = join(directory, object);
      const { size } = await stat(path);
      const match = range?.match(/^bytes=(\d*)-(\d*)$/);
      if (range && (!match || (!match[1] && !match[2])))
        return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      const start = match && !match[1] ? Math.max(0, size - Number(match[2])) : Number(match?.[1] || 0);
      const end = match?.[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
      if (start >= size || end < start)
        return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      headers.set("Content-Length", String(end - start + 1));
      if (match) headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
      const stream = Readable.toWeb(createReadStream(path, { start, end })) as ReadableStream<Uint8Array>;
      return new Response(stream, { status: match ? 206 : 200, headers });
    }
    const cloud = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket!)}/o/${encodeURIComponent(`${revision}/${object}`)}?alt=media`, {
      headers: { Authorization: `Bearer ${await cloudToken()}`, ...(range ? { Range: range } : {}) },
      cache: "no-store",
    });
    if (!cloud.ok) {
      await cloud.body?.cancel();
      const contentRange = cloud.headers.get("Content-Range");
      if (cloud.status === 416 && contentRange) headers.set("Content-Range", contentRange);
      return new Response(null, { status: cloud.status === 404 || cloud.status === 416 ? cloud.status : 503, headers });
    }
    for (const name of ["Content-Range", "Content-Length"]) {
      const value = cloud.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(cloud.body, { status: cloud.status, headers });
  } catch (error) {
    return new Response(null, { status: (error as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 503 });
  }
}
