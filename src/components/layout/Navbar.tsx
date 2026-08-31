import { NavLink } from "react-router-dom";
import { Compass, LayoutGrid, MessageSquareText, Sparkles } from "lucide-react";
import clsx from "clsx";

const LINKS = [
  { to: "/", label: "Plan a trip", icon: MessageSquareText, end: true },
  { to: "/trips", label: "My Trips", icon: LayoutGrid },
  { to: "/templates", label: "Templates", icon: Sparkles },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink-100 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral-500 text-white">
            <Compass size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold text-ink-900">Wayfare</span>
        </NavLink>

        <nav className="flex items-center gap-1 rounded-full border border-ink-100 bg-white p-1 shadow-soft">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors sm:px-4",
                  isActive ? "bg-coral-500 text-white shadow-soft" : "text-ink-500 hover:bg-ink-50 hover:text-ink-800"
                )
              }
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
