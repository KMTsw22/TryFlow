-- ============================================================
-- TryFlow — experiments 테이블에 category, maker_name 컬럼 추가
-- Supabase SQL Editor에서 실행
-- ============================================================

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS category  text NOT NULL DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS maker_name text NOT NULL DEFAULT '';
