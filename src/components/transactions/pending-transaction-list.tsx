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
      <Card className="border-dashed border-teal-200 bg-teal-50/20 text-center py-12 px-4 space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50">
          <ClipboardCheck className="h-6 w-6 text-teal-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-teal-800">Antrean Review Bersih!</h3>
          <p className="text-xs text-teal-600 max-w-xs mx-auto">
            Semua draf transaksi AI sudah dikonfirmasi atau diabaikan. Dashboard Anda sinkron sepenuhnya.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
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
