import type { TransactionWithCategory } from "@/types/database.types";
import type { ITransactionAnalyzer } from "../interfaces/analyzers.interface";
import type {
  TransactionAnalysis,
  CategorySpending,
  MerchantFrequency,
  PaymentMethodUsage,
  RecurringTransaction,
  AbnormalTransaction,
} from "../types";

export class TransactionAnalyzer implements ITransactionAnalyzer {
  analyze(transactions: TransactionWithCategory[]): TransactionAnalysis {
    const totalCount = transactions.length;
    let totalIncome = 0;
    let totalExpense = 0;

    const categoryMap = new Map<string, { id: string | null; total: number; count: number; kind: any }>();
    const merchantMap = new Map<string, { count: number; total: number }>();
    const paymentMap = new Map<string, { count: number; total: number }>();
    
    // Group transactions by category for statistical anomaly detection
    const categoryAmountMap = new Map<string, number[]>();

    // Days of week distribution (0 = Sun, 6 = Sat)
    const dayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const weekOfMonth: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    // Unique dates to compute daily average
    const uniqueDates = new Set<string>();

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      const isIncome = tx.type === "income";
      uniqueDates.add(tx.date);

      // Income vs Expense
      if (isIncome) {
        totalIncome += amount;
      } else {
        totalExpense += amount;

        // Days of week patterns (only for expenses)
        const dateObj = new Date(tx.date + "T00:00:00");
        const day = dateObj.getDay();
        dayOfWeek[day] = (dayOfWeek[day] || 0) + amount;

        // Week of month (1 to 5)
        const dom = dateObj.getDate();
        const week = Math.min(5, Math.ceil(dom / 7));
        weekOfMonth[week] = (weekOfMonth[week] || 0) + amount;

        // Group amounts for anomalies
        const catId = tx.category_id || "unassigned";
        if (!categoryAmountMap.has(catId)) {
          categoryAmountMap.set(catId, []);
        }
        categoryAmountMap.get(catId)!.push(amount);
      }

      // Categories
      const catName = tx.category?.name ?? "Lain-lain";
      const catId = tx.category_id;
      const catKind = tx.category?.expense_kind ?? null;
      const currentCat = categoryMap.get(catName) ?? { id: catId, total: 0, count: 0, kind: catKind };
      currentCat.total += amount;
      currentCat.count += 1;
      categoryMap.set(catName, currentCat);

      // Merchants
      if (tx.merchant) {
        const mKey = tx.merchant.trim();
        const currentM = merchantMap.get(mKey) ?? { count: 0, total: 0 };
        currentM.count += 1;
        currentM.total += amount;
        merchantMap.set(mKey, currentM);
      }

      // Payment Methods
      const pm = tx.payment_method || "other";
      const currentP = paymentMap.get(pm) ?? { count: 0, total: 0 };
      currentP.count += 1;
      currentP.total += amount;
      paymentMap.set(pm, currentP);
    }

