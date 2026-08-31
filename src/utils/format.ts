export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unrecognized/invalid currency code (e.g. a typo from manual entry) — fall back to a plain label.
    return `${currency} ${Math.round(amount).toLocaleString("en-US")}`;
  }
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return "Dates not set";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = new Date(start + "T00:00:00").toLocaleDateString("en-US", opts);
  if (!end) return startStr;
  const endStr = new Date(end + "T00:00:00").toLocaleDateString("en-US", opts);
  return `${startStr} – ${endStr}`;
}

export function formatDay(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
