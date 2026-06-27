import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils/currency";
import type { DashboardSummary } from "@/types/database.types";
import { TrendingDown, TrendingUp, Wallet, Scale } from "lucide-react";

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
        <Card>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
              <TrendingUp className="h-4 w-4 text-teal-600" />
            </div>
            <CardTitle>Pemasukan</CardTitle>
          </div>
          <CardValue className="text-teal-600">{formatRupiah(summary.totalIncome)}</CardValue>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <CardTitle>Pengeluaran</CardTitle>
          </div>
          <CardValue className="text-red-500">{formatRupiah(summary.totalExpense)}</CardValue>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <Scale className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle>Sisa bersih</CardTitle>
          </div>
          <CardValue className={summary.netBalance >= 0 ? "text-teal-600" : "text-red-500"}>
            {formatRupiah(summary.netBalance)}
          </CardValue>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
              <Wallet className="h-4 w-4 text-purple-600" />
            </div>
            <CardTitle>Aset valid</CardTitle>
          </div>
          <CardValue>{formatRupiah(summary.totalAssets)}</CardValue>
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
