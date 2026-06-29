import { createClient } from "@/lib/supabase/server";
import type { IBudgetRepository } from "../interfaces/repositories.interface";
import type { Budget } from "../types";

export class BudgetRepository implements IBudgetRepository {
  async getByUserId(userId: string): Promise<Budget[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching budgets in repository:", error);
      throw error;
    }

    return (data ?? []) as Budget[];
  }
}
