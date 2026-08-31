import { z } from "zod";

/**
 * Runtime schema for the itinerary Claude generates. Kept separate from
 * src/types/index.ts (the hand-written app types) because Zod needs its own
 * literal definitions to validate/constrain model output — the two are
 * intentionally aligned field-for-field with the InterestTag/Activity/
 * ItineraryDay shapes in src/types.
 */
export const AiActivitySchema = z.object({
  time: z.string().describe("24-hour local time as HH:MM, e.g. \"09:00\""),
  title: z.string().describe("Short, specific activity name (not generic like 'Explore the city')"),
  description: z
    .string()
    .describe("1-2 sentences with concrete, real specifics for this destination — a named neighborhood, dish, or landmark, not a placeholder"),
  category: z.enum([
    "food",
    "culture",
    "nature",
    "nightlife",
    "shopping",
    "adventure",
    "relaxation",
    "family",
    "logistics",
  ]),
  durationMins: z.number().int().min(15).max(600),
  estCost: z.number().int().min(0).describe("Estimated total cost in USD for the whole travel party for this single activity"),
  location: z.string().optional().describe("Specific neighborhood, venue, or place name"),
});

export const AiDaySchema = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().describe("Short label for the day's theme, e.g. \"Old Town & Riverside Markets\""),
  activities: z.array(AiActivitySchema).min(1).max(8),
});

export const AiItinerarySchema = z.object({
  days: z.array(AiDaySchema),
});

export type AiItinerary = z.infer<typeof AiItinerarySchema>;
