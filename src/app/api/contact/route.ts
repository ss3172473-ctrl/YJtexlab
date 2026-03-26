import { readFile } from "node:fs/promises";

import { google } from "googleapis";
import { NextResponse } from "next/server";

import { buildContactSheetRow, normalizeContactSubmission, type ContactSubmission } from "@/lib/contact";

const contactSpreadsheetId = process.env.GOOGLE_CONTACT_SPREADSHEET_ID;
const contactSheetName = process.env.GOOGLE_CONTACT_SHEET_NAME || "Inquiries";
const serviceAccountKeyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const contactSheetHeader = [
  "Received At (KST)",
  "Company / Name",
  "Reply-to Email",
  "Subject",
  "Message",
  "Source",
];

async function getGoogleCredentials() {
  if (serviceAccountJson) {
    return JSON.parse(serviceAccountJson) as Record<string, string>;
  }

  if (serviceAccountKeyPath) {
    const file = await readFile(serviceAccountKeyPath, "utf8");
    return JSON.parse(file) as Record<string, string>;
  }

  throw new Error(
    "Google service account is not configured. Add GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_KEY_PATH.",
  );
}

async function appendContactRow(values: string[]) {
  if (!contactSpreadsheetId) {
    throw new Error(
      "Google Sheets target is not configured. Add GOOGLE_CONTACT_SPREADSHEET_ID.",
    );
  }

  const credentials = await getGoogleCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const header = await sheets.spreadsheets.values.get({
    spreadsheetId: contactSpreadsheetId,
    range: `${contactSheetName}!A1:F1`,
  });
  const currentHeader = header.data.values?.[0] ?? [];

  if (currentHeader.join("|") !== contactSheetHeader.join("|")) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: contactSpreadsheetId,
      range: `${contactSheetName}!A1:F1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [contactSheetHeader],
      },
    });
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: contactSpreadsheetId,
    range: `${contactSheetName}!A2:F`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [values],
    },
  });
}

export async function POST(request: Request) {
  let payload: ContactSubmission;

  try {
    const json = (await request.json()) as ContactSubmission;
    payload = normalizeContactSubmission(json);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid request payload.";

    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await appendContactRow(buildContactSheetRow(payload));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to store inquiry.";

    console.error("Failed to append contact inquiry", error);
    return NextResponse.json({ error: message }, { status: 503 });
  }

  return NextResponse.json({
    ok: true,
    message: "Inquiry sent successfully.",
  });
}
