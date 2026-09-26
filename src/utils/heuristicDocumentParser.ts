import { AIRPORT_CITIES } from "../data/airportCities";
import type { ParsedFlightLeg, ParsedTravelDocument } from "../services/travelDocumentClient";

const MONTHS = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
const CURRENCY_SYMBOLS: Record<string, string> = { "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY" };
const CURRENCY_CODES = "USD|EUR|GBP|SGD|AUD|JPY|CAD|NZD|HKD|THB|TWD|KRW|CNY|INR";

function toIsoDate(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthNameToNumber(name: string): number {
  return MONTHS.split("|").findIndex((m) => m.toLowerCase() === name.slice(0, 3).toLowerCase()) + 1;
}

/** Finds every date mentioned in the text (ISO, "5 Jan 2026", "Jan 5, 2026", "5/1/2026") and
 * returns them as unique ISO strings. No AI — pure regex, so odd formats just won't match. */
function findDates(text: string): string[] {
  const found = new Set<string>();

  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    found.add(m[0]);
  }
  for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})\\s+(${MONTHS})[a-z]*\\s+(\\d{4})\\b`, "gi"))) {
    const iso = toIsoDate(Number(m[1]), monthNameToNumber(m[2]), Number(m[3]));
    if (iso) found.add(iso);
  }
  for (const m of text.matchAll(new RegExp(`\\b(${MONTHS})[a-z]*\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, "gi"))) {
    const iso = toIsoDate(Number(m[2]), monthNameToNumber(m[1]), Number(m[3]));
    if (iso) found.add(iso);
  }
  for (const m of text.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)) {
    // Ambiguous day/month order without locale context — assume MM/DD/YYYY (US ticket convention).
    const iso = toIsoDate(Number(m[2]), Number(m[1]), Number(m[3]));
    if (iso) found.add(iso);
  }

  return [...found].sort();
}

