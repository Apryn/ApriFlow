import { TransactionRepository } from "../repositories/transaction.repository";
import { AssetRepository } from "../repositories/asset.repository";
import { BudgetRepository } from "../repositories/budget.repository";
import { GoalRepository } from "../repositories/goal.repository";
import { TransactionAnalyzer } from "./transaction-analyzer";
import { BudgetAnalyzer } from "./budget-analyzer";
import { AssetAnalyzer } from "./asset-analyzer";
import { GoalAnalyzer } from "./goal-analyzer";
import { CashFlowAnalyzer } from "./cash-flow-analyzer";
import { FinancialHealthEngine } from "./financial-health-engine";
import { PredictionEngine } from "./prediction-engine";
import { getCurrentMonthRange } from "@/lib/utils/date";
import type { SimulationResult } from "../types";

export class DecisionSimulator {
  private transactionRepo = new TransactionRepository();
  private assetRepo = new AssetRepository();
  private budgetRepo = new BudgetRepository();
  private goalRepo = new GoalRepository();

  private transactionAnalyzer = new TransactionAnalyzer();
  private budgetAnalyzer = new BudgetAnalyzer();
  private assetAnalyzer = new AssetAnalyzer();
  private goalAnalyzer = new GoalAnalyzer();
  private cashFlowAnalyzer = new CashFlowAnalyzer();

  private healthEngine = new FinancialHealthEngine();
  private predictionEngine = new PredictionEngine();

  /**
   * Simulates what happens to a user's cash flow, health, and emergency fund if they resign.
   */
  async simulateResign(userId: string): Promise<SimulationResult> {
    const { year, month, start, end } = getCurrentMonthRange();

    // 1. Fetch real current data
    const [transactions, budgets, assets, goals] = await Promise.all([
      this.transactionRepo.getByUserIdAndDateRange(userId, start, end),
      this.budgetRepo.getByUserId(userId),
      this.assetRepo.getByUserId(userId),
      this.goalRepo.getByUserId(userId),
    ]);

    // 2. Perform baseline analysis
    const baseTxAnalysis = this.transactionAnalyzer.analyze(transactions);
    const baseBudgetAnalysis = this.budgetAnalyzer.analyze(budgets, transactions);
    const baseAssetAnalysis = this.assetAnalyzer.analyze(assets);
    const baseCashFlowAnalysis = this.cashFlowAnalyzer.analyze(transactions);
    const baseHealth = this.healthEngine.calculate(baseCashFlowAnalysis, baseBudgetAnalysis, baseAssetAnalysis);

    const currentSpending = Math.max(100000, baseCashFlowAnalysis.averageMonthlySpending);
    const baseEmergencyMonths = baseAssetAnalysis.liquidValue / currentSpending;

    // 3. Create simulated data
    // Remove all income (type = 'income') from transactions
    const simulatedTransactions = transactions.filter((t) => t.type !== "income");
    
    // Recalculate with simulated transactions
    const simTxAnalysis = this.transactionAnalyzer.analyze(simulatedTransactions);
    const simBudgetAnalysis = this.budgetAnalyzer.analyze(budgets, simulatedTransactions);
    const simCashFlowAnalysis = this.cashFlowAnalyzer.analyze(simulatedTransactions);
    const simHealth = this.healthEngine.calculate(simCashFlowAnalysis, simBudgetAnalysis, baseAssetAnalysis);

    const simEmergencyMonths = baseAssetAnalysis.liquidValue / currentSpending; // asset total stays same initially, spending stays same

    // 4. Evaluate viability & risk
    const isViable = simEmergencyMonths >= 6; // Resigning is viable if emergency fund covers >= 6 months
    let riskLevel: SimulationResult["riskLevel"] = "low";
    if (simEmergencyMonths < 1) riskLevel = "critical";
    else if (simEmergencyMonths < 3) riskLevel = "high";
    else if (simEmergencyMonths < 6) riskLevel = "medium";

    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (riskLevel === "critical") {
      warnings.push("Dana darurat Anda kritis! Menolak resign sangat disarankan saat ini karena kas tidak mencukupi untuk 1 bulan.");
      recommendations.push("Amankan pekerjaan saat ini atau cari pekerjaan pengganti sebelum mengajukan surat resign.");
    } else if (riskLevel === "high") {
      warnings.push("Dana darurat Anda hanya bertahan kurang dari 3 bulan pengeluaran.");
      recommendations.push("Persiapkan tabungan tambahan minimal 3 bulan sebelum memutuskan resign.");
    } else {
      recommendations.push("Kondisi dana darurat Anda aman. Anda bisa memfokuskan masa transisi untuk upskilling atau mencari peluang baru.");
    }

    const impactExplanation = `Jika Anda resign sekarang, pemasukan bulanan Anda akan turun menjadi Rp0. Dengan rata-rata pengeluaran bulanan sebesar Rp${Math.round(currentSpending).toLocaleString("id-ID")}, aset likuid Anda senilai Rp${baseAssetAnalysis.liquidValue.toLocaleString("id-ID")} akan bertahan selama kurang lebih ${simEmergencyMonths.toFixed(1)} bulan.`;

    return {
      decisionType: "resign",
      isViable,
      riskLevel,
      currentMetrics: {
        netCashFlow: baseCashFlowAnalysis.netCashFlow,
        savingRate: baseCashFlowAnalysis.savingRate,
        healthScore: baseHealth.overallScore,
        liquidAssets: baseAssetAnalysis.liquidValue,
        emergencyFundMonths: baseEmergencyMonths,
      },
      simulatedMetrics: {
        netCashFlow: simCashFlowAnalysis.netCashFlow,
        savingRate: simCashFlowAnalysis.savingRate,
        healthScore: simHealth.overallScore,
        liquidAssets: baseAssetAnalysis.liquidValue,
        emergencyFundMonths: simEmergencyMonths,
      },
      impactExplanation,
      warnings,
      recommendations,
    };
  }

