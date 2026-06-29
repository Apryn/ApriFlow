import { createClient } from "@/lib/supabase/server";
import type { IGoalRepository } from "../interfaces/repositories.interface";
import type { Goal } from "../types";

export class GoalRepository implements IGoalRepository {
  async getByUserId(userId: string): Promise<Goal[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching goals in repository:", error);
      throw error;
    }

    return (data ?? []) as Goal[];
  }
}
