"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { transactionSchema } from "@/lib/validators/transaction.schema";

export type ActionState = {
  error?: string;
  success?: boolean;
};

export async function createTransaction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const raw = {
    type: formData.get("type") as string,
    category_id: formData.get("category_id") as string,
    amount: Number(formData.get("amount")),
    date: formData.get("date") as string,
    payment_method: formData.get("payment_method") as string,
    merchant: (formData.get("merchant") as string) || null,
    note: (formData.get("note") as string) || null,
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    ...parsed.data,
    source: "manual",
    status: "confirmed",
    confirmed_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transaksi");
  return { success: true };
}

export async function updateTransaction(
  id: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const raw = {
    type: formData.get("type") as string,
    category_id: formData.get("category_id") as string,
    amount: Number(formData.get("amount")),
    date: formData.get("date") as string,
    payment_method: formData.get("payment_method") as string,
    merchant: (formData.get("merchant") as string) || null,
    note: (formData.get("note") as string) || null,
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Data tidak valid" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transaksi");
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transaksi");
  return { success: true };
}
