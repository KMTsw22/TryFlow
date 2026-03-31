-- ============================================================
-- try.wepp — Comment Reports Migration
-- Run in Supabase SQL Editor AFTER add_comment_features.sql
-- ============================================================

-- 1. report_count column on comments
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

-- 2. Reports join table (composite PK prevents double-reporting)
CREATE TABLE IF NOT EXISTS comment_reports (
  comment_id  text REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  reporter_id text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  PRIMARY KEY (comment_id, reporter_id)
);

ALTER TABLE comment_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public insert comment_reports" ON comment_reports;
DROP POLICY IF EXISTS "public read comment_reports"   ON comment_reports;

CREATE POLICY "public insert comment_reports" ON comment_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "public read comment_reports"   ON comment_reports FOR SELECT USING (true);

-- 3. Atomic report — prevents double-report, increments counter
CREATE OR REPLACE FUNCTION report_comment(
  p_comment_id  text,
  p_reporter_id text
) RETURNS jsonb AS $$
DECLARE
  already_reported boolean;
  new_count         integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM comment_reports
    WHERE comment_id = p_comment_id AND reporter_id = p_reporter_id
  ) INTO already_reported;

  IF already_reported THEN
    SELECT report_count INTO new_count FROM comments WHERE id = p_comment_id;
    RETURN jsonb_build_object('reported', true, 'report_count', new_count, 'already', true);
  END IF;

  INSERT INTO comment_reports (comment_id, reporter_id) VALUES (p_comment_id, p_reporter_id);
  UPDATE comments
    SET report_count = report_count + 1
    WHERE id = p_comment_id
    RETURNING report_count INTO new_count;

  RETURN jsonb_build_object('reported', true, 'report_count', new_count, 'already', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
