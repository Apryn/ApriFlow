import { createClient } from "@/lib/supabase/server";
import type { FullFinancialAnalysis } from "../types";

export class CacheRepository {
  /**
   * Fetches analysis data from cache if it exists and is not stale.
   */
  async get(
    userId: string,
    year: number,
    month: number,
    scope: string = "all"
  ): Promise<FullFinancialAnalysis | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("analysis_caches")
        .select("report_data, is_stale")
        .eq("user_id", userId)
        .eq("year", year)
        .eq("month", month)
        .eq("scope", scope)
        .single();

      if (error) {
        if (error.code !== "PGRST116") {
          console.error("Cache fetch error:", error);
        }
        return null;
      }

      if (data && !data.is_stale) {
        return data.report_data as unknown as FullFinancialAnalysis;
      }
    } catch (err) {
      console.error("Failed to read analysis cache:", err);
    }
    return null;
  }

  /**
   * Saves calculated analysis to cache.
   */
  async set(
    userId: string,
    year: number,
    month: number,
    scope: string,
    report: FullFinancialAnalysis
  ): Promise<void> {
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from("analysis_caches")
        .upsert({
          user_id: userId,
          year,
          month,
          scope,
          report_data: report as any,
          is_stale: false,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (err) {
      console.error("Failed to save analysis cache:", err);
    }
  }

  /**
   * Marks cache entries stale for a given month and user.
   * If year and month are omitted, it invalidates ALL caches for the user.
   */
  async invalidate(
    userId: string,
    year?: number,
    month?: number
  ): Promise<void> {
    try {
      const supabase = await createClient();
      let query = supabase
        .from("analysis_caches")
        .update({ is_stale: true })
        .eq("user_id", userId);

      if (year !== undefined && month !== undefined) {
        query = query.eq("year", year).eq("month", month);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (err) {
      console.error(`Failed to invalidate cache for user ${userId}:`, err);
    }
  }
}
