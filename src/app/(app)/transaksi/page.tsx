import Link from "next/link";
import { TransactionList } from "@/components/transactions/transaction-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getTransactions } from "@/lib/db/transactions";
import { getUser } from "@/lib/supabase/server";
import { getCurrentMonthRange, formatMonthYear } from "@/lib/utils/date";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";

export default async function TransaksiPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { year, month } = getCurrentMonthRange();
  const transactions = await getTransactions(user.id, year, month);

  return (
    <>
      <PageHeader
        title="Transaksi"
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
      <TransactionList transactions={transactions} />
    </>
  );
}
