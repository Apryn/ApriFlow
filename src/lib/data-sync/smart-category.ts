import type { ExpenseKind, TransactionType } from "@/types/database.types";

export interface CategoryInference {
  expenseKind: ExpenseKind | null;
  icon: string;
  color: string;
}

const WAJIB_KEYWORDS = [
  "listrik", "pln", "token", "sewa", "kost", "kontrakan", "rumah", "wifi", "indihome",
  "internet", "paket data", "pulsa", "air", "pdam", "cicilan", "kredit", "pinjaman",
  "asuransi", "bpjs", "pajak", "spp", "sekolah", "kuliah", "iuran"
];

const BOCOR_KEYWORDS = [
  "jajan", "warkop", "kopi", "coffee", "rokok", "snack", "nongkrong", "cafe",
  "game", "steam", "topup", "hiburan", "boba", "fast food", "cinema", "bioskop",
  "party", "hobi", "merokok", "vape"
];

const INCOME_KEYWORDS = [
  "gaji", "salary", "bonus", "sampingan", "freelance", "allowance", "uang saku",
  "dividen", "investasi", "hadiah", "reward", "profit", "penjualan", "omset"
];

export function inferCategoryMeta(name: string, type: TransactionType): CategoryInference {
  const norm = name.toLowerCase();

  if (type === "income") {
    return {
      expenseKind: null,
      icon: "ArrowDownLeft",
      color: "#10b981", // emerald
    };
  }

  // Check bocor keywords
  if (BOCOR_KEYWORDS.some((kw) => norm.includes(kw))) {
    return {
      expenseKind: "bocor",
      icon: "Coffee",
      color: "#f59e0b", // amber
    };
  }

  // Check wajib keywords
  if (WAJIB_KEYWORDS.some((kw) => norm.includes(kw))) {
    return {
      expenseKind: "wajib",
      icon: "ShieldAlert",
      color: "#ef4444", // red
    };
  }

  // Default to fleksibel
  return {
    expenseKind: "fleksibel",
    icon: "ShoppingBag",
    color: "#06b6d4", // cyan
  };
}

