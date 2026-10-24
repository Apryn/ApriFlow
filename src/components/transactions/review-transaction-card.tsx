"use client";

import { useState } from "react";
import { confirmTransactionAction, ignoreTransactionAction, updatePendingTransactionAction } from "@/actions/transaction.actions";
import { formatRupiah } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { TypeToggle, type TxType } from "@/components/ui/type-toggle";
import { Alert } from "@/components/ui/alert";
import { PAYMENT_METHODS } from "@/lib/constants/payment-methods";
import { Check, Edit2, Trash2, X, Sparkles, Calendar, Tag, CreditCard, ShoppingBag, MessageSquare } from "lucide-react";
import type { Category, TransactionWithCategory } from "@/types/database.types";

interface ReviewTransactionCardProps {
  transaction: TransactionWithCategory;
  categories: Category[];
  onActionComplete: () => void;
}

export function ReviewTransactionCard({ transaction, categories, onActionComplete }: ReviewTransactionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState(transaction.amount);
  const [type, setType] = useState<TxType>(transaction.type as TxType);

  const handleConfirm = async () => {
    setActionPending(true);
    setError(null);
    try {
      const res = await confirmTransactionAction(transaction.id);
      if (res.error) throw new Error(res.error);
      onActionComplete();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mengonfirmasi transaksi.";
      setError(errorMessage);
      setActionPending(false);
    }
  };

  const handleIgnore = async () => {
    setActionPending(true);
    setError(null);
    try {
      const res = await ignoreTransactionAction(transaction.id);
      if (res.error) throw new Error(res.error);
      onActionComplete();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal mengabaikan transaksi.";
      setError(errorMessage);
      setActionPending(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("amount", String(amount));
    formData.set("type", type);

    try {
      const res = await updatePendingTransactionAction(transaction.id, {}, formData);
      if (res.error) throw new Error(res.error);
      setIsEditing(false);
      onActionComplete();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      setError(errorMessage);
      setActionPending(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === type);
  const isIncome = transaction.type === "income";
  const paymentMethodLabel = PAYMENT_METHODS.find((pm) => pm.value === transaction.payment_method)?.label ?? transaction.payment_method;

  if (isEditing) {
    return (
      <Card className="space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            <Edit2 className="h-3.5 w-3.5 text-teal-400" />
            Edit Draf Transaksi
          </h3>
          <button
            onClick={() => setIsEditing(false)}
            className="text-zinc-500 hover:text-zinc-200"
            disabled={actionPending}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleUpdate} className="space-y-3 text-left">
          <div>
            <Label>Tipe</Label>
            <TypeToggle value={type} onChange={setType} />
          </div>

          <div>
            <Label htmlFor="card-amount">Nominal</Label>
            <Input
              id="card-amount"
              type="number"
              value={amount === 0 ? "" : amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Rp 0"
              required
            />
          </div>

          <div>
            <Label htmlFor="card-category_id">Kategori</Label>
            <Select
              id="card-category_id"
              name="category_id"
              defaultValue={transaction.category_id ?? ""}
              required
            >
              <option value="" disabled>
                Pilih kategori
              </option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="card-date">Tanggal</Label>
            <Input
              id="card-date"
              name="date"
              type="date"
              defaultValue={transaction.date}
              required
            />
          </div>

          <div>
            <Label htmlFor="card-payment_method">Pembayaran</Label>
            <Select
              id="card-payment_method"
              name="payment_method"
              defaultValue={transaction.payment_method}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="card-merchant">Merchant</Label>
            <Input
              id="card-merchant"
              name="merchant"
              defaultValue={transaction.merchant ?? ""}
              placeholder="Contoh: Kopi Kenangan"
            />
          </div>

          <div>
            <Label htmlFor="card-note">Catatan</Label>
            <Textarea
              id="card-note"
              name="note"
              defaultValue={transaction.note ?? ""}
              placeholder="Masukkan catatan..."
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            <Button
              type="submit"
              size="sm"
              className="flex-1"
              disabled={actionPending}
            >
              Simpan & Konfirmasi
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setIsEditing(false)}
              disabled={actionPending}
            >
              Batal
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400">
            <Sparkles className="h-3.5 w-3.5" />
            AI Draft
          </div>
          {transaction.raw_input && (
            <p className="text-xs text-zinc-400 italic bg-surface-2 px-2.5 py-1.5 rounded-lg border border-zinc-800">
              &quot;{transaction.raw_input}&quot;
            </p>
          )}
        </div>
        {transaction.ai_confidence !== null && (
          <Badge variant="success" className="shrink-0 ml-2">
            Akurasi {Math.round(transaction.ai_confidence * 100)}%
          </Badge>
        )}
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="space-y-2 border-y border-zinc-800 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-zinc-400 font-medium">Nominal</span>
          <span className={`tabular text-base font-bold ${isIncome ? "text-teal-400" : "text-rose-400"}`}>
            {isIncome ? "+" : "-"} {formatRupiah(transaction.amount)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <Tag className="h-3 w-3 shrink-0" />
            <span>Kategori</span>
          </div>
          <div className="font-semibold text-zinc-200 text-right">
            {transaction.category?.name ?? "Lain-lain"}
          </div>

          <div className="flex items-center gap-1.5 text-zinc-500">
            <CreditCard className="h-3 w-3 shrink-0" />
            <span>Pembayaran</span>
          </div>
          <div className="font-semibold text-zinc-200 text-right">{paymentMethodLabel}</div>

          <div className="flex items-center gap-1.5 text-zinc-500">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>Tanggal</span>
          </div>
          <div className="font-semibold text-zinc-200 text-right">{transaction.date}</div>

          {transaction.merchant && (
            <>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <ShoppingBag className="h-3 w-3 shrink-0" />
                <span>Merchant</span>
              </div>
              <div className="font-semibold text-zinc-200 text-right">{transaction.merchant}</div>
            </>
          )}

          {transaction.note && (
            <>
              <div className="flex items-center gap-1.5 text-zinc-500">
                <MessageSquare className="h-3 w-3 shrink-0" />
                <span>Catatan</span>
              </div>
              <div className="font-semibold text-zinc-200 text-right truncate max-w-[200px]">{transaction.note}</div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={handleConfirm}
          disabled={actionPending}
        >
          <Check className="h-3.5 w-3.5" />
          Setuju
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsEditing(true)}
          disabled={actionPending}
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-zinc-500 hover:text-rose-400"
          onClick={handleIgnore}
          disabled={actionPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Abaikan
        </Button>
      </div>
    </Card>
  );
}
