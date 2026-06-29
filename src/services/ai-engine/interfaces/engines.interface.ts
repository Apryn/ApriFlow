import type {
  TransactionAnalysis,
  BudgetAnalysis,
  GoalAnalysis,
  AssetAnalysis,
  CashFlowAnalysis,
  Predictions,
  FinancialHealthReport,
  Recommendation,
  FinancialInsight,
} from "../types";

export interface IPredictionEngine {
  predict(
    transactions: TransactionAnalysis,
    budgets: BudgetAnalysis,
    goals: GoalAnalysis,
    assets: AssetAnalysis
  ): Predictions;
}

export interface IFinancialHealthEngine {
  calculate(
    cashFlow: CashFlowAnalysis,
    budget: BudgetAnalysis,
    assets: AssetAnalysis,
    aiCommentary?: string
  ): FinancialHealthReport;
}

export interface IRecommendationEngine {
  recommend(
    health: FinancialHealthReport,
    cashFlow: CashFlowAnalysis,
    budget: BudgetAnalysis,
    goals: GoalAnalysis,
    predictions: Predictions,
    aiRecommendations?: Recommendation[]
  ): Recommendation[];
}

export interface IInsightEngine {
  generate(
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
    transactions: TransactionAnalysis,
    cashFlow: CashFlowAnalysis,
    budget: BudgetAnalysis,
    health: FinancialHealthReport,
    aiInsightFields?: {
      title: string;
      content: string;
      highlights: string[];
      warnings: string[];
      aiSummary: string;
    }
  ): FinancialInsight;
}
