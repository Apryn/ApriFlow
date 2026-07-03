"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { confirmTransactionAction, ignoreTransactionAction, updatePendingTransactionAction } from "@/actions/transaction.actions";
import { formatRupiah } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
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

  // States for Edit Form
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<"income" | "expense">("expense");

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
        setType(txData.type as "income" | "expense");
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
      <div className="flex items-center justify-center p-6 text-sm text-gray-500">
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        Memuat draf transaksi...
      </div>
    );
  }

  if (error && !transaction) {
    return <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl">{error}</div>;
  }

  if (!transaction) return null;

  // Filter categories by selected type
  const filteredCategories = categories.filter((c) => c.type === type);

  // Render view mode
  if (!isEditing) {
    const isIncome = transaction.type === "income";
    const paymentMethodLabel = PAYMENT_METHODS.find((pm) => pm.value === transaction.payment_method)?.label ?? transaction.payment_method;

    return (
      <Card className="border border-teal-100 bg-teal-50/20 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700">
            <Sparkles className="h-3.5 w-3.5" />
            AI Draft Transaksi
          </div>
          {transaction.ai_confidence !== null && (
            <Badge variant="success">
              Akurasi {Math.round(transaction.ai_confidence * 100)}%
            </Badge>
          )}
        </div>

        {error && <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</div>}

        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
            <span className="text-xs text-gray-500">Nominal</span>
            <span className={`text-lg font-bold ${isIncome ? "text-teal-600" : "text-red-500"}`}>
              {isIncome ? "+" : "-"} {formatRupiah(transaction.amount)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-gray-600">
              <Tag className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>Kategori</span>
            </div>
            <div className="font-medium text-gray-900 text-right">
              {transaction.category?.name ?? "Lain-lain"}
            </div>

            <div className="flex items-center gap-1.5 text-gray-600">
              <CreditCard className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>Pembayaran</span>
            </div>
            <div className="font-medium text-gray-900 text-right">
              {paymentMethodLabel}
            </div>

            <div className="flex items-center gap-1.5 text-gray-600">
              <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span>Tanggal</span>
            </div>
            <div className="font-medium text-gray-900 text-right">{transaction.date}</div>

            {transaction.merchant && (
              <>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <ShoppingBag className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>Merchant</span>
                </div>
                <div className="font-medium text-gray-900 text-right">{transaction.merchant}</div>
              </>
            )}

            {transaction.note && (
              <>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <MessageSquare className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <span>Catatan</span>
                </div>
                <div className="font-medium text-gray-900 text-right truncate max-w-[150px]">{transaction.note}</div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={handleConfirm}
            disabled={actionPending}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            Setuju
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            onClick={() => setIsEditing(true)}
            disabled={actionPending}
          >
            <Edit2 className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
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

  // Render edit form inline
  return (
    <Card className="border border-teal-200 bg-white p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
          <Edit2 className="h-4 w-4 text-teal-600" />
          Edit Draf Transaksi
        </h3>
        <button
          onClick={() => setIsEditing(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          disabled={actionPending}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleUpdate} className="space-y-3.5 text-left">
        <div>
          <Label>Tipe</Label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            {(["expense", "income"] as const).map((t) => (
              <label
                key={t}
                className={`flex cursor-pointer items-center justify-center rounded-xl border py-2 text-xs font-semibold transition-colors ${
                  type === t
                    ? t === "expense"
                      ? "border-red-300 bg-red-50 text-red-700"
                      : "border-teal-300 bg-teal-50 text-teal-700"
                    : "border-gray-200 bg-white text-gray-600"
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
          <Label htmlFor="edit-amount">Nominal</Label>
          <Input
            id="edit-amount"
            type="number"
            value={amount === 0 ? "" : amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="Rp 0"
            required
            className="py-2.5"
          />
        </div>

        <div>
          <Label htmlFor="edit-category_id">Kategori</Label>
          <Select
            id="edit-category_id"
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
          <Label htmlFor="edit-date">Tanggal</Label>
          <Input
            id="edit-date"
            name="date"
            type="date"
            defaultValue={transaction.date}
            required
            className="py-2.5"
          />
        </div>

        <div>
          <Label htmlFor="edit-payment_method">Pembayaran</Label>
          <Select
            id="edit-payment_method"
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
          <Label htmlFor="edit-merchant">Merchant</Label>
          <Input
            id="edit-merchant"
            name="merchant"
            defaultValue={transaction.merchant ?? ""}
            placeholder="Contoh: Kopi Kenangan"
            className="py-2.5"
          />
        </div>

        <div>
          <Label htmlFor="edit-note">Catatan</Label>
          <Textarea
            id="edit-note"
            name="note"
            defaultValue={transaction.note ?? ""}
            placeholder="Masukkan catatan..."
            className="min-h-[60px]"
          />
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Button
            type="submit"
            size="sm"
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            disabled={actionPending}
          >
            Simpan & Konfirmasi
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
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
