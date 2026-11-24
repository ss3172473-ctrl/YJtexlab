import type { NextRequest } from "next/server";
import sharp from "sharp";
import { json, sameOrigin } from "../../session";
import { readCatalog } from "../../sheets";
import { hasDesignSession } from "../auth";
import { photoStorageAvailable, swatchPhotoResponse, swatchPhotoUrl, writeSwatchPhoto } from "../photos";

const maxBytes = 20 * 1024 * 1024;
const formats = new Set(["jpeg", "png", "webp", "heif"]);

export async function GET(request: NextRequest) {
  if (!hasDesignSession(request)) return json({ error: "관리자 로그인이 필요합니다." }, 401);
  return swatchPhotoResponse(request.nextUrl.searchParams.get("sku"));
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "접근할 수 없습니다." }, 403);
  if (!hasDesignSession(request)) return json({ error: "관리자 로그인이 필요합니다." }, 401);
  if (!photoStorageAvailable) return json({ error: "사진 저장소가 연결되지 않았습니다." }, 503);

  const sku = request.nextUrl.searchParams.get("sku");
  if (!sku || sku.length > 100) return json({ error: "색상 SKU를 선택해 주세요." }, 400);
  if (Number(request.headers.get("content-length")) > maxBytes + 4096) {
    return json({ error: "사진은 20MB 이하로 올려 주세요." }, 413);
  }

  let photo: Buffer;
  try {
    const image = await request.arrayBuffer();
    if (!image.byteLength || image.byteLength > maxBytes) {
      return json({ error: "사진은 20MB 이하로 올려 주세요." }, 413);
    }
    const pipeline = sharp(Buffer.from(image), { limitInputPixels: 64_000_000 });
    const { format } = await pipeline.metadata();
    if (!format || !formats.has(format)) throw new Error("Unsupported image type");
    photo = await pipeline.rotate().resize({ width: 1800, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 88 }).toBuffer();
  } catch {
    return json({ error: "JPG, PNG, WebP 또는 AVIF 사진 파일을 올려 주세요." }, 415);
  }

  try {
    const { patterns } = await readCatalog();
    if (!patterns.some(({ variants }) => variants.some((variant) => variant.sku === sku))) {
      return json({ error: "목록에서 해당 색상 SKU를 찾을 수 없습니다." }, 404);
    }
    const version = await writeSwatchPhoto(sku, photo);
    return json({ image: swatchPhotoUrl(sku, true, version) });
  } catch {
    return json({ error: "사진을 저장하지 못했습니다. 다시 시도해 주세요." }, 503);
  }
}
