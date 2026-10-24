"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { usePendingCount } from "@/components/providers/pending-count-provider";
import { MOBILE_NAV, PLANNING_NAV, SETTINGS_NAV, isNavActive } from "@/lib/navigation";

export function BottomNav() {
  const pathname = usePathname();
  const pendingCount = usePendingCount();

  // "Menu" is active for the settings page and every planning page reachable from it.
  const menuHrefs = [SETTINGS_NAV.href, ...PLANNING_NAV.map((n) => n.href)];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-black bg-zinc-900/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {MOBILE_NAV.map(({ href, label, icon: Icon, showPendingBadge }) => {
          const active =
            href === SETTINGS_NAV.href
              ? menuHrefs.some((h) => isNavActive(pathname, h))
              : isNavActive(pathname, href);
          const badge = showPendingBadge && pendingCount > 0 ? pendingCount : null;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-teal-400" : "text-zinc-500 active:text-zinc-200"
              )}
            >
              {active && (
                <span className="absolute inset-x-5 top-0 h-[3px] rounded-b-full bg-teal-400" />
              )}
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {badge !== null && (
                  <span className="tabular absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-black bg-teal-400 px-1 text-[9px] font-bold text-black">
                    {badge}
                  </span>
                )}
              </span>
              <span className={cn(active && "font-semibold")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
