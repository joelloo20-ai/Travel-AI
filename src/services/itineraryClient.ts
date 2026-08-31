import type { ItineraryDay } from "../types";
import type { GenerateItineraryParams } from "./itineraryGenerator";

export interface ItineraryResponse {
  itinerary: ItineraryDay[];
  source: "ai" | "template";
  warning?: string;
}

/**
 * Asks the server to build an itinerary with Claude. The server holds the
 * API key and falls back to the local rule-based generator (with a
 * `warning`) if no key is configured or the request fails, so this never
 * throws for that case — only for network/parsing failures.
 */
export async function requestItinerary(params: GenerateItineraryParams): Promise<ItineraryResponse> {
  const res = await fetch("/api/itinerary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Itinerary request failed (${res.status})`);
  }

  return res.json();
}
