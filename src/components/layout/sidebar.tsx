"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { usePendingCount } from "@/components/providers/pending-count-provider";
import { PLANNING_NAV, PRIMARY_NAV, SETTINGS_NAV, isNavActive, type NavItem } from "@/lib/navigation";
import { VisibilityToggle } from "./visibility-toggle";
import { Logo } from "./logo";

export function Sidebar() {
  const pathname = usePathname();
  const pendingCount = usePendingCount();

  const renderItem = ({ href, label, icon: Icon, showPendingBadge }: NavItem) => {
    const active = isNavActive(pathname, href);
    const badge = showPendingBadge && pendingCount > 0 ? pendingCount : null;
    return (
      <Link
        key={href}
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "border-black bg-teal-400 font-semibold text-black shadow-nb-sm"
            : "border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">{label}</span>
        {badge !== null && (
          <span
            className={cn(
              "tabular flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
              active ? "bg-black text-teal-300" : "bg-teal-400 text-black"
            )}
          >
            {badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r-2 border-black bg-zinc-900 md:flex">
      <div className="flex items-center justify-between gap-2 px-4 py-5">
        <Link href="/" aria-label="Beranda">
          <Logo withTagline />
        </Link>
        <VisibilityToggle />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
        <div className="space-y-1">{PRIMARY_NAV.map(renderItem)}</div>
        <div className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Perencanaan
          </p>
          {PLANNING_NAV.map(renderItem)}
        </div>
      </nav>

      <div className="border-t-2 border-black p-3">{renderItem(SETTINGS_NAV)}</div>
    </aside>
  );
}
