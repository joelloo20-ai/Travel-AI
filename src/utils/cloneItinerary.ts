import { addDays } from "../services/itineraryGenerator";
import { newId } from "./format";
import type { ItineraryDay } from "../types";

/**
 * Deep-clones a static template itinerary with fresh ids (so multiple trips
 * started from the same template never collide) and fills in real dates
 * when a start date is provided.
 */
export function cloneItineraryWithFreshIds(itinerary: ItineraryDay[], startDate: string | null): ItineraryDay[] {
  return itinerary.map((day) => ({
    ...day,
    id: newId("day"),
    date: startDate ? addDays(startDate, day.dayNumber - 1) : null,
    activities: day.activities.map((activity) => ({ ...activity, id: newId("act") })),
  }));
}
