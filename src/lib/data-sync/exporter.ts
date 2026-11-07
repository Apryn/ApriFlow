import type {
  TransactionWithCategory,
  Category,
  Asset,
  Goal,
  MandatoryExpense
} from "@/types/database.types";

export interface FullBackupData {
  version: string;
  exportedAt: string;
  appName: string;
  userEmail?: string;
  transactions: TransactionWithCategory[];
  categories: Category[];
  assets: Asset[];
  goals: Goal[];
  budgets: any[];
  mandatoryExpenses: MandatoryExpense[];
}

/**
 * Escape a cell for CSV formatting.
 */
function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export transactions to standard CSV.
 */
export function generateTransactionsCsv(transactions: TransactionWithCategory[]): string {
  const headers = [
    "Date",
    "Account",
    "Category",
    "Subcategory",
    "Note",
    "IDR",
    "Income/Expense",
    "Tag",
    "Description",
    "Amount",
    "Currency",
  ];

  const lines = [headers.join(",")];

  for (const tx of transactions) {
    const date = tx.date || (tx.created_at ? tx.created_at.slice(0, 10) : "");
    const account = tx.payment_method ? tx.payment_method.toUpperCase() : "CASH";
    const category = tx.category?.name || "Lain-lain";
    const note = tx.note || "";
    const amount = tx.amount;
    const type = tx.type === "income" ? "Income" : "Expense";
    const merchant = tx.merchant || "";

    const row = [
      escapeCsvCell(tx.confirmed_at || tx.created_at || date),
      escapeCsvCell(account),
      escapeCsvCell(category),
      escapeCsvCell(""), // Subcategory
      escapeCsvCell(note),
      escapeCsvCell(amount),
      escapeCsvCell(type),
      escapeCsvCell(""), // Tag
      escapeCsvCell(merchant),
      escapeCsvCell(amount),
      escapeCsvCell("IDR"),
    ];

    lines.push(row.join(","));
  }

  return lines.join("\r\n");
}

/**
 * Generate full JSON string for backup.
 */
export function generateBackupJson(data: FullBackupData): string {
  return JSON.stringify(data, null, 2);
}

