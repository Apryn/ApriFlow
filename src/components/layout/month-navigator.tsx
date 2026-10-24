"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatMonthYear, getCurrentMonthRange, getPreviousMonth, getNextMonth } from "@/lib/utils/date";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MonthNavigatorProps {
  currentYear: number;
  currentMonth: number;
  className?: string;
}

/** Compact month stepper: ‹ Oktober 2026 ›  (+ "Bulan ini" shortcut when viewing the past). */
export function MonthNavigator({ currentYear, currentMonth, className }: MonthNavigatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const now = getCurrentMonthRange();
  const isCurrentMonth = currentYear === now.year && currentMonth === now.month;
  const isNextDisabled =
    currentYear > now.year || (currentYear === now.year && currentMonth >= now.month);

  const prev = getPreviousMonth(currentYear, currentMonth);
  const next = getNextMonth(currentYear, currentMonth);

  const go = (y?: number, m?: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (y && m && !(y === now.year && m === now.month)) {
      params.set("year", String(y));
      params.set("month", String(m));
    } else {
      params.delete("year");
      params.delete("month");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const stepBtn =
    "flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-700 disabled:hover:bg-transparent";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="inline-flex items-center rounded-xl border-2 border-black bg-surface p-0.5 shadow-nb-sm">
        <button
          type="button"
          onClick={() => go(prev.year, prev.month)}
          className={stepBtn}
          aria-label="Bulan sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[118px] px-1 text-center text-sm font-semibold text-zinc-100">
          {formatMonthYear(currentYear, currentMonth)}
        </span>
        <button
          type="button"
          disabled={isNextDisabled}
          onClick={() => go(next.year, next.month)}
          className={stepBtn}
          aria-label="Bulan berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {!isCurrentMonth && (
        <button
          type="button"
          onClick={() => go()}
          className="h-8 cursor-pointer rounded-lg px-2.5 text-xs font-semibold text-teal-400 transition-colors hover:bg-teal-400/10"
        >
          Bulan ini
        </button>
      )}
    </div>
  );
}
