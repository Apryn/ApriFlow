"use client";

import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/currency";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { DashboardSummary } from "@/types/database.types";
import { TrendingDown, TrendingUp, Wallet, Scale, ChevronRight, History } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

function getCashFlowStatus(net: number, expense: number, income: number) {
  if (income === 0 && expense === 0) {
    return { label: "Belum ada data", variant: "default" as const };
  }
  if (net >= 0) {
    const bocorRatio = income > 0 ? expense / income : 0;
    if (bocorRatio <= 0.85) return { label: "Aman", variant: "success" as const };
    return { label: "Waspada", variant: "warning" as const };
  }
  return { label: "Bocor", variant: "danger" as const };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { mask } = useVisibility();
  const status = getCashFlowStatus(
    summary.netBalance,
    summary.totalExpense,
    summary.totalIncome
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ringkasan Bulan Ini</h2>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <Link
          href="/history"
          className="text-xs font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
        >
          <History className="h-3 w-3" />
          Riwayat
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Pemasukan */}
        <Link
          href="/transaksi?type=income"
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 rounded-2xl"
          title="Lihat riwayat pemasukan"
        >
          <Card className="p-3.5 h-full flex flex-col justify-between border-2 border-black shadow-[3px_3px_0px_0px_#2dd4bf] hover:shadow-[4px_4px_0px_0px_#2dd4bf] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#2dd4bf] transition-all cursor-pointer">
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-teal-400 transition-colors">
                  Pemasukan
                </CardTitle>
                <ChevronRight className="h-3 w-3 text-zinc-500 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20 group-hover:bg-teal-500/20 group-hover:scale-105 transition-all">
                <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
              </div>
            </div>
            <CardValue className="mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-black tracking-tight text-teal-400 break-all">
              {mask(summary.totalIncome)}
            </CardValue>
          </Card>
        </Link>

        {/* Pengeluaran */}
        <Link
          href="/transaksi?type=expense"
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 rounded-2xl"
          title="Lihat riwayat pengeluaran"
        >
          <Card className="p-3.5 h-full flex flex-col justify-between border-2 border-black shadow-[3px_3px_0px_0px_#f43f5e] hover:shadow-[4px_4px_0px_0px_#f43f5e] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#f43f5e] transition-all cursor-pointer">
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-rose-400 transition-colors">
                  Pengeluaran
                </CardTitle>
                <ChevronRight className="h-3 w-3 text-zinc-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 group-hover:bg-rose-500/20 group-hover:scale-105 transition-all">
                <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
              </div>
            </div>
            <CardValue className="mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-black tracking-tight text-rose-400 break-all">
              {mask(summary.totalExpense)}
            </CardValue>
          </Card>
        </Link>

        {/* Sisa Bersih */}
        <Link
          href="/transaksi"
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-2xl"
          title="Lihat seluruh transaksi"
        >
          <Card className="p-3.5 h-full flex flex-col justify-between border-2 border-black shadow-[3px_3px_0px_0px_#3b82f6] hover:shadow-[4px_4px_0px_0px_#3b82f6] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#3b82f6] transition-all cursor-pointer">
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-blue-400 transition-colors">
                  Sisa bersih
                </CardTitle>
                <ChevronRight className="h-3 w-3 text-zinc-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-500/20 group-hover:scale-105 transition-all">
                <Scale className="h-3.5 w-3.5 text-blue-400" />
              </div>
            </div>
            <CardValue className={cn("mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-black tracking-tight break-all", summary.netBalance >= 0 ? "text-teal-400" : "text-rose-400")}>
              {mask(summary.netBalance)}
            </CardValue>
          </Card>
        </Link>

        {/* Aset Valid */}
        <Link
          href="/aset"
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-2xl"
          title="Kelola aset valid"
        >
          <Card className="p-3.5 h-full flex flex-col justify-between border-2 border-black shadow-[3px_3px_0px_0px_#a855f7] hover:shadow-[4px_4px_0px_0px_#a855f7] hover:-translate-x-[1px] hover:-translate-y-[1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#a855f7] transition-all cursor-pointer">
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-purple-400 transition-colors">
                  Aset valid
                </CardTitle>
                <ChevronRight className="h-3 w-3 text-zinc-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 group-hover:scale-105 transition-all">
                <Wallet className="h-3.5 w-3.5 text-purple-400" />
              </div>
            </div>
            <CardValue className="mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-black tracking-tight text-zinc-100 break-all">
              {mask(summary.totalAssets)}
            </CardValue>
          </Card>
        </Link>
      </div>

      {summary.topExpenseCategories.length > 0 && (
        <Card className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400">Pengeluaran terbesar</CardTitle>
          <ul className="mt-4 space-y-2.5 divide-y divide-zinc-800">
            {summary.topExpenseCategories.map((cat, i) => (
              <li key={cat.name} className={cn("flex items-center justify-between text-sm pt-2.5", i === 0 && "pt-0")}>
                <Link href={`/transaksi?category=${encodeURIComponent(cat.name)}`} className="flex items-center gap-2 group cursor-pointer">
                  <span className="text-zinc-300 font-bold group-hover:text-teal-400 transition-colors">{cat.name}</span>
                  <span className="text-[10px] font-black bg-zinc-850 text-teal-400 px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000] group-hover:bg-zinc-800 transition-all">{cat.count}x</span>
                </Link>
                <span className="font-extrabold text-zinc-100">{mask(cat.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

