-- ============================================================
-- contact_requests — VC → Founder 아이디어별 intro 요청 트래킹
-- Supabase Dashboard > SQL Editor 에서 실행
--
-- 2026-04 포지셔닝: TryFlow 는 "아이디어 단계 VC-Founder 매칭 플랫폼".
-- 기존엔 VC 가 Gmail 창 열어 수동 발송만 가능했고 추적 없음 → 창업자가
-- "누가 내 아이디어에 관심 가졌는지" 전혀 알 수 없었음. 이 테이블이 그 gap 해결.
--
-- 워크플로우:
--   1. VC 가 ContactSection 에서 메시지 작성
--   2. API 가 INSERT 하면서 Gmail URL 반환 → VC가 Gmail 열고 실제 발송
--   3. Founder 가 /inbox 로 들어와 받은 요청 확인 + read 마킹
--   4. Founder 가 이메일로 답장 or 관심 표시
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 메시지 보낸 VC (Pro 플랜 가입자)
  vc_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 받는 Founder (creator of the idea)
  founder_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 어떤 아이디어에 대한 intro 인지
  submission_id TEXT NOT NULL REFERENCES idea_submissions(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  -- 상태 — founder 관점
  status TEXT NOT NULL DEFAULT 'unread'
    CHECK (status IN ('unread', 'read', 'archived')),
  -- 타임라인
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Founder 가 자기 inbox 볼 때 created_at desc 로 정렬
CREATE INDEX IF NOT EXISTS contact_requests_founder_recent_idx
  ON contact_requests (founder_user_id, created_at DESC);

-- VC 가 자기가 보낸 것 조회 (중복 방지용)
CREATE INDEX IF NOT EXISTS contact_requests_vc_idx
  ON contact_requests (vc_user_id, created_at DESC);

-- 아이디어별 요청 카운트 (필요 시 submission 에 받은 intro 수 표시)
CREATE INDEX IF NOT EXISTS contact_requests_submission_idx
  ON contact_requests (submission_id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE contact_requests ENABLE ROW LEVEL SECURITY;

-- VC 는 자기가 보낸 것, Founder 는 자기가 받은 것만 볼 수 있음
CREATE POLICY "read_own_requests"
  ON contact_requests FOR SELECT
  USING (auth.uid() = vc_user_id OR auth.uid() = founder_user_id);

-- INSERT: VC 본인 id 로만 row 생성 가능 (API 에서 한 번 더 Pro 체크)
CREATE POLICY "vc_insert_own"
  ON contact_requests FOR INSERT
  WITH CHECK (auth.uid() = vc_user_id);

-- UPDATE: Founder 만 자기가 받은 요청 상태 변경 가능 (read/archived)
CREATE POLICY "founder_update_own"
  ON contact_requests FOR UPDATE
  USING (auth.uid() = founder_user_id);
