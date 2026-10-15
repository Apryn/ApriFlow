"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatMonthYear, getCurrentMonthRange, getPreviousMonth, getNextMonth } from "@/lib/utils/date";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, History } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface MonthNavigatorProps {
  currentYear: number;
  currentMonth: number;
  showHistoryLink?: boolean;
}

export function MonthNavigator({
  currentYear,
  currentMonth,
  showHistoryLink = true,
}: MonthNavigatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const realMonthRange = getCurrentMonthRange();
  const isRealCurrentMonth =
    currentYear === realMonthRange.year && currentMonth === realMonthRange.month;

  const prev = getPreviousMonth(currentYear, currentMonth);
  const next = getNextMonth(currentYear, currentMonth);

  const navigateToMonth = (y: number, m: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(y));
    params.set("month", String(m));
    router.push(`${pathname}?${params.toString()}`);
  };

  const resetToCurrentMonth = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("year");
    params.delete("month");
    const queryStr = params.toString();
    router.push(queryStr ? `${pathname}?${queryStr}` : pathname);
  };

  const isNextDisabled =
    currentYear > realMonthRange.year ||
    (currentYear === realMonthRange.year && currentMonth >= realMonthRange.month);

  return (
    <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex-wrap">
      {/* Month Stepper */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => navigateToMonth(prev.year, prev.month)}
          className="h-8 w-8 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 flex items-center justify-center border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer"
          title="Bulan sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 px-2.5 py-1 bg-zinc-950 rounded-xl border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]">
          <Calendar className="h-3.5 w-3.5 text-teal-400 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-zinc-100">
            {formatMonthYear(currentYear, currentMonth)}
          </span>
          {isRealCurrentMonth ? (
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
              Bulan Ini
            </span>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Arsip
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={isNextDisabled}
          onClick={() => navigateToMonth(next.year, next.month)}
          className={`h-8 w-8 rounded-xl flex items-center justify-center border-2 border-black transition-all ${
            isNextDisabled
              ? "bg-zinc-950/40 text-zinc-700 cursor-not-allowed border-zinc-800"
              : "bg-zinc-950 hover:bg-zinc-800 text-zinc-300 shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
          }`}
          title="Bulan selanjutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {!isRealCurrentMonth && (
          <button
            type="button"
            onClick={resetToCurrentMonth}
            className="text-xs font-bold bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Kembali ke Bulan Ini
          </button>
        )}

        {showHistoryLink && (
          <Link
            href="/history"
            className="text-xs font-black bg-zinc-950 hover:bg-zinc-800 text-teal-400 hover:text-teal-300 border-2 border-black shadow-[1.5px_1.5px_0px_0px_#2dd4bf] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <History className="h-3.5 w-3.5" />
            Riwayat Bulanan
          </Link>
        )}
      </div>
    </div>
  );
}
