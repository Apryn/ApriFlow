import { getMonthRange } from "@/lib/utils/date";
import { TransactionRepository } from "./repositories/transaction.repository";
import { BudgetRepository } from "./repositories/budget.repository";
import { AssetRepository } from "./repositories/asset.repository";
import { GoalRepository } from "./repositories/goal.repository";
import { CacheRepository } from "./repositories/cache.repository";
import { PromptRegistryService } from "./prompt-registry.service";
import { FinancialProfileService } from "./modules/financial-profile.service";
import { TransactionAnalyzer } from "./modules/transaction-analyzer";
import { BudgetAnalyzer } from "./modules/budget-analyzer";
import { AssetAnalyzer } from "./modules/asset-analyzer";
import { GoalAnalyzer } from "./modules/goal-analyzer";
import { CashFlowAnalyzer } from "./modules/cash-flow-analyzer";
import { PredictionEngine } from "./modules/prediction-engine";
import { FinancialHealthEngine } from "./modules/financial-health-engine";
import { RecommendationEngine } from "./modules/recommendation-engine";
import { InsightEngine } from "./modules/insight-engine";
import type { FullFinancialAnalysis } from "./types";

export class AIIntelligenceService {
  private transactionRepo = new TransactionRepository();
  private budgetRepo = new BudgetRepository();
  private assetRepo = new AssetRepository();
  private goalRepo = new GoalRepository();
  private cacheRepo = new CacheRepository();
  
  private promptRegistry = new PromptRegistryService();
  private profileService = new FinancialProfileService();

  private transactionAnalyzer = new TransactionAnalyzer();
  private budgetAnalyzer = new BudgetAnalyzer();
  private assetAnalyzer = new AssetAnalyzer();
  private goalAnalyzer = new GoalAnalyzer();
  private cashFlowAnalyzer = new CashFlowAnalyzer();

  private predictionEngine = new PredictionEngine();
  private healthEngine = new FinancialHealthEngine();
  private recommendationEngine = new RecommendationEngine();
  private insightEngine = new InsightEngine();

