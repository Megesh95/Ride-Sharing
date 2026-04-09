import { NavLink } from "react-router-dom";
import { CalendarDays, CircleUserRound, House, MapPinned, Wallet } from "lucide-react";
import type { ReactNode } from "react";

type NavItem = { to: string; label: string; icon: ReactNode };

const items: NavItem[] = [
  { to: "/", label: "Home", icon: <House size={18} /> },
  { to: "/map", label: "Map", icon: <MapPinned size={18} /> },
  { to: "/bookings", label: "Bookings", icon: <CalendarDays size={18} /> },
  { to: "/wallet", label: "Wallet", icon: <Wallet size={18} /> },
  { to: "/profile", label: "Profile", icon: <CircleUserRound size={18} /> },
];

export function BottomNav({ role }: { role: "user" | "admin" }) {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white/80 shadow-md backdrop-blur-md" aria-label="Bottom navigation">
      <nav className="mx-auto flex max-w-md items-center justify-around py-2">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.to === "/"}>
            {({ isActive }) => (
              <button
                type="button"
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center px-2 text-xs transition ${
                  isActive ? "font-medium text-emerald-600" : "text-gray-500 hover:text-emerald-600"
                }`}
              >
                <span className="mb-1 h-5 w-5">{it.icon}</span>
                <span>{it.label}</span>
              </button>
            )}
          </NavLink>
        ))}
        {role === "admin" ? null : null}
      </nav>
    </div>
  );
}

