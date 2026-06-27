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

      <div className="space-y-4">
        <Card>
          <p className="text-sm text-gray-500">Akun</p>
          <p className="mt-1 font-medium text-gray-900">{user.email}</p>
        </Card>

        <Card className="hover:border-teal-300 transition-colors">
          <Link href="/aset" className="block w-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Aset Valid</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Kelola rekening bank, uang tunai, investasi, dan emas Anda.
                </p>
              </div>
              <Wallet className="h-5 w-5 text-teal-600 shrink-0 ml-2" />
            </div>
          </Link>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-900">ApriFlow v0.2 — Phase 2</p>
          <p className="mt-1 text-sm text-gray-500">
            Pencatatan transaksi berbasis AI chat dengan review antrean persetujuan.
          </p>
        </Card>

        <form action={signOut}>
          <Button type="submit" variant="danger" className="w-full">
            Keluar
          </Button>
        </form>
      </div>
    </>
  );
}
