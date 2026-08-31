import { create } from "zustand";
import { persist } from "zustand/middleware";
import { syncItineraryToAppsScript } from "../services/appsScriptClient";
import type { Expense, ItineraryDay, Trip } from "../types";

interface TripStore {
  trips: Trip[];
  expenses: Expense[];

  addTrip: (trip: Trip) => void;
  updateTrip: (tripId: string, patch: Partial<Trip>) => void;
  deleteTrip: (tripId: string) => void;
  setItinerary: (tripId: string, itinerary: ItineraryDay[]) => void;
  updateDay: (tripId: string, dayId: string, patch: Partial<ItineraryDay>) => void;
  removeActivity: (tripId: string, dayId: string, activityId: string) => void;

  addExpense: (expense: Expense) => void;
  updateExpense: (expenseId: string, patch: Partial<Expense>) => void;
  removeExpense: (expenseId: string) => void;
  expensesForTrip: (tripId: string) => Expense[];
}

export const useTripStore = create<TripStore>()(
  persist(
    (set, get) => ({
      trips: [],
      expenses: [],

      addTrip: (trip) => {
        set((state) => ({ trips: [trip, ...state.trips] }));
        // Fire-and-forget: every trip-creation path (AI planner, template, curated
        // destination) funnels through here, so this is the one place that needs to
        // push the itinerary out to the shared sheet. Never blocks the UI or throws.
        void syncItineraryToAppsScript(trip);
      },

      updateTrip: (tripId, patch) =>
        set((state) => ({
          trips: state.trips.map((t) => (t.id === tripId ? { ...t, ...patch } : t)),
        })),

      deleteTrip: (tripId) =>
        set((state) => ({
          trips: state.trips.filter((t) => t.id !== tripId),
          expenses: state.expenses.filter((e) => e.tripId !== tripId),
        })),

      setItinerary: (tripId, itinerary) =>
        set((state) => ({
          trips: state.trips.map((t) => (t.id === tripId ? { ...t, itinerary } : t)),
        })),

      updateDay: (tripId, dayId, patch) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? { ...t, itinerary: t.itinerary.map((d) => (d.id === dayId ? { ...d, ...patch } : d)) }
              : t
          ),
        })),

      removeActivity: (tripId, dayId, activityId) =>
        set((state) => ({
          trips: state.trips.map((t) =>
            t.id === tripId
              ? {
                  ...t,
                  itinerary: t.itinerary.map((d) =>
                    d.id === dayId ? { ...d, activities: d.activities.filter((a) => a.id !== activityId) } : d
                  ),
                }
              : t
          ),
        })),

      addExpense: (expense) => set((state) => ({ expenses: [expense, ...state.expenses] })),

      updateExpense: (expenseId, patch) =>
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === expenseId ? { ...e, ...patch } : e)),
        })),

      removeExpense: (expenseId) =>
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== expenseId) })),

      expensesForTrip: (tripId) => get().expenses.filter((e) => e.tripId === tripId),
    }),
    { name: "wayfare-trips" }
  )
);
