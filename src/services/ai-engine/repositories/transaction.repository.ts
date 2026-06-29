import { createClient } from "@/lib/supabase/server";
import type { TransactionWithCategory } from "@/types/database.types";
import type { ITransactionRepository } from "../interfaces/repositories.interface";

export class TransactionRepository implements ITransactionRepository {
  async getByUserIdAndDateRange(
    userId: string,
    start: string,
    end: string
  ): Promise<TransactionWithCategory[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("transactions")
      .select("*, category:categories(id, name, expense_kind)")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .is("deleted_at", null)
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching transactions in repository:", error);
      throw error;
    }

    return (data ?? []) as TransactionWithCategory[];
  }
}
