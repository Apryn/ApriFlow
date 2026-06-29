import type { IRecommendationEngine } from "../interfaces/engines.interface";
import type {
  FinancialHealthReport,
  CashFlowAnalysis,
  BudgetAnalysis,
  GoalAnalysis,
  Predictions,
  Recommendation,
} from "../types";

export class RecommendationEngine implements IRecommendationEngine {
  recommend(
    health: FinancialHealthReport,
    cashFlow: CashFlowAnalysis,
    budget: BudgetAnalysis,
    goals: GoalAnalysis,
    predictions: Predictions,
    aiRecommendations?: Recommendation[]
  ): Recommendation[] {
    
    if (aiRecommendations && aiRecommendations.length > 0) {
      return aiRecommendations;
    }
    
    return generateFallbackRecommendations(health, cashFlow, budget, goals, predictions);
  }
}

// Deterministic fallback rules in Indonesian
function generateFallbackRecommendations(
  health: FinancialHealthReport,
  cashFlow: CashFlowAnalysis,
  budget: BudgetAnalysis,
  goals: GoalAnalysis,
  predictions: Predictions
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Rule 0: Deficit Cash Flow
  if (cashFlow.netCashFlow < 0) {
    recommendations.push({
      id: "rec-cashflow-deficit",
      title: "Segera Atasi Defisit Arus Kas Bulanan",
      description: "Pengeluaran bulanan Anda melebihi total pemasukan bersih, menyebabkan kondisi defisit keuangan.",
      priority: "high",
      category: "cashflow",
      actionPlan: "Hentikan pengeluaran fleksibel dan bocor sepenuhnya untuk sementara. Cari pemasukan tambahan darurat atau jual aset non-produktif jika diperlukan untuk menyeimbangkan neraca keuangan.",
      impact: "Menghentikan penumpukan utang konsumtif baru dan memulihkan kestabilan kas.",
      reason: `Arus kas bulanan bersih Anda bernilai negatif sebesar Rp${Math.abs(cashFlow.netCashFlow).toLocaleString("id-ID")}.`,
    });
  }

  // Rule 1: Emergency Fund Critical
  const emergencyFundBreakdown = health.breakdown.find((b) => b.name === "Emergency Fund");
  if (emergencyFundBreakdown && emergencyFundBreakdown.score < 50) {
    recommendations.push({
      id: "rec-emergency-fund",
      title: "Bangun Cadangan Dana Darurat Likuid",
      description: "Dana darurat Anda saat ini berada dalam posisi sangat minim dan berisiko tinggi terhadap ketidakpastian finansial.",
      priority: "high",
      category: "saving",
      actionPlan: "Alokasikan 10-15% pemasukan bulanan ke dalam rekening tabungan terpisah yang likuid dan mudah diakses (seperti Bank Digital atau Reksa Dana Pasar Uang). Jangan gunakan dana ini untuk investasi berisiko.",
      impact: "Membangun ketahanan finansial keluarga jika terjadi kehilangan pekerjaan, tagihan medis mendadak, atau musibah tak terduga.",
      reason: `Tabungan likuid Anda hanya mencakup kurang dari 1 bulan biaya hidup reguler bulanan.`,
    });
  }

  // Rule 2: Leaky Budget ("Bocor Alus" expenses)
  if (cashFlow.leakyExpenseRatio > 15) {
    recommendations.push({
      id: "rec-leaky-spending",
      title: "Pangkas Pengeluaran Bocor (Kategori Bocor)",
      description: `Rasio pengeluaran bocor bulanan Anda mencapai ${Math.round(cashFlow.leakyExpenseRatio)}% dari total pengeluaran Anda.`,
      priority: "high",
      category: "budget",
      actionPlan: "Identifikasi transaksi kecil yang sering berulang seperti langganan bulanan non-aktif, jajan/kopi harian berlebih, atau belanja online impulsif. Tetapkan budget pengeluaran bocor maksimal Rp300.000 per bulan.",
      impact: `Menghemat hingga Rp${Math.round(cashFlow.averageMonthlySpending * (cashFlow.leakyExpenseRatio / 100) * 0.5).toLocaleString("id-ID")} setiap bulannya yang bisa dialihkan ke dana darurat atau target tabungan.`,
      reason: "Batas wajar kategori pengeluaran impulsif ('bocor') adalah di bawah 10% dari total pengeluaran.",
    });
  }

  // Rule 3: Category Budget Exceeded
  if (predictions.overspendingRisks.length > 0) {
    const list = predictions.overspendingRisks.join(", ");
    recommendations.push({
      id: "rec-budget-overrun",
      title: `Kendalikan Pengeluaran Kategori: ${list}`,
      description: `Berdasarkan pola transaksi harian, kategori [${list}] diproyeksikan akan melampaui limit anggaran Anda sebelum akhir bulan.`,
      priority: "high",
      category: "budget",
      actionPlan: "Hentikan pengeluaran non-essential pada kategori ini untuk sisa hari bulan ini. Jika terpaksa, lakukan 'subsidi silang' dengan menggeser sisa anggaran dari kategori lain yang masih longgar.",
      impact: "Mencegah cash flow bulanan menjadi defisit dan menjaga disiplin pengelolaan budget tetap terjaga.",
      reason: "Pola transaksi menunjukkan kecepatan pengeluaran (burn rate) kategori tersebut terlalu tinggi dibanding durasi hari tersisa.",
    });
  }

  // Rule 4: Saving Rate Under 20%
  if (cashFlow.savingRate < 20 && cashFlow.savingRate >= 0) {
    recommendations.push({
      id: "rec-saving-rate",
      title: "Meningkatkan Rasio Tabungan Bulanan",
      description: `Rasio tabungan bulanan Anda baru mencapai ${Math.round(cashFlow.savingRate)}%, di bawah rekomendasi aman sebesar 20%.`,
      priority: "medium",
      category: "saving",
      actionPlan: "Gunakan metode 'Pay Yourself First'. Begitu ada pemasukan atau gaji masuk, potong langsung 20% di awal dan kirim ke rekening tabungan investasi sebelum digunakan untuk kebutuhan konsumsi.",
      impact: "Mempercepat akumulasi kekayaan bersih dan pencapaian target finansial jangka panjang.",
      reason: "Menyimpan sisa uang di akhir bulan seringkali gagal karena dorongan konsumtif di tengah bulan.",
    });
  }

  // Rule 5: Non-liquid asset imbalance
  const assetAllocation = health.breakdown.find((b) => b.name === "Asset Allocation");
  if (assetAllocation && assetAllocation.score < 70 && cashFlow.savingRate >= 20) {
    recommendations.push({
      id: "rec-asset-balance",
      title: "Diversifikasi Alokasi Portofolio Aset",
      description: "Distribusi portofolio aset Anda saat ini kurang seimbang antara aset likuid (kas/tabungan) dan non-likuid (investasi/emas).",
      priority: "medium",
      category: "asset",
      actionPlan: "Jika terlalu likuid, mulailah berinvestasi di Reksa Dana Obligasi, Saham, atau Emas secara konsisten. Jika terlalu tidak likuid, kurangi pembelian aset keras dan kumpulkan kas di tabungan berimbal hasil stabil.",
      impact: "Melindungi dana dari penurunan nilai akibat inflasi sekaligus menjaga fleksibilitas penarikan dana saat mendesak.",
      reason: "Portofolio aset yang timpang mengurangi daya kembang uang atau memperbesar risiko gagal bayar mendadak.",
    });
  }

  // If no specific recommendations generated, push a generic checkup advice
  if (recommendations.length === 0) {
    recommendations.push({
      id: "rec-generic-good",
      title: "Pertahankan Performa Finansial dan Mulai Investasi",
      description: "Seluruh pilar finansial Anda (Arus kas, Tabungan, Budget, dan Aset) berada dalam kondisi prima dan sangat sehat.",
      priority: "low",
      category: "general",
      actionPlan: "Pertahankan disiplin keuangan saat ini. Anda dapat meningkatkan kontribusi ke portofolio investasi produktif jangka panjang seperti indeks saham atau reksa dana saham secara berkala.",
      impact: "Mencapai kebebasan finansial (Financial Freedom) lebih cepat dari target awal.",
      reason: "Kesehatan finansial Anda sudah mendapat predikat Kelas A.",
    });
  }

  return recommendations;
}
