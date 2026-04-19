-- ============================================================
-- Try.Wepp — 전체 마이그레이션 (한 번에 실행)
-- Supabase SQL Editor에 붙여넣고 Run 하면 끝
-- ============================================================


-- ┌─────────────────────────────────────────────────────────┐
-- │ 0. 레거시 테이블 정리 (현재 코드에서 미사용)              │
-- └─────────────────────────────────────────────────────────┘

DROP TABLE IF EXISTS click_events CASCADE;
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS comment_reports CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS waitlist_entries CASCADE;
DROP TABLE IF EXISTS user_credits CASCADE;
DROP TABLE IF EXISTS experiments CASCADE;


-- ┌─────────────────────────────────────────────────────────┐
-- │ 1. idea_submissions — 아이디어 제출                      │
-- └─────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS idea_submissions (
  id          text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category    text NOT NULL,
  target_user text NOT NULL,
  description text NOT NULL,
  is_private  boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE idea_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public insert ideas"
    ON idea_submissions FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 공개 아이디어는 누구나 읽기 가능 (링크 공유용), 비공개는 작성자만
DROP POLICY IF EXISTS "users see own ideas"    ON idea_submissions;
DROP POLICY IF EXISTS "public read ideas"      ON idea_submissions;
DROP POLICY IF EXISTS "read public or own ideas" ON idea_submissions;

CREATE POLICY "read public or own ideas"
  ON idea_submissions FOR SELECT
  USING (is_private = false OR auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_idea_submissions_category   ON idea_submissions (category);
CREATE INDEX IF NOT EXISTS idx_idea_submissions_user_id    ON idea_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_idea_submissions_created_at ON idea_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_idea_submissions_is_private ON idea_submissions (is_private);


-- ┌─────────────────────────────────────────────────────────┐
-- │ 2. insight_reports — 즉시 생성되는 휴리스틱 리포트        │
-- └─────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS insight_reports (
  id                text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  submission_id     text UNIQUE REFERENCES idea_submissions(id) ON DELETE CASCADE,
  viability_score   integer NOT NULL,
  saturation_level  text NOT NULL,
  trend_direction   text NOT NULL,
  similar_count     integer NOT NULL,
  summary           text NOT NULL,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE insight_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public read reports"
    ON insight_reports FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "public insert reports"
    ON insight_reports FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_insight_reports_submission ON insight_reports (submission_id);


-- ┌─────────────────────────────────────────────────────────┐
-- │ 3. analysis_reports — 멀티에이전트 AI 딥 분석 결과       │
-- └─────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS analysis_reports (
  id                   text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  submission_id        text UNIQUE REFERENCES idea_submissions(id) ON DELETE CASCADE NOT NULL,
  viability_score      integer NOT NULL,
  summary              text NOT NULL,
  analysis             jsonb NOT NULL DEFAULT '{}',
  cross_agent_insights jsonb NOT NULL DEFAULT '[]',
  opportunities        jsonb NOT NULL DEFAULT '[]',
  risks                jsonb NOT NULL DEFAULT '[]',
  next_steps           jsonb NOT NULL DEFAULT '[]',
  agent_results        jsonb NOT NULL DEFAULT '{}',
  created_at           timestamptz DEFAULT now()
);

ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "public select analysis"
    ON analysis_reports FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "public insert analysis"
    ON analysis_reports FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_analysis_reports_submission ON analysis_reports (submission_id);


-- ============================================================
-- 완료! 위 3개 테이블이 현재 앱에서 사용하는 전부입니다.
-- ============================================================
