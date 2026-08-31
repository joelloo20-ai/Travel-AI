import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Cloud, CloudOff, Sparkles, Users } from "lucide-react";
import clsx from "clsx";
import { useTripStore } from "../store/useTripStore";
import { DayCard } from "../components/itinerary/DayCard";
import { DailyLog } from "../components/expenses/DailyLog";
import { BudgetSummary } from "../components/expenses/BudgetSummary";
import { estimateTripCost } from "../services/itineraryGenerator";
import { getSheetsStatus, syncExpenseToSheet } from "../services/sheetsClient";
import { formatCurrency, formatDateRange } from "../utils/format";
import type { Expense, Trip } from "../types";

const TABS = ["Itinerary", "Daily Log"] as const;

export function TripDetailPage() {
  const { tripId } = useParams();
  const trip = useTripStore((s) => s.trips.find((t) => t.id === tripId));
  const removeActivity = useTripStore((s) => s.removeActivity);
  const updateTrip = useTripStore((s) => s.updateTrip);
  const addExpense = useTripStore((s) => s.addExpense);
  const removeExpense = useTripStore((s) => s.removeExpense);
  const updateExpense = useTripStore((s) => s.updateExpense);
  const allExpenses = useTripStore((s) => s.expenses);
  const expenses = useMemo(() => (tripId ? allExpenses.filter((e) => e.tripId === tripId) : []), [allExpenses, tripId]);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Itinerary");
  const [sheetsOn, setSheetsOn] = useState<boolean | null>(null);

  useEffect(() => {
    getSheetsStatus().then(setSheetsOn);
  }, []);

  const handleAddExpense = (expense: Expense) => {
    addExpense(expense);
    if (sheetsOn) {
      syncExpenseToSheet(expense, trip?.destination ?? "").then((ok) => {
        if (ok) updateExpense(expense.id, { syncedToSheets: true });
      });
    }
  };

  if (!tripId || !trip) return <Navigate to="/trips" replace />;

  const estimatedCost = estimateTripCost(trip.itinerary);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link to="/trips" className="mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft size={15} />
        All trips
      </Link>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft">
        <div className="relative h-44 sm:h-56">
          <img src={trip.coverImage} alt={trip.destination} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900/70 via-ink-900/10 to-transparent" />
          <div className="absolute bottom-4 left-5 text-white">
            <h1 className="font-display text-2xl font-medium sm:text-3xl">{trip.destination}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-white/90">
              <span className="flex items-center gap-1">
                <CalendarDays size={14} />
                {formatDateRange(trip.startDate, trip.endDate)}
              </span>
              <span className="flex items-center gap-1">
                <Users size={14} />
                {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <select
            value={trip.status}
            onChange={(e) => updateTrip(trip.id, { status: e.target.value as Trip["status"] })}
            className="absolute right-4 top-4 rounded-full border-none bg-white/90 px-3 py-1.5 text-xs font-semibold capitalize text-ink-800 outline-none"
          >
            <option value="planning">Planning</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-ink-100 px-5 py-3 text-sm text-ink-500">
          <span>
            <strong className="text-ink-800">{trip.itinerary.length}</strong> days
          </span>
          <span className="capitalize">
            <strong className="text-ink-800">{trip.pace}</strong> pace
          </span>
          <span>
            Est. itinerary cost <strong className="text-ink-800">{formatCurrency(estimatedCost)}</strong>
          </span>
          {trip.budget > 0 && (
            <span>
              Budget <strong className="text-ink-800">{formatCurrency(trip.budget)}</strong>
            </span>
          )}
          {trip.itinerarySource === "ai" && (
            <span className="flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-600">
              <Sparkles size={11} />
              AI-planned
            </span>
          )}
          {trip.itinerarySource === "curated" && (
            <span className="flex items-center gap-1 rounded-full bg-coral-500/10 px-2 py-0.5 text-xs font-semibold text-coral-600">
              <Sparkles size={11} />
              Curated itinerary
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1 px-5 pt-3">
          <div className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  tab === t ? "bg-ink-800 text-white" : "text-ink-500 hover:bg-ink-50"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === "Daily Log" && sheetsOn !== null && (
            <span
              title={sheetsOn ? "New expenses sync to your Google Sheet automatically" : "Google Sheets sync isn't configured on the server"}
              className={clsx(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                sheetsOn ? "bg-teal-500/10 text-teal-600" : "bg-ink-100 text-ink-400"
              )}
            >
              {sheetsOn ? <Cloud size={12} /> : <CloudOff size={12} />}
              {sheetsOn ? "Sheets sync on" : "Sheets not connected"}
            </span>
          )}
        </div>

        <div className="overflow-hidden p-5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === "Daily Log" ? 12 : -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === "Daily Log" ? -12 : 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {tab === "Itinerary" ? (
                <div className="space-y-4">
                  {trip.itinerary.map((day) => (
                    <DayCard key={day.id} day={day} onRemoveActivity={(activityId) => removeActivity(trip.id, day.id, activityId)} />
                  ))}
                </div>
              ) : (
                <div className="space-y-5">
                  <BudgetSummary budget={trip.budget} expenses={expenses} />
                  <DailyLog trip={trip} expenses={expenses} onAdd={handleAddExpense} onRemove={removeExpense} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
