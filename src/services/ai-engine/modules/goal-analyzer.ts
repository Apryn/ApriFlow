import type { IGoalAnalyzer } from "../interfaces/analyzers.interface";
import type { Goal, GoalAnalysis, GoalStatus } from "../types";

export class GoalAnalyzer implements IGoalAnalyzer {
  analyze(goals: Goal[]): GoalAnalysis {
    const totalCount = goals.length;
    let completedCount = 0;
    let pendingCount = 0;

    const goalStatuses: GoalStatus[] = goals.map((goal) => {
      const targetAmount = Number(goal.target_amount);
      const currentAmount = Number(goal.current_amount);
      const remainingAmount = Math.max(0, targetAmount - currentAmount);
      
      const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
      const isCompleted = goal.is_completed || progressPercentage >= 100;

      if (isCompleted) {
        completedCount++;
      } else {
        pendingCount++;
      }

      // Calculate recommended savings if target date is set
      let recommendedMonthlySaving = 0;
      if (goal.target_date && !isCompleted) {
        const targetD = new Date(goal.target_date);
        const today = new Date();
        const diffMs = targetD.getTime() - today.getTime();
        const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.41); // average days in month
        
        if (diffMonths > 0) {
          recommendedMonthlySaving = Math.round(remainingAmount / diffMonths);
        } else {
          recommendedMonthlySaving = remainingAmount; // target date is past or today, save full amount now
        }
      }

      return {
        goalId: goal.id,
        name: goal.name,
        targetAmount,
        currentAmount,
        progressPercentage,
        targetDate: goal.target_date,
        estimatedCompletionDate: null, // Will be predicted by PredictionEngine using actual cash flow velocity
        recommendedMonthlySaving,
        isCompleted,
      };
    });

    // Find fastest/slowest to complete (among pending goals)
    const pendingGoals = goalStatuses.filter((g) => !g.isCompleted);
    let fastestToComplete: GoalStatus | null = null;
    let slowestToComplete: GoalStatus | null = null;

    if (pendingGoals.length > 0) {
      // Sort by progressPercentage descending (highest progress is closest to completion)
      const sortedByProgress = [...pendingGoals].sort((a, b) => b.progressPercentage - a.progressPercentage);
      fastestToComplete = sortedByProgress[0];
      slowestToComplete = sortedByProgress[sortedByProgress.length - 1];
    }

    return {
      goals: goalStatuses,
      completedCount,
      pendingCount,
      fastestToComplete,
      slowestToComplete,
    };
  }
}
