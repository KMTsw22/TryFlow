-- ============================================================
-- idea_submissions DELETE 정책 추가
-- 문제: RLS는 켜져있는데 DELETE 정책이 없어서 소유자가 Archive를
--       눌러도 supabase.delete()가 0행만 지우고 에러 없이 성공함.
-- 해결: 작성자 본인만 자기 아이디어를 지울 수 있도록 허용.
-- Supabase SQL Editor에서 실행.
-- ============================================================

DROP POLICY IF EXISTS "users delete own ideas" ON idea_submissions;

CREATE POLICY "users delete own ideas"
  ON idea_submissions FOR DELETE
  USING (auth.uid() = user_id);
