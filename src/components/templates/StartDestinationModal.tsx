import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import type { DestinationTemplate } from "../../data/destinationTemplates";

export function StartDestinationModal({
  template,
  onClose,
  onConfirm,
}: {
  template: DestinationTemplate | null;
  onClose: () => void;
  onConfirm: (opts: { startDate: string | null; travelers: number }) => void;
}) {
  const [startDate, setStartDate] = useState("");
  const [travelers, setTravelers] = useState(2);

  return (
    <AnimatePresence>
      {template && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-28">
              <img src={template.coverImage} alt={template.destination} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-ink-900/40" />
              <div className="absolute bottom-3 left-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/80">{template.country}</p>
                <h3 className="font-display text-xl font-medium">{template.destination}</h3>
              </div>
            </div>
            <div className="p-5">
              <p className="flex items-center gap-1.5 text-xs text-ink-400">
                <MapPin size={12} />
                {template.days}-day curated itinerary, ready to go
              </p>

              <label className="mt-4 block text-sm font-medium text-ink-700">When are you going? (optional)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-ink-100 bg-cream-50 px-3 py-2 text-sm text-ink-800 outline-none focus:border-coral-300"
              />

              <label className="mt-4 block text-sm font-medium text-ink-700">Travelers</label>
              <div className="mt-1.5 flex items-center gap-3">
                <button
                  onClick={() => setTravelers((t) => Math.max(1, t - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 text-ink-600 hover:bg-ink-50"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold text-ink-800">{travelers}</span>
                <button
                  onClick={() => setTravelers((t) => Math.min(12, t + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 text-ink-600 hover:bg-ink-50"
                >
                  +
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50">
                  Cancel
                </button>
                <button
                  onClick={() => onConfirm({ startDate: startDate || null, travelers })}
                  className="rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Start trip
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
