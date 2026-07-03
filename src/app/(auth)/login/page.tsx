"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null);

  return (
    <Card className="bg-white/80 backdrop-blur-md border border-white/50 shadow-xl shadow-teal-900/5 rounded-3xl p-7 md:p-8 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-gray-900">Masuk</h2>
        <p className="text-xs font-medium text-gray-400">Lanjutkan kelola cash flow-mu.</p>
      </div>

      <form action={formAction} className="mt-6 space-y-4">
        {state?.error && typeof state.error === "string" && (
          <div className="rounded-2xl bg-red-50/80 backdrop-blur border border-red-100/50 px-4 py-3 text-xs text-red-600 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
            <span>{state.error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">Email</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="nama@email.com" 
            required 
            className="rounded-2xl border-gray-200/80 hover:border-gray-300 focus:border-teal-500 shadow-sm text-sm h-11 px-4 bg-white/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">Password</Label>
          <Input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="••••••••" 
            required 
            className="rounded-2xl border-gray-200/80 hover:border-gray-300 focus:border-teal-500 shadow-sm text-sm h-11 px-4 bg-white/50"
          />
        </div>

        <Button 
          type="submit" 
          disabled={pending}
          className="bg-teal-600 hover:bg-teal-700 text-white rounded-2xl h-11 w-full shadow-md shadow-teal-600/10 active:scale-[0.98] transition-all duration-200"
        >
          {pending ? "Masuk..." : "Masuk"}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-gray-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors pl-1">
          Daftar
        </Link>
      </p>
    </Card>
  );
}
