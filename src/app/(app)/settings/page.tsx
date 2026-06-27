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

        <Card>
          <p className="text-sm font-medium text-gray-900">ApriFlow v0.1 — Phase 1</p>
          <p className="mt-1 text-sm text-gray-500">
            Fondasi cash flow manual. Fitur AI & scan akan hadir di phase berikutnya.
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
