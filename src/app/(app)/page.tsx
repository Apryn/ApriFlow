import Link from "next/link";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { QuickTransactionInput } from "@/components/dashboard/quick-transaction-input";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, SectionTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardSummary } from "@/lib/db/dashboard";
import { getTransactions } from "@/lib/db/transactions";
import { TransactionList } from "@/components/transactions/transaction-list";
import { getUser, createClient } from "@/lib/supabase/server";
import { getCurrentMonthRange, formatMonthYear } from "@/lib/utils/date";
import { PlusCircle, ArrowLeftRight } from "lucide-react";
import { redirect } from "next/navigation";

import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { BudgetWidget } from "@/components/dashboard/budget-widget";
import { GoalWidget } from "@/components/dashboard/goal-widget";
import { OnboardingModal } from "@/components/dashboard/onboarding-modal";
import { MandatoryExpensesSection } from "@/components/dashboard/mandatory-expenses-section";
import { getMandatoryExpenses, syncMandatoryExpensesForMonth } from "@/lib/db/mandatory-expenses";
import { MonthNavigator } from "@/components/layout/month-navigator";
import type { Goal } from "@/types/database.types";
import type { Budget } from "@/services/ai-engine/types";

interface DashboardPageProps {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await getUser();
  if (!user) redirect("/login");

  const resolvedParams = await searchParams;
  const current = getCurrentMonthRange();
  const year = resolvedParams.year ? parseInt(resolvedParams.year, 10) : current.year;
  const month = resolvedParams.month ? parseInt(resolvedParams.month, 10) : current.month;

  await syncMandatoryExpensesForMonth(user.id, year, month);

  const supabase = await createClient();
  const [summary, transactions, budgetsRes, goalsRes, mandatoryExpenses] = await Promise.all([
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
    getMandatoryExpenses(user.id),
  ]);

  const budgets = (budgetsRes.data ?? []) as unknown as Budget[];
  const goals = (goalsRes.data ?? []) as Goal[];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        subtitle={formatMonthYear(year, month)}
        action={
          <Link href="/tambah">
            <Button size="sm">
              <PlusCircle className="h-4 w-4" />
              Catat Manual
            </Button>
          </Link>
        }
      />

      <MonthNavigator currentYear={year} currentMonth={month} />

      <QuickTransactionInput />

      <OnboardingModal />

      <SummaryCards summary={summary} />

      <MandatoryExpensesSection
        initialItems={mandatoryExpenses}
        year={year}
        month={month}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <CashFlowChart transactions={transactions} />
        <BudgetWidget budgets={budgets} transactions={transactions} />
      </div>

      <GoalWidget goals={goals} />

      <div>
        <SectionTitle
          action={
            transactions.length > 0 && (
              <Link href="/transaksi" className="text-xs font-semibold text-teal-400 hover:text-teal-300">
                Lihat semua
              </Link>
            )
          }
        >
          Transaksi Terakhir
        </SectionTitle>

        {summary.transactionCount === 0 ? (
          <Card>
            <EmptyState
              compact
              icon={ArrowLeftRight}
              title="Belum ada transaksi bulan ini"
              description="Catat pengeluaran atau pemasukan pertama Anda di atas."
              action={
                <Link href="/tambah">
                  <Button size="sm">Catat Transaksi</Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <TransactionList transactions={transactions.slice(0, 5)} />
        )}
      </div>
    </div>
  );
}
