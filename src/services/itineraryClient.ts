import { generateItinerary, type GenerateItineraryParams } from "./itineraryGenerator";
import type { ItineraryDay } from "../types";

export interface ItineraryResponse {
  itinerary: ItineraryDay[];
  source: "ai" | "template";
  warning?: string;
}

/**
 * Asks the server to build an itinerary with Claude. The server holds the
 * API key and falls back to the local rule-based generator (with a
 * `warning`) if no key is configured or the request fails.
 *
 * On a static-only deployment (e.g. GitHub Pages) there is no server to
 * reach at all, so a missing/unreachable /api/itinerary route also falls
 * back to running the same rule-based generator directly in the browser,
 * rather than surfacing a network error to the user.
 */
export async function requestItinerary(params: GenerateItineraryParams): Promise<ItineraryResponse> {
  try {
    const res = await fetch("/api/itinerary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Itinerary request failed (${res.status})`);
    }

    return await res.json();
  } catch {
    return {
      itinerary: generateItinerary(params),
      source: "template",
      warning: "AI planning isn't available on this deployment — showing a quick template instead.",
    };
  }
}
