import { Bed, Car, Plane, Popcorn, ShoppingBag, Utensils, Wallet, type LucideIcon } from "lucide-react";
import type { ExpenseCategory } from "../types";

export const EXPENSE_CATEGORY_META: Record<ExpenseCategory, { label: string; icon: LucideIcon; color: string }> = {
  flights: { label: "Flights", icon: Plane, color: "#fc5a2e" },
  lodging: { label: "Lodging", icon: Bed, color: "#1c8c85" },
  food: { label: "Food & drink", icon: Utensils, color: "#f5a524" },
  activities: { label: "Activities", icon: Popcorn, color: "#7c6df2" },
  transport: { label: "Transport", icon: Car, color: "#4a90d9" },
  shopping: { label: "Shopping", icon: ShoppingBag, color: "#e0559b" },
  other: { label: "Other", icon: Wallet, color: "#8b93a7" },
};

export const EXPENSE_CATEGORIES = Object.keys(EXPENSE_CATEGORY_META) as ExpenseCategory[];
