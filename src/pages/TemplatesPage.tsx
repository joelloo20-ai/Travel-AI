import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { TEMPLATES } from "../data/templates";
import { DESTINATION_TEMPLATES, type DestinationTemplate } from "../data/destinationTemplates";
import { requestItinerary } from "../services/itineraryClient";
import { useTripStore } from "../store/useTripStore";
import { newId } from "../utils/format";
import { cloneItineraryWithFreshIds } from "../utils/cloneItinerary";
import { PullToRefresh } from "../components/layout/PullToRefresh";
import { DestinationCard } from "../components/templates/DestinationCard";
import { StartDestinationModal } from "../components/templates/StartDestinationModal";
import type { ItineraryTemplate, Trip } from "../types";

const BUDGET_TIER_PER_DAY: Record<ItineraryTemplate["budgetTier"], number> = {
  budget: 70,
  mid: 150,
  luxury: 400,
};

export function TemplatesPage() {
  const addTrip = useTripStore((s) => s.addTrip);
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState<ItineraryTemplate | null>(null);
  const [activeDestination, setActiveDestination] = useState<DestinationTemplate | null>(null);
  const [destination, setDestination] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startFromTemplate = async () => {
    if (!activeTemplate || !destination.trim() || isBuilding) return;
    setIsBuilding(true);
    setError(null);
    const budget = BUDGET_TIER_PER_DAY[activeTemplate.budgetTier] * activeTemplate.days * 2;

    try {
      const { itinerary, source } = await requestItinerary({
        destination: destination.trim(),
        days: activeTemplate.days,
        pace: activeTemplate.pace,
        interests: activeTemplate.interests,
        startDate: null,
        budget,
        travelers: 2,
      });
      const trip: Trip = {
        id: newId("trip"),
        destination: destination.trim(),
        coverImage: activeTemplate.coverImage,
        startDate: null,
        endDate: null,
        travelers: 2,
        budget,
        pace: activeTemplate.pace,
        interests: activeTemplate.interests,
        itinerary,
        createdAt: new Date().toISOString(),
        templateId: activeTemplate.id,
        status: "planning",
        itinerarySource: source,
      };
      addTrip(trip);
      navigate(`/trips/${trip.id}`);
    } catch {
      setError("Couldn't reach the planning service. Please try again.");
      setIsBuilding(false);
    }
  };

  const startFromDestination = (opts: { startDate: string | null; travelers: number }) => {
    if (!activeDestination) return;
    const itinerary = cloneItineraryWithFreshIds(activeDestination.itinerary, opts.startDate);
    const trip: Trip = {
      id: newId("trip"),
      destination: activeDestination.destination,
      coverImage: activeDestination.coverImage,
      startDate: opts.startDate,
      endDate: opts.startDate ? itinerary[itinerary.length - 1].date : null,
      travelers: opts.travelers,
      budget: activeDestination.avgDailyBudget * activeDestination.days * opts.travelers,
      pace: activeDestination.pace,
      interests: activeDestination.interests,
      itinerary,
      createdAt: new Date().toISOString(),
      templateId: activeDestination.id,
      status: "planning",
      itinerarySource: "curated",
    };
    addTrip(trip);
    setActiveDestination(null);
    navigate(`/trips/${trip.id}`);
  };

  const handleRefresh = async () => {
    await new Promise((r) => setTimeout(r, 500));
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <h1 className="font-display text-2xl font-medium text-ink-900 sm:text-3xl">Popular Destinations</h1>
          <p className="mt-1 text-sm text-ink-400">Curated, up-to-date itineraries for the trips everyone's taking right now.</p>
        </motion.div>

        <div className="-mx-4 mb-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          {DESTINATION_TEMPLATES.map((tpl, i) => (
            <DestinationCard key={tpl.id} template={tpl} index={i} onSelect={() => setActiveDestination(tpl)} />
          ))}
        </div>

        <div className="mb-6">
          <h2 className="font-display text-xl font-medium text-ink-900">Trip Styles</h2>
          <p className="mt-1 text-sm text-ink-400">Start from a ready-made trip shape, then tell us where you're going.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((tpl, i) => (
            <motion.button
              key={tpl.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              whileHover={{ y: -3 }}
              onClick={() => {
                setActiveTemplate(tpl);
                setError(null);
              }}
              className="group overflow-hidden rounded-2xl border border-ink-100 bg-white text-left shadow-soft transition-shadow hover:shadow-lift"
            >
              <div className="h-32 overflow-hidden">
                <img
                  src={tpl.coverImage}
                  alt={tpl.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg font-medium text-ink-900">{tpl.name}</h3>
                <p className="mt-1 text-sm text-ink-400">{tpl.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tpl.interests.map((i2) => (
                    <span key={i2} className="rounded-full bg-coral-50 px-2 py-0.5 text-xs font-medium capitalize text-coral-700">
                      {i2}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                  <span>{tpl.days} days · {tpl.pace} pace</span>
                  <span className="flex items-center gap-1 font-semibold text-coral-600">
                    Use template <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <StartDestinationModal template={activeDestination} onClose={() => setActiveDestination(null)} onConfirm={startFromDestination} />

      {activeTemplate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/40 p-4" onClick={() => setActiveTemplate(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-coral-50 text-coral-500">
              <Sparkles size={18} />
            </span>
            <h3 className="mt-3 font-display text-xl font-medium text-ink-900">{activeTemplate.name}</h3>
            <p className="mt-1 text-sm text-ink-400">
              Suggested for: {activeTemplate.suggestedDestinations.join(", ")}
            </p>
            <label className="mt-4 block text-sm font-medium text-ink-700">Where are you going?</label>
            <input
              autoFocus
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startFromTemplate()}
              placeholder="e.g. Lisbon, Portugal"
              disabled={isBuilding}
              className="mt-1.5 w-full rounded-lg border border-ink-100 bg-cream-50 px-3 py-2 text-sm text-ink-800 outline-none focus:border-coral-300 disabled:opacity-60"
            />
            {error && <p className="mt-2 text-xs text-coral-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setActiveTemplate(null)}
                disabled={isBuilding}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={startFromTemplate}
                disabled={!destination.trim() || isBuilding}
                className="flex items-center gap-1.5 rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
              >
                {isBuilding && <Loader2 size={14} className="animate-spin" />}
                {isBuilding ? "Planning..." : "Build itinerary"}
              </button>
            </div>
          </div>
        </div>
      )}
    </PullToRefresh>
  );
}
