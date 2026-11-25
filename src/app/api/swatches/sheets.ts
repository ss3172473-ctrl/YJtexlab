import { readContactGoogleCredentials, readSwatchesGoogleCredentials } from "./google-credentials";
import { google } from "googleapis";
import { type Catalog, type Pattern, type Roll } from "@/app/swatches/catalog";
import { customerCode } from "@/app/swatches/customer-code";
import { buildContactSheetRow } from "@/lib/contact";
import { contactRowNumber, notifyContactRow } from "@/lib/contact-notification";

function sheetId(name: "SWATCHES_INVENTORY_SHEET_ID" | "SWATCHES_CRM_SHEET_ID") {
  const id = process.env[name]?.trim();
  if (!id || !/^[A-Za-z0-9_-]{10,128}$/.test(id)) throw new Error("Swatches data source is not configured");
  return id;
}

type Row = unknown[];
const cell = (value: unknown) => String(value ?? "").trim();
const tab = (name: string) => `'${name.replaceAll("'", "''")}'`;

let swatchesClient: ReturnType<typeof initSheets> | undefined;
let contactClient: ReturnType<typeof initSheets> | undefined;

async function initSheets(readCredentials: typeof readSwatchesGoogleCredentials) {
  const key = await readCredentials();
  if (!key) throw new Error("Swatches service account is missing");
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(key),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function sheets() {
  swatchesClient ??= initSheets(readSwatchesGoogleCredentials);
  return swatchesClient;
}

async function contactSheets() {
  contactClient ??= initSheets(readContactGoogleCredentials);
  return contactClient;
}

function column(headers: Row, name: string) {
  const index = headers.findIndex((value) => cell(value) === name);
  if (index === -1) throw new Error(`Missing Swatches sheet column: ${name}`);
  return index;
}

export function parseCatalog([header = [], ...products]: Row[], [rollHeader = [], ...stock]: Row[]): Catalog {
  const skuCol = column(header, "SKU");
  const patternCol = column(header, "패턴 그룹");
  const colorCol = column(header, "Color");
  const productNameCol = column(header, "품 명");
  // The export catalog and inquiry must use KRW per yard, never domestic or indicative USD prices.
  const exportLabel = "수출가(원/yd)";
  const priceCol = column(header, exportLabel);
  if (header.slice(priceCol + 1).some((value) => cell(value) === exportLabel))
    throw new Error("Ambiguous Swatches export price column");
  const compositionCol = column(header, "혼용률");
  const widthCol = column(header, "inch");
  const kindCol = header.findIndex((name) => cell(name) === "패턴 유형");

  const rollSkuCol = column(rollHeader, "SKU");
  const yardsCol = column(rollHeader, "yd");
  const statusCol = column(rollHeader, "상태");
  const rollsBySku = new Map<string, Roll[]>();
  const countsByLength = new Map<string, number>();
  for (const row of stock) {
    if (cell(row[statusCol]) !== "보유중") continue;
    const sku = cell(row[rollSkuCol]);
    const yards = Number(cell(row[yardsCol]));
    if (!sku || !Number.isFinite(yards) || yards <= 0) continue;
    // Equal-length rolls under the same SKU are interchangeable in the sheet.
    const key = `${sku}:${yards}`;
    const number = (countsByLength.get(key) ?? 0) + 1;
    countsByLength.set(key, number);
    const rolls = rollsBySku.get(sku) ?? [];
    rolls.push({ id: `${key}:${number}`, yards });
    rollsBySku.set(sku, rolls);
  }

  const patterns = new Map<string, Pattern>();
  const seenSkus = new Set<string>();
  for (const row of products) {
    const name = cell(row[patternCol]);
    const sku = cell(row[skuCol]);
    if (!name || !sku || seenSkus.has(sku)) continue;
    seenSkus.add(sku);
    const rawPrice = cell(row[priceCol]);
    const price = Number(rawPrice.replaceAll(",", ""));
    const pattern = patterns.get(name) ?? { name, patternType: cell(row[kindCol]) || undefined, variants: [] };
    pattern.patternType ||= cell(row[kindCol]) || undefined;
    pattern.variants.push({
      sku,
      productName: cell(row[productNameCol]),
      color: cell(row[colorCol]) || sku,
      composition: cell(row[compositionCol]),
      width: cell(row[widthCol]),
      price: rawPrice && Number.isFinite(price) && price > 0 ? price : null,
      image: null,
      rolls: rollsBySku.get(sku) ?? [],
    });
    patterns.set(name, pattern);
  }
  return { patterns: Array.from(patterns.values()), updatedAt: new Date().toISOString() };
}

export async function readCatalog() {
  const client = await sheets();
  const response = await client.spreadsheets.values.batchGet({
    spreadsheetId: sheetId("SWATCHES_INVENTORY_SHEET_ID"),
    ranges: ["'상품 정보'!A:U", "'재고DB'!A:C"],
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const [products, stock] = response.data.valueRanges ?? [];
  return parseCatalog(products?.values ?? [], stock?.values ?? []);
}

export type Company = { name: string; email: string; code: string };

export async function readCompanies(): Promise<Company[]> {
  const client = await sheets();
  const response = await client.spreadsheets.values.get({
    spreadsheetId: sheetId("SWATCHES_CRM_SHEET_ID"),
    range: "'업체현황'!A:Z",
  });
  const [header = [], ...rows] = response.data.values ?? [];
  const nameCol = column(header, "업체명");
  const emailCol = column(header, "이메일");
  const codeCol = column(header, "고객 코드");
  const activeCol = column(header, "활성 상태");

  return rows.flatMap((row) => {
    const name = cell(row[nameCol]);
    const email = cell(row[emailCol]);
    const code = customerCode(cell(row[codeCol]));
    return cell(row[activeCol]) === "활성" && name &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && code
      ? [{ name, email, code }]
      : [];
  });
}

const accessTab = "Swatches 접속 기록";

function sheetTimeInKorea() {
  // Sheets serial dates count days since 1899-12-30. Store a number for COUNTIFS.
  return 25_569 + (Date.now() + 9 * 60 * 60 * 1_000) / 86_400_000;
}

export async function logAccess(company: Company, campaign: string) {
  const client = await sheets();
  await client.spreadsheets.values.append({
    spreadsheetId: sheetId("SWATCHES_CRM_SHEET_ID"),
    range: `${tab(accessTab)}!A:D`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[sheetTimeInKorea(), company.name, company.email, campaign]] },
  });
}

export async function recordInquiry(company: Company, message: string) {
  const spreadsheetId = process.env.GOOGLE_CONTACT_SPREADSHEET_ID;
  const contactTab = tab(process.env.GOOGLE_CONTACT_SHEET_NAME || "Inquiries");
  if (!spreadsheetId || !process.env.CONTACT_EMAIL_WEBHOOK_URL || !process.env.CONTACT_EMAIL_WEBHOOK_SECRET) {
    throw new Error("Swatches contact sheet or mail notification is missing");
  }
  const client = await contactSheets();
  const values = buildContactSheetRow({
    companyName: company.name,
    replyTo: company.email,
    subject: "[Swatches] 롤 구매 문의",
    message,
  }, "website/swatches");
  const appended = await client.spreadsheets.values.append({
    spreadsheetId,
    range: `${contactTab}!A:F`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [values] },
  });
  const rowNumber = contactRowNumber(appended.data.updates?.updatedRange);
  return rowNumber === null ? "uncertain" : notifyContactRow(rowNumber);
}
