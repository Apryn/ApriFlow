import Link from "next/link";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { QuickTransactionInput } from "@/components/dashboard/quick-transaction-input";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboardSummary } from "@/lib/db/dashboard";
import { getTransactions } from "@/lib/db/transactions";
import { TransactionList } from "@/components/transactions/transaction-list";
import { getUser, createClient } from "@/lib/supabase/server";
import { getCurrentMonthRange, formatMonthYear } from "@/lib/utils/date";
import { PlusCircle } from "lucide-react";
import { redirect } from "next/navigation";

// New components
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { BudgetWidget } from "@/components/dashboard/budget-widget";
import { GoalWidget } from "@/components/dashboard/goal-widget";
import { OnboardingModal } from "@/components/dashboard/onboarding-modal";
import type { Goal } from "@/types/database.types";
import type { Budget } from "@/services/ai-engine/types";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const { year, month } = getCurrentMonthRange();
  
  // Fetch dashboard summaries and parallel transactions/budgets/goals
  const supabase = await createClient();
  const [summary, transactions, budgetsRes, goalsRes] = await Promise.all([
    getDashboardSummary(user.id, year, month),
    getTransactions(user.id, year, month),
    supabase
      .from("budgets")
      .select("*, category:categories(id, name)")
      .eq("user_id", user.id),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("is_completed", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const budgets = (budgetsRes.data ?? []) as unknown as Budget[];
  const goals = (goalsRes.data ?? []) as Goal[];

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

      <OnboardingModal />

      <SummaryCards summary={summary} />

      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <CashFlowChart transactions={transactions} />
        <BudgetWidget budgets={budgets} transactions={transactions} />
      </div>

      <div className="mt-4">
        <GoalWidget goals={goals} />
      </div>

      {summary.transactionCount === 0 ? (
        <Card className="mt-4 border-dashed border-zinc-800 bg-zinc-900/50 text-center p-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          <p className="text-sm text-zinc-400 font-bold">
            Belum ada transaksi bulan ini. Mulai catat pemasukan atau pengeluaranmu!
          </p>
          <Link href="/tambah" className="mt-3 inline-block">
            <Button size="sm">Tambah transaksi pertama</Button>
          </Link>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Transaksi Terakhir</h2>
            <Link href="/transaksi" className="text-xs font-bold text-teal-400 hover:underline">
              Lihat semua
            </Link>
          </div>
          <TransactionList transactions={transactions.slice(0, 5)} />
        </div>
      )}
    </>
  );
}
