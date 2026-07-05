import { createClient } from "@/lib/supabase/server";
import { getMonthRange } from "@/lib/utils/date";
import type { DashboardSummary, ExpenseKind } from "@/types/database.types";

export async function getDashboardSummary(
  userId: string,
  year: number,
  month: number
): Promise<DashboardSummary> {
  const supabase = await createClient();
  const { start, end } = getMonthRange(year, month);

  const [assetsResult, transactionsResult] = await Promise.all([
    supabase.from("assets").select("value").eq("user_id", userId),
    supabase
      .from("transactions")
      .select("type, amount, category:categories(name, expense_kind)")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .is("deleted_at", null)
      .gte("date", start)
      .lte("date", end),
  ]);

  const totalAssets =
    assetsResult.data?.reduce((sum, a) => sum + Number(a.value), 0) ?? 0;

  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals = new Map<
    string,
    { total: number; count: number; expense_kind: ExpenseKind | null }
  >();

  for (const tx of transactionsResult.data ?? []) {
    const amount = Number(tx.amount);
    if (tx.type === "income") {
      totalIncome += amount;
    } else {
      totalExpense += amount;
      const category = tx.category as { name: string; expense_kind: ExpenseKind | null } | null;
      if (category) {
        const existing = categoryTotals.get(category.name) ?? {
          total: 0,
          count: 0,
          expense_kind: category.expense_kind,
        };
        existing.total += amount;
        existing.count += 1;
        categoryTotals.set(category.name, existing);
      }
    }
  }

  const topExpenseCategories = Array.from(categoryTotals.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    totalAssets,
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    topExpenseCategories,
    transactionCount: transactionsResult.data?.length ?? 0,
  };
}
