-- ApriFlow Phase X: Stabilization, Index Optimization & Analytics Logs

-- 1. Analytics Events Table
CREATE TABLE analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_name  TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Performance Query Indexing
-- Optimize active confirmed transactions queries (e.g. cash flow, history, summaries)
CREATE INDEX IF NOT EXISTS idx_transactions_performance_lookup
  ON transactions(user_id, status, date)
  WHERE deleted_at IS NULL;

-- Optimize user budget limits check queries
CREATE INDEX IF NOT EXISTS idx_budgets_performance_lookup
  ON budgets(user_id);

-- Optimize user savings goal queries
CREATE INDEX IF NOT EXISTS idx_goals_performance_lookup
  ON goals(user_id, is_completed);

-- Optimize analytics metrics lookups
CREATE INDEX IF NOT EXISTS idx_analytics_events_lookup
  ON analytics_events(user_id, event_name, created_at);

-- 3. Enable RLS on analytics table
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for analytics_events
CREATE POLICY "Users can insert own analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics events"
  ON analytics_events FOR SELECT
  USING (auth.uid() = user_id);
