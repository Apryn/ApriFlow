"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { DashboardSummary } from "@/types/database.types";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Wallet } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

function getCashFlowStatus(net: number, expense: number, income: number) {
  if (income === 0 && expense === 0) return { label: "Belum ada data", variant: "default" as const };
  if (net >= 0) {
    const ratio = income > 0 ? expense / income : 0;
    return ratio <= 0.85
      ? { label: "Aman", variant: "success" as const }
      : { label: "Waspada", variant: "warning" as const };
  }
  return { label: "Defisit", variant: "danger" as const };
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const { mask } = useVisibility();
  const status = getCashFlowStatus(summary.netBalance, summary.totalExpense, summary.totalIncome);
  const maxCat = Math.max(1, ...summary.topExpenseCategories.map((c) => c.total));

  return (
    <div className="space-y-4">
      {/* Hero: net balance + income / expense */}
      <Card className="p-0">
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Sisa bersih bulan ini</span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p
            className={cn(
              "tabular mt-1.5 break-all text-[28px] font-extrabold leading-tight tracking-tight",
              summary.netBalance >= 0 ? "text-zinc-50" : "text-rose-400"
            )}
          >
            {mask(summary.netBalance)}
          </p>
        </div>

        <div className="grid grid-cols-2 border-t-2 border-black">
          <Link
            href="/transaksi?type=income"
            className="group flex items-center gap-2.5 p-3.5 transition-colors hover:bg-zinc-800/60"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-400/10 text-teal-400">
              <ArrowDownLeft className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] text-zinc-500">Pemasukan</span>
              <span className="tabular block truncate text-sm font-bold text-teal-400">
                {mask(summary.totalIncome)}
              </span>
            </span>
          </Link>
          <Link
            href="/transaksi?type=expense"
            className="group flex items-center gap-2.5 border-l-2 border-black p-3.5 transition-colors hover:bg-zinc-800/60"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] text-zinc-500">Pengeluaran</span>
              <span className="tabular block truncate text-sm font-bold text-rose-400">
                {mask(summary.totalExpense)}
              </span>
            </span>
          </Link>
        </div>

        <Link
          href="/aset"
          className="flex items-center justify-between gap-3 rounded-b-2xl border-t-2 border-black px-4 py-3 transition-colors hover:bg-zinc-800/60"
        >
          <span className="flex items-center gap-2 text-xs text-zinc-400">
            <Wallet className="h-4 w-4 text-zinc-500" />
            Total aset
          </span>
          <span className="flex items-center gap-1">
            <span className="tabular text-sm font-semibold text-zinc-100">{mask(summary.totalAssets)}</span>
            <ChevronRight className="h-4 w-4 text-zinc-600" />
          </span>
        </Link>
      </Card>

      {/* Top categories */}
      {summary.topExpenseCategories.length > 0 && (
        <Card>
          <CardHeader title="Pengeluaran terbesar" href="/transaksi?type=expense" />
          <ul className="space-y-3">
            {summary.topExpenseCategories.map((cat) => (
              <li key={cat.name}>
                <Link
                  href={`/transaksi?category=${encodeURIComponent(cat.name)}`}
                  className="group block"
                >
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-zinc-200 transition-colors group-hover:text-teal-400">
                      {cat.name}
                      <span className="ml-1.5 text-xs font-normal text-zinc-500">{cat.count}×</span>
                    </span>
                    <span className="tabular shrink-0 font-semibold text-zinc-100">{mask(cat.total)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-rose-400/80"
                      style={{ width: `${(cat.total / maxCat) * 100}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