  /**
   * Runs the complete AI Financial Analysis for a specific user and month.
   * Utilizes cache if available and not stale.
   */
  async runAnalysis(
    userId: string,
    year: number,
    month: number,
    scope: string = "all"
  ): Promise<FullFinancialAnalysis> {
    
    // 1. Check cache first to avoid database queries & LLM calls
    const cachedReport = await this.cacheRepo.get(userId, year, month, scope);
    if (cachedReport) {
      return cachedReport;
    }

    const { start, end } = getMonthRange(year, month);

    // 2. Fetch data in parallel
    const [transactions, budgets, assets, goals, profile] = await Promise.all([
      this.transactionRepo.getByUserIdAndDateRange(userId, start, end),
      this.budgetRepo.getByUserId(userId),
      this.assetRepo.getByUserId(userId),
      this.goalRepo.getByUserId(userId),
      this.profileService.getProfile(userId),
    ]);

    // 3. Perform modular analyses
    const transactionAnalysis = this.transactionAnalyzer.analyze(transactions);
    const budgetAnalysis = this.budgetAnalyzer.analyze(budgets, transactions);
    const assetAnalysis = this.assetAnalyzer.analyze(assets);
    const goalAnalysis = this.goalAnalyzer.analyze(goals);
    const cashFlowAnalysis = this.cashFlowAnalyzer.analyze(transactions);

    // 4. Run predictions
    const predictions = this.predictionEngine.predict(
      transactionAnalysis,
      budgetAnalysis,
      goalAnalysis,
      assetAnalysis
    );

    // 5. Calculate deterministic health score base
    let financialHealth = this.healthEngine.calculate(
      cashFlowAnalysis,
      budgetAnalysis,
      assetAnalysis
    );

    // 6. Check AI API credentials
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    let apiKey: string | undefined = undefined;
    let provider: "gemini" | "openai" | undefined = undefined;

    if (geminiKey && geminiKey.trim().length > 0) {
      apiKey = geminiKey;
      provider = "gemini";
    } else if (openaiKey && openaiKey.trim().length > 0) {
      apiKey = openaiKey;
      provider = "openai";
    }

    let aiCommentary: string | undefined = undefined;
    let aiRecommendations: any[] | undefined = undefined;
    let aiInsightFields: any | undefined = undefined;

    // 7. Execute Unified LLM Call if credentials are set
    if (apiKey && provider) {
      try {
        const inputContext = {
          overallScore: financialHealth.overallScore,
          grade: financialHealth.grade,
          breakdown: financialHealth.breakdown.map((b) => ({
            name: b.name,
            score: b.score,
            explanation: b.explanation,
          })),
          cashFlow: {
            netCashFlow: cashFlowAnalysis.netCashFlow,
            savingRate: cashFlowAnalysis.savingRate,
            expenseRatio: cashFlowAnalysis.expenseRatio,
            essentialRatio: cashFlowAnalysis.essentialExpenseRatio,
            flexibleRatio: cashFlowAnalysis.flexibleExpenseRatio,
            leakyRatio: cashFlowAnalysis.leakyExpenseRatio,
            averageSpending: cashFlowAnalysis.averageMonthlySpending,
          },
          budget: {
            totalLimit: budgetAnalysis.totalBudgetLimit,
            totalSpent: budgetAnalysis.totalSpent,
            overBudgetCategories: budgetAnalysis.categoriesOverBudget.map((c) => c.categoryName),
            almostExhausted: budgetAnalysis.categoriesAlmostExhausted.map((c) => c.categoryName),
          },
          goals: goalAnalysis.goals.filter((g) => !g.isCompleted).map((g) => ({
            name: g.name,
            progress: g.progressPercentage,
          })),
          predictions: {
            overspendingRisks: predictions.overspendingRisks,
            estimatedEomCashFlow: predictions.estimatedEndOfMonthCashFlow,
          },
        };

        // Load prompt template from Prompt Registry
        const promptTemplate = await this.promptRegistry.getPrompt("unified-financial-analysis");

        // Format Financial Profile (AI Memory) details to append to the context
        const profileText = profile ? `
PROFIL KEBIASAAN FINANSIAL USER (AI Memory):
- Frekuensi pemasukan: ${profile.income_frequency || "tidak teratur"}
- Perkiraan tanggal gajian: tanggal ${profile.expected_payday || "tidak diketahui"}
- Metode pembayaran terfavorit: ${profile.preferred_payment_method || "tidak diketahui"}
- Rasio pengeluaran akhir pekan: ${profile.weekend_spend_ratio ? Math.round(profile.weekend_spend_ratio * 100) : 0}% dari total pengeluaran
- Jam paling sering berbelanja: ${profile.top_expense_hour !== null ? `${profile.top_expense_hour}:00` : "tidak diketahui"}
- Kategori pengeluaran terbesar: ${profile.top_expense_category || "tidak diketahui"}
` : "";

        const aiResponse = await this.callUnifiedAI(
          inputContext, 
          promptTemplate,
          profileText,
          apiKey, 
          provider
        );
        
        if (aiResponse) {
          aiCommentary = aiResponse.healthCommentary;
          aiRecommendations = aiResponse.recommendations;
          aiInsightFields = aiResponse.insight;
          
          // Re-calculate health to inject custom AI commentary
          financialHealth = this.healthEngine.calculate(
            cashFlowAnalysis,
            budgetAnalysis,
            assetAnalysis,
            aiCommentary
          );
        }
      } catch (err) {
        console.error("Unified AI Analysis failed. Falling back to rule-based analysis:", err);
      }
    }

    // 8. Generate final recommendation list and insights (combines AI or fallbacks)
    const recommendations = this.recommendationEngine.recommend(
      financialHealth,
      cashFlowAnalysis,
      budgetAnalysis,
      goalAnalysis,
      predictions,
      aiRecommendations
    );

    const insights = this.insightEngine.generate(
      "monthly",
      transactionAnalysis,
      cashFlowAnalysis,
      budgetAnalysis,
      financialHealth,
      aiInsightFields
    );

    const resultReport: FullFinancialAnalysis = {
      userId,
      generatedAt: new Date().toISOString(),
      scope,
      transactionAnalysis,
      budgetAnalysis,
      assetAnalysis,
      goalAnalysis,
      cashFlowAnalysis,
      financialHealth,
      predictions,
      recommendations,
      insights,
    };

    // 9. Cache the compiled report
    await this.cacheRepo.set(userId, year, month, scope, resultReport);

    return resultReport;
  }

  /**
   * Helper function to execute a single Unified LLM request returning structured JSON
   */
  private async callUnifiedAI(
    inputContext: any,
    promptTemplate: string,
    profileText: string,
    apiKey: string,
    provider: "gemini" | "openai"
  ): Promise<{ healthCommentary: string; recommendations: any[]; insight: any } | null> {
    const systemInstruction = promptTemplate;
    const userPrompt = `
Data Input Finansial: ${JSON.stringify(inputContext)}

${profileText}
`;

    try {
      let responseText = "";

      if (provider === "openai") {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemInstruction },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        if (!response.ok) throw new Error("OpenAI API call failed");
        const data = await response.json();
        responseText = data.choices?.[0]?.message?.content ?? "";
      } else {
        // Default to Gemini
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: systemInstruction + "\n\n" + userPrompt }] },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (!response.ok) throw new Error(`Gemini API call failed: ${response.statusText}`);
        const data = await response.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }

      return JSON.parse(responseText);
    } catch (err) {
      console.error("Unified LLM fetch call failed:", err);
      return null;
    }
  }
}
