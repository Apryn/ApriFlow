import Link from "next/link";
import { TransactionList } from "@/components/transactions/transaction-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getTransactions } from "@/lib/db/transactions";
import { getUser } from "@/lib/supabase/server";
import { getCurrentMonthRange, formatMonthYear } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, X } from "lucide-react";
import { redirect } from "next/navigation";

interface TransaksiPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function TransaksiPage({ searchParams }: TransaksiPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { category } = await searchParams;

  const { year, month } = getCurrentMonthRange();
  const transactions = await getTransactions(user.id, year, month, category);

  return (
    <>
      <PageHeader
        title="Transaksi"
        subtitle={
          <div className="flex items-center gap-2 flex-wrap text-zinc-400 font-bold text-xs mt-1">
            <span>{formatMonthYear(year, month)}</span>
            {category && (
              <Link href="/transaksi">
                <Badge variant="info" className="flex items-center gap-1.5 bg-zinc-850 hover:bg-zinc-800 text-teal-400 border border-black shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer text-[10px] font-black uppercase tracking-wider py-0.5 px-2">
                  Kategori: {category}
                  <X className="h-3 w-3" />
                </Badge>
              </Link>
            )}
          </div>
        }
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
