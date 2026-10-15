import { createClient } from "@/lib/supabase/server";
import { formatMonthYear, getMonthRange, getCurrentMonthRange } from "@/lib/utils/date";
import type { MonthlyHistoryData, MonthlyHistoryItem } from "@/types/database.types";

export async function getMonthlyHistory(
  userId: string,
  limitMonths: number = 6
): Promise<MonthlyHistoryData> {
  const supabase = await createClient();
  const { year: currentYear, month: currentMonth } = getCurrentMonthRange();

  // Generate list of months going back limitMonths
  const monthList: { year: number; month: number }[] = [];
  let y = currentYear;
  let m = currentMonth;

  for (let i = 0; i < limitMonths; i++) {
    monthList.push({ year: y, month: m });
    if (m === 1) {
      y -= 1;
      m = 12;
    } else {
      m -= 1;
    }
  }

  // Earliest month start date
  const earliest = monthList[monthList.length - 1];
  const { start: startDate } = getMonthRange(earliest.year, earliest.month);
  const { end: endDate } = getMonthRange(currentYear, currentMonth);

  // Fetch all transactions in that time range
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("type, amount, date, category:categories(name)")
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .is("deleted_at", null)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) {
    console.error("Failed to fetch history transactions:", error);
  }

  const txs = transactions ?? [];

  // Group by "YYYY-MM"
  const map = new Map<
    string,
    {
      income: number;
      expense: number;
      count: number;
      catTotals: Map<string, number>;
    }
  >();

  for (const tx of txs) {
    const key = tx.date.substring(0, 7); // "YYYY-MM"
    const entry = map.get(key) ?? {
      income: 0,
      expense: 0,
      count: 0,
      catTotals: new Map<string, number>(),
    };

    const amt = Number(tx.amount);
    if (tx.type === "income") {
      entry.income += amt;
    } else {
      entry.expense += amt;
      const cat = tx.category as { name: string } | null;
      if (cat?.name) {
        entry.catTotals.set(cat.name, (entry.catTotals.get(cat.name) ?? 0) + amt);
      }
    }
    entry.count += 1;
    map.set(key, entry);
  }

  // Build items chronologically (earliest to latest) to calculate deltas
  const chronologicalMonths = [...monthList].reverse();
  const calculatedItems: MonthlyHistoryItem[] = [];

  let prevExpense: number | null = null;

  for (const { year, month } of chronologicalMonths) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const data = map.get(key);

    const totalIncome = data?.income ?? 0;
    const totalExpense = data?.expense ?? 0;
    const transactionCount = data?.count ?? 0;

    let topExpenseCategory: { name: string; total: number } | null = null;
    if (data && data.catTotals.size > 0) {
      let maxCat = "";
      let maxTotal = 0;
      for (const [cName, cTot] of data.catTotals.entries()) {
        if (cTot > maxTotal) {
          maxTotal = cTot;
          maxCat = cName;
        }
      }
      if (maxTotal > 0) {
        topExpenseCategory = { name: maxCat, total: maxTotal };
      }
    }

    let expenseDiffFromPrev: number | null = null;
    let expensePercentChange: number | null = null;

    if (prevExpense !== null) {
      expenseDiffFromPrev = totalExpense - prevExpense;
      if (prevExpense > 0) {
        expensePercentChange = Math.round(((totalExpense - prevExpense) / prevExpense) * 100);
      } else if (totalExpense > 0) {
        expensePercentChange = 100;
      } else {
        expensePercentChange = 0;
      }
    }

    calculatedItems.push({
      year,
      month,
      monthLabel: formatMonthYear(year, month),
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      transactionCount,
      topExpenseCategory,
      expenseDiffFromPrev,
      expensePercentChange,
    });

    prevExpense = totalExpense;
  }

  // Reverse back so latest month is first for display
  const itemsLatestFirst = [...calculatedItems].reverse();

  const currentMonthItem =
    itemsLatestFirst.find((it) => it.year === currentYear && it.month === currentMonth) ??
    itemsLatestFirst[0];

  const lastMonthObj =
    currentMonth === 1
      ? { year: currentYear - 1, month: 12 }
      : { year: currentYear, month: currentMonth - 1 };

  const lastMonthItem =
    itemsLatestFirst.find(
      (it) => it.year === lastMonthObj.year && it.month === lastMonthObj.month
    ) ?? {
      year: lastMonthObj.year,
      month: lastMonthObj.month,
      monthLabel: formatMonthYear(lastMonthObj.year, lastMonthObj.month),
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      transactionCount: 0,
      topExpenseCategory: null,
      expenseDiffFromPrev: null,
      expensePercentChange: null,
    };

  const activeMonths = itemsLatestFirst.filter((it) => it.transactionCount > 0);
  const totalSpend = activeMonths.reduce((sum, it) => sum + it.totalExpense, 0);
  const overallAverageExpense =
    activeMonths.length > 0 ? Math.round(totalSpend / activeMonths.length) : 0;

  return {
    months: itemsLatestFirst,
    currentMonth: currentMonthItem,
    lastMonth: lastMonthItem,
    overallAverageExpense,
  };
}
