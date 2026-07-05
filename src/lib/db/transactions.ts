import { createClient } from "@/lib/supabase/server";
import type { Category, TransactionWithCategory } from "@/types/database.types";

export async function getCategories(userId: string, type?: "income" | "expense"): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("sort_order");

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getTransactions(
  userId: string,
  year: number,
  month: number,
  categoryName?: string
): Promise<TransactionWithCategory[]> {
  const supabase = await createClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const selectStr = categoryName
    ? "*, category:categories!inner(id, name, expense_kind)"
    : "*, category:categories(id, name, expense_kind)";

  let query = supabase
    .from("transactions")
    .select(selectStr)
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .is("deleted_at", null)
    .gte("date", start)
    .lte("date", end);

  if (categoryName) {
    query = query.eq("categories.name", categoryName);
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as TransactionWithCategory[];
}

export async function getTransactionById(
  userId: string,
  id: string
): Promise<TransactionWithCategory | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, category:categories(id, name, expense_kind)")
    .eq("user_id", userId)
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) return null;
  return data as TransactionWithCategory;
}
