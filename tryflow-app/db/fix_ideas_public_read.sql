-- ============================================================
-- idea_submissions SELECT 정책 수정
-- 문제: 기존 "users see own ideas" 정책이 auth.uid() = user_id 만 허용해서
--       (1) 비로그인 사용자가 링크로 접근 불가 → 404
--       (2) 다른 사람의 공개 아이디어 열람 불가 → 404
-- 해결: 공개(is_private = false) 아이디어는 누구나 읽기 가능,
--       비공개 아이디어는 작성자 본인만 읽기 가능.
--       Supabase SQL Editor 에서 한 번 실행하면 됩니다.
-- ============================================================

DROP POLICY IF EXISTS "users see own ideas" ON idea_submissions;
DROP POLICY IF EXISTS "public read ideas"   ON idea_submissions;

CREATE POLICY "read public or own ideas"
  ON idea_submissions FOR SELECT
  USING (is_private = false OR auth.uid() = user_id);
