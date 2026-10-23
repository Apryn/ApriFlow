"use server";

import { revalidatePath } from "next/cache";
import { getUser, createClient } from "@/lib/supabase/server";
import {
  getMandatoryExpenses,
  saveMandatoryExpenses,
  findMatchingCategory,
  getMandatoryExpenseDate,
} from "@/lib/db/mandatory-expenses";
import type { MandatoryExpense } from "@/types/database.types";
import { CacheRepository } from "@/services/ai-engine/repositories/cache.repository";

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function addMandatoryExpenseAction(
  name: string,
  amount: number,
  dueDay?: number | null,
  categoryName?: string | null
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  if (!name.trim()) return { error: "Nama pengeluaran wajib tidak boleh kosong." };
  if (amount <= 0) return { error: "Nominal harus lebih besar dari Rp 0." };
  if (dueDay !== null && dueDay !== undefined && (dueDay < 1 || dueDay > 31)) {
    return { error: "Tanggal jatuh tempo harus antara 1 sampai 31." };
  }

  try {
    const items = await getMandatoryExpenses(user.id);
    const newItem: MandatoryExpense = {
      id: crypto.randomUUID(),
      name: name.trim(),
      amount: Math.round(amount),
      due_day: dueDay || null,
      category_name: categoryName || null,
      paid_months: [],
      paid_transaction_ids: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    items.push(newItem);
    await saveMandatoryExpenses(user.id, items);

    try {
      await new CacheRepository().invalidate(user.id);
    } catch {}

    revalidatePath("/");
    revalidatePath("/transaksi");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal menambahkan pengeluaran wajib." };
  }
}

export async function updateMandatoryExpenseAction(
  id: string,
  name: string,
  amount: number,
  dueDay?: number | null
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  if (!name.trim()) return { error: "Nama pengeluaran tidak boleh kosong." };
  if (amount <= 0) return { error: "Nominal harus lebih besar dari Rp 0." };
  if (dueDay !== null && dueDay !== undefined && (dueDay < 1 || dueDay > 31)) {
    return { error: "Tanggal jatuh tempo harus antara 1 sampai 31." };
  }

  try {
    const items = await getMandatoryExpenses(user.id);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return { error: "Data pengeluaran tidak ditemukan." };

    const newAmount = Math.round(amount);
    const newName = name.trim();

    items[index] = {
      ...items[index],
      name: newName,
      amount: newAmount,
      due_day: dueDay || null,
      updated_at: new Date().toISOString(),
    };

    await saveMandatoryExpenses(user.id, items);

    // Sync any active transactions created from this mandatory expense
    const supabase = await createClient();
    await supabase
      .from("transactions")
      .update({
        amount: newAmount,
        merchant: newName,
        note: `Pos Wajib: ${newName}`,
      })
      .eq("user_id", user.id)
      .eq("ai_raw_payload->>mandatory_expense_id", id)
      .is("deleted_at", null);

    try {
      await new CacheRepository().invalidate(user.id);
    } catch {}

    revalidatePath("/");
    revalidatePath("/transaksi");
    revalidatePath("/history");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal memperbarui pengeluaran wajib." };
  }
}

export async function deleteMandatoryExpenseAction(id: string): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  try {
    const items = await getMandatoryExpenses(user.id);
    const filtered = items.filter((item) => item.id !== id);
    await saveMandatoryExpenses(user.id, filtered);

    // Soft delete any transactions created from this mandatory expense
    const supabase = await createClient();
    await supabase
      .from("transactions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("ai_raw_payload->>mandatory_expense_id", id)
      .is("deleted_at", null);

    try {
      await new CacheRepository().invalidate(user.id);
    } catch {}

    revalidatePath("/");
    revalidatePath("/transaksi");
    revalidatePath("/history");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal menghapus pengeluaran wajib." };
  }
}

export async function toggleMandatoryExpensePaidAction(
  id: string,
  year: number,
  month: number
): Promise<{ success: boolean; isPaid?: boolean; error?: string }> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang.", success: false };

  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const supabase = await createClient();

  try {
    const items = await getMandatoryExpenses(user.id);
    const item = items.find((it) => it.id === id);
    if (!item) return { error: "Data tidak ditemukan.", success: false };

    let isPaid = false;
    if (!item.paid_months) item.paid_months = [];
    if (!item.paid_transaction_ids) item.paid_transaction_ids = {};

    if (item.paid_months.includes(monthKey)) {
      // UNCHECK: Remove from paid_months and soft delete linked transaction
      item.paid_months = item.paid_months.filter((m) => m !== monthKey);
      isPaid = false;

      const txId = item.paid_transaction_ids[monthKey];
      if (txId) {
        await supabase
          .from("transactions")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", txId)
          .eq("user_id", user.id);
        delete item.paid_transaction_ids[monthKey];
      }

      // Safeguard in case txId was not recorded
      await supabase
        .from("transactions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("ai_raw_payload->>mandatory_expense_id", item.id)
        .eq("ai_raw_payload->>month_key", monthKey)
        .is("deleted_at", null);
    } else {
      // CHECK: Add to paid_months and insert transaction into transactions table
      item.paid_months.push(monthKey);
      isPaid = true;

      const categoryId = await findMatchingCategory(
        supabase,
        user.id,
        item.name,
        item.category_name
      );
      const txDate = getMandatoryExpenseDate(year, month, item.due_day);

      const { data: newTx, error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "expense",
          category_id: categoryId,
          amount: item.amount,
          date: txDate,
          payment_method: "transfer",
          merchant: item.name,
          note: `Pos Wajib: ${item.name}`,
          source: "manual",
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          ai_raw_payload: {
            source_type: "mandatory_expense",
            mandatory_expense_id: item.id,
            month_key: monthKey,
          },
        })
        .select("id")
        .single();

      if (txError) {
        console.error("Failed to create transaction for mandatory expense:", txError);
        return { success: false, error: txError.message };
      }

      if (newTx) {
        item.paid_transaction_ids[monthKey] = newTx.id;
      }
    }

    item.updated_at = new Date().toISOString();

    await saveMandatoryExpenses(user.id, items);

    try {
      await new CacheRepository().invalidate(user.id);
    } catch {}

    revalidatePath("/");
    revalidatePath("/transaksi");
    revalidatePath("/history");
    return { success: true, isPaid };
  } catch (err: any) {
    return { error: err.message || "Gagal mengubah status.", success: false };
  }
}
