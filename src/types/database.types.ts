export type TransactionType = "income" | "expense";

export type TransactionSource =
  | "manual"
  | "ai_chat"
  | "receipt_scan"
  | "screenshot"
  | "bank_import";

export type TransactionStatus =
  | "draft"
  | "pending_review"
  | "confirmed"
  | "ignored"
  | "duplicate";

export type PaymentMethod =
  | "cash"
  | "qris"
  | "transfer"
  | "debit_card"
  | "credit_card"
  | "ewallet"
  | "other";

export type ExpenseKind = "wajib" | "fleksibel" | "bocor";

export type CategoryType = "income" | "expense";

export type AssetType = "bank" | "cash" | "gold" | "investment" | "other";

export interface Profile {
  id: string;
  display_name: string | null;
  currency: string;
  timezone: string;
  month_start_day: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  expense_kind: ExpenseKind | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  category_id: string | null;
  amount: number;
  date: string;
  payment_method: PaymentMethod;
  merchant: string | null;
  note: string | null;
  source: TransactionSource;
  status: TransactionStatus;
  ai_confidence: number | null;
  ai_raw_payload: Record<string, unknown> | null;
  duplicate_of_id: string | null;
  confirmed_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category: Pick<Category, "id" | "name" | "expense_kind"> | null;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  type: AssetType;
  value: number;
  is_liquid: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  totalAssets: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  topExpenseCategories: { name: string; total: number; expense_kind: ExpenseKind | null }[];
  transactionCount: number;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Category>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, "id" | "created_at" | "updated_at" | "confirmed_at" | "deleted_at"> & {
          id?: string;
          confirmed_at?: string | null;
          deleted_at?: string | null;
        };
        Update: Partial<Transaction>;
      };
      assets: {
        Row: Asset;
        Insert: Omit<Asset, "id" | "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Asset>;
      };
    };
  };
}
