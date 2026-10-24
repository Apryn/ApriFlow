"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <Card className="space-y-5 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-zinc-100">Masuk</h2>
        <p className="text-xs text-zinc-400">Lanjutkan kelola cash flow pribadi Anda.</p>
      </div>

      <form action={formAction} className="space-y-3.5">
        {state?.error && typeof state.error === "string" && (
          <Alert variant="error">{state.error}</Alert>
        )}

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
            placeholder="••••••••" 
            required 
          />
        </div>

        <Button 
          type="submit" 
          disabled={pending}
          className="w-full mt-2"
        >
          {pending ? "Memproses..." : "Masuk"}
        </Button>
      </form>

      <p className="text-center text-xs text-zinc-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-teal-400 hover:text-teal-300">
          Daftar sekarang
        </Link>
      </p>
    </Card>
  );
}
