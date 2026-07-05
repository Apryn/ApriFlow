import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/currency";
import type { DashboardSummary } from "@/types/database.types";
import { TrendingDown, TrendingUp, Wallet, Scale } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
  const status = getCashFlowStatus(
    summary.netBalance,
    summary.totalExpense,
    summary.totalIncome
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Ringkasan bulan ini</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3.5 flex flex-col justify-between border-2 border-black shadow-[3px_3px_0px_0px_#2dd4bf]">
          <div className="flex items-start justify-between gap-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pemasukan</CardTitle>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 border border-teal-500/20">
              <TrendingUp className="h-3.5 w-3.5 text-teal-400" />
            </div>
          </div>
          <CardValue className="mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-black tracking-tight text-teal-400 break-all">
            {formatRupiah(summary.totalIncome)}
          </CardValue>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between border-2 border-black shadow-[3px_3px_0px_0px_#f43f5e]">
          <div className="flex items-start justify-between gap-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">Pengeluaran</CardTitle>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
            </div>
          </div>
          <CardValue className="mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-black tracking-tight text-rose-400 break-all">
            {formatRupiah(summary.totalExpense)}
          </CardValue>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between border-2 border-black shadow-[3px_3px_0px_0px_#3b82f6]">
          <div className="flex items-start justify-between gap-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">Sisa bersih</CardTitle>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Scale className="h-3.5 w-3.5 text-blue-400" />
            </div>
          </div>
          <CardValue className={cn("mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-black tracking-tight break-all", summary.netBalance >= 0 ? "text-teal-400" : "text-rose-400")}>
            {formatRupiah(summary.netBalance)}
          </CardValue>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between border-2 border-black shadow-[3px_3px_0px_0px_#a855f7]">
          <div className="flex items-start justify-between gap-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">Aset valid</CardTitle>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Wallet className="h-3.5 w-3.5 text-purple-400" />
            </div>
          </div>
          <CardValue className="mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-black tracking-tight text-zinc-100 break-all">
            {formatRupiah(summary.totalAssets)}
          </CardValue>
        </Card>
      </div>

      {summary.topExpenseCategories.length > 0 && (
        <Card className="border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <CardTitle className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-400">Pengeluaran terbesar</CardTitle>
          <ul className="mt-4 space-y-2.5 divide-y divide-zinc-800">
            {summary.topExpenseCategories.map((cat, i) => (
              <li key={cat.name} className={cn("flex items-center justify-between text-sm pt-2.5", i === 0 && "pt-0")}>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-300 font-bold">{cat.name}</span>
                  <span className="text-[10px] font-black bg-zinc-850 text-teal-400 px-1.5 py-0.5 rounded border border-black shadow-[1px_1px_0px_0px_#000]">{cat.count}x</span>
                </div>
                <span className="font-extrabold text-zinc-100">{formatRupiah(cat.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
