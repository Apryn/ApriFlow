import { createClient } from "@/lib/supabase/server";
import type { Asset } from "@/types/database.types";

export async function getAssets(userId: string): Promise<Asset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getAssetById(userId: string, id: string): Promise<Asset | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .eq("user_id", userId)
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getTotalAssets(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assets")
    .select("value")
    .eq("user_id", userId);

  if (error) throw error;
  return data?.reduce((sum, a) => sum + Number(a.value), 0) ?? 0;
}
