-- ── Fastlane 데모/시연 리셋: 인간 심사 단계 흔적 제거 ──────────────────
--
-- 본인이 운영하는 모든 대회의 출품을 "AI 1차 평가 완료" 상태로 되돌림.
-- 출품 자체와 AI 점수(score) 는 보존되고, 인간이 만든 흔적만 제거:
--   - proposal_reviews         (심사위원 평가)
--   - proposal_dispute_resolutions (분쟁 결정)
--   - proposals.review_closed_at / review_closed_by (검토 종료 마킹)
--
-- 사용:
--   1) 아래 $USER_ID 에 본인 auth.users.id (UUID) 를 채우거나
--   2) auth.uid() 그대로 두고 supabase SQL Editor "Run as user" 로 실행.
--
-- 본인 user_id 확인 SQL:
--   select id, email from auth.users where email = 'your@email.com';

-- ─ STEP 1: 분쟁 결정 삭제 ────────────────────────────────────
delete from proposal_dispute_resolutions
where proposal_id in (
  select p.id
  from proposals p
  join competitions c on c.id = p.competition_id
  where c.user_id = auth.uid()
);

-- ─ STEP 2: 심사위원 평가 삭제 ────────────────────────────────
delete from proposal_reviews
where proposal_id in (
  select p.id
  from proposals p
  join competitions c on c.id = p.competition_id
  where c.user_id = auth.uid()
);

-- ─ STEP 3: 검토 종료 마킹 해제 ───────────────────────────────
update proposals
set
  review_closed_at = null,
  review_closed_by = null
where competition_id in (
  select id from competitions where user_id = auth.uid()
);

-- 끝.
-- 이후 대회 상세 페이지의 stage stepper 가 "인간 심사" 단계로 돌아오고,
-- 매트릭스의 모든 셀이 ○ (미평가) 로 초기화됨.
