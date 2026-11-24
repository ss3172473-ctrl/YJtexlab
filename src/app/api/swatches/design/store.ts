import { randomUUID } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { google } from "googleapis";
import { readSwatchesGoogleCredentials } from "../google-credentials";
import { decodeSwatchesConfig } from "./secret-config";
import { emptySwatchesLayout, normalizeSwatchesLayout, type SwatchesLayout } from "@/app/swatches/design-layout";

const range = "'Swatches 디자인 설정'!A1";
const spreadsheetId = process.env.SWATCHES_DESIGN_SHEET_ID;
const layoutFile = process.env.SWATCHES_LAYOUT_FILE;
// Read-only approved layout for hosts that cannot mount a private JSON file.
// Never put this setting in public client config or the repository.
const layoutSnapshot = process.env.SWATCHES_LAYOUT_JSON;

export function canSaveSwatchesLayout() {
  return layoutSnapshot === undefined && Boolean(layoutFile || spreadsheetId);
}

async function designSheets() {
  const credentials = await readSwatchesGoogleCredentials();
  if (!credentials) throw new Error("Swatches design store credentials are missing");
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(credentials),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function readSwatchesLayout(): Promise<SwatchesLayout> {
  if (layoutSnapshot !== undefined) {
    const json = decodeSwatchesConfig(layoutSnapshot, 45_000);
    if (!json?.trim()) throw new Error("Invalid Swatches layout snapshot");
    const layout = normalizeSwatchesLayout(JSON.parse(json));
    if (!layout.order.length || !Object.keys(layout.covers).length)
      throw new Error("Invalid Swatches layout snapshot");
    return layout;
  }
  if (layoutFile) {
    try {
      return normalizeSwatchesLayout(JSON.parse(await readFile(layoutFile, "utf8")));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptySwatchesLayout;
      throw error;
    }
  }
  if (!spreadsheetId) return emptySwatchesLayout;
  const client = await designSheets();
  const reply = await client.spreadsheets.values.get({ spreadsheetId, range });
  const saved = reply.data.values?.[0]?.[0];
  return typeof saved === "string" && saved ? normalizeSwatchesLayout(JSON.parse(saved)) : emptySwatchesLayout;
}

export async function saveSwatchesLayout(input: SwatchesLayout): Promise<SwatchesLayout> {
  if (layoutSnapshot !== undefined) throw new Error("Swatches layout snapshot is read-only");
  const layout = normalizeSwatchesLayout(input);
  const json = JSON.stringify(layout);
  if (json.length > 45_000) throw new Error("Swatches layout exceeds the design store limit");
  if (layoutFile) {
    const temp = `${layoutFile}.${randomUUID()}.tmp`;
    try {
      await writeFile(temp, `${json}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
      await rename(temp, layoutFile);
    } finally {
      await rm(temp, { force: true });
    }
  } else if (spreadsheetId) {
    const client = await designSheets();
    await client.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [[json]] },
    });
  } else {
    throw new Error("Swatches design store is not configured");
  }
  return layout;
}
