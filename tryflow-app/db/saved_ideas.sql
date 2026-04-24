-- ============================================================
-- saved_ideas 테이블 — 사용자가 하트(❤️)로 저장한 아이디어
-- Supabase Dashboard > SQL Editor 에서 실행
--
-- 2026-04 교수님 피드백 대응:
--   "VC라면 관심 있을 리포트, 최근 본 리포트, 신규 리포트 같은 것들"
--   → 개인화 대시보드의 'Saved' 섹션 백킹 테이블.
--   하트는 모든 plan에서 사용 가능 (free/plus/pro). RLS 로 본인 것만 조작.
--
-- 추가: save_count — 아이디어별 저장 카운트를 idea_submissions 에 캐싱.
--   "본인 아이디어를 몇 명이 저장했나" 를 창업자(본인)에게만 보여주기 위함.
--   (앱 코드에서 owner 일 때만 표시 — 카운트 자체는 누구나 query 가능하지만
--    UI 에 노출하지 않음. WHO 가 저장했는지는 RLS 로 완전 차단됨.)
-- ============================================================

-- 주의: submission_id 는 UUID 가 아니라 TEXT.
-- idea_submissions.id 가 `text PRIMARY KEY DEFAULT gen_random_uuid()::text`
-- 로 정의돼 있어 외래키 컬럼 타입이 일치해야 한다.
CREATE TABLE IF NOT EXISTS saved_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id TEXT NOT NULL REFERENCES idea_submissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 같은 유저가 같은 아이디어를 여러 번 저장하지 못하게.
  UNIQUE (user_id, submission_id)
);

-- 인덱스: 유저별 저장 목록 조회용 (대시보드 Saved 섹션)
CREATE INDEX IF NOT EXISTS saved_ideas_user_recent_idx
  ON saved_ideas (user_id, created_at DESC);

-- 인덱스: 아이디어별 저장 카운트 / 카드의 isSaved 룩업 가속용
CREATE INDEX IF NOT EXISTS saved_ideas_submission_idx
  ON saved_ideas (submission_id);

-- ============================================================
-- RLS — 본인의 저장만 보고, 본인만 추가/삭제 가능
-- (저장 카운트를 공개하려면 별도 read 정책 추가 — MVP에서는 미공개)
-- ============================================================
ALTER TABLE saved_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_saves"
  ON saved_ideas FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "insert_own_save"
  ON saved_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_save"
  ON saved_ideas FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- save_count 캐싱 컬럼 + 자동 증감 트리거
--
-- 왜 트리거 사용?
--   매 렌더 때 COUNT(*) 쿼리를 추가로 날리는 것보다, idea_submissions 행에
--   캐시된 카운트를 한 번에 가져오는 게 빠름. 트리거가 INSERT/DELETE 시점에
--   원자적으로 동기화해주므로 일관성도 유지됨.
-- ============================================================
ALTER TABLE idea_submissions
  ADD COLUMN IF NOT EXISTS save_count INTEGER NOT NULL DEFAULT 0;

-- 트리거 함수: saved_ideas INSERT/DELETE 시 카운트를 ±1
CREATE OR REPLACE FUNCTION sync_idea_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE idea_submissions
       SET save_count = save_count + 1
     WHERE id = NEW.submission_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE idea_submissions
       SET save_count = GREATEST(save_count - 1, 0)
     WHERE id = OLD.submission_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있으면 삭제 후 재생성 (스크립트 재실행 안전)
DROP TRIGGER IF EXISTS saved_ideas_count_sync ON saved_ideas;
CREATE TRIGGER saved_ideas_count_sync
  AFTER INSERT OR DELETE ON saved_ideas
  FOR EACH ROW EXECUTE FUNCTION sync_idea_save_count();

-- 기존 데이터 백필 (스크립트 재실행 시 카운트 정합성 복구용)
UPDATE idea_submissions s
   SET save_count = COALESCE(c.cnt, 0)
  FROM (
    SELECT submission_id, COUNT(*) AS cnt
      FROM saved_ideas
     GROUP BY submission_id
  ) c
 WHERE s.id = c.submission_id;
