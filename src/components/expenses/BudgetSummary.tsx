import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import clsx from "clsx";
import { EXPENSE_CATEGORY_META } from "../../data/expenseCategories";
import { formatCurrency } from "../../utils/format";
import type { Expense, ExpenseCategory } from "../../types";

export function BudgetSummary({ budget, expenses }: { budget: number; expenses: Expense[] }) {
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = budget - spent;
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over = spent > budget && budget > 0;

  const byCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {})
  ).map(([category, value]) => ({
    category: category as ExpenseCategory,
    value,
  }));

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Total spent</p>
          <p className="font-display text-3xl font-medium text-ink-900">{formatCurrency(spent)}</p>
          <p className={clsx("mt-0.5 text-sm", over ? "text-rose-600" : "text-ink-400")}>
            {budget > 0
              ? over
                ? `${formatCurrency(Math.abs(remaining))} over your ${formatCurrency(budget)} budget`
                : `${formatCurrency(remaining)} left of ${formatCurrency(budget)}`
              : "No budget set for this trip"}
          </p>
          {budget > 0 && (
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100">
              <div
                className={clsx("h-full rounded-full transition-all", over ? "bg-rose-600" : "bg-teal-500")}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}

          {byCategory.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5">
              {byCategory.map(({ category, value }) => (
                <span key={category} className="flex items-center gap-1.5 text-xs text-ink-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EXPENSE_CATEGORY_META[category].color }} />
                  {EXPENSE_CATEGORY_META[category].label} · {formatCurrency(value)}
                </span>
              ))}
            </div>
          )}
        </div>

        {byCategory.length > 0 && (
          <div className="h-36 w-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="category" innerRadius={38} outerRadius={62} paddingAngle={2}>
                  {byCategory.map(({ category }) => (
                    <Cell key={category} fill={EXPENSE_CATEGORY_META[category].color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, category) => [formatCurrency(Number(value)), EXPENSE_CATEGORY_META[category as ExpenseCategory].label]}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e4e6ec", fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
