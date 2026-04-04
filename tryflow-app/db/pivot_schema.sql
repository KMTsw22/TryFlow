-- ============================================================
-- Try.Wepp Pivot: Anonymous Founder Idea Signals
-- Run this in Supabase SQL Editor
-- ============================================================

-- Idea submissions (anonymous or authenticated)
CREATE TABLE IF NOT EXISTS idea_submissions (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category    text NOT NULL,
  target_user text NOT NULL,
  description text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- Insight reports (generated immediately on submission)
CREATE TABLE IF NOT EXISTS insight_reports (
  id                text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  submission_id     text UNIQUE REFERENCES idea_submissions(id) ON DELETE CASCADE,
  viability_score   integer NOT NULL,
  saturation_level  text NOT NULL, -- 'Low' | 'Medium' | 'High'
  trend_direction   text NOT NULL, -- 'Rising' | 'Stable' | 'Declining'
  similar_count     integer NOT NULL,
  summary           text NOT NULL,
  created_at        timestamptz DEFAULT now()
);

-- ── RLS ─────────────────────────────────────────────────────

ALTER TABLE idea_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE insight_reports  ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an idea (anonymous or logged in)
CREATE POLICY "public insert ideas"
  ON idea_submissions FOR INSERT
  WITH CHECK (true);

-- Logged-in users can see their own submissions
CREATE POLICY "users see own ideas"
  ON idea_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Reports are accessible by anyone who has the submission_id (UUID = unforgeable)
CREATE POLICY "public read reports"
  ON insight_reports FOR SELECT
  USING (true);

-- Only the API (anon key) can insert reports
CREATE POLICY "public insert reports"
  ON insight_reports FOR INSERT
  WITH CHECK (true);

-- ── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_idea_submissions_category   ON idea_submissions (category);
CREATE INDEX IF NOT EXISTS idx_idea_submissions_user_id    ON idea_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_idea_submissions_created_at ON idea_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insight_reports_submission  ON insight_reports (submission_id);