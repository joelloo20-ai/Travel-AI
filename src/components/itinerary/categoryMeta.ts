import {
  Landmark,
  Luggage,
  Mountain,
  Moon,
  ShoppingBag,
  Trees,
  Users,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { InterestTag } from "../../types";

export const CATEGORY_META: Record<InterestTag | "logistics", { icon: LucideIcon; color: string; bg: string }> = {
  food: { icon: Utensils, color: "text-coral-600", bg: "bg-coral-50" },
  culture: { icon: Landmark, color: "text-amber-700", bg: "bg-amber-50" },
  nature: { icon: Trees, color: "text-teal-600", bg: "bg-teal-50" },
  nightlife: { icon: Moon, color: "text-indigo-600", bg: "bg-indigo-50" },
  shopping: { icon: ShoppingBag, color: "text-pink-600", bg: "bg-pink-50" },
  adventure: { icon: Mountain, color: "text-orange-700", bg: "bg-orange-50" },
  relaxation: { icon: Waves, color: "text-sky-600", bg: "bg-sky-50" },
  family: { icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
  logistics: { icon: Luggage, color: "text-ink-500", bg: "bg-ink-50" },
};
