"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useVisibility } from "@/components/providers/visibility-provider";
import type { TransactionWithCategory } from "@/types/database.types";
import { BudgetAnalyzer } from "@/services/ai-engine/modules/budget-analyzer";
import type { Budget } from "@/services/ai-engine/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusCircle, PiggyBank } from "lucide-react";

interface BudgetWidgetProps {
  budgets: Budget[];
  transactions: TransactionWithCategory[];
}

export function BudgetWidget({ budgets, transactions }: BudgetWidgetProps) {
  const { mask } = useVisibility();
  const analysis = useMemo(() => {
    const analyzer = new BudgetAnalyzer();
    return analyzer.analyze(budgets, transactions);
  }, [budgets, transactions]);

  if (budgets.length === 0) {
    return (
      <Card>
        <CardHeader title="Limit Anggaran" href="/budgets" linkLabel="Kelola" />
        <EmptyState
          compact
          icon={PiggyBank}
          title="Belum ada limit anggaran"
          description="Atur batas belanja per kategori agar keuangan tetap terkendali."
          action={
            <Link href="/budgets">
              <Button size="sm">
                <PlusCircle className="h-3.5 w-3.5" />
                Set Anggaran
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="space-y-3.5">
      <CardHeader title="Limit Anggaran" href="/budgets" linkLabel="Kelola" />

      <div className="space-y-3">
        {analysis.categoryBudgets.map((status) => {
          const usage = Math.min(status.usagePercentage, 100);
          const tone =
            status.status === "exceeded"
              ? "danger"
              : status.status === "warning"
              ? "warning"
              : "accent";

          return (
            <div key={status.categoryId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-zinc-200">{status.categoryName}</span>
                <span className="tabular text-zinc-400">
                  <span
                    className={
                      tone === "danger"
                        ? "text-rose-400"
                        : tone === "warning"
                        ? "text-amber-400"
                        : "text-zinc-200"
                    }
                  >
                    {mask(status.spentAmount)}
                  </span>{" "}
                  / {mask(status.budgetAmount)}
                </span>
              </div>
              <Progress value={usage} tone={tone} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