  /**
   * Simulates the purchase of a large asset (cash or credit).
   */
  async simulatePurchase(
    userId: string,
    assetName: string,
    price: number,
    isCash: boolean,
    downPayment: number = 0,
    monthlyInstallment: number = 0,
    installmentMonths: number = 0
  ): Promise<SimulationResult> {
    const { start, end } = getCurrentMonthRange();

    // 1. Fetch real current data
    const [transactions, budgets, assets] = await Promise.all([
      this.transactionRepo.getByUserIdAndDateRange(userId, start, end),
      this.budgetRepo.getByUserId(userId),
      this.assetRepo.getByUserId(userId),
    ]);

    // 2. Perform baseline analysis
    const baseTxAnalysis = this.transactionAnalyzer.analyze(transactions);
    const baseBudgetAnalysis = this.budgetAnalyzer.analyze(budgets, transactions);
    const baseAssetAnalysis = this.assetAnalyzer.analyze(assets);
    const baseCashFlowAnalysis = this.cashFlowAnalyzer.analyze(transactions);
    const baseHealth = this.healthEngine.calculate(baseCashFlowAnalysis, baseBudgetAnalysis, baseAssetAnalysis);

    const currentSpending = Math.max(100000, baseCashFlowAnalysis.averageMonthlySpending);
    const baseEmergencyMonths = baseAssetAnalysis.liquidValue / currentSpending;

    // 3. Create simulated data
    let simLiquidValue = baseAssetAnalysis.liquidValue;
    const simulatedTransactions = [...transactions];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    let purchaseDetails = "";

    if (isCash) {
      // Cash purchase: deducts price from liquid assets directly
      simLiquidValue -= price;
      purchaseDetails = `membeli ${assetName} seharga Rp${price.toLocaleString("id-ID")} secara TUNAI`;
      
      if (simLiquidValue < 0) {
        warnings.push(`Saldo kas Anda akan defisit sebesar Rp${Math.abs(simLiquidValue).toLocaleString("id-ID")} jika membeli tunai!`);
      } else {
        const afterSpendingCovered = simLiquidValue / currentSpending;
        if (afterSpendingCovered < 3) {
          warnings.push(`Dana darurat tersisa setelah pembelian tunai turun kritis menjadi ${afterSpendingCovered.toFixed(1)} bulan.`);
        }
      }
    } else {
      // Credit purchase: deducts down payment from liquid assets + adds monthly installments to expenses
      simLiquidValue -= downPayment;
      purchaseDetails = `membeli ${assetName} secara KREDIT (DP: Rp${downPayment.toLocaleString("id-ID")}, Angsuran: Rp${monthlyInstallment.toLocaleString("id-ID")}/bln selama ${installmentMonths} bulan)`;

      if (simLiquidValue < 0) {
        warnings.push(`Uang kas Anda tidak cukup untuk membayar DP sebesar Rp${downPayment.toLocaleString("id-ID")}.`);
      }

      // Add a simulated recurring monthly expense transaction
      // We push a mock transaction with type expense and category matching 'Lain-lain' or specific
      const mockInstallmentTx = {
        id: "mock-installment",
        user_id: userId,
        type: "expense" as const,
        category_id: null,
        amount: monthlyInstallment,
        date: new Date().toISOString().split("T")[0],
        payment_method: "transfer" as const,
        merchant: `Angsuran ${assetName}`,
        note: "Simulated Installment",
        source: "manual" as const,
        status: "confirmed" as const,
        ai_confidence: 1.0,
        ai_raw_payload: null,
        duplicate_of_id: null,
        confirmed_at: new Date().toISOString(),
        deleted_at: null,
        raw_input: null,
        reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: { id: "", name: "Cicilan", expense_kind: "wajib" as const },
      };
      simulatedTransactions.push(mockInstallmentTx);
    }

    // Re-calculate with simulated changes
    // Create simulated assets list
    const simulatedAssets = assets.map((a) => {
      if (a.is_liquid) {
        // Adjust liquid holdings
        // Assuming we distribute the cash deduction proportionally or just offset the total
        return { ...a, value: Math.max(0, Number(a.value) - (baseAssetAnalysis.liquidValue - simLiquidValue)) };
      }
      return a;
    });

    const simTxAnalysis = this.transactionAnalyzer.analyze(simulatedTransactions);
    const simBudgetAnalysis = this.budgetAnalyzer.analyze(budgets, simulatedTransactions);
    const simAssetAnalysis = this.assetAnalyzer.analyze(simulatedAssets);
    const simCashFlowAnalysis = this.cashFlowAnalyzer.analyze(simulatedTransactions);
    const simHealth = this.healthEngine.calculate(simCashFlowAnalysis, simBudgetAnalysis, simAssetAnalysis);

    const simEmergencyMonths = simAssetAnalysis.liquidValue / Math.max(100000, simCashFlowAnalysis.averageMonthlySpending);

    // 4. Evaluate viability
    const isViable = simLiquidValue >= 0 && simEmergencyMonths >= 3 && (isCash || simCashFlowAnalysis.netCashFlow > 0);
    
    let riskLevel: SimulationResult["riskLevel"] = "low";
    if (simLiquidValue < 0 || simEmergencyMonths < 1) riskLevel = "critical";
    else if (simEmergencyMonths < 3 || simCashFlowAnalysis.netCashFlow < 0) riskLevel = "high";
    else if (simEmergencyMonths < 6) riskLevel = "medium";

    if (riskLevel === "critical") {
      recommendations.push("Tunda pembelian aset ini. Tabung dana tunai lebih banyak dan pangkas pengeluaran.");
    } else if (riskLevel === "high") {
      recommendations.push("Jika membeli secara kredit, pastikan Anda memotong biaya fleksibel bulanan lainnya agar arus kas tetap positif.");
    } else {
      recommendations.push("Pembelian ini tergolong aman bagi profil kas Anda. Selamat berbelanja!");
    }

    const impactExplanation = `Jika Anda memutuskan untuk ${purchaseDetails}, skor kesehatan finansial diproyeksikan berubah dari **${baseHealth.overallScore}/100** menjadi **${simHealth.overallScore}/100**. Arus kas bulanan bersih Anda akan menjadi Rp${simCashFlowAnalysis.netCashFlow.toLocaleString("id-ID")} dengan cadangan dana darurat bertahan selama ${simEmergencyMonths.toFixed(1)} bulan.`;

    return {
      decisionType: "purchase",
      isViable,
      riskLevel,
      currentMetrics: {
        netCashFlow: baseCashFlowAnalysis.netCashFlow,
        savingRate: baseCashFlowAnalysis.savingRate,
        healthScore: baseHealth.overallScore,
        liquidAssets: baseAssetAnalysis.liquidValue,
        emergencyFundMonths: baseEmergencyMonths,
      },
      simulatedMetrics: {
        netCashFlow: simCashFlowAnalysis.netCashFlow,
        savingRate: simCashFlowAnalysis.savingRate,
        healthScore: simHealth.overallScore,
        liquidAssets: simAssetAnalysis.liquidValue,
        emergencyFundMonths: simEmergencyMonths,
      },
      impactExplanation,
      warnings,
      recommendations,
    };
  }

