-- ApriFlow Phase 1: core schema, RLS, and category seed on signup

-- ---------------------------------------------------------------------------
-- ENUM types
-- ---------------------------------------------------------------------------

CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TYPE transaction_source AS ENUM (
  'manual',
  'ai_chat',
  'receipt_scan',
  'screenshot',
  'bank_import'
);

CREATE TYPE transaction_status AS ENUM (
  'draft',
  'pending_review',
  'confirmed',
  'ignored',
  'duplicate'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'qris',
  'transfer',
  'debit_card',
  'credit_card',
  'ewallet',
  'other'
);

CREATE TYPE expense_kind AS ENUM ('wajib', 'fleksibel', 'bocor');

CREATE TYPE category_type AS ENUM ('income', 'expense');

CREATE TYPE asset_type AS ENUM ('bank', 'cash', 'gold', 'investment', 'other');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name    TEXT,
  currency        TEXT NOT NULL DEFAULT 'IDR',
  timezone        TEXT NOT NULL DEFAULT 'Asia/Jakarta',
  month_start_day SMALLINT NOT NULL DEFAULT 1 CHECK (month_start_day BETWEEN 1 AND 28),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          category_type NOT NULL,
  expense_kind  expense_kind,
  icon          TEXT,
  color         TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name, type)
);

CREATE TABLE transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type              transaction_type NOT NULL,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  amount            BIGINT NOT NULL CHECK (amount > 0),
  date              DATE NOT NULL,
  payment_method    payment_method NOT NULL DEFAULT 'other',
  merchant          TEXT,
  note              TEXT,
  source            transaction_source NOT NULL DEFAULT 'manual',
  status            transaction_status NOT NULL DEFAULT 'confirmed',
  ai_confidence     NUMERIC(3,2) CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
  ai_raw_payload    JSONB,
  duplicate_of_id   UUID REFERENCES transactions(id) ON DELETE SET NULL,
  confirmed_at      TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX idx_transactions_user_amount_date ON transactions(user_id, amount, date);
CREATE INDEX idx_transactions_not_deleted ON transactions(user_id) WHERE deleted_at IS NULL;

CREATE TABLE assets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        asset_type NOT NULL,
  value       BIGINT NOT NULL CHECK (value >= 0),
  is_liquid   BOOLEAN NOT NULL DEFAULT false,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assets_user ON assets(user_id);

-- ---------------------------------------------------------------------------
-- Utility: updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Utility: set confirmed_at when status becomes confirmed
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_confirmed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    NEW.confirmed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_confirmed_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_confirmed_at();

-- ---------------------------------------------------------------------------
-- Seed default categories for new users
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION seed_default_categories(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO categories (user_id, name, type, expense_kind, sort_order) VALUES
    (p_user_id, 'Makan Pokok',   'expense', 'wajib',     1),
    (p_user_id, 'Makan Luar',    'expense', 'fleksibel', 2),
    (p_user_id, 'Warkop',        'expense', 'bocor',     3),
    (p_user_id, 'Bensin',        'expense', 'wajib',     4),
    (p_user_id, 'WiFi',          'expense', 'wajib',     5),
    (p_user_id, 'Listrik',       'expense', 'wajib',     6),
    (p_user_id, 'Belanja Online','expense', 'bocor',     7),
    (p_user_id, 'Motor',         'expense', 'wajib',     8),
    (p_user_id, 'Kuliah',        'expense', 'wajib',     9),
    (p_user_id, 'Keluarga',      'expense', 'fleksibel', 10),
    (p_user_id, 'Hiburan',       'expense', 'fleksibel', 11),
    (p_user_id, 'Kesehatan',     'expense', 'wajib',     12),
    (p_user_id, 'Transfer',      'expense', 'fleksibel', 13),
    (p_user_id, 'Lain-lain',     'expense', 'fleksibel', 14);

  INSERT INTO categories (user_id, name, type, sort_order) VALUES
    (p_user_id, 'Gaji',           'income', 1),
    (p_user_id, 'Project Cair',   'income', 2),
    (p_user_id, 'Bonus',          'income', 3),
    (p_user_id, 'Hadiah',         'income', 4),
    (p_user_id, 'Transfer Masuk', 'income', 5),
    (p_user_id, 'Lain-lain',      'income', 6);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- New user handler: profile + default categories
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );

  PERFORM seed_default_categories(NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- assets
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  USING (auth.uid() = user_id);
