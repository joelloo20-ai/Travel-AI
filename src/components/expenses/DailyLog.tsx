import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { CATEGORY_META } from "../itinerary/categoryMeta";
import { ExpenseList } from "./ExpenseList";
import { AddExpenseModal } from "./AddExpenseModal";
import { formatCurrency, formatDay } from "../../utils/format";
import type { Expense, ItineraryDay, Trip } from "../../types";

function DayLogCard({
  day,
  expenses,
  onAdd,
  onRemove,
}: {
  day: ItineraryDay;
  expenses: Expense[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  const dayTotal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-ink-100 bg-white p-4"
    >
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Day {day.dayNumber}</span>
          <h3 className="font-display text-lg font-medium text-ink-900">{day.title}</h3>
          {day.date && <p className="text-xs text-ink-400">{formatDay(day.date)}</p>}
        </div>
        {dayTotal > 0 && <span className="text-sm font-semibold text-ink-700">{formatCurrency(dayTotal)}</span>}
      </div>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {day.activities.map((a) => {
          const meta = CATEGORY_META[a.category];
          const Icon = meta.icon;
          return (
            <span
              key={a.id}
              title={a.title}
              className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${meta.bg} ${meta.color}`}
            >
              <Icon size={11} />
              {a.title.length > 20 ? `${a.title.slice(0, 20)}…` : a.title}
            </span>
          );
        })}
      </div>

      <ExpenseList expenses={expenses} onRemove={onRemove} />

      <button
        onClick={onAdd}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-200 py-2.5 text-sm font-medium text-ink-500 hover:border-blue-300 hover:text-blue-600"
      >
        <Plus size={15} />
        Add expense for Day {day.dayNumber}
      </button>
    </motion.div>
  );
}

export function DailyLog({
  trip,
  expenses,
  onAdd,
  onRemove,
}: {
  trip: Trip;
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onRemove: (id: string) => void;
}) {
  const [modalDay, setModalDay] = useState<number | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  const unassigned = expenses.filter((e) => e.dayNumber == null);

  const openFor = (dayNumber: number | undefined) => {
    setModalDay(dayNumber);
    setModalOpen(true);
  };

  const modalDayLabel = modalDay != null ? `Day ${modalDay}` : "Unassigned";

  return (
    <div className="space-y-4">
      {trip.itinerary.map((day) => (
        <DayLogCard
          key={day.id}
          day={day}
          expenses={expenses.filter((e) => e.dayNumber === day.dayNumber)}
          onAdd={() => openFor(day.dayNumber)}
          onRemove={onRemove}
        />
      ))}

      {(unassigned.length > 0 || trip.itinerary.length === 0) && (
        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <h3 className="mb-3 font-display text-lg font-medium text-ink-900">Other expenses</h3>
          <ExpenseList expenses={unassigned} onRemove={onRemove} />
          <button
            onClick={() => openFor(undefined)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink-200 py-2.5 text-sm font-medium text-ink-500 hover:border-blue-300 hover:text-blue-600"
          >
            <Plus size={15} />
            Add expense
          </button>
        </div>
      )}

      <AddExpenseModal
        open={modalOpen}
        tripId={trip.id}
        dayNumber={modalDay}
        dayLabel={modalDayLabel}
        onClose={() => setModalOpen(false)}
        onAdd={onAdd}
      />
    </div>
  );
}
