import type { TransactionWithCategory, Asset } from "@/types/database.types";
import type {
  TransactionAnalysis,
  Budget,
  BudgetAnalysis,
  AssetAnalysis,
  Goal,
  GoalAnalysis,
  CashFlowAnalysis,
} from "../types";

export interface ITransactionAnalyzer {
  analyze(transactions: TransactionWithCategory[]): TransactionAnalysis;
}

export interface IBudgetAnalyzer {
  analyze(
    budgets: Budget[],
    transactions: TransactionWithCategory[]
  ): BudgetAnalysis;
}

export interface IAssetAnalyzer {
  analyze(assets: Asset[]): AssetAnalysis;
}

export interface IGoalAnalyzer {
  analyze(goals: Goal[]): GoalAnalysis;
}

export interface ICashFlowAnalyzer {
  analyze(transactions: TransactionWithCategory[]): CashFlowAnalysis;
}