    // Format top categories
    const topExpenseCategories: CategorySpending[] = Array.from(categoryMap.entries())
      .filter(([_, data]) => data.id !== null) // Filter out income categories based on types later, but for now we look at general
      .map(([name, data]) => ({
        categoryId: data.id,
        categoryName: name,
        totalAmount: data.total,
        percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0,
        expenseKind: data.kind,
      }))
      // Simple filter: only count if it's expenses (amount registered as expense total)
      // Since categoryMap contains both income and expenses, let's refine this to represent only expenses for topExpenseCategories
      .filter((c) => {
        // Find if this category has expense transactions. We can check via its name
        const match = transactions.find((t) => t.category?.name === c.categoryName);
        return match ? match.type === "expense" : true;
      })
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Format top merchants
    const topMerchants: MerchantFrequency[] = Array.from(merchantMap.entries())
      .map(([name, data]) => ({
        merchant: name,
        count: data.count,
        totalAmount: data.total,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Format payment methods
    const paymentMethodDistribution: PaymentMethodUsage[] = Array.from(paymentMap.entries())
      .map(([method, data]) => ({
        method: method as any,
        count: data.count,
        totalAmount: data.total,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // Calculate daily average
    const daysCount = uniqueDates.size || 1;
    const dailyAverage = totalExpense / daysCount;

    // Detect abnormal transactions (expenses exceeding mean + 2*StdDev for their category, minimum 3 transactions)
    const abnormalTransactions: AbnormalTransaction[] = [];
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const catId = tx.category_id || "unassigned";
      const amounts = categoryAmountMap.get(catId) ?? [];
      
      if (amounts.length >= 3) {
        const sum = amounts.reduce((a, b) => a + b, 0);
        const mean = sum / amounts.length;
        const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
        const stdDev = Math.sqrt(variance);
        
        const amount = Number(tx.amount);
        // Flag if amount is > mean + 2 * stdDev and amount is above 150,000 IDR (to avoid small spikes)
        if (amount > mean + 2 * stdDev && amount > 150000) {
          abnormalTransactions.push({
            id: tx.id,
            date: tx.date,
            amount: amount,
            merchant: tx.merchant,
            categoryName: tx.category?.name ?? "Lain-lain",
            reason: `Nominal pengeluaran melebihi batas wajar kategori ini (Rata-rata: Rp${Math.round(mean).toLocaleString("id-ID")}, Deviasi: +${Math.round(amount - mean).toLocaleString("id-ID")})`,
          });
        }
      } else {
        // Fallback for categories with few transactions: flag if single expense is > 2,000,000 IDR
        const amount = Number(tx.amount);
        if (amount > 2000000) {
          abnormalTransactions.push({
            id: tx.id,
            date: tx.date,
            amount: amount,
            merchant: tx.merchant,
            categoryName: tx.category?.name ?? "Lain-lain",
            reason: `Nominal transaksi tunggal sangat besar (Rp${amount.toLocaleString("id-ID")})`,
          });
        }
      }
    }

    // Detect recurring transactions (group by merchant, look for regular interval differences)
    const recurringTransactions: RecurringTransaction[] = [];
    const merchantTxs = new Map<string, TransactionWithCategory[]>();
    for (const tx of transactions) {
      if (tx.type !== "expense" || !tx.merchant) continue;
      const mKey = tx.merchant.trim().toLowerCase();
      if (!merchantTxs.has(mKey)) {
        merchantTxs.set(mKey, []);
      }
      merchantTxs.get(mKey)!.push(tx);
    }

    for (const [mName, txList] of merchantTxs.entries()) {
      if (txList.length < 3) continue; // Minimum 3 points to confirm recurrency
      
      // Sort by date ascending
      const sorted = [...txList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate day differences
      const diffs: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const d1 = new Date(sorted[i - 1].date).getTime();
        const d2 = new Date(sorted[i].date).getTime();
        diffs.push((d2 - d1) / (1000 * 60 * 60 * 24));
      }

      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      // Calculate standard deviation of differences to see interval regularity
      const diffVariance = diffs.reduce((a, b) => a + Math.pow(b - avgDiff, 2), 0) / diffs.length;
      const diffStdDev = Math.sqrt(diffVariance);

      // If intervals are regular (low standard deviation relative to interval duration, e.g. stdDev < 4 days)
      if (diffStdDev <= 4) {
        let frequency: RecurringTransaction["frequency"] = "other";
        if (avgDiff >= 5 && avgDiff <= 9) {
          frequency = "weekly";
        } else if (avgDiff >= 11 && avgDiff <= 17) {
          frequency = "biweekly";
        } else if (avgDiff >= 25 && avgDiff <= 35) {
          frequency = "monthly";
        }

        // Average amount
        const avgAmount = sorted.reduce((sum, t) => sum + Number(t.amount), 0) / sorted.length;

        recurringTransactions.push({
          merchant: sorted[0].merchant!,
          categoryName: sorted[0].category?.name ?? "Lain-lain",
          amount: Math.round(avgAmount),
          frequency,
          lastOccurrence: sorted[sorted.length - 1].date,
          matchCount: sorted.length,
        });
      }
    }

    return {
      totalCount,
      totalIncome,
      totalExpense,
      netCashFlow: totalIncome - totalExpense,
      topExpenseCategories,
      topMerchants,
      paymentMethodDistribution,
      abnormalTransactions,
      recurringTransactions,
      patterns: {
        dayOfWeek,
        weekOfMonth,
        dailyAverage,
      },
    };
  }
}
