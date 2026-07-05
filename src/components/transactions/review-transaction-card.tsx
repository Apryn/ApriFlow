"use client";

import { useState } from "react";
import { confirmTransactionAction, ignoreTransactionAction, updatePendingTransactionAction } from "@/actions/transaction.actions";
import { formatRupiah } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
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

  // Edit form states
  const [amount, setAmount] = useState(transaction.amount);
  const [type, setType] = useState<"income" | "expense">(transaction.type as "income" | "expense");

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
      <Card className="border-2 border-black bg-zinc-900 p-4 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
            <Edit2 className="h-4 w-4 text-teal-400" />
            Edit Draf Transaksi
          </h3>
          <button
            onClick={() => setIsEditing(false)}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
            disabled={actionPending}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <div className="text-xs text-red-400 bg-zinc-950 p-2 border border-red-500/30 rounded-lg">{error}</div>}

        <form onSubmit={handleUpdate} className="space-y-3.5 text-left">
          <div>
            <Label>Tipe</Label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(["expense", "income"] as const).map((t) => (
                <label
                  key={t}
                  className={`flex cursor-pointer items-center justify-center rounded-xl border-2 py-2 text-xs font-bold transition-all ${
                    type === t
                      ? t === "expense"
                        ? "border-black bg-rose-500 text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                        : "border-black bg-teal-400 text-black shadow-[2px_2px_0px_0px_#000] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                      : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="sr-only"
                  />
                  {t === "expense" ? "Pengeluaran" : "Pemasukan"}
                </label>
              ))}
            </div>
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
              className="py-2.5"
            />
          </div>

          <div>
            <Label htmlFor="card-category_id">Kategori</Label>
            <Select
              id="card-category_id"
              name="category_id"
              defaultValue={transaction.category_id ?? ""}
              required
              className="py-2.5"
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
              className="py-2.5"
            />
          </div>

          <div>
            <Label htmlFor="card-payment_method">Pembayaran</Label>
            <Select
              id="card-payment_method"
              name="payment_method"
              defaultValue={transaction.payment_method}
              className="py-2.5"
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
              className="py-2.5"
            />
          </div>

          <div>
            <Label htmlFor="card-note">Catatan</Label>
            <Textarea
              id="card-note"
              name="note"
              defaultValue={transaction.note ?? ""}
              placeholder="Masukkan catatan..."
              className="min-h-[60px]"
            />
          </div>

          <div className="flex gap-2 pt-3 border-t-2 border-black">
            <Button
              type="submit"
              size="sm"
              className="flex-1 bg-teal-400 hover:bg-teal-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
              disabled={actionPending}
            >
              Simpan & Konfirmasi
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-zinc-800 text-zinc-100 border-2 border-black hover:bg-zinc-700 shadow-[2px_2px_0px_0px_#000]"
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
    <Card className="border-2 border-black bg-zinc-900 p-4 space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            AI Draft
          </div>
          {transaction.raw_input && (
            <p className="text-xs text-zinc-400 italic bg-zinc-950 px-2 py-1.5 rounded-lg border-2 border-black">
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

      {error && <div className="text-xs text-red-400 bg-zinc-950 p-2 border border-red-500/30 rounded-lg">{error}</div>}

      {/* Grid Values */}
      <div className="space-y-2.5">
        <div className="flex items-baseline justify-between border-b-2 border-black pb-2">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nominal</span>
          <span className={`text-lg font-black ${isIncome ? "text-teal-400" : "text-rose-400"}`}>
            {isIncome ? "+" : "-"} {formatRupiah(transaction.amount)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-y-2.5 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
            <Tag className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <span>Kategori</span>
          </div>
          <div className="font-bold text-zinc-100 text-right">
            {transaction.category?.name ?? "Lain-lain"}
          </div>

          <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
            <CreditCard className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <span>Pembayaran</span>
          </div>
          <div className="font-bold text-zinc-100 text-right">{paymentMethodLabel}</div>

          <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
            <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <span>Tanggal</span>
          </div>
          <div className="font-bold text-zinc-100 text-right">{transaction.date}</div>

          {transaction.merchant && (
            <>
              <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
                <ShoppingBag className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span>Merchant</span>
              </div>
              <div className="font-bold text-zinc-100 text-right">{transaction.merchant}</div>
            </>
          )}

          {transaction.note && (
            <>
              <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
                <MessageSquare className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span>Catatan</span>
              </div>
              <div className="font-bold text-zinc-100 text-right truncate max-w-[200px]">{transaction.note}</div>
            </>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t-2 border-black">
        <Button
          size="sm"
          className="flex-1 bg-teal-400 hover:bg-teal-300 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000]"
          onClick={handleConfirm}
          disabled={actionPending}
        >
          <Check className="mr-1 h-3.5 w-3.5" />
          Setuju
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="bg-zinc-800 text-zinc-100 border-2 border-black hover:bg-zinc-700 shadow-[2px_2px_0px_0px_#000]"
          onClick={() => setIsEditing(true)}
          disabled={actionPending}
        >
          <Edit2 className="mr-1 h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="danger"
          className="bg-red-500 text-black border-2 border-black hover:bg-red-400 shadow-[2px_2px_0px_0px_#000]"
          onClick={handleIgnore}
          disabled={actionPending}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Abaikan
        </Button>
      </div>
    </Card>
  );
}
