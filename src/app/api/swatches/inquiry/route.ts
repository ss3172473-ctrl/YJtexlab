import { type NextRequest } from "next/server";
import { lineTotal, money, selectRolls, yardage, type CartLine } from "@/app/swatches/catalog";
import { readCatalog, recordInquiry } from "../sheets";
import { readActiveCompany } from "../active-session";
import { json, sameOrigin } from "../session";

type Selection = { id: string; price?: number };

function readSelections(value: unknown): Selection[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) return null;
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item.id !== "string" || item.id.length > 120 ||
      (item.price !== undefined && (typeof item.price !== "number" || !Number.isFinite(item.price) || item.price <= 0)) ||
      seen.has(item.id)) return null;
    seen.add(item.id);
  }
  return value;
}

function inquiryText(lines: CartLine[]) {
  const summary = lines.every(line => line.price != null)
    ? money(lines.reduce((sum, line) => sum + lineTotal(line.yards, line.price!), 0))
    : "견적 확인 필요";
  return [
    ...lines.map(line => {
      const pricing = line.price == null ? "견적 확인 필요" : `${money(line.price)}/y | ${money(lineTotal(line.yards, line.price))}`;
      return `${line.pattern} · ${line.color} · ${line.sku} | ${line.id} | ${yardage(line.yards)} × ${pricing}`;
    }),
    "",
    `선택 ${lines.length}롤 · 원단 합계 ${summary} (배송비 별도)`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: "접근할 수 없습니다." }, 403);
  const body = await request.json().catch(() => null);
  const selections = readSelections(body?.items);
  if (!selections) return json({ error: "문의할 롤을 확인해 주세요." }, 400);

  let company;
  let lines: CartLine[];
  try {
    company = await readActiveCompany(request);
    if (!company) return json({ error: "고객 코드를 다시 입력해 주세요." }, 401);
    const catalog = await readCatalog();
    const available = selectRolls(catalog.patterns);
    lines = [];
    for (const item of selections) {
      const live = available.get(item.id);
      // A previously priced cart must reload after a downgrade. The result
      // for a hidden company never depends on the numeric price supplied.
      const changed = company.canViewPrices
        ? live?.price == null || live.price !== item.price
        : item.price !== undefined;
      if (!live || changed) {
        return json({ error: "일부 롤의 재고나 단가가 바뀌었습니다. 장바구니를 확인해 주세요." }, 409);
      }
      lines.push(live);
    }
  } catch {
    console.error("swatches_inquiry_validation_unavailable");
    return json({ error: "지금은 재고를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요." }, 503);
  }

  try {
    const notification = await recordInquiry(company, inquiryText(lines));
    const sent = notification === "sent" || notification === "already_sent";
    if (!sent) console.warn("swatches_notification_not_confirmed", { status: notification });
    return json({ ok: true, sent, newlySent: notification === "sent" });
  } catch {
    console.error("swatches_inquiry_result_uncertain");
    return json({
      uncertain: true,
      error: "접수 결과를 확인하지 못했습니다. 아래 이메일로 문의 내용을 확인해 주세요.",
    }, 503);
  }
}
