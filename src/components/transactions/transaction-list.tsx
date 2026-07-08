"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteTransaction } from "@/actions/transaction.actions";
import { getPaymentMethodLabel } from "@/lib/constants/payment-methods";
import { formatRupiah } from "@/lib/utils/currency";
import { useVisibility } from "@/components/providers/visibility-provider";
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
  const { mask } = useVisibility();
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
      <Card className="p-3.5 bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] rounded-2xl grid grid-cols-3 gap-2 text-center divide-x divide-black">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Masuk</span>
          <span className="block text-xs sm:text-sm font-extrabold text-teal-400 truncate">
            {mask(totalIncome)}
          </span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Keluar</span>
          <span className="block text-xs sm:text-sm font-extrabold text-rose-400 truncate">
            {mask(totalExpense)}
          </span>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Sisa Bersih</span>
          <span className={`block text-xs sm:text-sm font-extrabold truncate ${netBalance >= 0 ? "text-teal-400" : "text-rose-400"}`}>
            {mask(netBalance)}
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
            <div className="flex items-center justify-between px-1.5 text-[10px] font-bold uppercase tracking-wider">
              <span className="text-zinc-400">{dateLabel}</span>
              <div className="flex gap-2">
                {group.totalIncome > 0 && (
                  <span className="text-teal-400">+{mask(group.totalIncome)}</span>
                )}
                {group.totalExpense > 0 && (
                  <span className="text-rose-400">-{mask(group.totalExpense)}</span>
                )}
              </div>
            </div>

            {/* Group Card holding all transactions for this day */}
            <Card className="p-0 overflow-hidden divide-y divide-black border-2 border-black bg-zinc-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              {group.items.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3.5 gap-3 hover:bg-zinc-800/40 transition-colors duration-150">
                  {/* Clickable Area pointing to Edit Page */}
                  <Link href={`/transaksi/${tx.id}/edit`} className="min-w-0 flex-1 flex items-center gap-2.5 group/link">
                    {/* Minimalist Dot Indicator */}
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full border border-black ${
                      tx.type === "income" ? "bg-teal-400" : "bg-rose-500"
                    }`} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-sm text-zinc-100 truncate group-hover/link:text-teal-400 transition-colors">
                          {tx.merchant || tx.note || "Tanpa keterangan"}
                        </span>
                        {tx.category && (
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-1.5 py-0.5 rounded-full shrink-0 font-bold">
                            {tx.category.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        {getPaymentMethodLabel(tx.payment_method)}
                        {tx.merchant && tx.note && ` · ${tx.note}`}
                      </p>
                    </div>
                  </Link>

                  {/* Right side: Amount and low-contrast delete action */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-xs min-[360px]:text-sm font-extrabold ${
                      tx.type === "income" ? "text-teal-400" : "text-rose-400"
                    }`}>
                      {tx.type === "income" ? "+" : "-"}
                      {mask(tx.amount)}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-lg hover:bg-red-500/20 border border-transparent hover:border-red-500/30 hover:text-red-400 text-zinc-600 transition-all shrink-0 active:translate-y-0 active:translate-x-0"
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
