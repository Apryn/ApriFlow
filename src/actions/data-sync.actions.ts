"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { CacheRepository } from "@/services/ai-engine/repositories/cache.repository";
import type { ParsedTransactionRow } from "@/lib/data-sync/csv-parser";
import { inferCategoryMeta } from "@/lib/data-sync/smart-category";
import { generateTransactionsCsv, generateBackupJson, type FullBackupData } from "@/lib/data-sync/exporter";
import { getMandatoryExpenses, saveMandatoryExpenses } from "@/lib/db/mandatory-expenses";
import type { Category, TransactionWithCategory, Asset, Goal } from "@/types/database.types";

export interface ImportOptions {
  skipDuplicates?: boolean;
}

export interface ImportResponse {
  success: boolean;
  error?: string;
  totalProcessed?: number;
  importedCount?: number;
  skippedDuplicates?: number;
  createdCategories?: string[];
}

export interface ExportResponse {
  success: boolean;
  error?: string;
  data?: string;
  filename?: string;
}

/**
 * Import a list of parsed transactions into Supabase.
 * Handles auto-category creation, duplicate detection, and batch insertion.
 */
export async function importTransactionsAction(
  items: ParsedTransactionRow[],
  options: ImportOptions = { skipDuplicates: true }
): Promise<ImportResponse> {
  const user = await getUser();
  if (!user) return { success: false, error: "Sesi telah berakhir. Silakan login kembali." };

  if (!items || items.length === 0) {
    return { success: false, error: "Tidak ada data transaksi yang dapat diimpor." };
  }

  const supabase = await createClient();

  // 1. Fetch all existing categories for this user
  const { data: existingCategories, error: catError } = await supabase
    .from("categories")
    .select("id, name, type, expense_kind")
    .eq("user_id", user.id);

  if (catError) {
    return { success: false, error: `Gagal memuat kategori: ${catError.message}` };
  }

  const categoryMap = new Map<string, string>(); // key: `${name.toLowerCase()}::${type}` -> id
  (existingCategories || []).forEach((c) => {
    categoryMap.set(`${c.name.toLowerCase()}::${c.type}`, c.id);
  });

  // 2. Identify missing categories and create them
  const neededCategories = new Map<string, { name: string; type: "income" | "expense" }>();
  for (const item of items) {
    const key = `${item.categoryName.toLowerCase()}::${item.type}`;
    if (!categoryMap.has(key)) {
      neededCategories.set(key, { name: item.categoryName, type: item.type });
    }
  }

  const createdCategories: string[] = [];
  if (neededCategories.size > 0) {
    for (const [key, cat] of neededCategories.entries()) {
      const meta = inferCategoryMeta(cat.name, cat.type);
      const { data: newCat, error: insertError } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: cat.name,
          type: cat.type,
          expense_kind: meta.expenseKind,
          icon: meta.icon,
          color: meta.color,
          is_active: true,
          sort_order: 10,
        })
        .select("id, name, type")
        .single();

      if (!insertError && newCat) {
        categoryMap.set(key, newCat.id);
        createdCategories.push(newCat.name);
      } else {
        // If already exists due to race or case uniqueness, re-fetch it
        const { data: found } = await supabase
          .from("categories")
          .select("id")
          .eq("user_id", user.id)
          .ilike("name", cat.name)
          .eq("type", cat.type)
          .maybeSingle();

        if (found) {
          categoryMap.set(key, found.id);
        }
      }
    }
  }

  // 3. Duplicate detection if skipDuplicates is enabled
  const duplicateSet = new Set<string>();
  if (options.skipDuplicates) {
    // Find earliest and latest date in import items
    const dates = items.map((i) => i.date).filter(Boolean).sort();
    if (dates.length > 0) {
      const minDate = dates[0];
      const maxDate = dates[dates.length - 1];

      const { data: existingTx } = await supabase
        .from("transactions")
        .select("date, amount, type, note")
        .eq("user_id", user.id)
        .gte("date", minDate)
        .lte("date", maxDate)
        .is("deleted_at", null);

      (existingTx || []).forEach((t) => {
        const hash = `${t.date}::${t.amount}::${t.type}::${(t.note || "").toLowerCase().trim()}`;
        duplicateSet.add(hash);
      });
    }
  }

  // 4. Filter items and construct insert rows
  const toInsert: any[] = [];
  let skippedDuplicates = 0;

  for (const item of items) {
    const key = `${item.categoryName.toLowerCase()}::${item.type}`;
    const categoryId = categoryMap.get(key) || null;
    const cleanNote = (item.note || "").toLowerCase().trim();
    const hash = `${item.date}::${item.amount}::${item.type}::${cleanNote}`;

    if (options.skipDuplicates && duplicateSet.has(hash)) {
      skippedDuplicates++;
      continue;
    }

    // Add to duplicate set so duplicate rows inside the same CSV file are also deduplicated
    if (options.skipDuplicates) {
      duplicateSet.add(hash);
    }

    const timestamp = item.rawTimestamp || `${item.date}T12:00:00.000Z`;

    toInsert.push({
      user_id: user.id,
      type: item.type,
      category_id: categoryId,
      amount: item.amount,
      date: item.date,
      payment_method: item.paymentMethod,
      merchant: item.merchant || null,
      note: item.note || null,
      source: "bank_import",
      status: "confirmed",
      confirmed_at: timestamp,
      created_at: timestamp,
    });
  }

  // 5. Batch insert in chunks of 50 to avoid limits
  const BATCH_SIZE = 50;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { error: batchError } = await supabase.from("transactions").insert(batch);
    if (batchError) {
      return {
        success: false,
        error: `Gagal menyimpan batch transaksi: ${batchError.message}`,
        importedCount: i,
        skippedDuplicates,
      };
    }
  }

  // Invalidate AI cache & revalidate Next.js paths
  try {
    await new CacheRepository().invalidate(user.id);
  } catch (err) {
    console.warn("Cache invalidate warning:", err);
  }

  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/history");
  revalidatePath("/budgets");

  return {
    success: true,
    totalProcessed: items.length,
    importedCount: toInsert.length,
    skippedDuplicates,
    createdCategories,
  };
}

