import { AIRPORT_CITIES } from "../data/airportCities";
import type { ParsedFlightLeg, ParsedTravelDocument } from "../services/travelDocumentClient";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_PATTERN = MONTHS.join("|");
const CURRENCY_SYMBOLS: Record<string, string> = { "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY" };
const CURRENCY_CODE_PATTERN = "USD|EUR|GBP|SGD|AUD|JPY|CAD|NZD|HKD|THB|TWD|KRW|CNY|INR";
const CURRENCY_PATTERN = `\\$|€|£|¥|${CURRENCY_CODE_PATTERN}`;

// A single date written as "5 Jan 2026", "Jan 5, 2026", "2026-01-05", or "1/5/2026".
const DATE_TOKEN = `(?:\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\s+(?:${MONTH_PATTERN})[a-z]*\\s+\\d{4}|(?:${MONTH_PATTERN})[a-z]*\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}\\/\\d{1,2}\\/\\d{4})`;
// The same date immediately followed by a 24-hour time — how flight departure/arrival
// timestamps are typically printed together (e.g. "08 Oct 2026 02:30").
const DATETIME_TOKEN = `\\d{1,2}\\s+(?:${MONTH_PATTERN})[a-z]*\\s+\\d{4}\\s+\\d{1,2}:\\d{2}`;

function monthIndex(name: string): number {
  return MONTHS.findIndex((m) => m.toLowerCase() === name.slice(0, 3).toLowerCase());
}

