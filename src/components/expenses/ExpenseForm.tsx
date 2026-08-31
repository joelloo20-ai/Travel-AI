import { useState } from "react";
import { Plus } from "lucide-react";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_META } from "../../data/expenseCategories";
import { newId, todayIso } from "../../utils/format";
import type { Expense, ExpenseCategory } from "../../types";

export function ExpenseForm({ tripId, onAdd }: { tripId: string; onAdd: (expense: Expense) => void }) {
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  const submit = () => {
    const amt = Number(amount);
    if (!label.trim() || !Number.isFinite(amt) || amt <= 0) return;
    onAdd({
      id: newId("exp"),
      tripId,
      category,
      label: label.trim(),
      amount: amt,
      date: todayIso(),
    });
    setLabel("");
    setAmount("");
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-ink-100 bg-white p-3 sm:flex-row sm:items-center">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
        className="rounded-lg border border-ink-100 bg-cream-50 px-2.5 py-2 text-sm text-ink-700 outline-none focus:border-coral-300"
      >
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {EXPENSE_CATEGORY_META[c].label}
          </option>
        ))}
      </select>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="What was it for?"
        className="flex-1 rounded-lg border border-ink-100 bg-cream-50 px-3 py-2 text-sm text-ink-700 outline-none placeholder:text-ink-400 focus:border-coral-300"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        type="number"
        min="0"
        placeholder="Amount"
        className="w-full rounded-lg border border-ink-100 bg-cream-50 px-3 py-2 text-sm text-ink-700 outline-none placeholder:text-ink-400 focus:border-coral-300 sm:w-28"
      />
      <button
        onClick={submit}
        className="flex items-center justify-center gap-1.5 rounded-lg bg-ink-800 px-3.5 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        <Plus size={15} />
        Add
      </button>
    </div>
  );
}
