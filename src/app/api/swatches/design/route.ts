import type { NextRequest } from "next/server";
import type { Pattern } from "@/app/swatches/catalog";
import { normalizeSwatchesLayout, type SwatchesLayout } from "@/app/swatches/design-layout";
import { json, sameOrigin } from "../session";
import { customerPatterns } from "../price-visibility";
import { readCatalog } from "../sheets";
import { createDesignSession, designCookie, designSessionSeconds, hasAdminKey, hasDesignSession, isAdminKey, secureDesignCookie } from "./auth";
import { photoStorageAvailable, withSwatchPhotos } from "./photos";
import { canSaveSwatchesLayout, readSwatchesLayout, saveSwatchesLayout } from "./store";

function currentLayout(layout: SwatchesLayout, patterns: Pattern[]): SwatchesLayout {
  const valid = new Map(patterns.map((pattern) => [pattern.name, pattern.variants]));
  return {
    ...layout,
    order: layout.order.filter((name) => valid.has(name)),
    covers: Object.fromEntries(Object.entries(layout.covers).filter(([name, sku]) =>
      valid.get(name)?.some((variant) => variant.sku === sku))),
    sizes: Object.fromEntries(Object.entries(layout.sizes).filter(([name]) => valid.has(name))),
  };
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "접근할 수 없습니다." }, 403);
  if (!hasAdminKey()) return json({ error: "관리자 접속이 설정되지 않았습니다." }, 503);
  const body = await request.json().catch(() => null);
  if (!isAdminKey(body?.key)) return json({ error: "관리자 키를 확인해 주세요." }, 401);
  const response = json({ ok: true });
  response.cookies.set(designCookie, createDesignSession(), {
    httpOnly: true,
    sameSite: "strict",
    secure: secureDesignCookie(request),
    maxAge: designSessionSeconds,
    path: "/api/swatches/design",
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "접근할 수 없습니다." }, 403);
  const response = json({ ok: true });
  response.cookies.set(designCookie, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: secureDesignCookie(request),
    maxAge: 0,
    path: "/api/swatches/design",
  });
  return response;
}

export async function GET(request: NextRequest) {
  if (!hasDesignSession(request)) return json({ error: "관리자 로그인이 필요합니다." }, 401);
  try {
    const [catalog, layout] = await Promise.all([readCatalog(), readSwatchesLayout()]);
    return json({
      layout: currentLayout(layout, catalog.patterns),
      patterns: customerPatterns(await withSwatchPhotos(catalog.patterns, true), false),
      photoWritable: photoStorageAvailable,
      writable: canSaveSwatchesLayout(),
    });
  } catch {
    console.error("swatches_design_read_failed");
    return json({ error: "패턴 또는 저장된 배치를 불러오지 못했습니다." }, 503);
  }
}

export async function PUT(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "접근할 수 없습니다." }, 403);
  if (!hasDesignSession(request)) return json({ error: "관리자 로그인이 필요합니다." }, 401);
  if (!canSaveSwatchesLayout()) return json({ error: "배치 저장소가 설정되지 않았습니다." }, 503);
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" ||
      !("order" in body) || !("covers" in body) || !("sizes" in body) || !("rowHeights" in body) ||
      !Array.isArray(body.order) ||
      [body.covers, body.sizes, body.rowHeights].some((value) =>
        !value || typeof value !== "object" || Array.isArray(value))) {
    return json({ error: "배치 설정 형식을 확인해 주세요." }, 400);
  }

  const layout = normalizeSwatchesLayout(body);
  if (layout.order.length !== body.order.length ||
      Object.keys(layout.covers).length !== Object.keys(body.covers as object).length ||
      Object.keys(layout.sizes).length !== Object.keys(body.sizes as object).length ||
      Object.keys(layout.rowHeights).length !== Object.keys(body.rowHeights as object).length ||
      (("columns" in body) && body.columns !== layout.columns) ||
      (("columnGap" in body) && body.columnGap !== layout.columnGap) ||
      (("rowGap" in body) && body.rowGap !== layout.rowGap) ||
      JSON.stringify(layout).length > 45_000) {
    return json({ error: "순서, 대표 색상, 크기, 줄 높이에 유효하지 않은 값이 있습니다." }, 400);
  }
  try {
    const { patterns } = await readCatalog();
    const matching = currentLayout(layout, patterns);
    if (matching.order.length !== layout.order.length ||
        Object.keys(matching.covers).length !== Object.keys(layout.covers).length ||
        Object.keys(matching.sizes).length !== Object.keys(layout.sizes).length) {
      return json({ error: "패턴 또는 색상 정보가 변경됐습니다. 목록을 새로고침해 주세요." }, 409);
    }
    return json({ layout: await saveSwatchesLayout(matching) });
  } catch {
    console.error("swatches_design_write_failed");
    return json({ error: "배치 설정을 저장하지 못했습니다. 다시 시도해 주세요." }, 503);
  }
}
