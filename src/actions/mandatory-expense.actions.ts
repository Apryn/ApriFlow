"use server";

import { revalidatePath } from "next/cache";
import { getUser, createClient } from "@/lib/supabase/server";
import { getMandatoryExpenses, saveMandatoryExpenses } from "@/lib/db/mandatory-expenses";
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    items.push(newItem);
    await saveMandatoryExpenses(user.id, items);

    try {
      await new CacheRepository().invalidate(user.id);
    } catch {}

    revalidatePath("/");
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

    items[index] = {
      ...items[index],
      name: name.trim(),
      amount: Math.round(amount),
      due_day: dueDay || null,
      updated_at: new Date().toISOString(),
    };

    await saveMandatoryExpenses(user.id, items);

    try {
      await new CacheRepository().invalidate(user.id);
    } catch {}

    revalidatePath("/");
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

    try {
      await new CacheRepository().invalidate(user.id);
    } catch {}

    revalidatePath("/");
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

  try {
    const items = await getMandatoryExpenses(user.id);
    const item = items.find((it) => it.id === id);
    if (!item) return { error: "Data tidak ditemukan.", success: false };

    let isPaid = false;
    if (!item.paid_months) item.paid_months = [];

    if (item.paid_months.includes(monthKey)) {
      item.paid_months = item.paid_months.filter((m) => m !== monthKey);
      isPaid = false;
    } else {
      item.paid_months.push(monthKey);
      isPaid = true;
    }
    item.updated_at = new Date().toISOString();

    await saveMandatoryExpenses(user.id, items);
    revalidatePath("/");
    return { success: true, isPaid };
  } catch (err: any) {
    return { error: err.message || "Gagal mengubah status.", success: false };
  }
}
