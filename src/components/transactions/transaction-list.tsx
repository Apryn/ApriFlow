"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteTransaction } from "@/actions/transaction.actions";
import { getPaymentMethodLabel } from "@/lib/constants/payment-methods";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { TransactionWithCategory } from "@/types/database.types";
import { ArrowLeftRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TransactionListProps {
  transactions: TransactionWithCategory[];
}

function getFriendlyDateLabel(dateStr: string): string {
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const yesterdayISO = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  if (dateStr === todayISO) return "Hari Ini";
  if (dateStr === yesterdayISO) return "Kemarin";

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
        description="Mulai catat pemasukan atau pengeluaran Anda."
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

  const sortedDates = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-4">
      {sortedDates.map((dateStr) => {
        const group = groupedData[dateStr];
        const dateLabel = getFriendlyDateLabel(dateStr);

        return (
          <div key={dateStr} className="space-y-1.5">
            <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-zinc-400">
              <span>{dateLabel}</span>
              <div className="tabular flex gap-2">
                {group.totalIncome > 0 && (
                  <span className="text-teal-400">+{mask(group.totalIncome)}</span>
                )}
                {group.totalExpense > 0 && (
                  <span className="text-rose-400">-{mask(group.totalExpense)}</span>
                )}
              </div>
            </div>

            <Card className="p-0 overflow-hidden divide-y divide-zinc-800">
              {group.items.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 gap-3 transition-colors hover:bg-zinc-800/40"
                >
                  <Link
                    href={`/transaksi/${tx.id}/edit`}
                    className="flex min-w-0 flex-1 items-center gap-2.5 group/link"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        tx.type === "income" ? "bg-teal-400" : "bg-rose-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="truncate text-sm font-semibold text-zinc-100 group-hover/link:text-teal-400 transition-colors">
                          {tx.merchant || tx.note || "Tanpa keterangan"}
                        </span>
                        {tx.category && (
                          <span className="shrink-0 text-[10px] text-zinc-500 font-normal">
                            · {tx.category.name}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-[11px] text-zinc-500 mt-0.5">
                        {getPaymentMethodLabel(tx.payment_method)}
                        {tx.merchant && tx.note && ` · ${tx.note}`}
                      </p>
                    </div>
                  </Link>

                  <div className="tabular flex shrink-0 items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        tx.type === "income" ? "text-teal-400" : "text-rose-400"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {mask(tx.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-600 hover:text-rose-400"
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
