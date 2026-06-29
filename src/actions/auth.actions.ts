"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  success?: string;
};

export async function signUp(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState | null> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("display_name") as string;

  let isSuccess = false;
  let errorMessage: string | null = null;

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) {
      console.error("Supabase signUp error details:", error);
      errorMessage = error.message;
    } else {
      isSuccess = true;
    }
  } catch (err: unknown) {
    console.error("Caught exception in signUp action:", err);
    errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga.";
  }

  if (isSuccess) {
    redirect("/");
  }

  return { error: errorMessage ?? undefined };
}

export async function signIn(
  _prevState: AuthState | null,
  formData: FormData
): Promise<AuthState | null> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  let isSuccess = false;
  let errorMessage: string | null = null;

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      console.error("Supabase signIn error details:", error);
      errorMessage = error.message;
    } else {
      isSuccess = true;
    }
  } catch (err: unknown) {
    console.error("Caught exception in signIn action:", err);
    errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan yang tidak terduga.";
  }

  if (isSuccess) {
    redirect("/");
  }

  return { error: errorMessage ?? undefined };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
