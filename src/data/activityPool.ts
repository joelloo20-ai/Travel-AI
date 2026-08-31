import type { InterestTag } from "../types";

export interface ActivityBlueprint {
  title: string;
  description: string;
  durationMins: number;
  baseCost: number; // per person, mid-tier baseline; scaled by budget tier
  slot: "morning" | "afternoon" | "evening";
}

/**
 * Generic, destination-agnostic activity blueprints grouped by interest.
 * The generator drops these into a day plan and fills in the destination
 * name, so the same pool produces a sensibly different-looking itinerary
 * for any city without needing a live places API.
 */
export const ACTIVITY_POOL: Record<InterestTag, ActivityBlueprint[]> = {
  food: [
    { title: "Local market food crawl", description: "Wander {destination}'s central market, sampling street food and regional specialties.", durationMins: 120, baseCost: 25, slot: "morning" },
    { title: "Signature dish lunch", description: "Sit-down lunch at a spot known for {destination}'s signature dish.", durationMins: 90, baseCost: 30, slot: "afternoon" },
    { title: "Chef's table dinner", description: "Multi-course dinner showcasing modern takes on local cuisine.", durationMins: 120, baseCost: 65, slot: "evening" },
    { title: "Coffee & pastry stop", description: "Slow morning at a well-loved local café.", durationMins: 60, baseCost: 12, slot: "morning" },
    { title: "Cooking class", description: "Hands-on class learning to cook a classic dish from the region.", durationMins: 150, baseCost: 55, slot: "afternoon" },
    { title: "Rooftop drinks & small plates", description: "Sunset drinks and shared plates with a view over {destination}.", durationMins: 120, baseCost: 40, slot: "evening" },
  ],
  culture: [
    { title: "Old town walking tour", description: "Guided or self-paced walk through {destination}'s historic core.", durationMins: 150, baseCost: 20, slot: "morning" },
    { title: "Flagship museum visit", description: "Explore the city's most notable museum or gallery.", durationMins: 120, baseCost: 18, slot: "afternoon" },
    { title: "Landmark & architecture tour", description: "Visit the defining landmark(s) of {destination}.", durationMins: 100, baseCost: 15, slot: "morning" },
    { title: "Local craft workshop", description: "Try a traditional craft taught by a local artisan.", durationMins: 120, baseCost: 35, slot: "afternoon" },
    { title: "Evening cultural show", description: "Live music, dance, or theater rooted in local tradition.", durationMins: 110, baseCost: 30, slot: "evening" },
    { title: "Neighborhood heritage walk", description: "Slower walk through a lesser-visited historic neighborhood.", durationMins: 100, baseCost: 10, slot: "afternoon" },
  ],
  nature: [
    { title: "Sunrise viewpoint hike", description: "Short hike to a viewpoint overlooking {destination}.", durationMins: 120, baseCost: 5, slot: "morning" },
    { title: "Botanical garden or park stroll", description: "Relaxed walk through the city's greenest spaces.", durationMins: 90, baseCost: 8, slot: "morning" },
    { title: "Day trip to nearby nature reserve", description: "Half-day excursion to a scenic natural area near {destination}.", durationMins: 240, baseCost: 45, slot: "afternoon" },
    { title: "Waterfront or beach walk", description: "Unwind along the water as the day cools down.", durationMins: 90, baseCost: 0, slot: "evening" },
    { title: "Bike ride along the coast/river", description: "Rent a bike and explore {destination}'s waterfront route.", durationMins: 120, baseCost: 20, slot: "afternoon" },
  ],
  nightlife: [
    { title: "Live music bar hop", description: "Tour a few bars known for live local music.", durationMins: 150, baseCost: 35, slot: "evening" },
    { title: "Rooftop bar sunset", description: "Cocktails with a skyline view as the sun sets.", durationMins: 90, baseCost: 30, slot: "evening" },
    { title: "Night market", description: "Browse stalls, snacks, and street performers after dark.", durationMins: 120, baseCost: 20, slot: "evening" },
    { title: "Late-night club or lounge", description: "Dance or unwind at a well-reviewed local nightspot.", durationMins: 150, baseCost: 40, slot: "evening" },
  ],
  shopping: [
    { title: "Design district browsing", description: "Independent boutiques and local designers.", durationMins: 120, baseCost: 0, slot: "afternoon" },
    { title: "Artisan market", description: "Handmade goods and souvenirs directly from makers.", durationMins: 90, baseCost: 30, slot: "morning" },
    { title: "Flagship shopping street", description: "The main retail strip, from high street to local brands.", durationMins: 120, baseCost: 0, slot: "afternoon" },
    { title: "Vintage & flea market", description: "Dig for one-of-a-kind finds at a weekend market.", durationMins: 90, baseCost: 15, slot: "morning" },
  ],
  adventure: [
    { title: "Guided adventure excursion", description: "Half-day adrenaline activity suited to {destination}'s terrain (climbing, rafting, or similar).", durationMins: 240, baseCost: 80, slot: "morning" },
    { title: "Watersports session", description: "Try a local watersport — kayaking, surfing, or snorkeling.", durationMins: 150, baseCost: 55, slot: "afternoon" },
    { title: "Off-the-beaten-path exploration", description: "Venture beyond the tourist center with a local guide.", durationMins: 180, baseCost: 40, slot: "afternoon" },
    { title: "Sunset paragliding or boat trip", description: "A high-energy way to close the day.", durationMins: 120, baseCost: 90, slot: "evening" },
  ],
  relaxation: [
    { title: "Spa & wellness morning", description: "Massage or thermal bath session to reset.", durationMins: 120, baseCost: 60, slot: "morning" },
    { title: "Slow café + people-watching", description: "No agenda — just a good seat and a good drink.", durationMins: 90, baseCost: 10, slot: "afternoon" },
    { title: "Beach or poolside lounging", description: "A full block of unscheduled downtime.", durationMins: 180, baseCost: 15, slot: "afternoon" },
    { title: "Sunset yoga or meditation", description: "Guided or self-led session at a scenic spot.", durationMins: 60, baseCost: 15, slot: "evening" },
  ],
  family: [
    { title: "Interactive science or kids' museum", description: "Hands-on exhibits that work for all ages.", durationMins: 120, baseCost: 20, slot: "morning" },
    { title: "Family-friendly park or zoo", description: "Wide-open space with something for every age.", durationMins: 150, baseCost: 25, slot: "afternoon" },
    { title: "Easy-going boat or tram tour", description: "A low-effort way to see the highlights together.", durationMins: 90, baseCost: 20, slot: "morning" },
    { title: "Casual dinner + game night", description: "Kid-friendly restaurant followed by downtime at the stay.", durationMins: 120, baseCost: 30, slot: "evening" },
  ],
};

export const ARRIVAL_ACTIVITY: ActivityBlueprint = {
  title: "Arrival & check-in",
  description: "Land in {destination}, settle into your stay, and get oriented.",
  durationMins: 90,
  baseCost: 0,
  slot: "morning",
};

export const DEPARTURE_ACTIVITY: ActivityBlueprint = {
  title: "Check-out & departure",
  description: "Pack up and head to the airport/station — buffer in extra time for traffic.",
  durationMins: 90,
  baseCost: 0,
  slot: "morning",
};
