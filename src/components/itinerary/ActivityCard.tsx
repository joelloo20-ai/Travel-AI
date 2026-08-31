import { X } from "lucide-react";
import { CATEGORY_META } from "./categoryMeta";
import { formatCurrency } from "../../utils/format";
import type { Activity } from "../../types";

export function ActivityCard({ activity, onRemove }: { activity: Activity; onRemove?: () => void }) {
  const meta = CATEGORY_META[activity.category];
  const Icon = meta.icon;

  return (
    <div className="group flex gap-3 rounded-xl border border-ink-100 bg-white p-3 transition-shadow hover:shadow-soft">
      <div className="flex w-14 shrink-0 flex-col items-center pt-0.5">
        <span className="text-xs font-semibold text-ink-500">{activity.time}</span>
      </div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-ink-800">{activity.title}</p>
          {onRemove && (
            <button
              onClick={onRemove}
              aria-label="Remove activity"
              className="shrink-0 rounded-full p-1 text-ink-400 opacity-0 transition-opacity hover:bg-ink-50 hover:text-ink-700 group-hover:opacity-100"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-400">{activity.description}</p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-400">
          <span>{activity.durationMins >= 60 ? `${Math.round(activity.durationMins / 60)}h` : `${activity.durationMins}m`}</span>
          {activity.estCost > 0 && <span className="font-medium text-ink-600">{formatCurrency(activity.estCost)}</span>}
        </div>
      </div>
    </div>
  );
}
