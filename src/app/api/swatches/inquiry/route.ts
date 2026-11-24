import { type NextRequest } from "next/server";
import { lineTotal, money, selectRolls, yardage, type CartLine } from "@/app/swatches/catalog";
import { readCatalog, readCompanies, recordInquiry } from "../sheets";
import { codeFingerprint, equal, json, readSession, sameOrigin } from "../session";

type Selection = { id: string; price: number };

function readSelections(value: unknown): Selection[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) return null;
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item.id !== "string" || item.id.length > 120 ||
      typeof item.price !== "number" || !Number.isFinite(item.price) || item.price <= 0 ||
      seen.has(item.id)) return null;
    seen.add(item.id);
  }
  return value;
}

function inquiryText(lines: CartLine[]) {
  return [
    ...lines.map((line) => `${line.pattern} · ${line.color} · ${line.sku} | ${yardage(line.yards)} × ${money(line.price)}/y | ${money(lineTotal(line.yards, line.price))}`),
    "",
    `선택 ${lines.length}롤 · 원단 합계 ${money(lines.reduce((sum, roll) => sum + lineTotal(roll.yards, roll.price), 0))} (배송비 별도)`,
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
    const fingerprint = readSession(request);
    if (!fingerprint) return json({ error: "고객 코드를 다시 입력해 주세요." }, 401);
    const [companies, catalog] = await Promise.all([readCompanies(), readCatalog()]);
    const matches = companies.filter((entry) => equal(codeFingerprint(entry.code), fingerprint));
    if (matches.length !== 1) return json({ error: "고객 코드를 다시 입력해 주세요." }, 401);
    company = matches[0];
    const available = selectRolls(catalog.patterns);
    lines = [];
    for (const item of selections) {
      const live = available.get(item.id);
      if (!live || live.price !== item.price) {
        return json({ error: "일부 롤의 재고나 단가가 바뀌었습니다. 장바구니를 확인해 주세요.", catalog }, 409);
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
    return json({ ok: true, sent });
  } catch {
    console.error("swatches_inquiry_result_uncertain");
    return json({
      uncertain: true,
      error: "접수 결과를 확인하지 못했습니다. 아래 이메일로 문의 내용을 확인해 주세요.",
    }, 503);
  }
}
