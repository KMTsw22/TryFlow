-- ============================================================
-- Add idea development stage to idea_submissions
-- Run in Supabase SQL Editor
-- ============================================================

ALTER TABLE idea_submissions
  ADD COLUMN IF NOT EXISTS stage text;

-- Backfill existing rows with a random realistic distribution
-- (weighted: more ideas in early stages)
UPDATE idea_submissions
SET stage = (
  CASE floor(random() * 10)::int
    WHEN 0 THEN 'launched'
    WHEN 1 THEN 'launched'
    WHEN 2 THEN 'early_traction'
    WHEN 3 THEN 'early_traction'
    WHEN 4 THEN 'prototype'
    WHEN 5 THEN 'prototype'
    WHEN 6 THEN 'prototype'
    ELSE 'idea'
  END
)
WHERE stage IS NULL;

-- Set default for new submissions
ALTER TABLE idea_submissions
  ALTER COLUMN stage SET DEFAULT 'idea';
