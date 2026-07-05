"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { CacheRepository } from "@/services/ai-engine/repositories/cache.repository";

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function createGoalAction(
  name: string,
  targetAmount: number,
  targetDate?: string,
  notes?: string
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  if (!name.trim()) return { error: "Nama target tidak boleh kosong." };
  if (targetAmount <= 0) return { error: "Target nominal harus lebih besar dari Rp 0" };

  const supabase = await createClient();
  const { error } = await supabase.from("goals").insert({
    user_id: user.id,
    name: name.trim(),
    target_amount: targetAmount,
    target_date: targetDate || null,
    notes: notes || null,
    current_amount: 0,
    is_completed: false,
  });

  if (error) return { error: error.message };

  try {
    await new CacheRepository().invalidate(user.id);
  } catch (err) {
    console.error("Cache invalidation failed:", err);
  }

  revalidatePath("/");
  revalidatePath("/goals");
  return { success: true };
}

export async function updateGoalProgressAction(
  goalId: string,
  currentAmount: number,
  isCompleted?: boolean
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  if (currentAmount < 0) return { error: "Jumlah terkumpul tidak boleh negatif." };

  const supabase = await createClient();
  
  // First get the target amount to verify if it is completed
  const { data: goal, error: getError } = await supabase
    .from("goals")
    .select("target_amount")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();

  if (getError || !goal) return { error: "Target tidak ditemukan." };

  const completed = isCompleted ?? currentAmount >= goal.target_amount;

  const { error } = await supabase
    .from("goals")
    .update({
      current_amount: currentAmount,
      is_completed: completed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  try {
    await new CacheRepository().invalidate(user.id);
  } catch (err) {
    console.error("Cache invalidation failed:", err);
  }

  revalidatePath("/");
  revalidatePath("/goals");
  return { success: true };
}

export async function deleteGoalAction(goalId: string): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  try {
    await new CacheRepository().invalidate(user.id);
  } catch (err) {
    console.error("Cache invalidation failed:", err);
  }

  revalidatePath("/");
  revalidatePath("/goals");
  return { success: true };
}
