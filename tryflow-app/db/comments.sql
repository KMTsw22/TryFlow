-- ============================================================
-- TryFlow — comments 테이블
-- Supabase SQL Editor에서 실행 (add_fields.sql 이후)
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  experiment_id text REFERENCES experiments(id) ON DELETE CASCADE NOT NULL,
  author_name   text NOT NULL,
  content       text NOT NULL,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 누구나 댓글 작성 가능 (랜딩 페이지 방문자)
CREATE POLICY "public insert comments"
  ON comments FOR INSERT
  WITH CHECK (true);

-- RUNNING 실험의 댓글은 누구나 조회 가능
CREATE POLICY "public read comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = comments.experiment_id
        AND experiments.status = 'RUNNING'
    )
  );

-- 실험 소유자는 본인 실험 댓글 전체 조회 가능
CREATE POLICY "owner read all comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = comments.experiment_id
        AND experiments.user_id = auth.uid()
    )
  );
