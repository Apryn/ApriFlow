import { createClient } from "@/lib/supabase/server";
import type { TransactionWithCategory } from "@/types/database.types";

export interface FinancialProfileData {
  user_id: string;
  income_frequency: string | null;
  expected_payday: number | null;
  preferred_payment_method: string | null;
  weekend_spend_ratio: number | null;
  top_expense_hour: number | null;
  top_expense_category: string | null;
  last_updated: string;
}

export class FinancialProfileService {
  /**
   * Compiles and saves the financial behavior profile for a user based on transaction history.
   */
  async computeAndSaveProfile(userId: string): Promise<FinancialProfileData | null> {
    try {
      const supabase = await createClient();

      // 1. Fetch the last 90 days of transactions to get a reliable sample size
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const startDateStr = ninetyDaysAgo.toISOString().split("T")[0];

      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("*, category:categories(id, name, expense_kind)")
        .eq("user_id", userId)
        .eq("status", "confirmed")
        .is("deleted_at", null)
        .gte("date", startDateStr);

      if (error) throw error;
      if (!transactions || transactions.length === 0) {
        return null; // not enough data
      }

      // 2. Process data
      let totalExpense = 0;
      let weekendExpense = 0;
      
      const paymentMethodCounts = new Map<string, number>();
      const categorySpendMap = new Map<string, number>();
      const hourCounts = new Map<number, number>();
      const paydayDays: number[] = [];

      for (const tx of transactions as TransactionWithCategory[]) {
        const amount = Number(tx.amount);
        const isExpense = tx.type === "expense";

        if (isExpense) {
          totalExpense += amount;

          // Weekend check (6 = Saturday, 0 = Sunday)
          const dateObj = new Date(tx.date + "T00:00:00");
          const day = dateObj.getDay();
          if (day === 0 || day === 6) {
            weekendExpense += amount;
          }

          // Category spending
          const catName = tx.category?.name ?? "Lain-lain";
          categorySpendMap.set(catName, (categorySpendMap.get(catName) ?? 0) + amount);

          // Hour of day (from created_at)
          if (tx.created_at) {
            const hour = new Date(tx.created_at).getHours();
            hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
          }
        } else {
          // Income payday check
          const isSalary = tx.category?.name?.toLowerCase().includes("gaji") || amount > 1000000;
          if (isSalary) {
            const payday = new Date(tx.date + "T00:00:00").getDate();
            paydayDays.push(payday);
          }
        }

        // Payment Method count
        const pm = tx.payment_method || "other";
        paymentMethodCounts.set(pm, (paymentMethodCounts.get(pm) ?? 0) + 1);
      }

      // 3. Extract metrics
      // Expected Payday (median day of month for salaries)
      let expected_payday: number | null = null;
      if (paydayDays.length > 0) {
        paydayDays.sort((a, b) => a - b);
        const mid = Math.floor(paydayDays.length / 2);
        expected_payday = paydayDays.length % 2 !== 0 ? paydayDays[mid] : Math.round((paydayDays[mid - 1] + paydayDays[mid]) / 2);
      }

      // Income Frequency
      let income_frequency: string | null = null;
      if (paydayDays.length > 0) {
        income_frequency = paydayDays.length >= 3 ? "monthly" : "irregular";
      }

      // Preferred Payment Method (mode)
      let preferred_payment_method: string | null = null;
      let maxPmCount = 0;
      for (const [pm, count] of paymentMethodCounts.entries()) {
        if (count > maxPmCount) {
          maxPmCount = count;
          preferred_payment_method = pm;
        }
      }

      // Weekend spend ratio
      const weekend_spend_ratio = totalExpense > 0 ? Number((weekendExpense / totalExpense).toFixed(2)) : 0;

      // Top expense hour (mode)
      let top_expense_hour: number | null = null;
      let maxHourCount = 0;
      for (const [hour, count] of hourCounts.entries()) {
        if (count > maxHourCount) {
          maxHourCount = count;
          top_expense_hour = hour;
        }
      }

      // Top expense category
      let top_expense_category: string | null = null;
      let maxCatSpend = 0;
      for (const [catName, total] of categorySpendMap.entries()) {
        if (total > maxCatSpend) {
          maxCatSpend = total;
          top_expense_category = catName;
        }
      }

      // 4. Upsert Profile into database
      const profile: FinancialProfileData = {
        user_id: userId,
        income_frequency,
        expected_payday,
        preferred_payment_method,
        weekend_spend_ratio,
        top_expense_hour,
        top_expense_category,
        last_updated: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from("financial_profiles")
        .upsert(profile);

      if (upsertError) throw upsertError;

      return profile;
    } catch (err) {
      console.error("Error in FinancialProfileService.computeAndSaveProfile:", err);
      return null;
    }
  }

  /**
   * Retrieves the profile from cache database, or compiles a new one if missing.
   */
  async getProfile(userId: string): Promise<FinancialProfileData | null> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("financial_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 is single row missing

      if (data) {
        // If profile was updated more than 7 days ago, recalculate in background asynchronously
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (new Date(data.last_updated) < sevenDaysAgo) {
          this.computeAndSaveProfile(userId); // non-blocking call
        }
        return data as FinancialProfileData;
      }

      // Compute now if missing
      return await this.computeAndSaveProfile(userId);
    } catch (err) {
      console.error("Error in FinancialProfileService.getProfile:", err);
      return null;
    }
  }
}
