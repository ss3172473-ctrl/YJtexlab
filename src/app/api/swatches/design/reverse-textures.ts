import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, isAbsolute } from "node:path";

import { driveReverse, hasDriveReverseForSku } from "./drive-video";

// Local review requires the operator's explicit directory and SKU allowlist. Hosted
// deployments use the separate private server-only Drive manifest, not bundled bytes.
const directory = process.env.SWATCHES_REVERSE_TEXTURE_DIRECTORY;
const localSkus = new Set((process.env.SWATCHES_LOCAL_REVERSE_SKUS ?? "").split(",").map((sku) => sku.trim()));
export function swatchReversePath(sku: string | null) {
  if (!directory || !isAbsolute(directory) || !sku || !/^[ST][1-9][0-9]{0,2}$/.test(sku) || !localSkus.has(sku)) return null;
  const path = join(directory, "webp", `${sku}.webp`);
  return existsSync(path) ? path : null;
}

export const hasSwatchReverse = (sku: string) => Boolean(swatchReversePath(sku) || hasDriveReverseForSku(sku));

export async function readReverseTexture(sku: string | null, signal?: AbortSignal) {
  const path = swatchReversePath(sku);
  if (!path) return sku && hasDriveReverseForSku(sku) ? driveReverse(sku, { signal }) : new Response(null, { status: 404 });
  try {
    return new Response(new Uint8Array(await readFile(path)), {
      headers: {
        "Content-Type": "image/webp", "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff",
      },
    });
  } catch { return new Response(null, { status: 503 }); }
}
