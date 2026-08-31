export type TripPace = "relaxed" | "balanced" | "packed";

export type InterestTag =
  | "food"
  | "culture"
  | "nature"
  | "nightlife"
  | "shopping"
  | "adventure"
  | "relaxation"
  | "family";

export interface Activity {
  id: string;
  time: string; // "09:00"
  title: string;
  description: string;
  category: InterestTag | "logistics";
  durationMins: number;
  estCost: number;
  location?: string;
}

export interface ItineraryDay {
  id: string;
  dayNumber: number;
  date: string | null; // ISO date, null if trip has no fixed dates yet
  title: string;
  activities: Activity[];
}

export type ExpenseCategory =
  | "flights"
  | "lodging"
  | "food"
  | "activities"
  | "transport"
  | "shopping"
  | "other";

export interface Expense {
  id: string;
  tripId: string;
  category: ExpenseCategory;
  label: string;
  amount: number;
  date: string; // ISO date
  note?: string;
}

export interface Trip {
  id: string;
  destination: string;
  coverImage: string;
  startDate: string | null;
  endDate: string | null;
  travelers: number;
  budget: number;
  pace: TripPace;
  interests: InterestTag[];
  itinerary: ItineraryDay[];
  createdAt: string;
  templateId?: string;
  status: "planning" | "upcoming" | "completed";
  itinerarySource?: "ai" | "template";
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  quickReplies?: string[];
  multiSelect?: boolean;
  createdAt: string;
}

export interface ItineraryTemplate {
  id: string;
  name: string;
  tagline: string;
  coverImage: string;
  days: number;
  pace: TripPace;
  interests: InterestTag[];
  suggestedDestinations: string[];
  budgetTier: "budget" | "mid" | "luxury";
}
