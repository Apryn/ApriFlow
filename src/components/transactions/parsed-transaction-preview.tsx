"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

interface ParsedTransactionPreviewProps {
  transactionId: string;
  onActionComplete?: (
    action: "confirm" | "ignore" | "update",
    details?: { amount: number; categoryName: string; type: string }
  ) => void;
}

export function ParsedTransactionPreview({ transactionId, onActionComplete }: ParsedTransactionPreviewProps) {
  const [transaction, setTransaction] = useState<TransactionWithCategory | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<TxType>("expense");

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [txRes, catRes] = await Promise.all([
          supabase
            .from("transactions")
            .select("*, category:categories(id, name, expense_kind)")
            .eq("id", transactionId)
            .eq("user_id", user.id)
            .single(),
          supabase
            .from("categories")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("sort_order")
        ]);

        if (txRes.error) throw txRes.error;
        if (catRes.error) throw catRes.error;

        const txData = txRes.data as TransactionWithCategory;
        setTransaction(txData);
        setCategories(catRes.data as Category[]);
        setAmount(txData.amount);
        setType(txData.type as TxType);
      } catch (err: unknown) {
        console.error("Error fetching preview data:", err);
        setError("Gagal memuat pratinjau transaksi.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [transactionId, supabase]);

  const handleConfirm = async () => {
    setActionPending(true);
    setError(null);
    try {
      const res = await confirmTransactionAction(transactionId);
      if (res.error) throw new Error(res.error);
      
      const categoryName = transaction?.category?.name || "Lain-lain";
      const txAmount = transaction?.amount || 0;
      const txType = transaction?.type || "expense";

      if (onActionComplete) {
        onActionComplete("confirm", { amount: txAmount, categoryName, type: txType });
      }
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
      const res = await ignoreTransactionAction(transactionId);
      if (res.error) throw new Error(res.error);
      if (onActionComplete) onActionComplete("ignore");
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

    const categoryId = formData.get("category_id") as string;
    const cat = categories.find((c) => c.id === categoryId);
    const categoryName = cat?.name || "Lain-lain";

    try {
      const res = await updatePendingTransactionAction(transactionId, {}, formData);
      if (res.error) throw new Error(res.error);
      setIsEditing(false);
      if (onActionComplete) {
        onActionComplete("update", { amount, categoryName, type });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      setError(errorMessage);
      setActionPending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 text-xs font-semibold text-zinc-400">
        <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        Memuat draf transaksi...
      </div>
    );
  }

  if (error && !transaction) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!transaction) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  if (!isEditing) {
    const isIncome = transaction.type === "income";
    const paymentMethodLabel = PAYMENT_METHODS.find((pm) => pm.value === transaction.payment_method)?.label ?? transaction.payment_method;

    return (
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400">
            <Sparkles className="h-3.5 w-3.5" />
            AI Draft Transaksi
          </div>
          {transaction.ai_confidence !== null && (
            <Badge variant="success">
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
            <div className="font-semibold text-zinc-200 text-right">
              {paymentMethodLabel}
            </div>

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
                <div className="font-semibold text-zinc-200 text-right truncate max-w-[150px]">{transaction.note}</div>
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
          <Label htmlFor="edit-amount">Nominal</Label>
          <Input
            id="edit-amount"
            type="number"
            value={amount === 0 ? "" : amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Rp 0"
            required
          />
        </div>

        <div>
          <Label htmlFor="edit-category_id">Kategori</Label>
          <Select
            id="edit-category_id"
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
          <Label htmlFor="edit-date">Tanggal</Label>
          <Input
            id="edit-date"
            name="date"
            type="date"
            defaultValue={transaction.date}
            required
          />
        </div>

        <div>
          <Label htmlFor="edit-payment_method">Pembayaran</Label>
          <Select
            id="edit-payment_method"
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
          <Label htmlFor="edit-merchant">Merchant</Label>
          <Input
            id="edit-merchant"
            name="merchant"
            defaultValue={transaction.merchant ?? ""}
            placeholder="Contoh: Kopi Kenangan"
          />
        </div>

        <div>
          <Label htmlFor="edit-note">Catatan</Label>
          <Textarea
            id="edit-note"
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
