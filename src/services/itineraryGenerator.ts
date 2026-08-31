import { ACTIVITY_POOL, ARRIVAL_ACTIVITY, DEPARTURE_ACTIVITY, type ActivityBlueprint } from "../data/activityPool";
import type { Activity, InterestTag, ItineraryDay, TripPace } from "../types";

export interface GenerateItineraryParams {
  destination: string;
  days: number;
  pace: TripPace;
  interests: InterestTag[];
  startDate: string | null;
  budget: number;
  travelers: number;
}

const PACE_ACTIVITY_COUNT: Record<TripPace, number> = {
  relaxed: 3,
  balanced: 4,
  packed: 6,
};

const START_HOUR: Record<TripPace, number> = {
  relaxed: 9,
  balanced: 8.5,
  packed: 8,
};

function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = Math.round(totalMinutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fillTemplate(text: string, destination: string): string {
  // Drop everything after a comma (e.g. "Kyoto, Japan" -> "Kyoto") so possessives
  // and mid-sentence mentions of the destination read naturally.
  const shortName = destination.split(",")[0].trim() || destination;
  return text.replaceAll("{destination}", shortName);
}

function costMultiplierFromBudget(budget: number, days: number, travelers: number): number {
  if (!budget || budget <= 0) return 1;
  const perDayPerPerson = budget / Math.max(days, 1) / Math.max(travelers, 1);
  // Reference: ~140/day/person maps to multiplier 1 (mid-tier)
  const multiplier = perDayPerPerson / 140;
  return Math.min(Math.max(multiplier, 0.5), 3);
}

function toActivity(
  blueprint: ActivityBlueprint,
  destination: string,
  time: string,
  costMultiplier: number,
  travelers: number,
  category: InterestTag | "logistics",
  idx: number
): Activity {
  const totalCost = Math.round((blueprint.baseCost * costMultiplier * travelers) / 5) * 5;
  return {
    id: `act-${idx}-${Math.random().toString(36).slice(2, 8)}`,
    time,
    title: fillTemplate(blueprint.title, destination),
    description: fillTemplate(blueprint.description, destination),
    category,
    durationMins: blueprint.durationMins,
    estCost: totalCost,
    location: destination,
  };
}

/**
 * Rule-based itinerary generator. This stands in for a live LLM call today —
 * it takes the same shape of input a prompt to Claude would, and returns
 * fully structured data. Swap the body of `generateItinerary` for a real
 * `services/aiClient.ts` call once an API key is wired up; callers don't change.
 */
export function generateItinerary(params: GenerateItineraryParams): ItineraryDay[] {
  const { destination, days, pace, startDate, travelers, budget } = params;
  const interests = params.interests.length > 0 ? params.interests : (["culture", "food"] as InterestTag[]);
  const costMultiplier = costMultiplierFromBudget(budget, days, travelers);
  const usageIndex = new Map<InterestTag, number>();
  let globalIdx = 0;

  const nextBlueprint = (interest: InterestTag): ActivityBlueprint => {
    const pool = ACTIVITY_POOL[interest];
    const i = usageIndex.get(interest) ?? 0;
    usageIndex.set(interest, i + 1);
    return pool[i % pool.length];
  };

  const result: ItineraryDay[] = [];

  for (let dayNum = 1; dayNum <= days; dayNum++) {
    const isFirstDay = dayNum === 1;
    const isLastDay = dayNum === days && days > 1;
    const activities: Activity[] = [];
    let cursorMinutes = START_HOUR[pace] * 60;

    if (isFirstDay) {
      activities.push(toActivity(ARRIVAL_ACTIVITY, destination, minutesToTime(cursorMinutes), costMultiplier, travelers, "logistics", globalIdx++));
      cursorMinutes += ARRIVAL_ACTIVITY.durationMins + 30;
    }

    const targetCount = isFirstDay || isLastDay ? Math.max(PACE_ACTIVITY_COUNT[pace] - 1, 2) : PACE_ACTIVITY_COUNT[pace];

    if (isLastDay) {
      // Light morning activity, then departure
      const interest = interests[dayNum % interests.length];
      const blueprint = nextBlueprint(interest);
      activities.push(toActivity(blueprint, destination, minutesToTime(cursorMinutes), costMultiplier, travelers, interest, globalIdx++));
      cursorMinutes += blueprint.durationMins + 30;
      activities.push(toActivity(DEPARTURE_ACTIVITY, destination, minutesToTime(cursorMinutes), costMultiplier, travelers, "logistics", globalIdx++));
    } else {
      for (let i = 0; i < targetCount; i++) {
        const interest = interests[(dayNum + i) % interests.length];
        const blueprint = nextBlueprint(interest);
        activities.push(toActivity(blueprint, destination, minutesToTime(cursorMinutes), costMultiplier, travelers, interest, globalIdx++));
        cursorMinutes += blueprint.durationMins + 30;
      }
    }

    const title = isFirstDay
      ? `Arrival in ${destination}`
      : isLastDay
        ? `Farewell to ${destination}`
        : `Day ${dayNum} in ${destination}`;

    result.push({
      id: `day-${dayNum}-${Math.random().toString(36).slice(2, 8)}`,
      dayNumber: dayNum,
      date: startDate ? addDays(startDate, dayNum - 1) : null,
      title,
      activities,
    });
  }

  return result;
}

export function estimateTripCost(itinerary: ItineraryDay[]): number {
  return itinerary.reduce((sum, day) => sum + day.activities.reduce((s, a) => s + a.estCost, 0), 0);
}
