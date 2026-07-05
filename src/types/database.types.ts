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

export type Profile = {
  id: string;
  display_name: string | null;
  currency: string;
  timezone: string;
  month_start_day: number;
  created_at: string;
  updated_at: string;
}

export type Category = {
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

export type Transaction = {
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
  raw_input: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type TransactionWithCategory = Transaction & {
  category: Pick<Category, "id" | "name" | "expense_kind"> | null;
}

export type Asset = {
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

export type DashboardSummary = {
  totalAssets: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  topExpenseCategories: { name: string; total: number; count: number; expense_kind: ExpenseKind | null }[];
  transactionCount: number;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          display_name?: string | null;
          currency?: string;
          timezone?: string;
          month_start_day?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          currency?: string;
          timezone?: string;
          month_start_day?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: CategoryType;
          expense_kind?: ExpenseKind | null;
          icon?: string | null;
          color?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: CategoryType;
          expense_kind?: ExpenseKind | null;
          icon?: string | null;
          color?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: {
          id?: string;
          user_id: string;
          type: TransactionType;
          category_id?: string | null;
          amount: number;
          date: string;
          payment_method?: PaymentMethod;
          merchant?: string | null;
          note?: string | null;
          source?: TransactionSource;
          status?: TransactionStatus;
          ai_confidence?: number | null;
          ai_raw_payload?: Record<string, unknown> | null;
          duplicate_of_id?: string | null;
          confirmed_at?: string | null;
          deleted_at?: string | null;
          raw_input?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: TransactionType;
          category_id?: string | null;
          amount?: number;
          date?: string;
          payment_method?: PaymentMethod;
          merchant?: string | null;
          note?: string | null;
          source?: TransactionSource;
          status?: TransactionStatus;
          ai_confidence?: number | null;
          ai_raw_payload?: Record<string, unknown> | null;
          duplicate_of_id?: string | null;
          confirmed_at?: string | null;
          deleted_at?: string | null;
          raw_input?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      assets: {
        Row: Asset;
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: AssetType;
          value: number;
          is_liquid?: boolean;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: AssetType;
          value?: number;
          is_liquid?: boolean;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          period: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          period?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          amount?: number;
          period?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          notes: string | null;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          notes?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string | null;
          notes?: string | null;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_prompts: {
        Row: {
          id: string;
          name: string;
          version: string;
          prompt_text: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          version?: string;
          prompt_text: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          version?: string;
          prompt_text?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      financial_profiles: {
        Row: {
          user_id: string;
          income_frequency: string | null;
          expected_payday: number | null;
          preferred_payment_method: string | null;
          weekend_spend_ratio: number | null;
          top_expense_hour: number | null;
          top_expense_category: string | null;
          last_updated: string;
        };
        Insert: {
          user_id: string;
          income_frequency?: string | null;
          expected_payday?: number | null;
          preferred_payment_method?: string | null;
          weekend_spend_ratio?: number | null;
          top_expense_hour?: number | null;
          top_expense_category?: string | null;
          last_updated?: string;
        };
        Update: {
          user_id?: string;
          income_frequency?: string | null;
          expected_payday?: number | null;
          preferred_payment_method?: string | null;
          weekend_spend_ratio?: number | null;
          top_expense_hour?: number | null;
          top_expense_category?: string | null;
          last_updated?: string;
        };
        Relationships: [];
      };
      analysis_caches: {
        Row: {
          user_id: string;
          year: number;
          month: number;
          scope: string;
          report_data: Record<string, unknown>;
          is_stale: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          year: number;
          month: number;
          scope: string;
          report_data: Record<string, unknown>;
          is_stale?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          year?: number;
          month?: number;
          scope?: string;
          report_data?: Record<string, unknown>;
          is_stale?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string | null;
          event_name: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_name: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_name?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
