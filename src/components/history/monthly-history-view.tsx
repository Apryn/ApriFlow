"use client";

import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { MonthlyHistoryData } from "@/types/database.types";
import {
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  LayoutDashboard,
} from "lucide-react";

interface MonthlyHistoryViewProps {
  data: MonthlyHistoryData;
}

export function MonthlyHistoryView({ data }: MonthlyHistoryViewProps) {
  const { mask } = useVisibility();
  const { months, currentMonth, lastMonth, overallAverageExpense } = data;

  const expenseDiff = currentMonth.totalExpense - lastMonth.totalExpense;
  const isMoreFrugal = expenseDiff < 0;
  const absDiff = Math.abs(expenseDiff);

  return (
    <div className="space-y-5">
      <Card className="space-y-3.5">
        <CardHeader
          title="Bulan Ini vs Bulan Kemarin"
          action={<Badge variant="info">Perbandingan</Badge>}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-surface-2 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-semibold uppercase tracking-wider">
                Bulan Kemarin ({lastMonth.monthLabel})
              </span>
              <span>{lastMonth.transactionCount} tx</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Total Pengeluaran:</span>
              <p className="tabular text-lg font-bold text-rose-400">
                {mask(lastMonth.totalExpense)}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800 text-zinc-400">
              <span>Masuk: {mask(lastMonth.totalIncome)}</span>
              <span className={lastMonth.netBalance >= 0 ? "text-teal-400" : "text-rose-400"}>
                Sisa: {mask(lastMonth.netBalance)}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-2 border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-teal-400">
              <span className="font-semibold uppercase tracking-wider">
                Bulan Ini ({currentMonth.monthLabel})
              </span>
              <span>{currentMonth.transactionCount} tx</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">Total Pengeluaran:</span>
              <p className="tabular text-lg font-bold text-zinc-100">
                {mask(currentMonth.totalExpense)}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800 text-zinc-400">
              <span>Masuk: {mask(currentMonth.totalIncome)}</span>
              <span className={currentMonth.netBalance >= 0 ? "text-teal-400" : "text-rose-400"}>
                Sisa: {mask(currentMonth.netBalance)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface-2 border border-zinc-800 flex items-center gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black ${
              isMoreFrugal ? "bg-teal-400/20 text-teal-400" : "bg-rose-500/20 text-rose-400"
            }`}
          >
            {isMoreFrugal ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {lastMonth.totalExpense > 0 ? (
              isMoreFrugal ? (
                <>Bulan ini Anda <strong className="text-teal-400 font-bold">lebih hemat {mask(absDiff)}</strong> dibanding bulan kemarin ({lastMonth.monthLabel}).</>
              ) : (
                <>Pengeluaran bulan ini <strong className="text-rose-400 font-bold">naik {mask(absDiff)}</strong> dibanding bulan kemarin ({lastMonth.monthLabel}).</>
              )
            ) : (
              <>Bulan kemarin belum ada data. Rata-rata pengeluaran Anda adalah <strong className="text-teal-400 font-bold">{mask(overallAverageExpense)}</strong>.</>
            )}
          </p>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Daftar Riwayat Per Bulan
          </h2>
          <span className="text-xs text-zinc-500">
            {months.length} bulan terakhir
          </span>
        </div>

        <div className="grid gap-3">
          {months.map((item, idx) => (
            <Card key={`${item.year}-${item.month}`} className="p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-teal-400 shrink-0" />
                  <span className="text-sm font-bold text-zinc-100">
                    {item.monthLabel}
                  </span>
                  {idx === 0 && <Badge variant="success">Bulan Ini</Badge>}
                  {idx === 1 && <Badge variant="warning">Bulan Kemarin</Badge>}
                </div>
                <span className="text-xs text-zinc-400">
                  {item.transactionCount} Transaksi
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-surface-2 border border-zinc-800">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase block">Pengeluaran</span>
                  <span className="tabular text-xs font-bold text-rose-400 block truncate">{mask(item.totalExpense)}</span>
                </div>
                <div className="p-2 rounded-xl bg-surface-2 border border-zinc-800">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase block">Pemasukan</span>
                  <span className="tabular text-xs font-bold text-teal-400 block truncate">{mask(item.totalIncome)}</span>
                </div>
                <div className="p-2 rounded-xl bg-surface-2 border border-zinc-800">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase block">Sisa Bersih</span>
                  <span className={`tabular text-xs font-bold block truncate ${item.netBalance >= 0 ? "text-teal-400" : "text-rose-400"}`}>
                    {mask(item.netBalance)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-800">
                {item.topExpenseCategory ? (
                  <span className="truncate">
                    Pos Terbesar: <strong className="text-zinc-200">{item.topExpenseCategory.name}</strong> ({mask(item.topExpenseCategory.total)})
                  </span>
                ) : (
                  <span className="text-zinc-500">Tidak ada pengeluaran</span>
                )}

                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/?year=${item.year}&month=${item.month}`}>
                    <Button variant="ghost" size="sm">
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Dashboard
                    </Button>
                  </Link>
                  <Link href={`/transaksi?year=${item.year}&month=${item.month}`}>
                    <Button size="sm">
                      <Receipt className="h-3.5 w-3.5" />
                      Transaksi
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
