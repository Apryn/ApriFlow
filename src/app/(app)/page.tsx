import Link from "next/link";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { QuickTransactionInput } from "@/components/dashboard/quick-transaction-input";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboardSummary } from "@/lib/db/dashboard";
import { getTransactions } from "@/lib/db/transactions";
import { TransactionList } from "@/components/transactions/transaction-list";
import { getUser } from "@/lib/supabase/server";
import { getCurrentMonthRange, formatMonthYear } from "@/lib/utils/date";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { year, month } = getCurrentMonthRange();
  const summary = await getDashboardSummary(user.id, year, month);
  const transactions = await getTransactions(user.id, year, month);

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

      <QuickTransactionInput />

      <SummaryCards summary={summary} />

      {summary.transactionCount === 0 ? (
        <Card className="mt-4 border-dashed border-teal-200 bg-teal-50/50 text-center">
          <p className="text-sm text-teal-800">
            Belum ada transaksi bulan ini. Mulai catat pemasukan atau pengeluaranmu!
          </p>
          <Link href="/tambah" className="mt-3 inline-block">
            <Button size="sm">Tambah transaksi pertama</Button>
          </Link>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-medium text-gray-500">Transaksi Terakhir</h2>
            <Link href="/transaksi" className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
              Lihat semua
            </Link>
          </div>
          <TransactionList transactions={transactions.slice(0, 10)} />
        </div>
      )}
    </>
  );
}
