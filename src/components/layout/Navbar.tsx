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
    <header className="sticky top-0 z-30 border-b border-ink-100/70 bg-cream-50/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-700 text-white shadow-glow">
            <Compass size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-ink-900">Wayfare</span>
        </NavLink>

        <nav className="flex items-center gap-1 rounded-full border border-ink-100/80 bg-white/90 p-1 shadow-soft">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all sm:px-4",
                  isActive
                    ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-glow"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-800"
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
