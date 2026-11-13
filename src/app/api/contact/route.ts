import { readFile } from "node:fs/promises";

import { google } from "googleapis";
import { NextResponse } from "next/server";
import { contactRowNumber, notifyContactRow } from "@/lib/contact-notification";

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

  const appended = await sheets.spreadsheets.values.append({
    spreadsheetId: contactSpreadsheetId,
    range: `${contactSheetName}!A2:F`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [values],
    },
  });
  return contactRowNumber(appended.data.updates?.updatedRange);
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

  let rowNumber: number | null;
  try {
    rowNumber = await appendContactRow(buildContactSheetRow(payload));
  } catch {
    // Append may have succeeded before its response was lost. No automatic retry.
    // Never expose credential/provider error details or ask users to resubmit blindly.
    console.error("contact_store_result_uncertain");
    return NextResponse.json({
      ok: false,
      saved: "unknown",
      error: "접수 결과를 확인하지 못했습니다. 중복 접수를 막기 위해 다시 전송하지 말고 직접 연락해 확인해 주세요.",
    }, { status: 503 });
  }

  const notification = rowNumber === null ? "uncertain" : await notifyContactRow(rowNumber);
  if (notification !== "sent" && notification !== "already_sent") {
    console.warn("contact_notification_not_confirmed", { rowNumber, status: notification });
  }
  return NextResponse.json({
    ok: true,
    saved: true,
    notification,
    message: "문의가 접수되었습니다. 확인 후 회신드리겠습니다.",
  });
}
