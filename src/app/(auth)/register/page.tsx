"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900">Daftar</h2>
      <p className="mt-1 text-sm text-gray-500">Mulai catat cash flow dengan lebih jelas.</p>

      <form action={formAction} className="mt-6 space-y-4">
        {state?.error && typeof state.error === "string" && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</div>
        )}

        <div>
          <Label htmlFor="display_name">Nama</Label>
          <Input id="display_name" name="display_name" placeholder="Nama kamu" required />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="nama@email.com" required />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Min. 6 karakter"
            minLength={6}
            required
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Mendaftar..." : "Daftar"}
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-teal-600 hover:text-teal-700">
          Masuk
        </Link>
      </p>
    </Card>
  );
}
