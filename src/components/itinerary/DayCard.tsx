import { ActivityCard } from "./ActivityCard";
import { formatCurrency } from "../../utils/format";
import { formatDay } from "../../utils/format";
import type { ItineraryDay } from "../../types";

export function DayCard({
  day,
  onRemoveActivity,
}: {
  day: ItineraryDay;
  onRemoveActivity?: (activityId: string) => void;
}) {
  const dayTotal = day.activities.reduce((sum, a) => sum + a.estCost, 0);

  return (
    <div className="animate-fade-up rounded-2xl border border-ink-100 bg-cream-100/60 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Day {day.dayNumber}</span>
          <h3 className="font-display text-lg font-medium text-ink-900">{day.title}</h3>
          {day.date && <p className="text-xs text-ink-400">{formatDay(day.date)}</p>}
        </div>
        {dayTotal > 0 && <span className="text-xs font-medium text-ink-500">~{formatCurrency(dayTotal)}</span>}
      </div>
      <div className="space-y-2">
        {day.activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onRemove={onRemoveActivity ? () => onRemoveActivity(activity.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
