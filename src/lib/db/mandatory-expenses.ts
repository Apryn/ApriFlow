import { createClient } from "@/lib/supabase/server";
import type { MandatoryExpense } from "@/types/database.types";

const SCOPE_MANDATORY = "mandatory_expenses";

export async function getMandatoryExpenses(userId: string): Promise<MandatoryExpense[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("analysis_caches")
      .select("report_data")
      .eq("user_id", userId)
      .eq("year", 0)
      .eq("month", 0)
      .eq("scope", SCOPE_MANDATORY)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("Failed to fetch mandatory expenses:", error);
      }
      return [];
    }

    const payload = data?.report_data as { items?: MandatoryExpense[] } | null;
    return payload?.items ?? [];
  } catch (err) {
    console.error("Error reading mandatory expenses:", err);
    return [];
  }
}

export async function saveMandatoryExpenses(
  userId: string,
  items: MandatoryExpense[]
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("analysis_caches").upsert(
    {
      user_id: userId,
      year: 0,
      month: 0,
      scope: SCOPE_MANDATORY,
      report_data: { items } as any,
      is_stale: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,year,month,scope" }
  );

  if (error) {
    console.error("Failed to save mandatory expenses:", error);
    throw new Error(error.message);
  }
}

export async function findMatchingCategory(
  supabase: any,
  userId: string,
  itemName: string,
  categoryName?: string | null
): Promise<string | null> {
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, expense_kind, type")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!categories || categories.length === 0) return null;

  const expenseCats = categories.filter((c: any) => c.type === "expense");
  if (expenseCats.length === 0) return null;

  const cleanItem = itemName.toLowerCase();

  // 1. If explicit categoryName provided, check for match
  if (categoryName) {
    const directMatch = expenseCats.find(
      (c: any) => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (directMatch) return directMatch.id;
  }

  // 2. Keyword matching between item name and category name
  const keywordMatch = expenseCats.find((c: any) => {
    const catLower = c.name.toLowerCase();
    return cleanItem.includes(catLower) || catLower.includes(cleanItem);
  });
  if (keywordMatch) return keywordMatch.id;

  // 3. Fallback to category with expense_kind === 'wajib'
  const wajibCat = expenseCats.find((c: any) => c.expense_kind === "wajib");
  if (wajibCat) return wajibCat.id;

  // 4. Fallback to general category names
  const generalCat = expenseCats.find((c: any) =>
    ["tagihan", "lain-lain", "lainnya", "kebutuhan"].includes(c.name.toLowerCase())
  );
  if (generalCat) return generalCat.id;

  // 5. Default to the first expense category
  return expenseCats[0].id;
}

export function getMandatoryExpenseDate(
  year: number,
  month: number,
  dueDay?: number | null
): string {
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month;

  if (isCurrentMonth) {
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const maxDays = new Date(year, month, 0).getDate();
  const day = dueDay ? Math.min(Math.max(dueDay, 1), maxDays) : 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export async function syncMandatoryExpensesForMonth(
  userId: string,
  year: number,
  month: number
): Promise<void> {
  try {
    const supabase = await createClient();
    const items = await getMandatoryExpenses(userId);
    if (!items || items.length === 0) return;

    const monthKey = `${year}-${String(month).padStart(2, "0")}`;
    const start = `${monthKey}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${monthKey}-${String(lastDay).padStart(2, "0")}`;

    // Query active transactions created from mandatory expenses for this user in this month
    const { data: txs, error: txError } = await supabase
      .from("transactions")
      .select("id, amount, merchant, note, ai_raw_payload")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .is("deleted_at", null)
      .gte("date", start)
      .lte("date", end);

    if (txError) {
      console.error("Error fetching transactions for mandatory expense sync:", txError);
      return;
    }

    const mandatoryTxs = (txs || []).filter((tx: any) => {
      const payload = tx.ai_raw_payload as any;
      return (
        payload?.source_type === "mandatory_expense" &&
        payload?.month_key === monthKey
      );
    });

    let itemsChanged = false;

    for (const item of items) {
      const isPaid = item.paid_months?.includes(monthKey);
      const existingTx = mandatoryTxs.find((tx: any) => {
        const payload = tx.ai_raw_payload as any;
        return (
          payload?.mandatory_expense_id === item.id ||
          item.paid_transaction_ids?.[monthKey] === tx.id
        );
      });

      if (isPaid) {
        if (!existingTx) {
          // Checked, but transaction not created yet -> create it now!
          const categoryId = await findMatchingCategory(
            supabase,
            userId,
            item.name,
            item.category_name
          );
          const dateStr = getMandatoryExpenseDate(year, month, item.due_day);

          const { data: newTx, error: insertError } = await supabase
            .from("transactions")
            .insert({
              user_id: userId,
              type: "expense",
              category_id: categoryId,
              amount: item.amount,
              date: dateStr,
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

          if (!insertError && newTx) {
            if (!item.paid_transaction_ids) item.paid_transaction_ids = {};
            item.paid_transaction_ids[monthKey] = newTx.id;
            itemsChanged = true;
          }
        } else {
          // If transaction exists but ID not mapped, save ID mapping
          if (!item.paid_transaction_ids) item.paid_transaction_ids = {};
          if (item.paid_transaction_ids[monthKey] !== existingTx.id) {
            item.paid_transaction_ids[monthKey] = existingTx.id;
            itemsChanged = true;
          }
        }
      } else {
        // Unchecked, but active transaction exists -> soft delete it!
        if (existingTx) {
          await supabase
            .from("transactions")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", existingTx.id)
            .eq("user_id", userId);

          if (item.paid_transaction_ids?.[monthKey]) {
            delete item.paid_transaction_ids[monthKey];
            itemsChanged = true;
          }
        }
      }
    }

    if (itemsChanged) {
      await saveMandatoryExpenses(userId, items);
    }
  } catch (err) {
    console.error("Failed to sync mandatory expenses with transactions:", err);
  }
}
