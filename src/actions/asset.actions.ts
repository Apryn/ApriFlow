"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { assetSchema } from "@/lib/validators/transaction.schema";
import { CacheRepository } from "@/services/ai-engine/repositories/cache.repository";

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function createAsset(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    value: Number(formData.get("value")),
    is_liquid: formData.get("is_liquid") === "true",
    note: (formData.get("note") as string) || null,
  };

  const parsed = assetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("assets").insert({
    user_id: user.id,
    ...parsed.data,
  });

  if (error) return { error: error.message };

  await new CacheRepository().invalidate(user.id);

  revalidatePath("/");
  revalidatePath("/aset");
  return { success: true };
}

export async function updateAsset(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    value: Number(formData.get("value")),
    is_liquid: formData.get("is_liquid") === "true",
    note: (formData.get("note") as string) || null,
  };

  const parsed = assetSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("assets")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  await new CacheRepository().invalidate(user.id);

  revalidatePath("/");
  revalidatePath("/aset");
  return { success: true };
}

export async function deleteAsset(id: string): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const supabase = await createClient();
  const { error } = await supabase.from("assets").delete().eq("id", id).eq("user_id", user.id);

  if (error) return { error: error.message };

  await new CacheRepository().invalidate(user.id);

  revalidatePath("/");
  revalidatePath("/aset");
  return { success: true };
}
