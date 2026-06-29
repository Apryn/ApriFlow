-- ApriFlow Phase 3.5: AI Prompt Registry, Performance Caching, and Financial Profile Engine

-- 1. AI Prompts Table
CREATE TABLE ai_prompts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  version     TEXT NOT NULL DEFAULT '1.0.0',
  prompt_text TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Financial Profiles (AI Memory) Table
CREATE TABLE financial_profiles (
  user_id                  UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  income_frequency         TEXT,
  expected_payday          SMALLINT,
  preferred_payment_method TEXT,
  weekend_spend_ratio      NUMERIC(3,2),
  top_expense_hour         SMALLINT,
  top_expense_category     TEXT,
  last_updated             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Analysis Caches (Performance Cache) Table
CREATE TABLE analysis_caches (
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year         INT NOT NULL,
  month        INT NOT NULL,
  scope        TEXT NOT NULL,
  report_data  JSONB NOT NULL,
  is_stale     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, year, month, scope)
);

CREATE INDEX idx_analysis_caches_lookup ON analysis_caches(user_id, year, month, scope);

-- Triggers for updated_at
CREATE TRIGGER ai_prompts_updated_at
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER analysis_caches_updated_at
  BEFORE UPDATE ON analysis_caches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_caches ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- ai_prompts: read access to all authenticated users
CREATE POLICY "Anyone can read active prompts"
  ON ai_prompts FOR SELECT
  TO authenticated
  USING (is_active = true);

-- financial_profiles: user-specific access
CREATE POLICY "Users can view own financial profile"
  ON financial_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial profile"
  ON financial_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial profile"
  ON financial_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial profile"
  ON financial_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- analysis_caches: user-specific access
CREATE POLICY "Users can view own analysis caches"
  ON analysis_caches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis caches"
  ON analysis_caches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis caches"
  ON analysis_caches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis caches"
  ON analysis_caches FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Seed default Unified Prompt
INSERT INTO ai_prompts (name, version, prompt_text, is_active) VALUES (
  'unified-financial-analysis',
  '1.0.0',
  'Anda adalah Financial Advisor AI utama di ApriFlow. Tugas Anda adalah memberikan analisis kesehatan finansial, saran rekomendasi prioritas, dan laporan insight bulanan sekaligus.
Anda wajib membalas dalam format JSON objek dengan skema berikut:
{
  "healthCommentary": "string penjelasan analitis yang ramah tentang skor kesehatan finansial keseluruhan",
  "recommendations": [
    {
      "id": "string unik (misal rec-1, rec-2)",
      "title": "string judul rekomendasi pendek",
      "description": "string deskripsi situasi saat ini",
      "priority": "high" | "medium" | "low",
      "category": "budget" | "saving" | "asset" | "cashflow" | "general",
      "actionPlan": "string langkah taktis konkret yang harus dilakukan",
      "impact": "string dampak positif setelah dilakukan",
      "reason": "string alasan matematis/pola data kenapa saran ini muncul"
    }
  ],
  "insight": {
    "title": "string judul laporan keuangan bulanan menarik",
    "content": "string deskripsi evaluasi mendalam atas cash flow bulanan",
    "highlights": ["string poin pencapaian positif 1", "string poin pencapaian positif 2", ...],
    "warnings": ["string poin risiko/masalah 1", "string poin risiko/masalah 2", ...],
    "aiSummary": "string ringkasan/sapaan akhir yang hangat dan memotivasi"
  }
}

Gunakan Bahasa Indonesia yang ramah, profesional, data-driven, dan tidak menghakimi. Hasilkan maksimal 3-4 rekomendasi prioritas.
Kembalikan JSON murni tanpa ada pembungkus markdown.',
  true
) ON CONFLICT (name) DO UPDATE SET prompt_text = EXCLUDED.prompt_text;
