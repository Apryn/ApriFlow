"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { CacheRepository } from "@/services/ai-engine/repositories/cache.repository";

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function upsertBudgetAction(
  categoryId: string,
  amount: number
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  if (amount <= 0) return { error: "Limit anggaran harus lebih besar dari Rp 0" };

  const supabase = await createClient();

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: categoryId,
      amount,
      period: "monthly",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,category_id,period" }
  );

  if (error) return { error: error.message };

  try {
    await new CacheRepository().invalidate(user.id);
  } catch (err) {
    console.error("Cache invalidation failed:", err);
  }

  revalidatePath("/");
  revalidatePath("/budgets");
  return { success: true };
}

export async function deleteBudgetAction(budgetId: string): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  try {
    await new CacheRepository().invalidate(user.id);
  } catch (err) {
    console.error("Cache invalidation failed:", err);
  }

  revalidatePath("/");
  revalidatePath("/budgets");
  return { success: true };
}
