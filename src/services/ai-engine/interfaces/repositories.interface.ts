import type { TransactionWithCategory, Asset } from "@/types/database.types";
import type { Budget, Goal } from "../types";

export interface ITransactionRepository {
  getByUserIdAndDateRange(
    userId: string,
    start: string,
    end: string
  ): Promise<TransactionWithCategory[]>;
}

export interface IBudgetRepository {
  getByUserId(userId: string): Promise<Budget[]>;
}

export interface IAssetRepository {
  getByUserId(userId: string): Promise<Asset[]>;
}

export interface IGoalRepository {
  getByUserId(userId: string): Promise<Goal[]>;
}
