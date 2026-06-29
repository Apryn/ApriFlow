import type { ExpenseKind, PaymentMethod } from "@/types/database.types";

// ============================================================================
// Core Database Models (Domain representation)
// ============================================================================

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: string; // e.g. 'monthly'
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Data Transfer Objects (DTOs) for Analyzers
// ============================================================================

export interface CategorySpending {
  categoryId: string | null;
  categoryName: string;
  totalAmount: number;
  percentage: number;
  expenseKind: ExpenseKind | null;
}

export interface MerchantFrequency {
  merchant: string;
  count: number;
  totalAmount: number;
}

export interface PaymentMethodUsage {
  method: PaymentMethod | "other";
  count: number;
  totalAmount: number;
}

export interface SpendingPattern {
  dayOfWeek: Record<number, number>; // 0 = Sunday, 1 = Monday, etc. -> total spent
  weekOfMonth: Record<number, number>; // 1, 2, 3, 4, 5 -> total spent
  dailyAverage: number;
}

export interface RecurringTransaction {
  merchant: string;
  categoryName: string;
  amount: number;
  frequency: "weekly" | "monthly" | "biweekly" | "other";
  lastOccurrence: string;
  matchCount: number;
}

export interface AbnormalTransaction {
  id: string;
  date: string;
  amount: number;
  merchant: string | null;
  categoryName: string;
  reason: string;
}

export interface TransactionAnalysis {
  totalCount: number;
  totalIncome: number;
  totalExpense: number;
  netCashFlow: number;
  topExpenseCategories: CategorySpending[];
  topMerchants: MerchantFrequency[];
  paymentMethodDistribution: PaymentMethodUsage[];
  abnormalTransactions: AbnormalTransaction[];
  recurringTransactions: RecurringTransaction[];
  patterns: SpendingPattern;
}

export interface CategoryBudgetStatus {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  usagePercentage: number;
  status: "normal" | "warning" | "exceeded";
}

export interface BudgetAnalysis {
  totalBudgetLimit: number;
  totalSpent: number;
  totalRemaining: number;
  overallUsagePercentage: number;
  categoriesAlmostExhausted: CategoryBudgetStatus[];
  categoriesOverBudget: CategoryBudgetStatus[];
  categoryBudgets: CategoryBudgetStatus[];
}

export interface AssetAllocation {
  assetId: string;
  name: string;
  type: string;
  value: number;
  percentage: number;
  isLiquid: boolean;
}

export interface AssetAnalysis {
  totalValue: number;
  liquidValue: number;
  nonLiquidValue: number;
  liquidityRatio: number; // liquidValue / totalValue
  allocation: AssetAllocation[];
}

export interface GoalStatus {
  goalId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  targetDate: string | null;
  estimatedCompletionDate: string | null; // calculated YYYY-MM-DD
  recommendedMonthlySaving: number;
  isCompleted: boolean;
}

export interface GoalAnalysis {
  goals: GoalStatus[];
  completedCount: number;
  pendingCount: number;
  fastestToComplete: GoalStatus | null;
  slowestToComplete: GoalStatus | null;
}

export interface CashFlowAnalysis {
  netCashFlow: number;
  savingRate: number; // (netCashFlow / income) * 100
  expenseRatio: number; // (expense / income) * 100
  incomeStabilityIndex: number; // 0 to 1 based on monthly variance
  averageMonthlySpending: number;
  averageMonthlyIncome: number;
  essentialExpenseRatio: number; // wajib / total expense
  flexibleExpenseRatio: number; // fleksibel / total expense
  leakyExpenseRatio: number; // bocor / total expense
}

// ============================================================================
// Data Transfer Objects (DTOs) for AI Engines
// ============================================================================

export interface HealthMetricBreakdown {
  name: string;
  score: number; // 0-100
  weight: number; // 0.0 - 1.0
  explanation: string;
}

export interface FinancialHealthReport {
  overallScore: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: HealthMetricBreakdown[];
  aiCommentary: string;
}

export interface CategoryExhaustionPrediction {
  categoryId: string;
  categoryName: string;
  estimatedExhaustionDate: string | null; // YYYY-MM-DD or null
  isLikelyToOverspend: boolean;
  predictedOverspendAmount: number;
}

export interface Predictions {
  estimatedEndOfMonthBalance: number;
  estimatedEndOfMonthCashFlow: number;
  categoryExhaustions: CategoryExhaustionPrediction[];
  overspendingRisks: string[]; // list of category names
  goalProjections: {
    goalId: string;
    goalName: string;
    projectedCompletionDate: string | null;
  }[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "budget" | "saving" | "asset" | "cashflow" | "general";
  actionPlan: string;
  impact: string;
  reason: string;
}

export interface FinancialInsight {
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  date: string;
  title: string;
  content: string;
  highlights: string[];
  warnings: string[];
  aiSummary: string;
}

export interface FullFinancialAnalysis {
  userId: string;
  generatedAt: string;
  scope: string;
  transactionAnalysis: TransactionAnalysis;
  budgetAnalysis: BudgetAnalysis;
  assetAnalysis: AssetAnalysis;
  goalAnalysis: GoalAnalysis;
  cashFlowAnalysis: CashFlowAnalysis;
  financialHealth: FinancialHealthReport;
  predictions: Predictions;
  recommendations: Recommendation[];
  insights: FinancialInsight;
}

export interface SimulationResult {
  decisionType: "resign" | "purchase" | "goal_roadmap" | "general";
  isViable: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
  currentMetrics: {
    netCashFlow: number;
    savingRate: number;
    healthScore: number;
    liquidAssets: number;
    emergencyFundMonths: number;
  };
  simulatedMetrics: {
    netCashFlow: number;
    savingRate: number;
    healthScore: number;
    liquidAssets: number;
    emergencyFundMonths: number;
  };
  impactExplanation: string;
  warnings: string[];
  recommendations: string[];
}
