import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const sheetsConfigured = Boolean(SHEET_ID && SERVICE_ACCOUNT_EMAIL && PRIVATE_KEY);

const SHEET_RANGE = "Expenses!A:H";
const HEADER_ROW = ["Date", "Trip", "Day", "Category", "Label", "Amount", "Currency", "Note"];

let authClient: InstanceType<typeof google.auth.JWT> | null = null;
let headerEnsured = false;

function getAuth(): InstanceType<typeof google.auth.JWT> | null {
  if (!sheetsConfigured) return null;
  if (!authClient) {
    authClient = new google.auth.JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return authClient;
}

export interface SheetExpenseRow {
  date: string;
  trip: string;
  day: number | null;
  category: string;
  label: string;
  amount: number;
  currency: string;
  note?: string;
}

async function ensureHeaderRow(sheets: ReturnType<typeof google.sheets>): Promise<void> {
  if (headerEnsured) return;
  const existing = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: "Expenses!A1:H1" });
  if (!existing.data.values || existing.data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: "Expenses!A1:H1",
      valueInputOption: "RAW",
      requestBody: { values: [HEADER_ROW] },
    });
  }
  headerEnsured = true;
}

export async function appendExpenseRow(row: SheetExpenseRow): Promise<{ ok: boolean; error?: string }> {
  const auth = getAuth();
  if (!auth) return { ok: false, error: "Google Sheets is not configured." };

  try {
    const sheets = google.sheets({ version: "v4", auth });
    await ensureHeaderRow(sheets);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: SHEET_RANGE,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[row.date, row.trip, row.day ?? "", row.category, row.label, row.amount, row.currency, row.note ?? ""]],
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("[sheetsService] append failed:", err);
    return { ok: false, error: "Failed to sync to Google Sheets — check that the sheet is shared with the service account." };
  }
}
