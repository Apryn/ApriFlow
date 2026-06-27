-- ApriFlow Phase 2: Add raw_input and reviewed_at columns to transactions
ALTER TABLE transactions ADD COLUMN raw_input TEXT;
ALTER TABLE transactions ADD COLUMN reviewed_at TIMESTAMPTZ;
