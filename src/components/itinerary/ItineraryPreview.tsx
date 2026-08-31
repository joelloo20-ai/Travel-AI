import { Compass, MapPin } from "lucide-react";
import { DayCard } from "./DayCard";
import { estimateTripCost } from "../../services/itineraryGenerator";
import { formatCurrency } from "../../utils/format";
import type { ItineraryDay } from "../../types";

export function ItineraryPreview({
  destination,
  itinerary,
  onSave,
  saved,
}: {
  destination: string;
  itinerary: ItineraryDay[] | null;
  onSave: () => void;
  saved: boolean;
}) {
  if (!itinerary) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-50 text-coral-500">
          <MapPin size={24} />
        </span>
        <h3 className="font-display text-xl font-medium text-ink-800">Your itinerary builds here</h3>
        <p className="max-w-xs text-sm text-ink-400">
          Answer a few questions in the chat and I'll draft a day-by-day plan you can edit and save.
        </p>
      </div>
    );
  }

  const total = estimateTripCost(itinerary);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-100 bg-white/70 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-coral-600">Draft itinerary</p>
            <h2 className="font-display text-xl font-medium text-ink-900">{destination}</h2>
            <p className="text-xs text-ink-400">
              {itinerary.length} days · est. {formatCurrency(total)} total
            </p>
          </div>
          <button
            onClick={onSave}
            disabled={saved}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Compass size={14} />
            {saved ? "Saved to trips" : "Save trip"}
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
        {itinerary.map((day) => (
          <DayCard key={day.id} day={day} />
        ))}
      </div>
    </div>
  );
}
