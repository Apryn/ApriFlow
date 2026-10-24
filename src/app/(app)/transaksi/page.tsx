import Link from "next/link";
import { TransactionList } from "@/components/transactions/transaction-list";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { getTransactions } from "@/lib/db/transactions";
import { syncMandatoryExpensesForMonth } from "@/lib/db/mandatory-expenses";
import { getUser } from "@/lib/supabase/server";
import { getCurrentMonthRange, formatMonthYear } from "@/lib/utils/date";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
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

  await syncMandatoryExpensesForMonth(user.id, year, month);

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
    <div className="space-y-4">
      <PageHeader
        title="Daftar Transaksi"
        subtitle={
          <div className="flex items-center gap-2 flex-wrap text-zinc-400 font-medium text-xs mt-0.5">
            <span>{formatMonthYear(year, month)}</span>
            {type && (
              <Link href={category ? `/transaksi?category=${encodeURIComponent(category)}&year=${year}&month=${month}` : `/transaksi?year=${year}&month=${month}`}>
                <Badge
                  variant={type === "income" ? "success" : "danger"}
                  className="cursor-pointer"
                >
                  Tipe: {type === "income" ? "Pemasukan" : "Pengeluaran"}
                  <X className="h-3 w-3" />
                </Badge>
              </Link>
            )}
            {category && (
              <Link href={type ? `/transaksi?type=${type}&year=${year}&month=${month}` : `/transaksi?year=${year}&month=${month}`}>
                <Badge variant="info" className="cursor-pointer">
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
              <Plus className="h-4 w-4" />
              Catat
            </Button>
          </Link>
        }
      />

      <MonthNavigator currentYear={year} currentMonth={month} />

      <TransactionFilterBar />

      <TransactionList transactions={transactions} />
    </div>
  );
}
