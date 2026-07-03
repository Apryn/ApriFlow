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
import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
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
      {sortedDates.map((dateStr) => {
        const group = groupedData[dateStr];
        const dateLabel = getFriendlyDateLabel(dateStr);

        return (
          <div key={dateStr} className="space-y-1.5">
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
                <div key={tx.id} className="flex items-center justify-between p-3.5 gap-3">
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    {/* Visual Indicator of Type */}
                    <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                      tx.type === "income" ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-500"
                    }`}>
                      {tx.type === "income" ? "M" : "K"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {tx.merchant || tx.note || "Tanpa keterangan"}
                        </span>
                        {tx.category && (
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full shrink-0">
                            {tx.category.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {getPaymentMethodLabel(tx.payment_method)}
                        {tx.merchant && tx.note && ` · ${tx.note}`}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Amount and actions */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-xs min-[360px]:text-sm font-bold ${
                      tx.type === "income" ? "text-teal-600" : "text-red-500"
                    }`}>
                      {tx.type === "income" ? "+" : "-"}
                      {formatRupiah(tx.amount)}
                    </span>

                    {/* Action Panel */}
                    <div className="flex items-center gap-0.5 border border-gray-100 rounded-lg p-0.5 bg-gray-50/50">
                      <Link href={`/transaksi/${tx.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-6.5 w-6.5 p-0 hover:bg-white" aria-label="Edit">
                          <Pencil className="h-3 w-3 text-gray-500" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6.5 w-6.5 p-0 hover:bg-white"
                        aria-label="Hapus"
                        disabled={isPending && deletingId === tx.id}
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
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
