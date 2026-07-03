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
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500">Ringkasan bulan ini</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <CardTitle className="text-xs font-semibold text-gray-500">Pemasukan</CardTitle>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50">
              <TrendingUp className="h-3.5 w-3.5 text-teal-600" />
            </div>
          </div>
          <CardValue className="mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-bold tracking-tight text-teal-600 break-all">
            {formatRupiah(summary.totalIncome)}
          </CardValue>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <CardTitle className="text-xs font-semibold text-gray-500">Pengeluaran</CardTitle>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            </div>
          </div>
          <CardValue className="mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-bold tracking-tight text-red-500 break-all">
            {formatRupiah(summary.totalExpense)}
          </CardValue>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <CardTitle className="text-xs font-semibold text-gray-500">Sisa bersih</CardTitle>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Scale className="h-3.5 w-3.5 text-blue-600" />
            </div>
          </div>
          <CardValue className={cn("mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-bold tracking-tight break-all", summary.netBalance >= 0 ? "text-teal-600" : "text-red-500")}>
            {formatRupiah(summary.netBalance)}
          </CardValue>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-1">
            <CardTitle className="text-xs font-semibold text-gray-500">Aset valid</CardTitle>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-50">
              <Wallet className="h-3.5 w-3.5 text-purple-600" />
            </div>
          </div>
          <CardValue className="mt-2 text-xs min-[360px]:text-sm sm:text-base md:text-lg font-bold tracking-tight text-gray-900 break-all">
            {formatRupiah(summary.totalAssets)}
          </CardValue>
        </Card>
      </div>

      {summary.topExpenseCategories.length > 0 && (
        <Card>
          <CardTitle>Pengeluaran terbesar</CardTitle>
          <ul className="mt-3 space-y-2">
            {summary.topExpenseCategories.map((cat) => (
              <li key={cat.name} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{cat.name}</span>
                <span className="font-medium text-gray-900">{formatRupiah(cat.total)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
