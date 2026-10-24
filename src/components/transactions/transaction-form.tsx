"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { TypeToggle, type TxType } from "@/components/ui/type-toggle";
import { Alert } from "@/components/ui/alert";
import { createTransaction, updateTransaction, type ActionState } from "@/actions/transaction.actions";
import { PAYMENT_METHODS } from "@/lib/constants/payment-methods";
import { formatRupiahInput, parseRupiahInput } from "@/lib/utils/currency";
import { todayISO } from "@/lib/utils/date";
import type { Category, TransactionWithCategory } from "@/types/database.types";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TransactionFormProps {
  categories: Category[];
  transaction?: TransactionWithCategory;
  redirectTo?: string;
}

const initialState: ActionState = {};

export function TransactionForm({ categories, transaction, redirectTo }: TransactionFormProps) {
  const router = useRouter();
  const isEdit = !!transaction;

  const boundAction = isEdit
    ? updateTransaction.bind(null, transaction.id)
    : createTransaction;

  const [state, formAction, pending] = useActionState(boundAction, initialState);

  const [type, setType] = useState<TxType>(
    (transaction?.type as TxType) ?? "expense"
  );
  const [amountDisplay, setAmountDisplay] = useState(
    transaction ? formatRupiahInput(transaction.amount) : ""
  );

  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (state.success) {
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    }
  }, [state.success, redirectTo, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && <Alert variant="error">{state.error}</Alert>}

      <div>
        <Label>Tipe Transaksi</Label>
        <TypeToggle value={type} onChange={setType} />
      </div>

      <div>
        <Label htmlFor="amount">Nominal</Label>
        <Input
          id="amount"
          name="amount_display"
          inputMode="numeric"
          placeholder="Rp 0"
          value={amountDisplay}
          onChange={(e) => setAmountDisplay(formatRupiahInput(parseRupiahInput(e.target.value)))}
          required
        />
        <input type="hidden" name="amount" value={parseRupiahInput(amountDisplay)} />
      </div>

      <div>
        <Label htmlFor="category_id">Kategori</Label>
        <Select
          key={type}
          id="category_id"
          name="category_id"
          defaultValue={
            transaction && transaction.type === type ? transaction.category_id ?? "" : ""
          }
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
        <Label htmlFor="date">Tanggal</Label>
        <Input
          id="date"
          name="date"
          type="date"
          defaultValue={transaction?.date ?? todayISO()}
          required
        />
      </div>

      <div>
        <Label htmlFor="payment_method">Metode Pembayaran</Label>
        <Select
          id="payment_method"
          name="payment_method"
          defaultValue={transaction?.payment_method ?? "cash"}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="merchant">Merchant / Tempat (opsional)</Label>
        <Input
          id="merchant"
          name="merchant"
          placeholder="Contoh: Indomaret, Warkop"
          defaultValue={transaction?.merchant ?? ""}
        />
      </div>

      <div>
        <Label htmlFor="note">Catatan (opsional)</Label>
        <Textarea
          id="note"
          name="note"
          placeholder="Keterangan transaksi..."
          defaultValue={transaction?.note ?? ""}
        />
      </div>

      <Button type="submit" size="md" className="w-full mt-2" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
            Menyimpan...
          </>
        ) : isEdit ? (
          "Simpan Perubahan"
        ) : (
          "Simpan Transaksi"
        )}
      </Button>
    </form>
  );
}
