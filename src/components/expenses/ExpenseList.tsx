import { Cloud, Trash2 } from "lucide-react";
import { EXPENSE_CATEGORY_META } from "../../data/expenseCategories";
import { formatCurrency, formatDay } from "../../utils/format";
import type { Expense } from "../../types";

export function ExpenseList({ expenses, onRemove }: { expenses: Expense[]; onRemove: (id: string) => void }) {
  if (expenses.length === 0) {
    return <p className="rounded-xl border border-dashed border-ink-200 py-8 text-center text-sm text-ink-400">No expenses logged yet.</p>;
  }

  const sorted = [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-100 bg-white">
      {sorted.map((expense) => {
        const meta = EXPENSE_CATEGORY_META[expense.category];
        const Icon = meta.icon;
        return (
          <div key={expense.id} className="group flex items-center gap-3 px-4 py-3">
            {expense.receiptImage ? (
              <img src={expense.receiptImage} alt="Receipt" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
            ) : (
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
              >
                <Icon size={16} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-800">{expense.label}</p>
              <p className="text-xs text-ink-400">
                {meta.label} · {formatDay(expense.date)}
              </p>
            </div>
            {expense.syncedToSheets && (
              <span title="Synced to Google Sheets" className="text-teal-500">
                <Cloud size={13} />
              </span>
            )}
            <span className="text-sm font-semibold text-ink-800">{formatCurrency(expense.amount, expense.currency)}</span>
            <button
              onClick={() => onRemove(expense.id)}
              aria-label="Remove expense"
              className="rounded-full p-1.5 text-ink-300 opacity-0 transition-opacity hover:bg-ink-50 hover:text-coral-600 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
