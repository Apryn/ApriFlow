"use client";

import { useState } from "react";
import { ReviewTransactionCard } from "./review-transaction-card";
import { Card } from "@/components/ui/card";
import type { Category, TransactionWithCategory } from "@/types/database.types";
import { ClipboardCheck } from "lucide-react";

interface PendingTransactionListProps {
  initialTransactions: TransactionWithCategory[];
  categories: Category[];
}

export function PendingTransactionList({ initialTransactions, categories }: PendingTransactionListProps) {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>(initialTransactions);

  const handleActionComplete = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  if (transactions.length === 0) {
    return (
      <Card className="border-2 border-dashed border-teal-500 bg-zinc-900 text-center py-12 px-4 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
          <ClipboardCheck className="h-6 w-6 text-teal-400" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-black text-teal-400 uppercase tracking-wider">Antrean Review Bersih!</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
            Semua draf transaksi AI sudah dikonfirmasi atau diabaikan. Dashboard Anda sinkron sepenuhnya.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-400 px-1">
        <span>Ada {transactions.length} draf menunggu persetujuan Anda</span>
      </div>

      <div className="grid gap-4">
        {transactions.map((tx) => (
          <ReviewTransactionCard
            key={tx.id}
            transaction={tx}
            categories={categories}
            onActionComplete={() => handleActionComplete(tx.id)}
          />
        ))}
      </div>
    </div>
  );
}
