"use server";

import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { transactionSchema } from "@/lib/validators/transaction.schema";
import { parseTransactionWithOpenAI } from "@/lib/ai/openai";
import { getCategories } from "@/lib/db/transactions";

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

export async function parseTransactionAction(
  text: string
): Promise<{ error?: string; success?: boolean; transactionId?: string }> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  if (!text || text.trim().length === 0) {
    return { error: "Input teks tidak boleh kosong." };
  }

  try {
    const supabase = await createClient();
    const categories = await getCategories(user.id);

    const parsed = await parseTransactionWithOpenAI(text, categories);

    // Match parsed.category_name to user's category list
    let matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === parsed.category_name.toLowerCase() && c.type === parsed.type
    );

    // If not matched, try to find a category of the same type containing the text
    if (!matchedCategory) {
      matchedCategory = categories.find(
        (c) => c.type === parsed.type && c.name.toLowerCase().includes(parsed.category_name.toLowerCase())
      );
    }

    // If still not matched, find the fallback "Lain-lain" category of correct type
    if (!matchedCategory) {
      matchedCategory = categories.find((c) => c.name === "Lain-lain" && c.type === parsed.type);
    }

    const { data: transaction, error: insertError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: parsed.type,
        category_id: matchedCategory?.id ?? null,
        amount: parsed.amount,
        date: parsed.date,
        payment_method: parsed.payment_method,
        merchant: parsed.merchant,
        note: parsed.note,
        source: "ai_chat",
        status: "pending_review",
        raw_input: text,
        ai_confidence: parsed.confidence,
        ai_raw_payload: parsed as unknown as Record<string, unknown>,
      })
      .select()
      .single();

    if (insertError) {
      return { error: insertError.message };
    }

    revalidatePath("/review");
    revalidatePath("/ai-chat");
    return { success: true, transactionId: transaction.id };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Gagal memproses teks dengan AI.";
    console.error("Error in parseTransactionAction:", err);
    return { error: errorMessage };
  }
}

export async function confirmTransactionAction(id: string): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/review");
  return { success: true };
}

export async function ignoreTransactionAction(id: string): Promise<ActionState> {
  const user = await getUser();
  if (!user) return { error: "Sesi tidak valid. Silakan login ulang." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({
      status: "ignored",
      reviewed_at: new Date().toISOString(),
      deleted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/review");
  return { success: true };
}

export async function updatePendingTransactionAction(
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
    .update({
      ...parsed.data,
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/transaksi");
  revalidatePath("/review");
  return { success: true };
}
