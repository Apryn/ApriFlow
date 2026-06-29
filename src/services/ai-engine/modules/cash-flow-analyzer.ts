import type { TransactionWithCategory } from "@/types/database.types";
import type { ICashFlowAnalyzer } from "../interfaces/analyzers.interface";
import type { CashFlowAnalysis } from "../types";

export class CashFlowAnalyzer implements ICashFlowAnalyzer {
  analyze(transactions: TransactionWithCategory[]): CashFlowAnalysis {
    let totalIncome = 0;
    let totalExpense = 0;

    let wajibExpense = 0;
    let fleksibelExpense = 0;
    let bocorExpense = 0;
    let otherExpense = 0;

    // Group income amounts to compute stability (coefficient of variation)
    const incomeAmounts: number[] = [];

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      if (tx.type === "income") {
        totalIncome += amount;
        incomeAmounts.push(amount);
      } else {
        totalExpense += amount;
        
        const kind = tx.category?.expense_kind;
        if (kind === "wajib") {
          wajibExpense += amount;
        } else if (kind === "fleksibel") {
          fleksibelExpense += amount;
        } else if (kind === "bocor") {
          bocorExpense += amount;
        } else {
          otherExpense += amount;
        }
      }
    }

    // Treat other/unclassified expense as flexible
    fleksibelExpense += otherExpense;

    // Ratios
    const essentialExpenseRatio = totalExpense > 0 ? (wajibExpense / totalExpense) * 100 : 0;
    const flexibleExpenseRatio = totalExpense > 0 ? (fleksibelExpense / totalExpense) * 100 : 0;
    const leakyExpenseRatio = totalExpense > 0 ? (bocorExpense / totalExpense) * 100 : 0;

    const netCashFlow = totalIncome - totalExpense;
    const savingRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;
    const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

    // Calculate income stability index:
    // If no income, stability is 0
    // If 1 income stream, stability is 0.75 (steady single source like a job salary)
    // If multiple streams, we check standard deviation.
    let incomeStabilityIndex = 0;
    if (incomeAmounts.length === 1) {
      incomeStabilityIndex = 0.8;
    } else if (incomeAmounts.length > 1) {
      const avgIncome = totalIncome / incomeAmounts.length;
      const variance = incomeAmounts.reduce((a, b) => a + Math.pow(b - avgIncome, 2), 0) / incomeAmounts.length;
      const stdDev = Math.sqrt(variance);
      
      const coV = avgIncome > 0 ? stdDev / avgIncome : 0;
      // High CoV means unstable income. Stability = Math.max(0, 1 - CoV)
      incomeStabilityIndex = Math.max(0.1, Math.min(1.0, 1.0 - coV * 0.5));
    }

    return {
      netCashFlow,
      savingRate,
      expenseRatio,
      incomeStabilityIndex,
      averageMonthlySpending: totalExpense, // since transactions list is usually bounded to a month/range
      averageMonthlyIncome: totalIncome,
      essentialExpenseRatio,
      flexibleExpenseRatio,
      leakyExpenseRatio,
    };
  }
}
