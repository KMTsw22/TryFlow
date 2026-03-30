-- ============================================================
-- TryFlow — experiments 테이블에 project_url 컬럼 추가
-- Supabase SQL Editor에서 실행
-- ============================================================

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS project_url text NOT NULL DEFAULT '';
