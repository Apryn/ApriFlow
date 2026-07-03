"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteTransaction } from "@/actions/transaction.actions";
import { getPaymentMethodLabel } from "@/lib/constants/payment-methods";
import { formatRupiah } from "@/lib/utils/currency";
import type { TransactionWithCategory } from "@/types/database.types";
import { ArrowLeftRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TransactionListProps {
  transactions: TransactionWithCategory[];
}

function getFriendlyDateLabel(dateStr: string): string {
  // Get local date representation in ISO format (YYYY-MM-DD)
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const yesterdayISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  if (dateStr === todayISO) {
    return "Hari Ini";
  }
  if (dateStr === yesterdayISO) {
    return "Kemarin";
  }

  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export function TransactionList({ transactions }: TransactionListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="Belum ada transaksi"
        description="Mulai catat pemasukan atau pengeluaranmu lewat Tambah Cepat."
      />
    );
  }

  function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    setDeletingId(id);
    startTransition(async () => {
      await deleteTransaction(id);
      setDeletingId(null);
      router.refresh();
    });
  }

  // Calculate monthly totals
  const totalIncome = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const netBalance = totalIncome - totalExpense;

  // Group transactions by date
  const groupedData = transactions.reduce((acc, tx) => {
    const dateStr = tx.date;
    if (!acc[dateStr]) {
      acc[dateStr] = {
        items: [],
        totalIncome: 0,
        totalExpense: 0,
      };
    }
    acc[dateStr].items.push(tx);
    if (tx.type === "income") {
      acc[dateStr].totalIncome += Number(tx.amount);
    } else {
      acc[dateStr].totalExpense += Number(tx.amount);
    }
    return acc;
  }, {} as Record<string, { items: TransactionWithCategory[]; totalIncome: number; totalExpense: number }>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-5">
      {/* Monthly Summary Bar */}
      <Card className="p-3.5 bg-white border border-gray-100/50 shadow-sm rounded-2xl grid grid-cols-3 gap-2 text-center divide-x divide-gray-100">
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Total Masuk</span>
          <span className="block text-xs sm:text-sm font-bold text-teal-600 truncate">
            {formatRupiah(totalIncome)}
          </span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Total Keluar</span>
          <span className="block text-xs sm:text-sm font-bold text-red-500 truncate">
            {formatRupiah(totalExpense)}
          </span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Sisa Bersih</span>
          <span className={`block text-xs sm:text-sm font-bold truncate ${netBalance >= 0 ? "text-teal-600" : "text-red-500"}`}>
            {formatRupiah(netBalance)}
          </span>
        </div>
      </Card>

      {/* Daily Grouped List */}
      {sortedDates.map((dateStr) => {
        const group = groupedData[dateStr];
        const dateLabel = getFriendlyDateLabel(dateStr);

        return (
          <div key={dateStr} className="space-y-1.5 animate-in fade-in duration-300">
            {/* Group Header with Date and Totals */}
            <div className="flex items-center justify-between px-1.5 text-xs font-semibold">
              <span className="text-gray-500 font-medium">{dateLabel}</span>
              <div className="flex gap-2">
                {group.totalIncome > 0 && (
                  <span className="text-teal-600">+{formatRupiah(group.totalIncome)}</span>
                )}
                {group.totalExpense > 0 && (
                  <span className="text-red-500">-{formatRupiah(group.totalExpense)}</span>
                )}
              </div>
            </div>

            {/* Group Card holding all transactions for this day */}
            <Card className="p-0 overflow-hidden divide-y divide-gray-100/70 border border-gray-100/50">
              {group.items.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3.5 gap-3 hover:bg-gray-50/40 transition-colors duration-150">
                  {/* Clickable Area pointing to Edit Page */}
                  <Link href={`/transaksi/${tx.id}/edit`} className="min-w-0 flex-1 flex items-center gap-2.5 group/link">
                    {/* Minimalist Dot Indicator */}
                    <span className={`h-2 w-2 shrink-0 rounded-full ${
                      tx.type === "income" ? "bg-teal-500" : "bg-red-500"
                    }`} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-sm text-gray-900 truncate group-hover/link:text-teal-600 transition-colors">
                          {tx.merchant || tx.note || "Tanpa keterangan"}
                        </span>
                        {tx.category && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">
                            {tx.category.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {getPaymentMethodLabel(tx.payment_method)}
                        {tx.merchant && tx.note && ` · ${tx.note}`}
                      </p>
                    </div>
                  </Link>

                  {/* Right side: Amount and low-contrast delete action */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-xs min-[360px]:text-sm font-bold ${
                      tx.type === "income" ? "text-teal-600" : "text-red-500"
                    }`}>
                      {tx.type === "income" ? "+" : "-"}
                      {formatRupiah(tx.amount)}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-300 transition-colors shrink-0"
                      aria-label="Hapus"
                      disabled={isPending && deletingId === tx.id}
                      onClick={() => handleDelete(tx.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