  /**
   * Calculates monthly target savings to achieve a net worth goal by a target age.
   */
  async simulateGoalRoadmap(
    userId: string,
    targetAmount: number,
    targetAge: number
  ): Promise<SimulationResult> {
    const { start, end } = getCurrentMonthRange();

    // 1. Fetch data
    const [transactions, budgets, assets, profile] = await Promise.all([
      this.transactionRepo.getByUserIdAndDateRange(userId, start, end),
      this.budgetRepo.getByUserId(userId),
      this.assetRepo.getByUserId(userId),
      this.assetRepo.getByUserId(userId), // profile placeholder
    ]);

    const baseTxAnalysis = this.transactionAnalyzer.analyze(transactions);
    const baseBudgetAnalysis = this.budgetAnalyzer.analyze(budgets, transactions);
    const baseAssetAnalysis = this.assetAnalyzer.analyze(assets);
    const baseCashFlowAnalysis = this.cashFlowAnalyzer.analyze(transactions);
    const baseHealth = this.healthEngine.calculate(baseCashFlowAnalysis, baseBudgetAnalysis, baseAssetAnalysis);

    const currentSpending = Math.max(100000, baseCashFlowAnalysis.averageMonthlySpending);
    const baseEmergencyMonths = baseAssetAnalysis.liquidValue / currentSpending;

    // Estimate age based on profile if we had birthdate, else default to 23 years old (average user)
    const currentAgeEstimate = 23;
    const yearsRemaining = Math.max(1, targetAge - currentAgeEstimate);
    const monthsRemaining = yearsRemaining * 12;

    const netRemaining = Math.max(0, targetAmount - baseAssetAnalysis.totalValue);
    const requiredMonthlySaving = Math.round(netRemaining / monthsRemaining);

    const isViable = baseCashFlowAnalysis.netCashFlow >= requiredMonthlySaving;
    let riskLevel: SimulationResult["riskLevel"] = "low";
    if (requiredMonthlySaving > baseCashFlowAnalysis.averageMonthlyIncome) riskLevel = "critical";
    else if (!isViable) riskLevel = "high";
    else if (requiredMonthlySaving > baseCashFlowAnalysis.netCashFlow * 0.8) riskLevel = "medium";

    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!isViable) {
      warnings.push(`Kemampuan menyisihkan uang Anda saat ini (Rp${baseCashFlowAnalysis.netCashFlow.toLocaleString("id-ID")}/bulan) di bawah target kebutuhan (Rp${requiredMonthlySaving.toLocaleString("id-ID")}/bulan).`);
      recommendations.push(`Tingkatkan pemasukan sampingan atau pangkas pengeluaran fleksibel Anda sebesar Rp${(requiredMonthlySaving - baseCashFlowAnalysis.netCashFlow).toLocaleString("id-ID")}/bulan.`);
    } else {
      recommendations.push("Pertahankan tingkat cash flow bulanan saat ini agar target tercapai sesuai jadwal.");
    }

