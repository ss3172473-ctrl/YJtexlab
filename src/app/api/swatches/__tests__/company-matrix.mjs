import { randomInt } from "node:crypto";

// All rows are generated locally; CRM P and Q are zero-based 15 and 16.
export function makeCompanyMatrix() {
  const headers = Array.from({ length: 17 }, (_, i) => `fixture-${i + 1}`);
  Object.assign(headers, { 0: "업체명", 1: "이메일", 2: "고객 코드", 15: "활성 상태", 16: "가격 공개" });
  const names = ["Aster", "Cedar", "Linden", "Maple", "Juniper", "Willow", "Hazel", "Elm"]
    .flatMap(prefix => ["Weaving", "Fabrics", "Textiles", "Knitting", "Looms", "Dyehouse", "Trading", "Mills"]
      .map(suffix => `QA ${prefix} ${suffix}`));
  const usedCodes = new Set();
  function newRow(name, index) {
    let code;
    do { code = String(randomInt(10_000)).padStart(4, "0"); } while (usedCodes.has(code));
    usedCodes.add(code);
    const row = Array(17).fill("");
    Object.assign(row, { 0: name, 1: `qa-${index}@example.invalid`, 2: code, 15: "활성" });
    return row;
  }
  const external = Array.from({ length: 20 }, (_, index) => {
    const [name] = names.splice(randomInt(names.length), 1);
    const row = newRow(name, index);
    row[16] = index < 10 ? "비공개" : "";
    return row;
  });
  const internal = newRow("QA Internal Swatches", 20);
  internal[16] = "공개";
  return { headers, external, internal };
}