function findFlightNumbers(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(/Flight\s*(?:No\.?|Number|#)?\s*:?\s*([A-Z]{2})\s?(\d{2,4})\b/gi)) {
    found.push(`${m[1].toUpperCase()}${m[2]}`);
  }
  if (found.length === 0) {
    // Fallback: bare "XX123" tokens, capped so a noisy document can't flood the list.
    for (const m of text.matchAll(/\b([A-Z]{2})\s?(\d{2,4})\b/g)) {
      found.push(`${m[1]}${m[2]}`);
      if (found.length >= 8) break;
    }
  }
  return [...new Set(found)];
}

function findRoutes(text: string): { from: string; to: string }[] {
  const routes: { from: string; to: string }[] = [];
  for (const m of text.matchAll(/\b([A-Z]{3})\s*(?:→|->|-|to)\s*([A-Z]{3})\b/g)) {
    if (m[1] !== m[2]) routes.push({ from: m[1], to: m[2] });
  }
  return routes;
}

function findTravelerCount(text: string): number | null {
  const m = text.match(/\b(\d+)\s*(?:adults?|passengers?|travele?rs?|guests?)\b/i);
  return m ? Number(m[1]) : null;
}

const LABEL_WORDS = new Set([
  "name", "names", "number", "date", "total", "amount", "flight",
  "passenger", "passengers", "guest", "guests",
  "traveler", "travelers", "traveller", "travellers", "departure", "arrival", "fare",
]);

function findTravelerNames(text: string): string[] {
  const names = new Set<string>();
  // Requires the literal word "Name" in the trigger (not just "Passengers"/"Travelers" on
  // their own, which show up as a plain headcount) and stops at exactly two capitalized
  // words. Whether either word is itself the next field's label (e.g. a 1-word name
  // immediately followed by "Flight Number:") is checked after matching, in plain JS —
  // a lookahead here would let the regex backtrack into truncating the name instead.
  const pattern = /(?:Passengers?\s*Names?|Guests?\s*Names?|Travell?ers?\s*Names?)\s*:?\s*([A-Z][A-Za-z'-]+)\s+([A-Z][A-Za-z'-]+)\b/g;
  for (const m of text.matchAll(pattern)) {
    const [first, second] = [m[1], m[2]];
    if (LABEL_WORDS.has(first.toLowerCase()) || LABEL_WORDS.has(second.toLowerCase())) continue;
    names.add(`${first} ${second}`);
    if (names.size >= 8) break;
  }
  return [...names];
}

function findTotalCost(text: string): { amount: number; currency: string } | null {
  const labeled = text.match(
    new RegExp(`(?:Total(?:\\s*Amount|\\s*Paid|\\s*Due)?|Grand\\s*Total|Fare\\s*Total)\\D{0,15}?(\\$|€|£|¥|${CURRENCY_CODES})\\s?([\\d,]+(?:\\.\\d{2})?)`, "i")
  );
  const match =
    labeled ??
    [...text.matchAll(new RegExp(`(\\$|€|£|¥|${CURRENCY_CODES})\\s?([\\d,]+\\.\\d{2})`, "g"))].sort(
      (a, b) => Number(b[2].replace(/,/g, "")) - Number(a[2].replace(/,/g, ""))
    )[0];
  if (!match) return null;
  const amount = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const currency = CURRENCY_SYMBOLS[match[1]] ?? match[1].toUpperCase();
  return { amount, currency };
}

function guessDestination(text: string, routes: { from: string; to: string }[]): string | null {
  for (const route of routes) {
    const city = AIRPORT_CITIES[route.to];
    if (city) return city;
  }
  const labeled = text.match(/(?:Destination|Arriving\s*in)\s*:?\s*([A-Z][A-Za-z,\s]{2,40}?)(?:[.\n]|$)/);
  return labeled ? labeled[1].trim() : null;
}

/** Regex/pattern-based extraction over already-extracted document text — no AI, no server call.
 * Necessarily rougher than AI extraction (especially destination and traveler names), but works
 * entirely offline for PDFs that have a real text layer. */
export function parseTravelTextHeuristically(rawText: string): ParsedTravelDocument {
  const text = rawText.replace(/\s+/g, " ").trim();

  const dates = findDates(text);
  const flightNumbers = findFlightNumbers(text);
  const routes = findRoutes(text);
  const travelers = findTravelerCount(text);
  const travelerNames = findTravelerNames(text);
  const totalCost = findTotalCost(text);
  const destination = guessDestination(text, routes);

  const legCount = Math.max(flightNumbers.length, routes.length);
  const flights: ParsedFlightLeg[] = [];
  for (let i = 0; i < Math.min(legCount, 8); i++) {
    const flightNumber = flightNumbers[i] ?? null;
    const route = routes[i];
    if (!flightNumber && !route) continue;
    flights.push({
      airline: null,
      flightNumber,
      departureAirport: route?.from ?? null,
      arrivalAirport: route?.to ?? null,
      departureTime: null,
      arrivalTime: null,
    });
  }

  const documentType: ParsedTravelDocument["documentType"] = flights.length
    ? "flight"
    : /\bhotel\b|\bcheck-?in\b|\bcheck-?out\b|\breservation\b/i.test(text)
      ? "hotel"
      : /\bitinerary\b/i.test(text)
        ? "itinerary"
        : "other";

  const foundParts: string[] = [];
  if (flights.length) foundParts.push(`${flights.length} flight leg${flights.length > 1 ? "s" : ""}`);
  if (destination) foundParts.push(`a trip to ${destination}`);
  if (dates.length) foundParts.push(`date${dates.length > 1 ? "s" : ""}`);
  if (totalCost) foundParts.push("a total price");
  const summary = foundParts.length
    ? `Scanned the text in your file(s) and found ${foundParts.join(", ")} — no AI involved, so double-check the details below.`
    : "Scanned the text in your file(s) but couldn't confidently pull out trip details — you can fill them in below.";

  return {
    documentType,
    destination,
    startDate: dates[0] ?? null,
    endDate: dates.length > 1 ? dates[dates.length - 1] : null,
    travelers,
    travelerNames,
    flights,
    totalCost: totalCost?.amount ?? null,
    currency: totalCost?.currency ?? null,
    summary,
  };
}
