import Link from "next/link";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboardSummary } from "@/lib/db/dashboard";
import { getUser } from "@/lib/supabase/server";
import { getCurrentMonthRange, formatMonthYear } from "@/lib/utils/date";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { year, month } = getCurrentMonthRange();
  const summary = await getDashboardSummary(user.id, year, month);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={formatMonthYear(year, month)}
        action={
          <Link href="/tambah">
            <Button size="sm">
              <PlusCircle className="h-4 w-4" />
              Tambah
            </Button>
          </Link>
        }
      />

      <SummaryCards summary={summary} />

      {summary.transactionCount === 0 && (
        <Card className="mt-4 border-dashed border-teal-200 bg-teal-50/50 text-center">
          <p className="text-sm text-teal-800">
            Belum ada transaksi bulan ini. Mulai catat pemasukan atau pengeluaranmu!
          </p>
          <Link href="/tambah" className="mt-3 inline-block">
            <Button size="sm">Tambah transaksi pertama</Button>
          </Link>
        </Card>
      )}
    </>
  );
}
