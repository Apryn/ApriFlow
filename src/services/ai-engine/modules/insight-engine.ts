import type { IInsightEngine } from "../interfaces/engines.interface";
import type {
  TransactionAnalysis,
  CashFlowAnalysis,
  BudgetAnalysis,
  FinancialHealthReport,
  FinancialInsight,
} from "../types";

export class InsightEngine implements IInsightEngine {
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
  ): FinancialInsight {
    
    if (aiInsightFields) {
      return {
        period,
        date: new Date().toISOString().split("T")[0],
        title: aiInsightFields.title,
        content: aiInsightFields.content,
        highlights: aiInsightFields.highlights,
        warnings: aiInsightFields.warnings,
        aiSummary: aiInsightFields.aiSummary,
      };
    }
    
    return generateFallbackInsight(period, transactions, cashFlow, budget, health);
  }
}

// Rule-based fallback insights in Indonesian
function generateFallbackInsight(
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly",
  transactions: TransactionAnalysis,
  cashFlow: CashFlowAnalysis,
  budget: BudgetAnalysis,
  health: FinancialHealthReport
): FinancialInsight {
  const dateStr = new Date().toISOString().split("T")[0];
  const title = `Laporan Keuangan ${period.toUpperCase()} — ApriFlow`;
  
  const highlights: string[] = [];
  const warnings: string[] = [];

  // 1. Compile highlights
  highlights.push(`Total Pemasukan: Rp${transactions.totalIncome.toLocaleString("id-ID")}`);
  highlights.push(`Total Pengeluaran: Rp${transactions.totalExpense.toLocaleString("id-ID")}`);
  
  if (cashFlow.netCashFlow > 0) {
    highlights.push(`Surplus keuangan sebesar Rp${cashFlow.netCashFlow.toLocaleString("id-ID")} (${Math.round(cashFlow.savingRate)}% dari pemasukan diselamatkan).`);
  }
  
  if (transactions.topExpenseCategories.length > 0) {
    const topCat = transactions.topExpenseCategories[0];
    highlights.push(`Kategori pengeluaran terbesar: ${topCat.categoryName} (Rp${topCat.totalAmount.toLocaleString("id-ID")}).`);
  }

  // 2. Compile warnings
  if (cashFlow.netCashFlow < 0) {
    warnings.push(`Defisit terdeteksi! Pengeluaran melebihi pemasukan sebesar Rp${Math.abs(cashFlow.netCashFlow).toLocaleString("id-ID")}.`);
  }

  if (cashFlow.leakyExpenseRatio > 15) {
    warnings.push(`Tingkat pengeluaran impulsif ('bocor') tinggi: ${Math.round(cashFlow.leakyExpenseRatio)}% dari total pengeluaran.`);
  }

  if (budget.categoriesOverBudget.length > 0) {
    warnings.push(`${budget.categoriesOverBudget.length} kategori pengeluaran melampaui anggaran.`);
  }

  if (transactions.abnormalTransactions.length > 0) {
    warnings.push(`Terdeteksi ${transactions.abnormalTransactions.length} transaksi abnormal dengan nominal mencurigakan.`);
  }

  // 3. Overall Content & Summary
  const statusStr = cashFlow.netCashFlow > 0 ? "surplus" : "defisit";
  const content = `Analisis keuangan untuk periode ini menunjukkan status ${statusStr} kas. Tingkat kesehatan finansial berada di skor ${health.overallScore}/100 (Grade ${health.grade}). Rasio pembagian pengeluaran: Wajib ${Math.round(cashFlow.essentialExpenseRatio)}%, Fleksibel ${Math.round(cashFlow.flexibleExpenseRatio)}%, Bocor ${Math.round(cashFlow.leakyExpenseRatio)}%.`;
  
  const aiSummary = `Halo! Selama periode ini, dompet Anda berada dalam kondisi ${statusStr}. ${
    cashFlow.netCashFlow > 0 
      ? `Bagus! Anda berhasil menyisihkan Rp${cashFlow.netCashFlow.toLocaleString("id-ID")} ke tabungan.`
      : "Hati-hati, Anda membelanjakan lebih banyak uang daripada yang masuk. Perketat ikat pinggang!"
  } Alokasi pengeluaran Anda didominasi oleh kategori ${
    transactions.topExpenseCategories[0]?.categoryName ?? "Lain-lain"
  }. Tetap lacak pengeluaran agar selalu terkontrol!`;

  return {
    period,
    date: dateStr,
    title,
    content,
    highlights,
    warnings,
    aiSummary,
  };
}
