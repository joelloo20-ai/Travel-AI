import { apiUrl } from "./apiBase";
import type { Expense } from "../types";

let cachedStatus: boolean | null = null;

/** Whether the server has Google Sheets credentials configured. Cached for the
 * session so the UI can show a status badge without re-checking on every render. */
export async function getSheetsStatus(): Promise<boolean> {
  if (cachedStatus !== null) return cachedStatus;
  try {
    const res = await fetch(apiUrl("/api/sheets/status"));
    if (!res.ok) throw new Error("not ok");
    const data = await res.json();
    cachedStatus = Boolean(data.configured);
  } catch {
    cachedStatus = false;
  }
  return cachedStatus;
}

/** Fire-and-forget sync of one expense row to the configured Google Sheet.
 * Never throws — a missing/misconfigured sheet just means the row didn't sync. */
export async function syncExpenseToSheet(expense: Expense, tripDestination: string): Promise<boolean> {
  try {
    const res = await fetch(apiUrl("/api/sync-expense"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: expense.date,
        trip: tripDestination,
        day: expense.dayNumber ?? null,
        category: expense.category,
        label: expense.label,
        amount: expense.amount,
        currency: expense.currency ?? "USD",
        note: expense.note ?? "",
      }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.ok);
  } catch {
    return false;
  }
}
