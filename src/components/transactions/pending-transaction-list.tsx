"use client";

import { useState } from "react";
import { ReviewTransactionCard } from "./review-transaction-card";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
      <Card>
        <EmptyState
          icon={ClipboardCheck}
          title="Antrean Review Bersih"
          description="Semua draf transaksi AI sudah dikonfirmasi atau diabaikan. Keuangan Anda tersinkronisasi."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold text-zinc-400 px-1">
        Ada {transactions.length} draf menunggu persetujuan Anda
      </div>

      <div className="grid gap-3">
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
