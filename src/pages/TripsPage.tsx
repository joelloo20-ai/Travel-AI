import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useTripStore } from "../store/useTripStore";
import { TripCard } from "../components/trips/TripCard";

export function TripsPage() {
  const trips = useTripStore((s) => s.trips);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-medium text-ink-900 sm:text-3xl">My Trips</h1>
          <p className="mt-1 text-sm text-ink-400">Every itinerary you've saved, all in one place.</p>
        </div>
        <Link
          to="/"
          className="flex items-center gap-1.5 rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:opacity-90"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Plan a trip</span>
        </Link>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-white/60 py-20 text-center">
          <p className="font-display text-lg text-ink-700">No trips saved yet</p>
          <p className="max-w-sm text-sm text-ink-400">
            Chat with your AI planning assistant or start from a template to build your first itinerary.
          </p>
          <div className="mt-2 flex gap-2">
            <Link to="/" className="rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Start planning
            </Link>
            <Link
              to="/templates"
              className="rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
            >
              Browse templates
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
