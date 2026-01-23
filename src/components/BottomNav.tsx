// src/components/BottomNav.tsx
import React, { memo, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, CalendarDays, BarChart3, Pill, Plus } from "lucide-react";

type CenterTab = "flow" | "symptoms" | "mood";

interface BottomNavProps {
  onCenterPress?: (tab?: CenterTab) => void;
}

type Item = {
  key: string;
  to: string;
  label: string;
  icon: React.ReactNode;
  match?: (pathname: string) => boolean;
};

export const BottomNav = memo(function BottomNav({ onCenterPress }: BottomNavProps) {
  const { pathname } = useLocation();

  const items: Item[] = useMemo(
    () => [
      {
        key: "today",
        to: "/",
        label: "Bugün",
        icon: <Home className="w-5 h-5" />,
        match: (p) => p === "/" || p.startsWith("/today"),
      },
      {
        key: "calendar",
        to: "/calendar",
        label: "Takvim",
        icon: <CalendarDays className="w-5 h-5" />,
        match: (p) => p.startsWith("/calendar"),
      },
      {
        key: "stats",
        to: "/stats",
        label: "İstatistik",
        icon: <BarChart3 className="w-5 h-5" />,
        match: (p) => p.startsWith("/stats"),
      },
      {
        key: "meds",
        to: "/medications",
        label: "İlaçlar",
        icon: <Pill className="w-5 h-5" />,
        match: (p) => p.startsWith("/medications"),
      },
    ],
    []
  );

  const isActive = (it: Item) => (it.match ? it.match(pathname) : pathname === it.to);

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      {/* Safe-area spacer */}
      <div className="pointer-events-none h-[env(safe-area-inset-bottom)]" />

      <div className="relative mx-auto w-full max-w-md px-4 pb-4">
        {/* BAR */}
        <div className="relative rounded-[28px] border border-border/40 bg-card/60 backdrop-blur-xl shadow-lg">
          {/* bar içi padding; ortada FAB için boşluk */}
          <div className="grid grid-cols-5 items-center px-3 py-2">
            {/* Sol 2 */}
            <NavItem item={items[0]} active={isActive(items[0])} />
            <NavItem item={items[1]} active={isActive(items[1])} />

            {/* Orta boşluk (FAB altında kalmasın) */}
            <div />

            {/* Sağ 2 */}
            <NavItem item={items[2]} active={isActive(items[2])} />
            <NavItem item={items[3]} active={isActive(items[3])} />
          </div>

          {/* Üstte hafif parlak şerit */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-10 rounded-[28px] bg-gradient-to-b from-white/10 to-transparent" />
        </div>

        {/* FAB (+) */}
        <button
          type="button"
          onClick={() => onCenterPress?.("flow")}
          className="
            absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2
            h-14 w-14 rounded-full
            bg-primary text-primary-foreground
            shadow-xl shadow-primary/35
            active:scale-95 transition-transform
            flex items-center justify-center
            border border-white/20
          "
          aria-label="Yeni kayıt"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
});

function NavItem({ item, active }: { item: Item; active: boolean }) {
  return (
    <NavLink
      to={item.to}
      className={`
        group flex flex-col items-center justify-center gap-1
        py-2
        transition-all duration-200
      `}
    >
      <div
        className={`
          flex items-center justify-center
          h-10 w-14 rounded-2xl
          transition-all duration-200
          ${active ? "bg-primary/15 text-primary" : "text-muted-foreground group-hover:text-foreground"}
        `}
      >
        {item.icon}
      </div>
      <span
        className={`
          text-[11px] font-medium leading-none
          transition-colors duration-200
          ${active ? "text-primary" : "text-muted-foreground"}
        `}
      >
        {item.label}
      </span>
    </NavLink>
  );
}
