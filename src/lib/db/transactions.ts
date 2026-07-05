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

  const categories = data ?? [];

  // Lazy check and seed 'Jajan' category for this user if it doesn't exist
  const hasJajan = categories.some(
    (c) => c.name.toLowerCase() === "jajan" && c.type === "expense"
  );

  if (!hasJajan && (!type || type === "expense")) {
    try {
      const { data: newCat, error: insertError } = await supabase
        .from("categories")
        .insert({
          user_id: userId,
          name: "Jajan",
          type: "expense",
          expense_kind: "bocor",
          sort_order: 3,
        })
        .select()
        .single();

      if (!insertError && newCat) {
        categories.push(newCat as Category);
        categories.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        // Auto-reclassify any existing transactions containing "jajan" in note or merchant
        await supabase
          .from("transactions")
          .update({ category_id: newCat.id })
          .eq("user_id", userId)
          .or("note.ilike.%jajan%,merchant.ilike.%jajan%");
      }
    } catch (err) {
      console.error("Failed to lazy seed Jajan category:", err);
    }
  }

  return categories;
}

export async function getTransactions(
  userId: string,
  year: number,
  month: number,
  categoryName?: string,
  searchQuery?: string,
  startDate?: string,
  endDate?: string
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
    .is("deleted_at", null);

  if (startDate) {
    query = query.gte("date", startDate);
  } else {
    query = query.gte("date", start);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  } else {
    query = query.lte("date", end);
  }

  if (categoryName) {
    query = query.eq("categories.name", categoryName);
  }

  if (searchQuery) {
    query = query.or(`note.ilike.%${searchQuery}%,merchant.ilike.%${searchQuery}%`);
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
