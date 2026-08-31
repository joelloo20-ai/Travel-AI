import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { addDays, generateItinerary, type GenerateItineraryParams } from "../src/services/itineraryGenerator";
import type { Activity, ItineraryDay } from "../src/types";
import { AiItinerarySchema, type AiItinerary } from "./itinerarySchema";

const MODEL = "claude-sonnet-5";

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export interface ItineraryResult {
  itinerary: ItineraryDay[];
  source: "ai" | "template";
  warning?: string;
}

function buildPrompt(params: GenerateItineraryParams): string {
  const { destination, days, pace, interests, budget, travelers } = params;
  const perDayPerPerson = budget > 0 ? Math.round(budget / Math.max(days, 1) / Math.max(travelers, 1)) : null;

  return `Plan a ${days}-day trip to ${destination} for ${travelers} traveler(s).

Trip pace: ${pace} (relaxed = 2-3 activities/day, balanced = 3-4, packed = 5-6).
Interests to prioritize, in order: ${interests.join(", ") || "no strong preference — pick a well-rounded mix"}.
${perDayPerPerson ? `Budget: roughly $${perDayPerPerson} per person per day across all activities.` : "No specific budget given — assume mid-range."}

Requirements:
- Day 1 must start with an "Arrival & check-in" activity (category "logistics", $0 cost) before anything else.
- If there is more than one day, the final day must end with a "Check-out & departure" activity (category "logistics", $0 cost).
- Every other activity must be a REAL, SPECIFIC recommendation for ${destination} — name actual neighborhoods, landmarks, restaurants, or venues where you can. Do not use generic placeholders like "local market" or "a museum" if you can name the real one.
- Spread activities logically through the day (morning/afternoon/evening) with sensible times and no overlaps, leaving realistic travel buffers.
- estCost is the total cost in USD for the whole travel party (not per person) for that single activity; use $0 for free activities.
- Vary activities across days — don't repeat the same idea twice.
- Match the requested pace and lean into the listed interests more than untagged ones.`;
}

function toItineraryDays(ai: AiItinerary, params: GenerateItineraryParams): ItineraryDay[] {
  const { destination, startDate } = params;
  let globalIdx = 0;

  return ai.days
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((day) => {
      const activities: Activity[] = day.activities.map((a) => ({
        id: `act-${globalIdx++}-${Math.random().toString(36).slice(2, 8)}`,
        time: a.time,
        title: a.title,
        description: a.description,
        category: a.category,
        durationMins: a.durationMins,
        estCost: a.estCost,
        location: a.location ?? destination,
      }));

      return {
        id: `day-${day.dayNumber}-${Math.random().toString(36).slice(2, 8)}`,
        dayNumber: day.dayNumber,
        date: startDate ? addDays(startDate, day.dayNumber - 1) : null,
        title: day.title,
        activities,
      } satisfies ItineraryDay;
    });
}

function fallback(params: GenerateItineraryParams, warning: string): ItineraryResult {
  return { itinerary: generateItinerary(params), source: "template", warning };
}

export async function buildItinerary(params: GenerateItineraryParams): Promise<ItineraryResult> {
  if (!client) {
    return fallback(params, "ANTHROPIC_API_KEY is not set on the server — showing a quick template instead of an AI-planned itinerary.");
  }

  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system:
        "You are a meticulous, well-traveled trip planner. You produce day-by-day itineraries with real, specific, well-regarded places — never generic filler. Respond only through the itinerary tool.",
      messages: [{ role: "user", content: buildPrompt(params) }],
      output_config: { format: zodOutputFormat(AiItinerarySchema) },
    });

    if (!response.parsed_output || response.parsed_output.days.length === 0) {
      return fallback(params, "The AI response could not be parsed — showing a quick template instead.");
    }

    return { itinerary: toItineraryDays(response.parsed_output, params), source: "ai" };
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("[itineraryService] Invalid ANTHROPIC_API_KEY:", err.message);
    } else if (err instanceof Anthropic.RateLimitError) {
      console.error("[itineraryService] Rate limited:", err.message);
    } else if (err instanceof Anthropic.APIError) {
      console.error(`[itineraryService] API error ${err.status}:`, err.message);
    } else {
      console.error("[itineraryService] Unexpected error:", err);
    }
    return fallback(params, "The AI planner is temporarily unavailable — showing a quick template instead.");
  }
}
