import { PageHeader } from "@/components/layout/page-header";
import { MonthlyHistoryView } from "@/components/history/monthly-history-view";
import { getMonthlyHistory } from "@/lib/db/history";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const historyData = await getMonthlyHistory(user.id, 6);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Riwayat Bulanan"
        subtitle="Cek pengeluaran bulan kemarin, perbandingan arus kas, dan tren keuangan."
      />

      <MonthlyHistoryView data={historyData} />
    </div>
  );
}
