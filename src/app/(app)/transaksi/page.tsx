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
import { TransactionFilterBar } from "@/components/transactions/transaction-filter-bar";
import { MonthNavigator } from "@/components/layout/month-navigator";

interface TransaksiPageProps {
  searchParams: Promise<{
    category?: string;
    query?: string;
    start_date?: string;
    end_date?: string;
    type?: "income" | "expense";
    year?: string;
    month?: string;
  }>;
}

export default async function TransaksiPage({ searchParams }: TransaksiPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");

  const resolved = await searchParams;
  const current = getCurrentMonthRange();
  const year = resolved.year ? parseInt(resolved.year, 10) : current.year;
  const month = resolved.month ? parseInt(resolved.month, 10) : current.month;
  const { category, query, start_date, end_date, type } = resolved;

  const transactions = await getTransactions(
    user.id,
    year,
    month,
    category,
    query,
    start_date,
    end_date,
    type
  );

  return (
    <>
      <PageHeader
        title="Transaksi"
        subtitle={
          <div className="flex items-center gap-2 flex-wrap text-zinc-400 font-bold text-xs mt-1">
            <span>{formatMonthYear(year, month)}</span>
            {type && (
              <Link href={category ? `/transaksi?category=${encodeURIComponent(category)}&year=${year}&month=${month}` : `/transaksi?year=${year}&month=${month}`}>
                <Badge
                  variant={type === "income" ? "success" : "danger"}
                  className="flex items-center gap-1.5 bg-zinc-850 hover:bg-zinc-800 border border-black shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer text-[10px] font-black uppercase tracking-wider py-0.5 px-2"
                >
                  Tipe: {type === "income" ? "Pemasukan" : "Pengeluaran"}
                  <X className="h-3 w-3" />
                </Badge>
              </Link>
            )}
            {category && (
              <Link href={type ? `/transaksi?type=${type}&year=${year}&month=${month}` : `/transaksi?year=${year}&month=${month}`}>
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

      <div className="my-3">
        <MonthNavigator currentYear={year} currentMonth={month} />
      </div>

      <div className="my-4">
        <TransactionFilterBar />
      </div>

      <TransactionList transactions={transactions} />
    </>
  );
}
