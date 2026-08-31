import type { Expense, Trip } from "../types";

/**
 * Syncs expenses and itineraries straight from the browser to the Apps Script
 * Web App that backs the shared Google Sheet — no Express server involved.
 * This is what makes sync work on the static GitHub Pages deployment, which
 * has no backend at all.
 *
 * Setup: deploy apps-script/Code.gs as a Web App (Deploy > New deployment >
 * Web app, execute as Me, access: Anyone) and set VITE_APPS_SCRIPT_URL to the
 * resulting /exec URL and VITE_APPS_SCRIPT_SHARED_SECRET to match the
 * SHARED_SECRET constant in that script. See the "Google Sheets sync"
 * section in README.md.
 */

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
const SHARED_SECRET = import.meta.env.VITE_APPS_SCRIPT_SHARED_SECRET as string | undefined;

/** True once both build-time env vars are set. Synchronous — no network round trip
 * needed, since there's no server to ask (unlike the old service-account status check). */
export function isAppsScriptConfigured(): boolean {
  return Boolean(APPS_SCRIPT_URL && SHARED_SECRET);
}

/** POSTs JSON to the Apps Script Web App. Sent as text/plain so the browser treats it
 * as a "simple request" and skips the CORS preflight — Apps Script Web Apps can't
 * answer an OPTIONS preflight, so a real application/json request would just fail.
 * Apps Script still reads the body as JSON via e.postData.contents regardless of the
 * declared content type. Never throws — a missing/misconfigured Web App just means
 * the row didn't sync; the trip or expense is always saved locally either way. */
async function postToAppsScript(payload: Record<string, unknown>): Promise<boolean> {
  if (!APPS_SCRIPT_URL || !SHARED_SECRET) return false;
  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...payload, secret: SHARED_SECRET }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

/** Fire-and-forget sync of one expense row to the trip's tab in the shared sheet. */
export function syncExpenseToAppsScript(expense: Expense, tripDestination: string): Promise<boolean> {
  return postToAppsScript({
    type: "expense",
    date: expense.date,
    trip: tripDestination,
    day: expense.dayNumber ?? null,
    category: expense.category,
    label: expense.label,
    amount: expense.amount,
    currency: expense.currency ?? "SGD",
    note: expense.note ?? "",
  });
}

/** Fire-and-forget sync of a trip's full day-by-day itinerary to its tab in the
 * shared sheet — called once per trip creation (AI planner, template, or curated
 * destination), and safe to call again later since the Apps Script side clears
 * and rewrites the itinerary block each time rather than appending duplicates. */
export function syncItineraryToAppsScript(trip: Trip): Promise<boolean> {
  return postToAppsScript({
    type: "itinerary",
    trip: trip.destination,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    travelers: trip.travelers,
    budget: trip.budget,
    pace: trip.pace,
    source: trip.itinerarySource ?? "template",
    days: trip.itinerary.map((day) => ({
      dayNumber: day.dayNumber,
      date: day.date,
      activities: day.activities.map((act) => ({
        time: act.time,
        title: act.title,
        description: act.description,
        category: act.category,
        location: act.location ?? "",
        estCost: act.estCost,
      })),
    })),
  });
}