/**
 * Export all user's transactions as CSV.
 */
export async function exportTransactionsCsvAction(): Promise<ExportResponse> {
  const user = await getUser();
  if (!user) return { success: false, error: "Sesi tidak valid." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(id, name, expense_kind)")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .is("deleted_at", null)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { success: false, error: error.message };
  }

  const csv = generateTransactionsCsv((data || []) as TransactionWithCategory[]);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `apriflow-transaksi-${dateStr}.csv`;

  return {
    success: true,
    data: csv,
    filename,
  };
}

/**
 * Export full backup as JSON (all tables).
 */
export async function exportFullBackupJsonAction(): Promise<ExportResponse> {
  const user = await getUser();
  if (!user) return { success: false, error: "Sesi tidak valid." };

  const supabase = await createClient();

  const [txRes, catRes, assetRes, goalRes, budgetRes, mandatoryItems] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, category:categories(id, name, expense_kind)")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("date", { ascending: false }),
    supabase.from("categories").select("*").eq("user_id", user.id).eq("is_active", true),
    supabase.from("assets").select("*").eq("user_id", user.id),
    supabase.from("goals").select("*").eq("user_id", user.id),
    supabase.from("budgets").select("*").eq("user_id", user.id),
    getMandatoryExpenses(user.id),
  ]);

  const backupData: FullBackupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    appName: "ApriFlow",
    userEmail: user.email,
    transactions: (txRes.data || []) as TransactionWithCategory[],
    categories: (catRes.data || []) as Category[],
    assets: (assetRes.data || []) as Asset[],
    goals: (goalRes.data || []) as Goal[],
    budgets: budgetRes.data || [],
    mandatoryExpenses: mandatoryItems || [],
  };

  const jsonStr = generateBackupJson(backupData);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `apriflow-cadangan-lengkap-${dateStr}.json`;

  return {
    success: true,
    data: jsonStr,
    filename,
  };
}

