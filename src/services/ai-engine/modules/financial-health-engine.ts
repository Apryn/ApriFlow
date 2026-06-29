import type { IFinancialHealthEngine } from "../interfaces/engines.interface";
import type {
  CashFlowAnalysis,
  BudgetAnalysis,
  AssetAnalysis,
  FinancialHealthReport,
  HealthMetricBreakdown,
} from "../types";

export class FinancialHealthEngine implements IFinancialHealthEngine {
  calculate(
    cashFlow: CashFlowAnalysis,
    budget: BudgetAnalysis,
    assets: AssetAnalysis,
    aiCommentary?: string
  ): FinancialHealthReport {
    
    // 1. Component calculations
    const breakdown: HealthMetricBreakdown[] = [];

    // --- A. Cash Flow Score (25% Weight) ---
    let cashFlowScore = 0;
    if (cashFlow.netCashFlow > 0) {
      if (cashFlow.expenseRatio < 50) {
        cashFlowScore = 100;
      } else if (cashFlow.expenseRatio < 70) {
        cashFlowScore = 85;
      } else if (cashFlow.expenseRatio < 90) {
        cashFlowScore = 65;
      } else {
        cashFlowScore = 50;
      }
    } else {
      cashFlowScore = Math.max(10, Math.round(30 + (cashFlow.netCashFlow / 1000000) * 10)); // negative cash flow deducts points
      cashFlowScore = Math.min(40, cashFlowScore);
    }
    breakdown.push({
      name: "Cash Flow",
      score: cashFlowScore,
      weight: 0.25,
      explanation: cashFlow.netCashFlow > 0 
        ? `Arus kas positif sebesar Rp${cashFlow.netCashFlow.toLocaleString("id-ID")}. Rasio pengeluaran dibanding pemasukan berada di angka ${Math.round(cashFlow.expenseRatio)}%.`
        : `Arus kas negatif (defisit) sebesar Rp${Math.abs(cashFlow.netCashFlow).toLocaleString("id-ID")}. Pengeluaran Anda melebihi pemasukan.`,
    });

    // --- B. Saving Rate Score (25% Weight) ---
    let savingScore = 0;
    const rate = cashFlow.savingRate;
    if (rate >= 30) {
      savingScore = 100;
    } else if (rate >= 20) {
      savingScore = 90;
    } else if (rate >= 10) {
      savingScore = 75;
    } else if (rate >= 0) {
      savingScore = 50;
    } else {
      savingScore = 10;
    }
    breakdown.push({
      name: "Saving Rate",
      score: savingScore,
      weight: 0.25,
      explanation: rate > 0
        ? `Tingkat tabungan Anda adalah ${Math.round(rate)}% dari total pemasukan. Rekomendasi ideal adalah minimal 20%.`
        : `Anda tidak menabag bulan ini karena seluruh pemasukan habis atau defisit.`,
    });

    // --- C. Budget Discipline Score (20% Weight) ---
    let budgetScore = 100;
    let budgetExplanation = "Disiplin anggaran sangat baik.";
    if (budget.totalBudgetLimit > 0) {
      const usage = budget.overallUsagePercentage;
      if (usage > 100) {
        budgetScore = Math.max(10, Math.round(100 - (usage - 100) * 2));
        budgetExplanation = `Anggaran bulanan terlampaui. Total penggunaan anggaran adalah ${Math.round(usage)}% dengan ${budget.categoriesOverBudget.length} kategori over-budget.`;
      } else if (usage >= 90) {
        budgetScore = 80;
        budgetExplanation = `Anggaran bulanan hampir habis (${Math.round(usage)}% terpakai). Perlu berhati-hati di sisa periode.`;
      } else if (usage >= 80) {
        budgetScore = 90;
        budgetExplanation = `Penggunaan anggaran terkontrol baik di angka ${Math.round(usage)}%.`;
      } else {
        budgetScore = 100;
        budgetExplanation = `Penggunaan anggaran aman di angka ${Math.round(usage)}%.`;
      }

      // Deduct extra points for individual categories overbudget
      if (budget.categoriesOverBudget.length > 0) {
        budgetScore = Math.max(10, budgetScore - budget.categoriesOverBudget.length * 5);
      }
    } else {
      budgetScore = 70; // Deduct default score slightly since no budget constraints are set (less discipline tracking)
      budgetExplanation = "Anda belum membuat anggaran bulanan. Buat anggaran per kategori untuk melacak batasan pengeluaran.";
    }
    breakdown.push({
      name: "Budget Discipline",
      score: budgetScore,
      weight: 0.20,
      explanation: budgetExplanation,
    });

    // --- D. Asset Growth & Liquidity Score (15% Weight) ---
    let assetScore = 50;
    let assetExplanation = "";
    if (assets.totalValue > 0) {
      const ratio = assets.liquidityRatio;
      if (ratio >= 0.3 && ratio <= 0.7) {
        assetScore = 100;
        assetExplanation = `Distribusi aset sangat ideal dengan rasio likuiditas ${Math.round(ratio * 100)}%. Kombinasi dana kas dan investasi jangka panjang seimbang.`;
      } else if (ratio > 0.7) {
        assetScore = 80;
        assetExplanation = `Aset didominasi kas likuid (${Math.round(ratio * 100)}%). Bagus untuk keamanan, namun Anda kehilangan potensi imbal hasil investasi jangka panjang.`;
      } else {
        assetScore = 60;
        assetExplanation = `Sebagian besar aset tidak likuid (${Math.round((1 - ratio) * 100)}%). Likuiditas kas Anda rendah, berisiko jika ada kebutuhan mendesak mendadak.`;
      }
    } else {
      assetScore = 20;
      assetExplanation = "Belum ada catatan aset aktif. Catat tabungan, emas, atau aset lain di menu Aset.";
    }
    breakdown.push({
      name: "Asset Allocation",
      score: assetScore,
      weight: 0.15,
      explanation: assetExplanation,
    });

    // --- E. Emergency Fund Score (15% Weight) ---
    let emergencyScore = 10;
    let emergencyExplanation = "";
    const monthlySpending = Math.max(100000, cashFlow.averageMonthlySpending);
    const monthsCovered = assets.liquidValue / monthlySpending;

    if (monthsCovered >= 6) {
      emergencyScore = 100;
      emergencyExplanation = `Dana darurat likuid Anda sangat aman, cukup untuk membiayai ${monthsCovered.toFixed(1)} bulan pengeluaran rata-rata.`;
    } else if (monthsCovered >= 3) {
      emergencyScore = 85;
      emergencyExplanation = `Dana darurat likuid cukup aman, membiayai ${monthsCovered.toFixed(1)} bulan pengeluaran. Target aman adalah 6 bulan.`;
    } else if (monthsCovered >= 1) {
      emergencyScore = 50;
      emergencyExplanation = `Dana darurat likuid hanya bertahan ${monthsCovered.toFixed(1)} bulan. Disarankan untuk menambah alokasi dana darurat segera.`;
    } else {
      emergencyScore = 10;
      emergencyExplanation = `Dana darurat likuid Anda sangat kritis, kurang dari 1 bulan biaya hidup (${monthsCovered.toFixed(1)} bulan). Sangat berisiko tinggi.`;
    }
    breakdown.push({
      name: "Emergency Fund",
      score: emergencyScore,
      weight: 0.15,
      explanation: emergencyExplanation,
    });

    // 2. Final weighted score calculation
    let overallScore = 0;
    for (const item of breakdown) {
      overallScore += item.score * item.weight;
    }
    overallScore = Math.round(overallScore);

    // 3. Map to Grade
    let grade: FinancialHealthReport["grade"] = "F";
    if (overallScore >= 90) grade = "A";
    else if (overallScore >= 80) grade = "B";
    else if (overallScore >= 70) grade = "C";
    else if (overallScore >= 60) grade = "D";

    // 4. Explanation & AI Commentary
    const finalCommentary = aiCommentary && aiCommentary.trim().length > 0
      ? aiCommentary
      : generateFallbackCommentary(overallScore, grade, breakdown);

    return {
      overallScore,
      grade,
      breakdown,
      aiCommentary: finalCommentary,
    };
  }
}

