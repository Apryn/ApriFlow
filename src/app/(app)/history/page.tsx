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
    <>
      <PageHeader
        title="Riwayat Bulanan"
        subtitle="Cek pengeluaran bulan kemarin, bandingkan arus kas, dan pantau tren keuangan Anda."
      />

      <div className="mt-4">
        <MonthlyHistoryView data={historyData} />
      </div>
    </>
  );
}
