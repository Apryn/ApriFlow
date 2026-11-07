import { PageHeader } from "@/components/layout/page-header";
import { BackupManager } from "@/components/data-sync/backup-manager";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Transfer & Cadangan Data | ApriFlow",
  description: "Ekspor dan impor data transaksi keuangan agar perpindahan HP berjalan mulus.",
};

export default async function BackupPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transfer & Cadangan Data"
        subtitle="Impor atau ekspor riwayat transaksi agar perpindahan data antar HP mulus."
      />

      <BackupManager />
    </div>
  );
}

