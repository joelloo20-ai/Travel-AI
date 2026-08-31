import { Link } from "react-router-dom";
import clsx from "clsx";
import { CalendarDays, Users } from "lucide-react";
import { formatCurrency, formatDateRange } from "../../utils/format";
import type { Trip } from "../../types";

const STATUS_STYLE: Record<Trip["status"], string> = {
  planning: "bg-amber-100 text-amber-700",
  upcoming: "bg-teal-100 text-teal-700",
  completed: "bg-ink-100 text-ink-500",
};

export function TripCard({ trip }: { trip: Trip }) {
  const total = trip.itinerary.reduce((sum, d) => sum + d.activities.reduce((s, a) => s + a.estCost, 0), 0);

  return (
    <Link
      to={`/trips/${trip.id}`}
      className="group overflow-hidden rounded-2xl border border-ink-100/80 bg-white shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lift"
    >
      <div className="relative h-36 overflow-hidden">
        <img
          src={trip.coverImage}
          alt={trip.destination}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <span
          className={clsx(
            "absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
            STATUS_STYLE[trip.status]
          )}
        >
          {trip.status}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-medium text-ink-900">{trip.destination}</h3>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-400">
          <span className="flex items-center gap-1">
            <CalendarDays size={13} />
            {formatDateRange(trip.startDate, trip.endDate)}
          </span>
          <span className="flex items-center gap-1">
            <Users size={13} />
            {trip.travelers}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3 text-sm">
          <span className="text-ink-400">{trip.itinerary.length} days planned</span>
          <span className="font-semibold text-ink-800">~{formatCurrency(total)}</span>
        </div>
      </div>
    </Link>
  );
}
