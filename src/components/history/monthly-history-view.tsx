"use client";

import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { MonthlyHistoryData } from "@/types/database.types";
import {
  TrendingDown,
  TrendingUp,
  Scale,
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  HelpCircle,
  Receipt,
  LayoutDashboard,
  CheckCircle2,
  Clock,
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
    <div className="space-y-6">
      {/* Hero Comparison: "Bulan Kemarin Habis Berapa?" */}
      <Card className="border-2 border-black bg-zinc-900 p-4 sm:p-5 shadow-[4px_4px_0px_0px_#2dd4bf] space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 border-2 border-teal-400 text-teal-400 shadow-[1.5px_1.5px_0px_0px_#000]">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-zinc-100 uppercase tracking-wide">
                Perbandingan Bulan Ini vs Bulan Kemarin
              </h2>
              <p className="text-xs text-zinc-400">
                Ringkasan cepat untuk mengevaluasi pengeluaran Anda
              </p>
            </div>
          </div>

          <Badge variant="info" className="text-[10px] font-black uppercase px-2 py-0.5">
            Arsip Arus Kas
          </Badge>
        </div>

        {/* 2 Side-by-side cards: Bulan Kemarin vs Bulan Ini */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Bulan Kemarin Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border-2 border-black shadow-[2px_2px_0px_0px_#f43f5e] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-zinc-400 uppercase tracking-wider">
                Bulan Kemarin ({lastMonth.monthLabel})
              </span>
              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-black">
                {lastMonth.transactionCount} transaksi
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-zinc-400 block">Total Pengeluaran:</span>
              <p className="text-lg sm:text-xl font-black text-rose-400 tracking-tight">
                {mask(lastMonth.totalExpense)}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-900 font-bold">
              <span className="text-zinc-500">Pemasukan: {mask(lastMonth.totalIncome)}</span>
              <span className={lastMonth.netBalance >= 0 ? "text-teal-400" : "text-rose-400"}>
                Sisa: {mask(lastMonth.netBalance)}
              </span>
            </div>
          </div>

          {/* Bulan Ini Card */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border-2 border-black shadow-[2px_2px_0px_0px_#2dd4bf] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-teal-400 uppercase tracking-wider">
                Bulan Ini ({currentMonth.monthLabel})
              </span>
              <span className="text-[10px] font-bold text-teal-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-teal-500/30">
                {currentMonth.transactionCount} transaksi
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-zinc-400 block">Total Pengeluaran:</span>
              <p className="text-lg sm:text-xl font-black text-zinc-100 tracking-tight">
                {mask(currentMonth.totalExpense)}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-900 font-bold">
              <span className="text-zinc-500">Pemasukan: {mask(currentMonth.totalIncome)}</span>
              <span className={currentMonth.netBalance >= 0 ? "text-teal-400" : "text-rose-400"}>
                Sisa: {mask(currentMonth.netBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Insight / Difference Banner */}
        <div className="p-3 rounded-xl bg-zinc-950 border-2 border-black flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-black ${
              isMoreFrugal
                ? "bg-teal-500/20 text-teal-400 shadow-[1.5px_1.5px_0px_0px_#2dd4bf]"
                : "bg-rose-500/20 text-rose-400 shadow-[1.5px_1.5px_0px_0px_#f43f5e]"
            }`}
          >
            {isMoreFrugal ? (
              <ArrowDownRight className="h-5 w-5" />
            ) : (
              <ArrowUpRight className="h-5 w-5" />
            )}
          </div>

          <div className="text-xs leading-relaxed">
            {lastMonth.totalExpense > 0 ? (
              isMoreFrugal ? (
                <p className="font-bold text-zinc-200">
                  Bulan ini Anda <strong className="text-teal-400 font-black">lebih hemat {mask(absDiff)}</strong> dibanding bulan kemarin ({lastMonth.monthLabel}). Pertahankan ritme belanja Anda! 👏
                </p>
              ) : (
                <p className="font-bold text-zinc-200">
                  Pengeluaran bulan ini <strong className="text-rose-400 font-black">naik {mask(absDiff)}</strong> dibanding bulan kemarin ({lastMonth.monthLabel}). Cek pos pengeluaran fleksibel atau bocor halus Anda.
                </p>
              )
            ) : (
              <p className="font-bold text-zinc-200">
                Bulan kemarin belum ada pengeluaran yang tercatat. Rata-rata pengeluaran bulanan Anda saat ini adalah <strong className="text-teal-400 font-black">{mask(overallAverageExpense)}</strong>.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Monthly History Timeline Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Daftar Riwayat Per Bulan
          </h2>
          <span className="text-[11px] font-bold text-zinc-500">
            Menampilkan {months.length} bulan terakhir
          </span>
        </div>

        <div className="grid gap-3.5">
          {months.map((item, idx) => {
            const isCurrent = idx === 0;
            const isLast = idx === 1;

            return (
              <Card
                key={`${item.year}-${item.month}`}
                className="p-4 sm:p-5 border-2 border-black bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all space-y-3.5"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-400 shrink-0" />
                    <span className="text-sm sm:text-base font-black text-zinc-100">
                      {item.monthLabel}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                        Bulan Ini
                      </span>
                    )}
                    {isLast && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Bulan Kemarin
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-black shadow-[1px_1px_0px_0px_#000]">
                    {item.transactionCount} Transaksi
                  </span>
                </div>

                {/* Metrics 3-Col Grid */}
                <div className="grid grid-cols-3 gap-2 text-center sm:text-left">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-950 border border-black">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Pengeluaran
                    </span>
                    <span className="text-xs sm:text-sm font-black text-rose-400 mt-0.5 block break-all">
                      {mask(item.totalExpense)}
                    </span>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-950 border border-black">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Pemasukan
                    </span>
                    <span className="text-xs sm:text-sm font-black text-teal-400 mt-0.5 block break-all">
                      {mask(item.totalIncome)}
                    </span>
                  </div>

                  <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-950 border border-black">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Sisa Bersih
                    </span>
                    <span
                      className={`text-xs sm:text-sm font-black mt-0.5 block break-all ${
                        item.netBalance >= 0 ? "text-teal-400" : "text-rose-400"
                      }`}
                    >
                      {mask(item.netBalance)}
                    </span>
                  </div>
                </div>

                {/* Extra Details & Category */}
                <div className="flex items-center justify-between text-xs font-bold text-zinc-400 flex-wrap gap-2 pt-0.5">
                  {item.topExpenseCategory ? (
                    <span className="flex items-center gap-1.5">
                      <span className="text-zinc-500">Pos Terbesar:</span>
                      <strong className="text-zinc-200">
                        {item.topExpenseCategory.name}
                      </strong>{" "}
                      ({mask(item.topExpenseCategory.total)})
                    </span>
                  ) : (
                    <span className="text-zinc-600">Tidak ada pengeluaran</span>
                  )}

                  {item.expensePercentChange != null && (
                    <span
                      className={`text-[11px] font-bold flex items-center gap-1 ${
                        item.expensePercentChange > 0
                          ? "text-rose-400"
                          : item.expensePercentChange < 0
                          ? "text-teal-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {item.expensePercentChange > 0 ? (
                        <>
                          <ArrowUpRight className="h-3 w-3" />+{item.expensePercentChange}% vs bln sblmnya
                        </>
                      ) : item.expensePercentChange < 0 ? (
                        <>
                          <ArrowDownRight className="h-3 w-3" />{item.expensePercentChange}% vs bln sblmnya
                        </>
                      ) : (
                        "Stabil vs bln sblmnya"
                      )}
                    </span>
                  )}
                </div>

                {/* Quick Action Navigation */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                  <Link href={`/?year=${item.year}&month=${item.month}`}>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] h-8 px-3"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 mr-1 text-teal-400" />
                      Dashboard Bulan Ini
                    </Button>
                  </Link>
                  <Link href={`/transaksi?year=${item.year}&month=${item.month}`}>
                    <Button
                      size="sm"
                      className="text-xs font-black bg-teal-400 hover:bg-teal-300 text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] h-8 px-3"
                    >
                      <Receipt className="h-3.5 w-3.5 mr-1" />
                      Lihat Transaksi
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
