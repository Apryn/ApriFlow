import type { IPredictionEngine } from "../interfaces/engines.interface";
import type {
  TransactionAnalysis,
  BudgetAnalysis,
  GoalAnalysis,
  AssetAnalysis,
  Predictions,
  CategoryExhaustionPrediction,
} from "../types";

export class PredictionEngine implements IPredictionEngine {
  predict(
    transactions: TransactionAnalysis,
    budgets: BudgetAnalysis,
    goals: GoalAnalysis,
    assets: AssetAnalysis
  ): Predictions {
    const today = new Date();
    const currentDay = Math.max(1, today.getDate());
    const year = today.getFullYear();
    const monthIndex = today.getMonth(); // 0-indexed
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const remainingDays = Math.max(0, daysInMonth - currentDay);

    // 1. Project cash flow to end of month
    // Burn rate logic: average daily income / expense so far
    const dailyIncomeRate = transactions.totalIncome / currentDay;
    const dailyExpenseRate = transactions.totalExpense / currentDay;

    const projectedIncome = transactions.totalIncome + (dailyIncomeRate * remainingDays);
    const projectedExpense = transactions.totalExpense + (dailyExpenseRate * remainingDays);
    const estimatedEndOfMonthCashFlow = projectedIncome - projectedExpense;
    
    // Project end of month asset balance (Asset total + projected additional cash flow for the month)
    const currentCashFlow = transactions.totalIncome - transactions.totalExpense;
    const estimatedEndOfMonthBalance = assets.totalValue + (estimatedEndOfMonthCashFlow - currentCashFlow);

    // 2. Predict Category Budget Exhaustion
    const categoryExhaustions: CategoryExhaustionPrediction[] = [];
    const overspendingRisks: string[] = [];

    for (const catBudget of budgets.categoryBudgets) {
      const budgetAmount = catBudget.budgetAmount;
      const spentAmount = catBudget.spentAmount;
      const remainingAmount = catBudget.remainingAmount;

      const dailyCategoryBurnRate = spentAmount / currentDay;
      const predictedEomCategorySpent = dailyCategoryBurnRate * daysInMonth;
      
      let estimatedExhaustionDate: string | null = null;
      let isLikelyToOverspend = false;
      let predictedOverspendAmount = 0;

      if (predictedEomCategorySpent > budgetAmount) {
        isLikelyToOverspend = true;
        predictedOverspendAmount = Math.max(0, Math.round(predictedEomCategorySpent - budgetAmount));
        overspendingRisks.push(catBudget.categoryName);

        // Calculate when it will run out
        if (dailyCategoryBurnRate > 0) {
          const daysToExhaustion = remainingAmount / dailyCategoryBurnRate;
          if (daysToExhaustion >= 0 && daysToExhaustion < remainingDays) {
            const exhaustionDate = new Date();
            exhaustionDate.setDate(today.getDate() + Math.ceil(daysToExhaustion));
            estimatedExhaustionDate = exhaustionDate.toISOString().split("T")[0];
          }
        }
      }

      categoryExhaustions.push({
        categoryId: catBudget.categoryId,
        categoryName: catBudget.categoryName,
        estimatedExhaustionDate,
        isLikelyToOverspend,
        predictedOverspendAmount,
      });
    }

    // 3. Goal Projections
    // Saving velocity is projected monthly cash flow (minimum of current cash flow vs projected cash flow)
    // We default to a minimum of 100,000 IDR to avoid division by zero or infinite timeline if cash flow is negative
    const savingVelocity = Math.max(100000, estimatedEndOfMonthCashFlow);

    const goalProjections = goals.goals.map((g) => {
      if (g.isCompleted) {
        return {
          goalId: g.goalId,
          goalName: g.name,
          projectedCompletionDate: today.toISOString().split("T")[0],
        };
      }

      const remainingToSave = g.targetAmount - g.currentAmount;
      const monthsNeeded = remainingToSave / savingVelocity;

      if (monthsNeeded === Infinity || isNaN(monthsNeeded)) {
        return {
          goalId: g.goalId,
          goalName: g.name,
          projectedCompletionDate: null,
        };
      }

      const projectedDate = new Date();
      // Add months
      projectedDate.setMonth(projectedDate.getMonth() + Math.ceil(monthsNeeded));
      return {
        goalId: g.goalId,
        goalName: g.name,
        projectedCompletionDate: projectedDate.toISOString().split("T")[0],
      };
    });

    // Populate estimatedCompletionDate in GoalAnalysis items if needed, but since it is handled here, it aligns perfectly!
    // We return the Predictions payload.
    return {
      estimatedEndOfMonthBalance: Math.round(estimatedEndOfMonthBalance),
      estimatedEndOfMonthCashFlow: Math.round(estimatedEndOfMonthCashFlow),
      categoryExhaustions,
      overspendingRisks,
      goalProjections,
    };
  }
}
