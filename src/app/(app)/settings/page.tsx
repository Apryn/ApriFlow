import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOut } from "@/actions/auth.actions";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANNING_NAV } from "@/lib/navigation";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-5">
      <PageHeader title="Menu & Pengaturan" subtitle="Kelola akun, perencanaan, dan preferensi aplikasi." />

      <Card className="p-4 space-y-1">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Akun Terdaftar</p>
        <p className="text-sm font-semibold text-zinc-100">{user.email}</p>
      </Card>

      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider px-1">Perencanaan Finansial</h2>
        <div className="grid gap-2">
          {PLANNING_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Card className="p-3.5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 border border-zinc-800 text-teal-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-zinc-100">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-zinc-500">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="p-4 space-y-1">
        <p className="text-xs font-semibold text-zinc-400">ApriFlow v0.3</p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Pencatatan arus kas pribadi bertenaga AI dengan integrasi WhatsApp & bot Gemini.
        </p>
      </Card>

      <form action={signOut}>
        <Button type="submit" variant="danger" className="w-full">
          Keluar dari Akun
        </Button>
      </form>
    </div>
  );
}
