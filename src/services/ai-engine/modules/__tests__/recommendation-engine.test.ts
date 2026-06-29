import { describe, it, expect } from "vitest";
import { RecommendationEngine } from "../recommendation-engine";
import type { FinancialHealthReport, CashFlowAnalysis, BudgetAnalysis, GoalAnalysis, Predictions } from "../../types";

describe("RecommendationEngine", () => {
  const engine = new RecommendationEngine();

  const mockHealth: FinancialHealthReport = {
    overallScore: 60,
    grade: "C",
    breakdown: [
      { name: "Emergency Fund", score: 70, weight: 0.15, explanation: "Cukup" },
      { name: "Saving Rate", score: 60, weight: 0.25, explanation: "Cukup" },
      { name: "Budget Discipline", score: 80, weight: 0.20, explanation: "Baik" },
      { name: "Asset Allocation", score: 85, weight: 0.15, explanation: "Sangat baik" },
      { name: "Cash Flow Stability", score: 90, weight: 0.25, explanation: "Sangat baik" },
    ],
    aiCommentary: "Kondisi cukup stabil.",
  };

  const mockCashFlow: CashFlowAnalysis = {
    netCashFlow: 2000000,
    savingRate: 20,
    expenseRatio: 80,
    incomeStabilityIndex: 1,
    averageMonthlySpending: 8000000,
    averageMonthlyIncome: 10000000,
    essentialExpenseRatio: 50,
    flexibleExpenseRatio: 25,
    leakyExpenseRatio: 5,
  };

  const mockBudget: BudgetAnalysis = {
    totalBudgetLimit: 9000000,
    totalSpent: 8000000,
    totalRemaining: 1000000,
    overallUsagePercentage: 88,
    categoriesOverBudget: [],
    categoriesAlmostExhausted: [],
    categoryBudgets: [],
  };

  const mockGoal: GoalAnalysis = {
    goals: [],
    completedCount: 0,
    pendingCount: 0,
    fastestToComplete: null,
    slowestToComplete: null,
  };

  const mockPredictions: Predictions = {
    estimatedEndOfMonthBalance: 2000000,
    estimatedEndOfMonthCashFlow: 2000000,
    categoryExhaustions: [],
    overspendingRisks: [],
    goalProjections: [],
  };

  it("returns pre-computed AI recommendations directly when provided", () => {
    const aiRecs = [
      {
        id: "ai-rec-1",
        title: "Pangkas Biaya Langganan",
        description: "Ada biaya langganan yang tidak terpakai.",
        priority: "medium" as const,
        category: "budget" as const,
        actionPlan: "Hentikan langganan musik premium.",
        impact: "Menghemat 50rb per bulan.",
        reason: "Terdeteksi transaksi recurring Spotify.",
      },
    ];

    const results = engine.recommend(mockHealth, mockCashFlow, mockBudget, mockGoal, mockPredictions, aiRecs);

    expect(results).toEqual(aiRecs);
  });

  it("falls back to local rules-based recommendations if no AI recommendations are provided", () => {
    // If deficit cash flow, it should recommend cutting expenses
    const deficitCashFlow = { ...mockCashFlow, netCashFlow: -500000, savingRate: 0 };
    const results = engine.recommend(mockHealth, deficitCashFlow, mockBudget, mockGoal, mockPredictions);

    expect(results.length).toBeGreaterThan(0);
    const deficitRec = results.find((r) => r.category === "cashflow");
    expect(deficitRec).toBeDefined();
    expect(deficitRec?.priority).toBe("high");
  });
});