    const impactExplanation = `Untuk mencapai total aset Rp${targetAmount.toLocaleString("id-ID")} dalam ${yearsRemaining} tahun (target umur ${targetAge} tahun), Anda perlu menyisihkan minimal Rp${requiredMonthlySaving.toLocaleString("id-ID")} setiap bulan dari sekarang. Saat ini arus kas bersih Anda adalah Rp${baseCashFlowAnalysis.netCashFlow.toLocaleString("id-ID")}/bulan.`;

    return {
      decisionType: "goal_roadmap",
      isViable,
      riskLevel,
      currentMetrics: {
        netCashFlow: baseCashFlowAnalysis.netCashFlow,
        savingRate: baseCashFlowAnalysis.savingRate,
        healthScore: baseHealth.overallScore,
        liquidAssets: baseAssetAnalysis.liquidValue,
        emergencyFundMonths: baseEmergencyMonths,
      },
      simulatedMetrics: {
        netCashFlow: baseCashFlowAnalysis.netCashFlow, // stays same
        savingRate: (requiredMonthlySaving / Math.max(1, baseCashFlowAnalysis.averageMonthlyIncome)) * 100, // target saving rate
        healthScore: baseHealth.overallScore,
        liquidAssets: baseAssetAnalysis.liquidValue,
        emergencyFundMonths: baseEmergencyMonths,
      },
      impactExplanation,
      warnings,
      recommendations,
    };
  }
}
