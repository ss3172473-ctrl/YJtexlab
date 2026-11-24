import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { approvedMedia, hasApprovedMediaForSku, hasOriginalSwatchVideoForSku, validApprovedSku } from "./media";
import { hasSwatchReverse } from "./reverse-textures";
import type { Pattern } from "@/app/swatches/catalog";

const localLayout = process.env.SWATCHES_LAYOUT_FILE;
const directory = process.env.SWATCHES_PHOTO_DIRECTORY || (localLayout ? `${localLayout}.photos` : undefined);

export const photoStorageAvailable = Boolean(directory);

function photoName(sku: string) {
  return `${createHash("sha256").update(sku).digest("hex")}.webp`;
}

export function swatchPhotoUrl(sku: string, admin: boolean, version: number) {
  const route = admin ? "/api/swatches/design/photo" : "/api/swatches/photo";
  return `${route}?sku=${encodeURIComponent(sku)}&v=${version}`;
}

export async function withSwatchPhotos(patterns: Pattern[], admin: boolean): Promise<Pattern[]> {
  const folder = directory;
  const names = folder ? await readdir(folder).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  }) : [];
  const versions = new Map(await Promise.all(names.filter((name) => /^[a-f0-9]{64}\.webp$/.test(name))
    .map(async (name) => [name, (await stat(join(folder!, name))).mtimeMs] as const)));
  return patterns.map((pattern) => ({ ...pattern, variants: pattern.variants.map((variant) => {
    const version = versions.get(photoName(variant.sku));
    const valid = validApprovedSku(variant.sku);
    const approved = valid && hasApprovedMediaForSku(variant.sku);
    const video = !admin && valid && hasOriginalSwatchVideoForSku(variant.sku);
    const reverse = !admin && hasSwatchReverse(variant.sku);
    if (!version && !approved && !video && !reverse) return { ...variant, image: null };
    return {
      ...variant,
      image: version || approved ? swatchPhotoUrl(variant.sku, admin, version || 1) : null,
      video: video ? `/api/swatches/video?sku=${encodeURIComponent(variant.sku)}` : null,
      reverse: reverse ? `/api/swatches/reverse?sku=${encodeURIComponent(variant.sku)}` : null,
    };
  }) }));
}

export async function writeSwatchPhoto(sku: string, photo: Buffer) {
  if (!directory) throw new Error("Swatch photo storage unavailable");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const target = join(directory, photoName(sku));
  const temporary = join(directory, `${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, photo, { flag: "wx", mode: 0o600 });
    await rename(temporary, target);
    return (await stat(target)).mtimeMs;
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function swatchPhotoResponse(sku: string | null) {
  if (!sku || sku.length > 100) return new Response(null, { status: 404 });
  if (!directory) return approvedMedia("png", sku, null);
  try {
    const image = await readFile(join(directory, photoName(sku)));
    return new Response(new Uint8Array(image), { headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return approvedMedia("png", sku, null);
    return new Response(null, { status: 503 });
  }
}