// Fallback rule-based commentator (Indonesian)
function generateFallbackCommentary(
  score: number,
  grade: string,
  breakdown: HealthMetricBreakdown[]
): string {
  let summary = `Skor Kesehatan Finansial Anda adalah **${score}/100** dengan predikat **Kelas ${grade}**.\n\n`;

  const cashFlowItem = breakdown.find((b) => b.name === "Cash Flow")!;
  const savingItem = breakdown.find((b) => b.name === "Saving Rate")!;
  const budgetItem = breakdown.find((b) => b.name === "Budget Discipline")!;
  const emergencyItem = breakdown.find((b) => b.name === "Emergency Fund")!;

  if (score >= 85) {
    summary += "Kondisi keuangan Anda sangat sehat! Anda memiliki surplus kas yang baik, alokasi tabungan yang solid, dan dana darurat yang memadai. Pertahankan disiplin pengeluaran Anda dan pertimbangkan untuk mengoptimalkan kelebihan dana ke instrumen investasi produktif.";
  } else if (score >= 70) {
    summary += "Kondisi keuangan Anda tergolong cukup baik. Namun ada beberapa area yang perlu dioptimalkan. ";
    if (budgetItem.score < 80) {
      summary += "Kurangi pengeluaran yang tidak terencana agar Anda tidak melampaui batas anggaran kategori.";
    } else if (emergencyItem.score < 60) {
      summary += "Fokus utama Anda harus diarahkan pada pemenuhan cadangan dana darurat likuid minimal untuk 3 bulan pengeluaran.";
    } else {
      summary += "Meningkatkan rasio tabungan bulanan (saving rate) Anda di atas 20% akan mempercepat pencapaian finansial jangka panjang.";
    }
  } else {
    summary += "Kondisi keuangan Anda memerlukan perhatian mendesak. Arus kas Anda tidak seimbang atau dana cadangan darurat Anda berada dalam level kritis. ";
    if (cashFlowItem.score < 50) {
      summary += "Prioritaskan pemotongan biaya fleksibel dan bocor (misalnya jajan warkop, belanja impulsif) untuk membalikkan posisi cash flow menjadi positif. ";
    }
    if (emergencyItem.score < 30) {
      summary += "Jangan melakukan investasi berisiko terlebih dahulu sebelum memiliki dana darurat minimal setara 1 bulan biaya hidup.";
    }
  }

  return summary;
}
