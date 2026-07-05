"use client";

import { useMemo } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils/currency";
import type { TransactionWithCategory } from "@/types/database.types";
import { BudgetAnalyzer } from "@/services/ai-engine/modules/budget-analyzer";
import type { Budget } from "@/services/ai-engine/types";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Flame, CheckCircle2 } from "lucide-react";

interface BudgetWidgetProps {
  budgets: Budget[];
  transactions: TransactionWithCategory[];
}

export function BudgetWidget({ budgets, transactions }: BudgetWidgetProps) {
  const analysis = useMemo(() => {
    const analyzer = new BudgetAnalyzer();
    return analyzer.analyze(budgets, transactions);
  }, [budgets, transactions]);

  if (budgets.length === 0) {
    return (
      <Card className="border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Limit Anggaran Bulanan
          </CardTitle>
        </div>
        <div className="text-center py-4 space-y-3">
          <p className="text-xs text-zinc-500">Belum ada limit anggaran bulanan yang diatur.</p>
          <Link href="/budgets" className="inline-block">
            <Button size="sm" className="bg-teal-400 text-black border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-teal-300">
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Set Anggaran
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-4">
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          Limit Anggaran Bulanan
        </CardTitle>
        <Link href="/budgets" className="text-xs font-bold text-teal-400 hover:underline">
          Kelola
        </Link>
      </div>

      <div className="space-y-4">
        {analysis.categoryBudgets.map((status) => {
          const usage = Math.min(status.usagePercentage, 100);
          
          let fillerColor = "bg-teal-400";
          let textColor = "text-teal-400";
          if (status.status === "exceeded") {
            fillerColor = "bg-rose-500";
            textColor = "text-rose-400";
          } else if (status.status === "warning") {
            fillerColor = "bg-amber-400";
            textColor = "text-amber-400";
          }

          return (
            <div key={status.categoryId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-100 flex items-center gap-1">
                  {status.categoryName}
                  {status.status === "exceeded" && (
                    <Flame className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                  )}
                  {status.status === "normal" && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                  )}
                </span>
                <span className="text-zinc-400">
                  <span className={textColor}>{formatRupiah(status.spentAmount)}</span> / {formatRupiah(status.budgetAmount)}
                </span>
              </div>

              {/* Neo-brutalist Progress Bar */}
              <div className="w-full bg-zinc-950 border-2 border-black rounded-full h-4 overflow-hidden relative shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                <div
                  className={`h-full ${fillerColor} border-r-2 border-black rounded-full transition-all duration-500`}
                  style={{ width: `${usage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
