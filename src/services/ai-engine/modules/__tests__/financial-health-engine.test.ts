import { describe, it, expect } from "vitest";
import { FinancialHealthEngine } from "../financial-health-engine";
import type { CashFlowAnalysis, BudgetAnalysis, AssetAnalysis } from "../../types";

describe("FinancialHealthEngine", () => {
  const engine = new FinancialHealthEngine();

  it("calculates excellent health score for positive cash flow, high saving rate, and balanced assets", () => {
    const cashFlow: CashFlowAnalysis = {
      netCashFlow: 6000000,
      savingRate: 60,
      expenseRatio: 40,
      incomeStabilityIndex: 1,
      essentialExpenseRatio: 20,
      flexibleExpenseRatio: 15,
      leakyExpenseRatio: 5,
      averageMonthlySpending: 4000000,
      averageMonthlyIncome: 10000000,
    };

    const budget: BudgetAnalysis = {
      totalBudgetLimit: 5000000,
      totalSpent: 4000000,
      totalRemaining: 1000000,
      overallUsagePercentage: 80,
      categoriesOverBudget: [],
      categoriesAlmostExhausted: [],
      categoryBudgets: [],
    };

    const asset: AssetAnalysis = {
      totalValue: 30000000,
      liquidValue: 20000000,
      nonLiquidValue: 10000000,
      liquidityRatio: 0.67,
      allocation: [
        {
          assetId: "1",
          name: "Bank Mandiri",
          type: "bank",
          value: 20000000,
          percentage: 67,
          isLiquid: true,
        },
        {
          assetId: "2",
          name: "Emas Antam",
          type: "gold",
          value: 10000000,
          percentage: 33,
          isLiquid: false,
        }
      ],
    };

    const report = engine.calculate(cashFlow, budget, asset);

    expect(report.overallScore).toBeGreaterThanOrEqual(80);
    expect(report.grade).toBe("A");
    expect(report.breakdown.length).toBe(5);
  });

  it("calculates poor health score for deficit cash flow and low liquidity", () => {
    const cashFlow: CashFlowAnalysis = {
      netCashFlow: -1000000,
      savingRate: 0,
      expenseRatio: 120,
      incomeStabilityIndex: 0.5,
      essentialExpenseRatio: 70,
      flexibleExpenseRatio: 30,
      leakyExpenseRatio: 20,
      averageMonthlySpending: 6000000,
      averageMonthlyIncome: 5000000,
    };

    const budget: BudgetAnalysis = {
      totalBudgetLimit: 5000000,
      totalSpent: 6000000,
      totalRemaining: -1000000,
      overallUsagePercentage: 120,
      categoriesOverBudget: [
        { 
          categoryId: "1", 
          categoryName: "Makan", 
          budgetAmount: 2000000, 
          spentAmount: 3000000, 
          remainingAmount: -1000000,
          usagePercentage: 150,
          status: "exceeded" as const,
        }
      ],
      categoriesAlmostExhausted: [],
      categoryBudgets: [],
    };

    const asset: AssetAnalysis = {
      totalValue: 2000000,
      liquidValue: 500000,
      nonLiquidValue: 1500000,
      liquidityRatio: 0.25,
      allocation: [
        {
          assetId: "1",
          name: "Cash",
          type: "cash",
          value: 500000,
          percentage: 25,
          isLiquid: true,
        }
      ],
    };

    const report = engine.calculate(cashFlow, budget, asset);

    expect(report.overallScore).toBeLessThanOrEqual(50);
    expect(["C", "D", "F"]).toContain(report.grade);
  });
});
