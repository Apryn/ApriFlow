import type { TransactionWithCategory } from "@/types/database.types";
import type { IBudgetAnalyzer } from "../interfaces/analyzers.interface";
import type { Budget, BudgetAnalysis, CategoryBudgetStatus } from "../types";

export class BudgetAnalyzer implements IBudgetAnalyzer {
  analyze(
    budgets: Budget[],
    transactions: TransactionWithCategory[]
  ): BudgetAnalysis {
    let totalBudgetLimit = 0;
    let totalSpent = 0;

    // Group actual spending by category ID
    const spendingMap = new Map<string, { total: number; name: string }>();

    // Initialize map with all budget category IDs
    for (const b of budgets) {
      spendingMap.set(b.category_id, { total: 0, name: "Kategori Lain" });
    }

    // Populate actual spending from confirmed transactions (expenses only)
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const catId = tx.category_id;
      if (!catId) continue;

      const current = spendingMap.get(catId) ?? { total: 0, name: tx.category?.name ?? "Lain-lain" };
      current.total += Number(tx.amount);
      if (tx.category) {
        current.name = tx.category.name;
      }
      spendingMap.set(catId, current);
    }

    const categoryBudgets: CategoryBudgetStatus[] = [];
    const categoriesAlmostExhausted: CategoryBudgetStatus[] = [];
    const categoriesOverBudget: CategoryBudgetStatus[] = [];

    for (const b of budgets) {
      const budgetAmount = Number(b.amount);
      totalBudgetLimit += budgetAmount;

      const spentData = spendingMap.get(b.category_id) ?? { total: 0, name: "Kategori Lain" };
      const spentAmount = spentData.total;
      totalSpent += spentAmount;

      const remainingAmount = budgetAmount - spentAmount;
      const usagePercentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;

      let status: CategoryBudgetStatus["status"] = "normal";
      if (usagePercentage >= 100) {
        status = "exceeded";
      } else if (usagePercentage >= 80) {
        status = "warning";
      }

      const budgetStatus: CategoryBudgetStatus = {
        categoryId: b.category_id,
        categoryName: spentData.name,
        budgetAmount,
        spentAmount,
        remainingAmount,
        usagePercentage,
        status,
      };

      categoryBudgets.push(budgetStatus);

      if (status === "exceeded") {
        categoriesOverBudget.push(budgetStatus);
      } else if (status === "warning") {
        categoriesAlmostExhausted.push(budgetStatus);
      }
    }

    const totalRemaining = totalBudgetLimit - totalSpent;
    const overallUsagePercentage = totalBudgetLimit > 0 ? (totalSpent / totalBudgetLimit) * 100 : 0;

    return {
      totalBudgetLimit,
      totalSpent,
      totalRemaining,
      overallUsagePercentage,
      categoriesAlmostExhausted,
      categoriesOverBudget,
      categoryBudgets,
    };
  }
}
