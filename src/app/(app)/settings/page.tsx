import Link from "next/link";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut } from "@/actions/auth.actions";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <PageHeader title="Settings" subtitle="Kelola akun dan preferensi." />

      <div className="space-y-5">
        <Card className="border-2 border-black bg-zinc-900 shadow-[3px_3px_0px_0px_#a855f7] p-4">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Akun</p>
          <p className="mt-1.5 text-sm font-bold text-zinc-100">{user.email}</p>
        </Card>

        <Card className="border-2 border-black bg-zinc-900 shadow-[3px_3px_0px_0px_#2dd4bf] hover:shadow-[4px_4px_0px_0px_#2dd4bf] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px] transition-all p-4">
          <Link href="/aset" className="block w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-black text-teal-400 uppercase tracking-wider">Aset Valid</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Kelola rekening bank, uang tunai, investasi, dan emas Anda.
                </p>
              </div>
              <Wallet className="h-5 w-5 text-teal-400 shrink-0 ml-2" />
            </div>
          </Link>
        </Card>

        <Card className="border-2 border-black bg-zinc-900 shadow-[3px_3px_0px_0px_#f43f5e] p-4">
          <p className="text-sm font-black text-rose-400 uppercase tracking-wider">ApriFlow v0.2 — Phase 2</p>
          <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
            Pencatatan transaksi berbasis AI chat dengan review antrean persetujuan.
          </p>
        </Card>

        <form action={signOut}>
          <Button type="submit" variant="danger" className="w-full h-11 text-sm font-extrabold rounded-xl">
            Keluar
          </Button>
        </form>
      </div>
    </>
  );
}
