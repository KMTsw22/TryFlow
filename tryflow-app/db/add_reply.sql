-- ============================================================
-- TryFlow — comments 테이블에 parent_id (대댓글) 추가
-- Supabase SQL Editor에서 실행
-- ============================================================

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id text REFERENCES comments(id) ON DELETE CASCADE;