function toIso(day: number, monthIdx: number, year: number): string | null {
  if (monthIdx < 0 || day < 1 || day > 31) return null;
  return `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Parses one already-matched date token (any of the DATE_TOKEN forms) into an ISO date. */
function parseDateToken(token: string): string | null {
  let m = token.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return token;
  m = token.match(new RegExp(`^(\\d{1,2})\\s+(${MONTH_PATTERN})[a-z]*\\s+(\\d{4})$`, "i"));
  if (m) return toIso(Number(m[1]), monthIndex(m[2]), Number(m[3]));
  m = token.match(new RegExp(`^(${MONTH_PATTERN})[a-z]*\\s+(\\d{1,2}),?\\s+(\\d{4})$`, "i"));
  if (m) return toIso(Number(m[2]), monthIndex(m[1]), Number(m[3]));
  m = token.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  // Ambiguous day/month order without locale context — assume MM/DD/YYYY (US ticket convention).
  if (m) return toIso(Number(m[2]), Number(m[1]) - 1, Number(m[3]));
  return null;
}

/** Dates that look like real dates but aren't trip dates: when the document was booked/paid
 * for, and cancellation-policy deadlines ("Before 12:00, Oct 7, 2026 Free cancellation"). Left
 * in, these can badly skew the min/max trip-date range (a booking date is often months before
 * the actual travel dates). */
function findDatesToExclude(text: string): Set<string> {
  const excluded = new Set<string>();
  const label = new RegExp(`(?:Booking|Payment|Issued?|Booked\\s*on)\\s*Date\\s*:?\\s*(${DATE_TOKEN})`, "gi");
  // Non-greedy gap (not restricted to non-alphanumeric — "12:00 PM," has digits and letters in it).
  const deadline = new RegExp(`\\b(?:Before|After)\\b[\\s\\S]{0,20}?(${DATE_TOKEN})`, "gi");
  for (const pattern of [label, deadline]) {
    for (const m of text.matchAll(pattern)) {
      const iso = parseDateToken(m[1]);
      if (iso) excluded.add(iso);
    }
  }
  return excluded;
}

/** Finds every date mentioned in the text and returns the ones that look like real trip dates
 * (excluding booking/payment/cancellation-deadline dates) as unique ISO strings, earliest first.
 * No AI — pure regex, so odd formats just won't match. */
function findDates(text: string): string[] {
  const all = new Set<string>();
  for (const m of text.matchAll(new RegExp(DATE_TOKEN, "gi"))) {
    const iso = parseDateToken(m[0]);
    if (iso) all.add(iso);
  }
  const excluded = findDatesToExclude(text);
  const kept = [...all].filter((d) => !excluded.has(d));
  return (kept.length ? kept : [...all]).sort();
}

/** Flight numbers explicitly labeled ("Flight No: TR58"), in document order. */
function findLabeledFlightNumbers(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(/Flight\s*(?:No\.?|Number|#)?\s*:?\s*([A-Z]{2})\s?(\d{2,4})\b/gi)) {
    found.push(`${m[1].toUpperCase()}${m[2]}`);
  }
  return found;
}

/** Flight numbers found near a "FLIGHT 1:"-style heading (e.g. "FLIGHT 1: SINGAPORE TO
 * MELBOURNE ... TR 58 [Scoot B787-9]") — common in airline e-tickets that don't use the literal
 * words "Flight Number". Scoped to a short window after each heading to avoid picking up an
 * unrelated code+number pair elsewhere in the document. */
function findHeadingFlightNumbers(text: string): string[] {
  const found: string[] = [];
  for (const m of text.matchAll(/FLIGHT\s*\d*\s*:.{0,80}?\b([A-Z]{2})\s?(\d{2,4})\b/gi)) {
    found.push(`${m[1].toUpperCase()}${m[2]}`);
  }
  return found;
}

/** Every parenthesized 3-letter airport code, in document order — e.g. "...(SIN)... (MEL)...".
 * Paired up sequentially (1st+2nd = leg 1, 3rd+4th = leg 2, ...), which matches how airline
 * confirmations consistently list departure then arrival for each flight. */
function findAirportCodeSequence(text: string): string[] {
  return [...text.matchAll(/\(([A-Z]{3})\)/g)].map((m) => m[1]);
}

/** Fallback for documents that write the route as plain text ("SIN -> MEL", "SIN to MEL")
 * rather than parenthesized codes. */
function findRoutesFromArrowPattern(text: string): { from: string; to: string }[] {
  const routes: { from: string; to: string }[] = [];
  for (const m of text.matchAll(/\b([A-Z]{3})\s*(?:→|->|-|to)\s*([A-Z]{3})\b/g)) {
    if (m[1] !== m[2]) routes.push({ from: m[1], to: m[2] });
  }
  return routes;
}

/** Departure/arrival "date time" pairs (e.g. "08 Oct 2026 02:30" then "08 Oct 2026 12:45"),
 * paired up the same way as airport codes — two per flight leg, in order. */
function findFlightDatetimeSequence(text: string): string[] {
  return [...text.matchAll(new RegExp(DATETIME_TOKEN, "gi"))].map((m) => m[0].trim());
}

function findFlights(text: string): ParsedFlightLeg[] {
  const flightNumbers = findLabeledFlightNumbers(text);
  // Real e-tickets often restate each "FLIGHT n:" heading a second time (e.g. in a separate
  // passenger/add-ons section) — dedupe by number so that doesn't produce a phantom extra leg.
  const numbers = [...new Set(flightNumbers.length ? flightNumbers : findHeadingFlightNumbers(text))];

  const codes = findAirportCodeSequence(text);
  const parenRoutes: { from: string; to: string }[] = [];
  for (let i = 0; i + 1 < codes.length; i += 2) {
    if (codes[i] !== codes[i + 1]) parenRoutes.push({ from: codes[i], to: codes[i + 1] });
  }
  const routes = parenRoutes.length ? parenRoutes : findRoutesFromArrowPattern(text);

  const datetimes = findFlightDatetimeSequence(text);

  const legCount = Math.min(Math.max(numbers.length, routes.length), 8);
  const flights: ParsedFlightLeg[] = [];
  for (let i = 0; i < legCount; i++) {
    const flightNumber = numbers[i] ?? null;
    const route = routes[i];
    if (!flightNumber && !route) continue;
    flights.push({
      airline: null,
      flightNumber,
      departureAirport: route?.from ?? null,
      arrivalAirport: route?.to ?? null,
      departureTime: datetimes[i * 2] ?? null,
      arrivalTime: datetimes[i * 2 + 1] ?? null,
    });
  }
  return flights;
}

function findTravelerCount(text: string): number | null {
  const m = text.match(/\b(\d+)\s*(?:adults?|passengers?|travele?rs?|guests?)\b/i);
  return m ? Number(m[1]) : null;
}

// Kept out of a captured name via a per-word lookahead (not post-hoc truncation): rejecting
// a whole match after the fact would still have let the regex engine consume that label text
// as part of the match, leaving nothing left over for the *next* occurrence to match against
// (e.g. two consecutive "Passenger Name: ..." entries — the label text of the second one would
// already be swallowed into the greedy capture of the first).
const LABEL_WORD_PATTERN =
  "(?:Name|Names|Number|Date|Total|Amount|Flight|Passengers?|Guests?|Travell?ers?|Departure|Arrival|Fare)";
const NAME_WORD = `(?!${LABEL_WORD_PATTERN}\\b)[A-Z][A-Za-z'-]+`;
const NAME_CAPTURE = `(${NAME_WORD}(?:\\s+${NAME_WORD}){0,3})`;

const TITLES = "MR|MRS|MS|MISS|DR|MSTR";

/** Two names are treated as the same person if they share at least 2 word-tokens, regardless
 * of order or case — catches e.g. "Eng Annabel Jing Wen" (flight manifest, surname first) and
 * "ANNABEL JING WEN ENG" (hotel guest field, same person, different order/case) being the same
 * traveler rather than two separate people. */
function dedupeSimilarNames(names: string[]): string[] {
  const kept: string[] = [];
  for (const name of names) {
    const tokens = new Set(name.toLowerCase().split(/\s+/));
    const isDuplicate = kept.some((existing) => {
      const existingTokens = new Set(existing.toLowerCase().split(/\s+/));
      let shared = 0;
      for (const t of tokens) if (existingTokens.has(t)) shared++;
      return shared >= 2;
    });
    if (!isDuplicate) kept.push(name);
  }
  return kept;
}

function findTravelerNames(text: string): string[] {
  const found: string[] = [];

  // "MR Loo Joel Choon Kiat" / "MS Eng Annabel Jing Wen" — the most common real-world pattern
  // (airline passenger manifests, numbered "1. MR ..." lists), independent of any "Name:" label.
  for (const m of text.matchAll(new RegExp(`\\b(?:${TITLES})\\.?\\s+${NAME_CAPTURE}`, "gi"))) {
    found.push(m[1].replace(/\s+/g, " ").trim());
  }

  // "Guest names ANNABEL JING WEN ENG" / "Passenger Name: ..." style labels.
  for (const m of text.matchAll(
    new RegExp(`(?:Passengers?\\s*Names?|Guests?\\s*Names?|Travell?ers?\\s*Names?)\\s*:?\\s*${NAME_CAPTURE}`, "gi")
  )) {
    found.push(m[1].replace(/\s+/g, " ").trim());
  }

  return dedupeSimilarNames(found).slice(0, 8);
}

/** Sums every distinct "Total"-style labeled amount found (case-insensitive: real documents
 * often use ALL CAPS). Distinct means by (currency, amount) — a document whose PDF happens to
 * repeat the same figure on more than one page (seen in real hotel vouchers, once as "S$" and
 * again as "SGD") only counts once, while genuinely different totals across several uploaded
 * documents (a flight receipt plus separate hotel bookings) are added together, matching the
 * "total across everything you uploaded" intent this field has always had. */
function findTotalCost(text: string): { amount: number; currency: string } | null {
  const pattern = new RegExp(
    `(?:Grand\\s*Total|Total\\s*Amount|Total\\s*Paid|Total\\s*Due|Fare\\s*Total|Total\\s*Transaction|Prepay\\s*Online|Total)\\s*:?\\s*(${CURRENCY_PATTERN})\\s?([\\d,]+\\.\\d{2})`,
    "gi"
  );
  const seen = new Set<string>();
  const byCurrency = new Map<string, number>();
  for (const m of text.matchAll(pattern)) {
    const currency = CURRENCY_SYMBOLS[m[1]] ?? m[1].toUpperCase();
    const amount = Number(m[2].replace(/,/g, ""));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const key = `${currency}|${amount}`;
    if (seen.has(key)) continue;
    seen.add(key);
    byCurrency.set(currency, (byCurrency.get(currency) ?? 0) + amount);
  }
  if (byCurrency.size === 0) return null;
  const [currency, amount] = [...byCurrency.entries()].sort((a, b) => b[1] - a[1])[0];
  return { amount, currency };
}

function guessDestination(text: string, routes: ParsedFlightLeg[]): string | null {
  for (const leg of routes) {
    const city = leg.arrivalAirport ? AIRPORT_CITIES[leg.arrivalAirport] : undefined;
    if (city) return city;
  }
  const labeled = text.match(/(?:Destination|Arriving\s*in)\s*:?\s*([A-Z][A-Za-z,\s]{2,40}?)(?:[.\n]|$)/i);
  return labeled ? labeled[1].trim() : null;
}

/** Regex/pattern-based extraction over already-extracted document text — no AI, no server call.
 * Necessarily rougher than AI extraction (especially destination and traveler names), but works
 * entirely offline for PDFs that have a real text layer. Calibrated against real airline
 * (Scoot-style "FLIGHT n:" headings) and hotel-booking-site voucher formats. */
export function parseTravelTextHeuristically(rawText: string): ParsedTravelDocument {
  const text = rawText.replace(/\s+/g, " ").trim();

  const dates = findDates(text);
  const flights = findFlights(text);
  const travelers = findTravelerCount(text);
  const travelerNames = findTravelerNames(text);
  const totalCost = findTotalCost(text);
  const destination = guessDestination(text, flights);

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