/**
 * Restore a full JSON backup.
 */
export async function restoreFullBackupJsonAction(
  jsonString: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const user = await getUser();
  if (!user) return { success: false, error: "Sesi tidak valid." };

  let backup: FullBackupData;
  try {
    backup = JSON.parse(jsonString);
  } catch (err: any) {
    return { success: false, error: "Format JSON tidak valid atau rusak." };
  }

  if (!backup || !backup.transactions || !Array.isArray(backup.transactions)) {
    return { success: false, error: "File cadangan tidak berisi data transaksi ApriFlow yang valid." };
  }

  const supabase = await createClient();

  // 1. Sync Categories
  const categoryOldToNewId = new Map<string, string>();
  if (backup.categories && Array.isArray(backup.categories)) {
    for (const cat of backup.categories) {
      const { data: existing } = await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", cat.name)
        .eq("type", cat.type)
        .maybeSingle();

      if (existing) {
        categoryOldToNewId.set(cat.id, existing.id);
      } else {
        const { data: created } = await supabase
          .from("categories")
          .insert({
            user_id: user.id,
            name: cat.name,
            type: cat.type,
            expense_kind: cat.expense_kind,
            icon: cat.icon,
            color: cat.color,
            is_active: true,
            sort_order: cat.sort_order ?? 0,
          })
          .select("id")
          .single();

        if (created) {
          categoryOldToNewId.set(cat.id, created.id);
        }
      }
    }
  }

  // 2. Insert Transactions
  const txToInsert = backup.transactions.map((tx) => {
    const categoryId = tx.category_id ? (categoryOldToNewId.get(tx.category_id) || tx.category_id) : null;
    return {
      user_id: user.id,
      type: tx.type,
      category_id: categoryId,
      amount: tx.amount,
      date: tx.date,
      payment_method: tx.payment_method || "cash",
      merchant: tx.merchant || null,
      note: tx.note || null,
      source: tx.source || "bank_import",
      status: "confirmed" as const,
      confirmed_at: tx.confirmed_at || new Date().toISOString(),
      created_at: tx.created_at || new Date().toISOString(),
    };
  });

  const BATCH_SIZE = 50;
  for (let i = 0; i < txToInsert.length; i += BATCH_SIZE) {
    const batch = txToInsert.slice(i, i + BATCH_SIZE);
    await supabase.from("transactions").insert(batch);
  }

  // 3. Restore Assets if present
  if (backup.assets && Array.isArray(backup.assets) && backup.assets.length > 0) {
    for (const a of backup.assets) {
      await supabase.from("assets").insert({
        user_id: user.id,
        name: a.name,
        type: a.type,
        value: a.value,
        is_liquid: a.is_liquid,
        note: a.note,
      });
    }
  }

  // 4. Restore Goals if present
  if (backup.goals && Array.isArray(backup.goals) && backup.goals.length > 0) {
    for (const g of backup.goals) {
      await supabase.from("goals").insert({
        user_id: user.id,
        name: g.name,
        target_amount: g.target_amount,
        current_amount: g.current_amount || 0,
        target_date: g.target_date,
        notes: g.notes,
        is_completed: g.is_completed || false,
      });
    }
  }

  // 5. Restore Mandatory Expenses if present
  if (backup.mandatoryExpenses && Array.isArray(backup.mandatoryExpenses) && backup.mandatoryExpenses.length > 0) {
    await saveMandatoryExpenses(user.id, backup.mandatoryExpenses);
  }

  try {
    await new CacheRepository().invalidate(user.id);
  } catch (err) {}

  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/history");
  revalidatePath("/aset");
  revalidatePath("/goals");

  return {
    success: true,
    message: `Berhasil memulihkan ${txToInsert.length} transaksi dan data pendukung.`,
  };
}

