"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(signUp, null);

  return (
    <Card className="space-y-5 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-zinc-100">Daftar Akun</h2>
        <p className="text-xs text-zinc-400">Mulai catat cash flow dengan lebih rapi dan jelas.</p>
      </div>

      <form action={formAction} className="space-y-3.5">
        {state?.error && typeof state.error === "string" && (
          <Alert variant="error">{state.error}</Alert>
        )}

        <div>
          <Label htmlFor="display_name">Nama Panggilan</Label>
          <Input 
            id="display_name" 
            name="display_name" 
            placeholder="Nama Anda" 
            required 
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="nama@email.com" 
            required 
          />
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

        <Button 
          type="submit" 
          disabled={pending}
          className="w-full mt-2"
        >
          {pending ? "Mendaftar..." : "Buat Akun"}
        </Button>
      </form>

      <p className="text-center text-xs text-zinc-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-teal-400 hover:text-teal-300">
          Masuk di sini
        </Link>
      </p>
    </Card>
  );
}
