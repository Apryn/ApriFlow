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
