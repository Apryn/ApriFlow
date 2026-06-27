"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteTransaction } from "@/actions/transaction.actions";
import { getPaymentMethodLabel } from "@/lib/constants/payment-methods";
import { formatRupiah } from "@/lib/utils/currency";
import { formatDateId } from "@/lib/utils/date";
import type { TransactionWithCategory } from "@/types/database.types";
import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TransactionListProps {
  transactions: TransactionWithCategory[];
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

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <Card key={tx.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={tx.type === "income" ? "success" : "danger"}>
                  {tx.type === "income" ? "Masuk" : "Keluar"}
                </Badge>
                {tx.category && (
                  <span className="truncate text-sm text-gray-500">{tx.category.name}</span>
                )}
              </div>
              <p className="mt-1 font-semibold text-gray-900">
                {tx.merchant || tx.note || "Tanpa keterangan"}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {formatDateId(tx.date)} · {getPaymentMethodLabel(tx.payment_method)}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`font-semibold ${
                  tx.type === "income" ? "text-teal-600" : "text-red-500"
                }`}
              >
                {tx.type === "income" ? "+" : "-"}
                {formatRupiah(tx.amount)}
              </p>
              <div className="mt-2 flex justify-end gap-1">
                <Link href={`/transaksi/${tx.id}/edit`}>
                  <Button variant="ghost" size="sm" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Hapus"
                  disabled={isPending && deletingId === tx.id}
                  onClick={() => handleDelete(tx.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
