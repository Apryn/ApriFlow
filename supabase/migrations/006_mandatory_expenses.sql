-- ApriFlow Phase 4: Mandatory Recurring Expenses Schema

CREATE TABLE IF NOT EXISTS mandatory_expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  amount        BIGINT NOT NULL CHECK (amount > 0),
  due_day       SMALLINT CHECK (due_day BETWEEN 1 AND 31),
  category_name TEXT,
  paid_months   TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mandatory_expenses_user ON mandatory_expenses(user_id);

-- Enable RLS
ALTER TABLE mandatory_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own mandatory expenses"
  ON mandatory_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mandatory expenses"
  ON mandatory_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mandatory expenses"
  ON mandatory_expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mandatory expenses"
  ON mandatory_expenses FOR DELETE
  USING (auth.uid() = user_id);
